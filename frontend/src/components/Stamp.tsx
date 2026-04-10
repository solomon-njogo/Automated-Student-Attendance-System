type Tone = 'ink' | 'info' | 'ok' | 'warn' | 'danger'

export default function Stamp({
  tone = 'ink',
  label,
  value,
}: {
  tone?: Tone
  label: string
  value: string
}) {
  return (
    <span className={`stamp stamp-${tone}`}>
      <span className="stampLabel">{label}</span>
      <span className="stampValue">{value}</span>
    </span>
  )
}

