import { IS_PROD } from "./constants"

type HttpMethod = "GET" | "POST"

interface FetchOptions {
  method: HttpMethod
  url: string
  headers?: HeadersInit
  body?: any
  params?: Record<string, any>
}

const BASE_URL = IS_PROD
  ? "https://ntumods.com/api"
  : "http://localhost:3000/api"

const fetchApi = async <T>({
  method,
  url,
  headers = {},
  body,
  params
}: FetchOptions): Promise<T> => {
  const queryString = params ? "?" + new URLSearchParams(params).toString() : ""

  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers
    }
  }

  if (method === "POST" && body) {
    options.body = JSON.stringify(body)
  }

  try {
    const response = await fetch(BASE_URL + url + queryString, options)
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error("Fetch error:", error)
    throw error
  }
}

export const get = async <T>(url: string, params?: Record<string, any>) =>
  fetchApi<T>({ method: "GET", url, params })
