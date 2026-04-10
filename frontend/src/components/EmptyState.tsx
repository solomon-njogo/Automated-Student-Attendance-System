export default function EmptyState({
  title,
  body,
  hint,
}: {
  title: string
  body?: string
  hint?: string
}) {
  return (
    <div className="emptyState" role="status" aria-live="polite">
      <div className="emptyStateTitle">{title}</div>
      {body ? <div className="emptyStateBody">{body}</div> : null}
      {hint ? <div className="emptyStateHint">{hint}</div> : null}
    </div>
  )
}

