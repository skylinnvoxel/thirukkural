/**
 * Renders a Kural couplet in its correct classical layout: exactly two
 * lines, four சீர்கள் (metrical words) on the first and three on the
 * second, as printed in every standard edition. Each line never wraps
 * onto a third line — instead the font scales down to fit the container,
 * since re-wrapping would break the traditional four/three structure.
 */
export default function KuralLines({
  text,
  className = '',
  size = 'clamp(0.95rem, 4.2vw, 1.35rem)',
}: {
  text: string
  className?: string
  size?: string
}) {
  const lines = text.split('\n')
  return (
    <div className={`inline-block text-left ${className}`} style={{ fontSize: size }}>
      {lines.map((line, i) => (
        <p key={i} className="leading-snug whitespace-nowrap">
          {line}
        </p>
      ))}
    </div>
  )
}
