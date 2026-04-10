export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string
  hint?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`field ${className ?? ''}`.trim()}>
      <label className="fieldLabel">
        <span>{label}</span>
        {hint ? <span className="fieldHint">{hint}</span> : null}
      </label>
      {children}
    </div>
  )
}

