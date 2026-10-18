// import.meta.env, not process.env — these are read from code that renders
// both at build time (Node) and on-demand (workerd, where NODE_ENV is not
// defined, so a process.env check silently reports the wrong environment).
export const IS_DEV = import.meta.env.DEV

export const BASE_URL = IS_DEV ? "http://localhost:4321" : "https://ntumods.com"

export const GIT_COMMIT_SHA = import.meta.env.PUBLIC_GIT_COMMIT_SHA ?? "unknown"

export const BUILD_TIME = import.meta.env.PUBLIC_BUILD_TIME ?? "unknown"

export const BUILD_ENV = import.meta.env.PUBLIC_BUILD_ENV ?? "unknown"

export * from "./module-constants"
