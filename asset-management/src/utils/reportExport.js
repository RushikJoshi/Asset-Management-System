import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { loadAssetFormConfig } from "./assetFormBuilder";
import { isNetworkAssetCategory } from "./categoryCatalog";
import { dateText, repairCost } from "./assetUtils";

export const REPORT_HEADERS = [
  "Asset",
  "Code",
  "Category",
  "Status",
  "Office",
  "Department",
  "IP Address",
  "MAC Address",
  "Host Name",
  "OS",
  "RAM",
  "Storage",
  "Repair Cost",
  "Warranty End",
];

export const buildReportRows = (assetListData = []) => {
  let catalog = null;
  try {
    if (typeof window !== "undefined") {
      catalog = loadAssetFormConfig().__categoryCatalog;
    }
  } catch {
    catalog = null;
  }

  return assetListData.map((asset) => {
    const computer = isNetworkAssetCategory(asset.category, catalog);
    return [
      asset.assetName,
      asset.assetCode,
      asset.category,
      asset.assetStatus,
      asset.officeName,
      asset.department,
      computer ? asset.ipAddress : "",
      computer ? asset.macAddress : "",
      computer ? asset.hostName : "",
      computer ? asset.operatingSystem : "",
      computer ? asset.ram : "",
      computer ? asset.storage : "",
      repairCost(asset),
      dateText(asset.warrantyEnd),
    ];
  });
};

const downloadBlob = (blob, fileName) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

export const exportReportCsv = (assetListData) => {
  const rows = buildReportRows(assetListData);
  const csv = [REPORT_HEADERS, ...rows]
    .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
  downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8;" }), "asset-management-report.csv");
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const statusBadgeHtml = (status) => {
  const normalized = String(status || "").toUpperCase();
  const palette = {
    AVAILABLE: { bg: "#dcfce7", color: "#166534" },
    ASSIGNED: { bg: "#e0f2fe", color: "#075985" },
    UNDER_REPAIR: { bg: "#fef3c7", color: "#92400e" },
    RETURNED: { bg: "#f1f5f9", color: "#334155" },
    DAMAGED: { bg: "#fee2e2", color: "#991b1b" },
    LOST: { bg: "#fee2e2", color: "#991b1b" },
    RETIRED: { bg: "#ede9fe", color: "#5b21b6" },
    DISPOSED: { bg: "#ede9fe", color: "#5b21b6" },
    RECYCLED: { bg: "#ede9fe", color: "#5b21b6" },
  };
  const tone = palette[normalized] || { bg: "#ecfeff", color: "#0f766e" };

  return `<span style="background:${tone.bg};color:${tone.color};padding:4px 10px;border-radius:999px;font-size:10px;font-weight:700;letter-spacing:0.3px;">${escapeHtml(normalized || "-")}</span>`;
};

const formatWordCell = (cell, columnIndex) => {
  if (columnIndex === 3) return statusBadgeHtml(cell);
  if (columnIndex === 12) return `<span style="font-weight:700;color:#0f172a;">Rs. ${escapeHtml(Number(cell || 0).toLocaleString("en-IN"))}</span>`;
  return escapeHtml(cell || "-");
};

export const exportReportWord = (assetListData) => {
  const rows = buildReportRows(assetListData);
  const generatedAt = new Date().toLocaleString("en-IN");
  const totalAssets = assetListData.length;
  const totalRepair = assetListData.reduce((sum, asset) => sum + Number(repairCost(asset) || 0), 0);

  const tableRows = rows
    .map(
      (row, rowIndex) => `
        <tr style="background:${rowIndex % 2 === 0 ? "#ffffff" : "#f8fafc"};">
          ${row
            .map(
              (cell, columnIndex) => `
                <td style="border:1px solid #dbe4ee;padding:10px 8px;color:#334155;font-size:11px;vertical-align:middle;">
                  ${formatWordCell(cell, columnIndex)}
                </td>`,
            )
            .join("")}
        </tr>`,
    )
    .join("");

  const headerCells = REPORT_HEADERS.map(
    (header) => `
      <th style="border:1px solid #02848a;background:#03a4aa;color:#ffffff;padding:12px 8px;font-size:11px;font-weight:700;text-align:left;white-space:nowrap;">
        ${escapeHtml(header)}
      </th>`,
  ).join("");

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
      <head>
        <meta charset="utf-8" />
        <title>Asset Management Report</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          body {
            background: #ffffff !important;
            color: #0f172a !important;
            font-family: Calibri, Arial, sans-serif;
            margin: 0;
            padding: 24px;
          }
          table { border-collapse: collapse; }
        </style>
      </head>
      <body style="background:#ffffff;color:#0f172a;font-family:Calibri,Arial,sans-serif;margin:0;padding:24px;">
        <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin-bottom:18px;">
          <tr>
            <td style="background:linear-gradient(135deg,#03a4aa 0%,#0f766e 100%);padding:22px 24px;border-radius:12px;">
              <p style="margin:0 0 6px;color:#d1fae5;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">AssetPro Lifecycle ERP</p>
              <h1 style="margin:0 0 8px;color:#ffffff;font-size:28px;font-weight:800;">Asset Management Report</h1>
              <p style="margin:0;color:#ecfeff;font-size:13px;">Generated on ${escapeHtml(generatedAt)}</p>
            </td>
          </tr>
        </table>

        <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:separate;border-spacing:10px 0;margin-bottom:20px;">
          <tr>
            <td style="width:33%;background:#f8fafc;border:1px solid #dbe4ee;border-radius:10px;padding:14px 16px;">
              <p style="margin:0 0 4px;color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;">Total Assets</p>
              <p style="margin:0;color:#0f172a;font-size:24px;font-weight:800;">${totalAssets}</p>
            </td>
            <td style="width:33%;background:#f8fafc;border:1px solid #dbe4ee;border-radius:10px;padding:14px 16px;">
              <p style="margin:0 0 4px;color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;">Repair Cost</p>
              <p style="margin:0;color:#0f172a;font-size:24px;font-weight:800;">Rs. ${totalRepair.toLocaleString("en-IN")}</p>
            </td>
            <td style="width:33%;background:#f8fafc;border:1px solid #dbe4ee;border-radius:10px;padding:14px 16px;">
              <p style="margin:0 0 4px;color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;">Report Rows</p>
              <p style="margin:0;color:#0f172a;font-size:24px;font-weight:800;">${rows.length}</p>
            </td>
          </tr>
        </table>

        <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;border:1px solid #dbe4ee;border-radius:10px;overflow:hidden;">
          <thead><tr>${headerCells}</tr></thead>
          <tbody>${tableRows}</tbody>
        </table>

        <p style="margin:18px 0 0;color:#94a3b8;font-size:11px;text-align:center;">
          AssetPro Asset Management System • Confidential internal report
        </p>
      </body>
    </html>
  `;

  downloadBlob(
    new Blob(["\ufeff", html], { type: "application/msword;charset=utf-8;" }),
    "asset-management-report.doc",
  );
};

export const exportReportPdf = (assetListData) => {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  doc.setFontSize(16);
  doc.text("Asset Management Report", 40, 36);
  doc.setFontSize(10);
  doc.text(`Generated on ${new Date().toLocaleString("en-IN")}`, 40, 52);

  autoTable(doc, {
    startY: 64,
    head: [REPORT_HEADERS],
    body: buildReportRows(assetListData),
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: [3, 164, 170] },
    margin: { left: 24, right: 24 },
  });

  doc.save("asset-management-report.pdf");
};
