import deleteModelImage from "../../images/deleteModalImage.svg";
import "./ConfirmDeleteModal.css";

export default function ConfirmDeleteModal({
  open,
  title = "DELETE PERMANENTLY?",
  message = "If you delete this item, you won't be able to recover it. Do you want to delete it?",
  confirmLabel = "DELETE",
  onCancel,
  onConfirm,
}) {
  if (!open) return null;

  return (
    <div className="delete-modal-overlay" onClick={onCancel}>
      <div className="delete-modal" onClick={(event) => event.stopPropagation()}>
        <img src={deleteModelImage} alt="delete" className="delete-modal-image" />
        <h2 className="delete-title">{title}</h2>
        <p className="delete-text">{message}</p>
        <div className="delete-modal-buttons">
          <button type="button" className="cancel-delete-btn" onClick={onCancel}>
            CANCEL
          </button>
          <button type="button" className="confirm-delete-btn" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
