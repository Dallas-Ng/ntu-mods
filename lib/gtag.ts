import ReactGA from "react-ga4"

const IS_DEV = process.env.NODE_ENV === "development"

export function INIT_GA() {
  if (IS_DEV) return
  ReactGA.initialize("G-K1FQ9NV2EQ")
}

export function GA_TRACK_EVENT(
  name: string,
  properties: Record<string, string>
) {
  if (IS_DEV) return

  ReactGA.event(name, properties)
}
