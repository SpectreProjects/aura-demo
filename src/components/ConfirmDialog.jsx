import { AlertTriangle, X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import './ConfirmDialog.css'

export default function ConfirmDialog({
  children,
  confirmLabel,
  errorMessage,
  isBusy = false,
  isOpen,
  onClose,
  onConfirm,
  title,
  tone = 'primary',
}) {
  const dialogRef = useRef(null)
  const cancelRef = useRef(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (isOpen && !dialog.open) {
      dialog.showModal()
      window.requestAnimationFrame(() => cancelRef.current?.focus())
    } else if (!isOpen && dialog.open) {
      dialog.close()
    }
  }, [isOpen])

  function close() {
    if (isBusy) return
    onClose()
  }

  return (
    <dialog
      aria-labelledby="aura-confirm-dialog-title"
      className="aura-confirm-dialog"
      onCancel={(event) => {
        event.preventDefault()
        close()
      }}
      ref={dialogRef}
    >
      <div className="acd-heading">
        <span className={`acd-icon acd-icon-${tone}`}><AlertTriangle aria-hidden="true" size={20} /></span>
        <div>
          <p>AURA confirmation</p>
          <h2 id="aura-confirm-dialog-title">{title}</h2>
        </div>
        <button aria-label="Close confirmation" disabled={isBusy} onClick={close} type="button"><X aria-hidden="true" size={18} /></button>
      </div>
      <div className="acd-body">{children}</div>
      <div aria-live="polite" className="acd-error-slot">
        {errorMessage ? <p role="alert">{errorMessage}</p> : null}
      </div>
      <div className="acd-actions">
        <button className="acd-cancel" disabled={isBusy} onClick={close} ref={cancelRef} type="button">Cancel</button>
        <button className={`acd-confirm acd-confirm-${tone}`} disabled={isBusy} onClick={onConfirm} type="button">
          {isBusy ? 'Working…' : confirmLabel}
        </button>
      </div>
    </dialog>
  )
}
