export const areObjectsEqual = (
  obj1: Record<string, unknown>,
  obj2: Record<string, unknown>
) => {
  const entries1 = Object.entries(obj1)
  const entries2 = Object.entries(obj2)

  if (entries1.length !== entries2.length) {
    return false
  }

  return entries1.every(
    ([key, value]) => obj2.hasOwnProperty(key) && obj2[key] === value
  )
}
