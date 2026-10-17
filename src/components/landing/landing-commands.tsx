import { useState } from "react"

export type Command = {
  name: string
  href: string
  desc: string
  art?: string
  invert?: boolean
}

const artClass = (c: Command) =>
  `object-contain ${c.invert ? "invert dark:invert-0" : ""}`

// Giant command menu: typing filters, hover or arrow keys move the selection.
// Rows are plain links, so it works without script and on touch.
const LandingCommands = ({ commands }: { commands: Command[] }) => {
  const [query, setQuery] = useState("")
  const [active, setActive] = useState(0)

  const q = query.trim().toLowerCase()
  const rows = q
    ? commands.filter((c) => `${c.name} ${c.desc}`.toLowerCase().includes(q))
    : commands
  const selected = Math.min(active, Math.max(rows.length - 1, 0))
  const current = rows[selected]

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActive(Math.min(selected + 1, rows.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActive(Math.max(selected - 1, 0))
    } else if (e.key === "Enter" && current) {
      window.location.href = current.href
    }
  }

  return (
    <section aria-label="Features and tools">
      <input
        type="search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setActive(0)
        }}
        onKeyDown={onKeyDown}
        placeholder="Find a feature or tool"
        aria-label="Find a feature or tool"
        className="bg-muted placeholder:text-foreground/60 focus-visible:ring-primary h-14 w-full rounded-xl px-5 text-xl font-semibold tracking-tight outline-none focus-visible:ring-2 md:h-20 md:px-8 md:text-4xl"
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-[7fr_5fr]">
        <ul className="space-y-1">
          {rows.map((c, i) => {
            const on = i === selected
            return (
              <li key={c.href + c.name} className="landing-reveal">
                <a
                  href={c.href}
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  className={`flex items-center gap-4 rounded-xl px-5 py-4 transition-colors duration-150 md:px-6 md:py-5 ${
                    on ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  }`}>
                  <span className="min-w-0 flex-1">
                    <span className="block text-3xl leading-[1.1] font-bold tracking-tight md:text-5xl">
                      {c.name}
                    </span>
                    <span className="mt-1 block max-w-xl text-base md:text-lg lg:hidden">
                      {c.desc}
                    </span>
                  </span>
                  {c.art && (
                    <img
                      src={c.art}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className={`size-16 shrink-0 lg:hidden ${artClass(c)}`}
                    />
                  )}
                </a>
              </li>
            )
          })}
          {!rows.length && (
            <li className="px-5 py-8 text-xl md:px-6">
              Nothing matches &ldquo;{query}&rdquo;.
            </li>
          )}
        </ul>

        <div
          aria-hidden="true"
          className="bg-muted sticky top-24 hidden h-[480px] self-start overflow-hidden rounded-2xl p-8 lg:block">
          {commands.map((c) => (
            <div
              key={c.href + c.name}
              className={`absolute inset-8 flex flex-col justify-center gap-6 transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none ${
                current === c
                  ? "translate-y-0 opacity-100"
                  : "pointer-events-none translate-y-2 opacity-0"
              }`}>
              {c.art ? (
                <img
                  src={c.art}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className={`min-h-0 flex-1 ${artClass(c)}`}
                />
              ) : (
                <p className="text-4xl leading-tight font-bold tracking-tight">
                  {c.name}
                </p>
              )}
              <p className="text-lg">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default LandingCommands
