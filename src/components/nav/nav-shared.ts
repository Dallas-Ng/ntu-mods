/** Pieces the desktop bar (main-nav.tsx) and the phone menu share. */

/** Top-level items with a yellow "new" dot until first visited. */
export const NEW_DOTS: Record<string, string> = {
  "/tools": "seen-tools",
  "/maps": "seen-maps",
  "/exams": "seen-exams",
  "/calendar": "seen-calendar",
  "/developers": "seen-developers"
}

/** True on the route itself and every page under it. */
export const isActive = (pathname: string, route: string) =>
  pathname === route || pathname.startsWith(`${route}/`)
