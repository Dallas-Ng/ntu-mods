"use client"

// Theme state lives in localStorage + a DOM class, read independently by each
// consumer via useTheme() (see @/hooks/use-theme) — no context provider needed,
// so this component is just a passthrough kept for JSX call-site compatibility.
const ThemeProvider = ({ children }: { children?: React.ReactNode }) => (
  <>{children}</>
)

export default ThemeProvider
