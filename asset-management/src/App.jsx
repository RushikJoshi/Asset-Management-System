import { useDispatch, useSelector } from "react-redux";
import { addAsset, fetchAssetList, deleteAsset } from "./store/slices/assetSlice";
import "./App.css";
import { useEffect, useRef, useState } from "react";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import { FaDownload, FaEdit, FaEye, FaFileCsv, FaFileImport, FaTags, FaTimes, FaTrash, FaBoxOpen, FaCheckCircle, FaUserCheck, FaWrench, FaShieldAlt } from "react-icons/fa";
import deleteModelImage from "../src/images/deleteModalImage.svg";
import logoImage from "../src/images/logo.jpeg";
import {
  assetImportHeaders,
  assetImportSampleRows,
  buildStats,
  exportRowsToCsv,
  getInventoryAssets,
  parseCsvText,
} from "./utils/assetUtils";
import { useToast } from "./components/toast/toastStore";

const pdfText = (value) => String(value || "-").replace(/[\\()]/g, "\\$&").replace(/[^\x20-\x7E]/g, "");

const splitPdfLines = (value, maxLength) => {
  const text = String(value || "-").replace(/[^\x20-\x7E]/g, "");
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";

  words.forEach((word) => {
    if (word.length > maxLength) {
      if (current) {
        lines.push(current);
        current = "";
      }
      for (let index = 0; index < word.length; index += maxLength) {
        lines.push(word.slice(index, index + maxLength));
      }
      return;
    }

    const next = current ? `${current} ${word}` : word;
    if (next.length > maxLength) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  });

  if (current) lines.push(current);
  return lines.length ? lines : ["-"];
};

const loadPdfImage = (src) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });

const imageToJpeg = async (src) => {
  const image = await loadPdfImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = 420;
  canvas.height = 420;
  const context = canvas.getContext("2d");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 20, 20, 380, 380);
  return canvas.toDataURL("image/jpeg", 0.95).split(",")[1];
};

const blankJpeg = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 420;
  canvas.height = 420;
  const context = canvas.getContext("2d");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.95).split(",")[1];
};

const saveBlob = (blob, filename) => {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
};

const buildStickerPdf = async (assets, getDetails) => {
  const pageWidth = 595;
  const pageHeight = 842;
  const objects = ["<< /Type /Catalog /Pages 2 0 R >>", ""];
  const pageObjects = [];
  const qrImages = await Promise.all(
    assets.map(async (asset) => ({
      asset,
      data: atob(asset.qrCode ? await imageToJpeg(asset.qrCode) : blankJpeg()),
    })),
  );

  const addObject = (object) => {
    objects.push(object);
    return objects.length;
  };

  const imageIds = qrImages.map(({ data }) =>
    addObject(
      `<< /Type /XObject /Subtype /Image /Width 420 /Height 420 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${data.length} >>\nstream\n${data}\nendstream`,
    ),
  );

  for (let pageStart = 0; pageStart < assets.length; pageStart += 8) {
    const pageItems = qrImages.slice(pageStart, pageStart + 8);
    const lines = [
      "q",
      "0.8 w 0 0 0 RG",
    ];
    const xObjects = [];

    pageItems.forEach(({ asset }, itemIndex) => {
      const absoluteIndex = pageStart + itemIndex;
      const col = itemIndex % 2;
      const row = Math.floor(itemIndex / 2);
      const cardX = 38 + col * 266;
      const cardY = 637 - row * 150;
      const cardWidth = 252;
      const cardHeight = 130;
      const cardPadding = 10;
      const qrSize = 104;
      const qrX = cardX + cardPadding;
      const qrY = cardY + cardHeight - qrSize - cardPadding;
      const detailsX = cardX + 124;
      const detailsY = cardY + cardHeight - 24;
      const details = getDetails(asset).slice(0, 6);

      xObjects.push(`/QR${absoluteIndex} ${imageIds[absoluteIndex]} 0 R`);
      lines.push(
        "0.8 w 0 0 0 RG",
        `${cardX} ${cardY} ${cardWidth} ${cardHeight} re S`,
        "q",
        `${qrSize} 0 0 ${qrSize} ${qrX} ${qrY} cm`,
        `/QR${absoluteIndex} Do`,
        "Q",
      );

      let detailRowY = detailsY;
      details.forEach(([label, value]) => {
        const valueLines = splitPdfLines(value, 11).slice(0, 2);
        lines.push(
          `BT /F2 7.8 Tf 0.39 0.46 0.56 rg ${detailsX} ${detailRowY} Td (${pdfText(label)}) Tj ET`,
        );
        valueLines.forEach((line, valueLineIndex) => {
          lines.push(
            `BT /F2 8.2 Tf 0 0 0 rg ${detailsX + 67} ${detailRowY - valueLineIndex * 8} Td (${pdfText(line)}) Tj ET`,
          );
        });
        lines.push(
          `0.88 0.91 0.94 RG ${detailsX} ${detailRowY - 5 - Math.max(0, valueLines.length - 1) * 8} 108 0 m ${detailsX + 108} ${detailRowY - 5 - Math.max(0, valueLines.length - 1) * 8} l S`,
        );
        detailRowY -= 12 + Math.max(0, valueLines.length - 1) * 8;
      });
    });

    lines.push("Q");
    const content = lines.join("\n");
    const contentObjectId = addObject(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
    const pageObjectId = addObject(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> /F2 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> >> /XObject << ${xObjects.join(" ")} >> >> /Contents ${contentObjectId} 0 R >>`,
    );
    pageObjects.push(pageObjectId);
  }

  objects[1] = `<< /Type /Pages /Kids [${pageObjects.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageObjects.length} >>`;

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;

  const bytes = new Uint8Array(pdf.length);
  for (let index = 0; index < pdf.length; index += 1) {
    bytes[index] = pdf.charCodeAt(index) & 0xff;
  }

  saveBlob(new Blob([bytes], { type: "application/pdf" }), "all-asset-stickers.pdf");
};

function App() {
  const dispatch = useDispatch();

  const navigate = useNavigate();
  const { showToast } = useToast();
  const fileInputRef = useRef(null);
  const [openModal, setOpenModal] = useState(false);
  const [selectedQr, setSelectedQr] = useState("");
  const [deleteModal, setDeleteModal] = useState(false);
  const [stickerModal, setStickerModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const [selectedDeleteId, setSelectedDeleteId] = useState(null);
  const { loading, error, assetListData } = useSelector(
    (state) => state.assetList,
  );
  const { user } = useSelector((state) => state.auth);
  const canManageAssets = ["SUPER_ADMIN", "ADMIN", "IT_STAFF"].includes(user?.role);
  const canDeleteAssets = ["SUPER_ADMIN", "ADMIN"].includes(user?.role);

  useEffect(() => {
    dispatch(fetchAssetList());
  }, [dispatch]);

  const inventoryAssets = getInventoryAssets(assetListData);

  const filteredAssets = inventoryAssets.filter((asset) => {
    const matchesStatus = statusFilter === "ALL" || asset.assetStatus === statusFilter;
    const haystack = [
      asset.assetName,
      asset.assetCode,
      asset.serialNumber,
      asset.assignedTo,
      asset.officeName,
      asset.department,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return matchesStatus && haystack.includes(search.toLowerCase());
  });

  const stats = buildStats(assetListData);

  const getStickerDetails = (asset) => [
    ["Asset Name:", asset.assetName],
    ["Serial No:", asset.serialNumber],
    ["Company Name:", asset.companyName || asset.ownerName || asset.vendor || "AssetPro"],
    ["Branch:", asset.branchName || asset.branchCode || asset.department],
    ["Office Name:", asset.officeName || asset.location],
    ["Asset No:", asset.assetCode || asset._id],
  ];

  const openSideStickers = async () => {
    setStickerModal(true);

    if (!filteredAssets.length) return;

    try {
      await buildStickerPdf(filteredAssets, getStickerDetails);
      showToast({
        title: "Sticker PDF downloaded",
        message: "All asset stickers were downloaded successfully.",
        type: "info",
      });
    } catch {
      showToast({
        title: "PDF download failed",
        message: "Unable to create the sticker PDF. Please try again.",
        type: "error",
      });
    }
  };

  const exportCsv = () => {
    const headers = [
      "Asset Name",
      "Asset Code",
      "Status",
      "Assigned To",
      "Office",
      "Department",
      "Vendor",
      "Warranty End",
      "Repair Cost",
    ];
    const rows = filteredAssets.map((asset) => [
      asset.assetName,
      asset.assetCode,
      asset.assetStatus,
      asset.assignedTo,
      asset.officeName,
      asset.department,
      asset.vendor,
      asset.warrantyEnd ? moment(asset.warrantyEnd).format("DD-MM-YYYY") : "",
      asset.repairHistory?.reduce((sum, item) => sum + Number(item.repairCost || 0), 0) || 0,
    ]);
    exportRowsToCsv("asset-report.csv", headers, rows);
    showToast({
      title: "Report exported",
      message: "Asset CSV report downloaded successfully.",
      type: "info",
    });
  };

  const downloadSampleCsv = () => {
    exportRowsToCsv("asset-import-sample.csv", assetImportHeaders, assetImportSampleRows);
    showToast({
      title: "Sample downloaded",
      message: "Fill this CSV and import it from the Assets page.",
      type: "info",
    });
  };

  const importCsv = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    try {
      const csvText = await file.text();
      const assets = parseCsvText(csvText);

      for (const asset of assets) {
        await dispatch(addAsset(asset)).unwrap();
      }

      await dispatch(fetchAssetList());
      showToast({
        title: "CSV imported",
        message: `${assets.length} asset${assets.length > 1 ? "s" : ""} imported successfully.`,
      });
    } catch (importError) {
      showToast({
        title: "Import failed",
        message: importError.message || importError || "Please check the CSV format and try again.",
        type: "error",
      });
    } finally {
      event.target.value = "";
    }
  };

  const handleDeleteClick = (id) => {
    setSelectedDeleteId(id);

    setDeleteModal(true);
  };

  const confirmDeleteAsset = async () => {
    try {
      await dispatch(deleteAsset(selectedDeleteId)).unwrap();
      showToast({
        title: "Asset deleted",
        message: "The asset was removed successfully.",
      });
    } catch (error) {
      showToast({
        title: "Delete failed",
        message: error || "Unable to delete this asset.",
        type: "error",
      });
    } finally {
      setDeleteModal(false);
      setSelectedDeleteId(null);
    }
  };

  return (
    <>
      <div className="app-container assets-page">
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <div className="card-left">
              <span className="card-title-label">Total Assets</span>
              <strong className="card-value-text">{stats.total}</strong>
              <span className="card-sub-trend">+12 this month</span>
            </div>
            <div className="card-right-icon" style={{ color: "#2185f3", backgroundColor: "#2185f312" }}>
              <FaBoxOpen />
            </div>
          </div>
          <div className="dashboard-card">
            <div className="card-left">
              <span className="card-title-label">Available</span>
              <strong className="card-value-text">{stats.available}</strong>
              <span className="card-sub-trend">Ready to assign</span>
            </div>
            <div className="card-right-icon" style={{ color: "#10B981", backgroundColor: "#10B98112" }}>
              <FaCheckCircle />
            </div>
          </div>
          <div className="dashboard-card">
            <div className="card-left">
              <span className="card-title-label">Assigned</span>
              <strong className="card-value-text">{stats.assigned}</strong>
              <span className="card-sub-trend">Currently active</span>
            </div>
            <div className="card-right-icon" style={{ color: "#2563EB", backgroundColor: "#2563EB12" }}>
              <FaUserCheck />
            </div>
          </div>
          <div className="dashboard-card">
            <div className="card-left">
              <span className="card-title-label">Under Repair</span>
              <strong className="card-value-text">{stats.repair}</strong>
              <span className="card-sub-trend">In maintenance</span>
            </div>
            <div className="card-right-icon" style={{ color: "#F59E0B", backgroundColor: "#F59E0B12" }}>
              <FaWrench />
            </div>
          </div>
          <div className="dashboard-card alert-card">
            <div className="card-left">
              <span className="card-title-label">Warranty Alerts</span>
              <strong className="card-value-text">{stats.warranty}</strong>
              <span className="card-sub-trend">Expiring soon</span>
            </div>
            <div className="card-right-icon" style={{ color: "#EF4444", backgroundColor: "#EF444412" }}>
              <FaShieldAlt />
            </div>
          </div>
        </div>

        <div className="assets-toolbar">
          <div className="assets-toolbar-fields">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search asset, employee, office, serial..."
            className="search-input"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="status-filter"
          >
            <option value="ALL">All Status</option>
            <option value="AVAILABLE">Available</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="UNDER_REPAIR">Under Repair</option>
            <option value="RETURNED">Returned</option>
            <option value="DAMAGED">Damaged</option>
            <option value="LOST">Lost</option>
            <option value="RETIRED">Retired</option>
          </select>
          </div>
          <div className="assets-toolbar-actions">
            <div className="assets-toolbar-actions-left">
              <button onClick={exportCsv} className="export-btn">
                <FaFileCsv /> Export CSV
              </button>
              <button onClick={downloadSampleCsv} className="sample-btn">
                <FaDownload /> Sample CSV
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="import-btn">
                <FaFileImport /> Import CSV
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="csv-file-input"
                onChange={importCsv}
              />
              <button onClick={openSideStickers} className="side-sticker-btn">
                <FaTags /> Print All Asset Stickers
              </button>
            </div>
            <button
              onClick={() => navigate("/add-asset")}
              className={`add-btn add-btn-primary ${loading ? "loading-btn" : ""}`}
            >
              Add Asset
            </button>
          </div>
        </div>

        {/* ERROR */}
        {error && <p className="error-text">{error}</p>}

        {/* TABLE */}
        <div className="table-wrapper assets-table-scroll">
          <table className="asset-table">
            <thead>
              <tr>
                <th>No</th>

                <th>Asset Name</th>
                <th>Assigned To</th>
                <th>Serial No</th>
                <th>Assets Code</th>
                <th>Status</th>
                <th>Office</th>
                <th>Warranty End</th>
                <th>Assigned Date</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredAssets?.length > 0 ? (
                filteredAssets.map((item, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{item.assetName}</td>
                    <td>{item.assignedTo}</td>
                    <td>{item.serialNumber}</td>
                    <td>{item.assetCode}</td>
                    <td>
                      <span className={`asset-status-pill status-${String(item.assetStatus || "unknown").toLowerCase().replace(/_/g, "-")}`}>
                        {String(item.assetStatus || "-").replace(/_/g, " ")}
                      </span>
                    </td>
                    <td>{item.officeName || item.location}</td>
                    <td>{item.warrantyEnd ? moment(item.warrantyEnd).format("DD-MM-YYYY") : "-"}</td>
                    <td>{item.assignedDate ? moment(item.assignedDate).format("DD-MM-YYYY") : "-"}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="scan-btn"
                          onClick={() => {
                            setSelectedQr(item.qrCode);
                            setOpenModal(true);
                          }}
                        >
                          Scan QR
                        </button>
                        <button
                          className="view-btn"
                          onClick={() => navigate(`/asset-details/${item._id}`)}
                        >
                          <FaEye />
                        </button>

                        {canManageAssets && (
                          <button
                            className="edit-btn"
                            onClick={() => navigate(`/edit-asset/${item._id}`)}
                          >
                            <FaEdit />
                          </button>
                        )}
                        {canDeleteAssets && (
                          <button
                            className="delete-btn"
                            onClick={() => handleDeleteClick(item._id)}
                          >
                            <FaTrash />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="10" className="no-data">
                    No Assets Found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* QR MODAL */}

      {openModal && (
        <div className="modal-overlay">
          <div className="qr-modal">
            <button className="close-btn" onClick={() => setOpenModal(false)}>
              X
            </button>

            <h2>Scan QR Code</h2>

            <div className="modal-qr-wrapper">
              <img src={selectedQr} alt="QR" className="modal-qr" />

              <div className="qr-center-text modal-center-text">
                <img src={logoImage} alt="AssetPro logo" className="qr-center-logo" />
              </div>
            </div>
          </div>
        </div>
      )}

      {stickerModal && (
        <div className="sticker-modal-overlay">
          <div className="sticker-modal">
            <div className="sticker-modal-header">
              <div>
                <p>Sticker Preview</p>
                <h2>Print All Asset Stickers</h2>
              </div>
              <button
                className="sticker-modal-close"
                onClick={() => setStickerModal(false)}
                aria-label="Close sticker preview"
              >
                <FaTimes />
              </button>
            </div>

            <div className="side-sticker-list">
              {filteredAssets.length > 0 ? (
                filteredAssets.map((asset) => (
                  <section className="side-sticker-box" key={asset._id}>
                    <div className="side-qr-sticker">
                      {asset.qrCode ? (
                        <img src={asset.qrCode} alt={`${asset.assetName || "Asset"} QR`} />
                      ) : (
                        <div className="side-qr-empty">No QR</div>
                      )}
                    </div>

                    <div className="side-sticker-details">
                      <p className="side-sticker-kicker">Asset Sticker Details</p>
                      <div className="side-sticker-detail-list">
                        {getStickerDetails(asset).map(([label, value]) => (
                          <div className="side-sticker-detail-row" key={label}>
                            <span>{label}</span>
                            <strong>{value || "-"}</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>
                ))
              ) : (
                <p className="side-sticker-empty">No assets found for this filter.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}

      {deleteModal && (
        <div className="delete-modal-overlay">
          <div className="delete-modal">
            <img
              src={deleteModelImage}
              alt="delete"
              className="delete-modal-image"
            />

            <h2 className="delete-title">DELETE ASSET PERMANENTLY?</h2>

            <p className="delete-text">
              If you delete this Asset, you won't be able to recover it. Do you
              want to delete it?
            </p>

            <div className="delete-modal-buttons">
              <button
                className="cancel-delete-btn"
                onClick={() => setDeleteModal(false)}
              >
                CANCEL
              </button>

              <button
                className="confirm-delete-btn"
                onClick={confirmDeleteAsset}
              >
                DELETE
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
