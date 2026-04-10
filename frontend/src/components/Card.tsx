export default function Card({
  title,
  subtitle,
  aside,
  children,
  className,
}: {
  title?: string
  subtitle?: string
  aside?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={`card ${className ?? ''}`.trim()}>
      {(title || subtitle || aside) && (
        <div className="cardHeader">
          <div style={{ minWidth: 0 }}>
            {title ? <h2>{title}</h2> : null}
            {subtitle ? <span>{subtitle}</span> : null}
          </div>
          {aside ? <div>{aside}</div> : null}
        </div>
      )}
      <div className="cardInner">{children}</div>
    </section>
  )
}

