type LocalStorageKey = "BETA_AUTH_VALID"

export const getLsItem = (key: LocalStorageKey) => {
  let item: string | null = null

  try {
    item = localStorage.getItem(key)
  } catch {
    console.error(`Unable to retrieve item: ${key}`)
  }

  return item
}

export const setLsItem = (key: LocalStorageKey, value: string) => {
  try {
    localStorage.setItem(key, value)
  } catch {
    console.error(`Unable to set item: ${key}, ${value}`)
  }
}
