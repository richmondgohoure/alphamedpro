import { FaTimes } from 'react-icons/fa'
import './Modal.css'

function Modal({ title, onClose, children, size = 'medium' }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className={`modal-panel modal-${size}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Fermer">
            <FaTimes />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}

export default Modal
