// Matches the line drawings on the landing page (public/landing/*.svg): thin
// #3B82F6 pen strokes and plain handwriting on the card background, no fills or
// effects. Keep `text` short (about 14 characters).
const PEN = "#3B82F6"

// Stable pseudo-random numbers from the text, so each card gets its own underline.
const seeded = (s: string) => {
  let n = [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7)
  return () => (n = (n * 1664525 + 1013904223) >>> 0) / 2 ** 32
}

const underline = (text: string, half: number) => {
  const r = seeded(text)
  const style = Math.floor(r() * 4)
  const left = 160 - half * (0.7 + r() * 0.3)
  const right = 160 + half * (0.7 + r() * 0.3)
  const y = 108 + r() * 6
  const drift = (r() - 0.5) * 8
  const bump = () => (r() - 0.5) * 12
  // 0 wavy, 1 straight and slightly tilted, 2 two strokes, 3 swoosh
  const line = (dy = 0) =>
    style === 1
      ? `M${left} ${y + dy}L${right} ${y + dy + drift}`
      : style === 3
        ? `M${left} ${y + dy}Q${160 + bump()} ${y + dy + 10} ${right} ${y + dy - 6 + drift}`
        : `M${left} ${y + dy}Q${left + (right - left) / 3} ${y + dy + bump()} ${160 + bump()} ${y + dy}T${right} ${y + dy + drift}`
  return { d: style === 2 ? `${line()}${line(7)}` : line(), width: 1.6 + r() }
}

export function ArticleThumb({ text }: { text: string }) {
  const size = text.length > 14 ? 40 : text.length > 10 ? 48 : 56
  const half = Math.min(text.length * size * 0.24, 130)
  const { d, width } = underline(text, half)

  return (
    <div
      aria-hidden="true"
      className="bg-primary/[0.07] dark:bg-background/50 aspect-[32/11] w-full">
      <svg viewBox="0 30 320 110" className="size-full" fill="none">
        <text
          x="160"
          y="95"
          textAnchor="middle"
          fontSize={size}
          fill={PEN}
          style={{ fontFamily: "var(--font-hand), cursive" }}>
          {text}
        </text>
        <path d={d} stroke={PEN} strokeWidth={width} strokeLinecap="round" />
      </svg>
    </div>
  )
}
