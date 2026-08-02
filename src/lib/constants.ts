// import.meta.env, not process.env — these are read from .astro layouts that
// render both at build time (Node) and on-demand (workerd, where NODE_ENV is
// not defined, so a process.env check silently reports "not production" and
// drops the analytics scripts).
export const IS_DEV = import.meta.env.DEV

export const IS_PROD = import.meta.env.PROD

export const BASE_URL = IS_DEV ? "http://localhost:4321" : "https://ntumods.com"

export * from "./module-constants"
