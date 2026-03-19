export function RadioEmbed({
  className = "",
  style,
}: {
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <iframe
      src="https://www.coreyterrell.com/assets/external/radio.html"
      title="WTED Radio"
      className={`w-full rounded-md border-0 ${className}`}
      style={{ height: "66px", ...style }}
    />
  )
}
