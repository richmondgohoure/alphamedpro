import './PageHeader.css'

function PageHeader({ title, subtitle, actionLabel, onAction }) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actionLabel && (
        <button type="button" className="page-header-action" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  )
}

export default PageHeader
