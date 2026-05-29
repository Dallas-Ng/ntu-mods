export const formatTitle = (courseTitle: string) => {
  return courseTitle.replace(/[^a-zA-Z ]/g, "").replace(/\s+/g, " ")
}

export function formatHhmm(hhmm: number): string {
  const h = Math.floor(hhmm / 100)
  const m = hhmm % 100
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

export const formatRemarks = (remarks: string) => {
  let formattedRemarks = remarks

  if (remarks.includes("2,4,6")) {
    formattedRemarks = "Even Weeks"
  } else if (remarks.includes("1,3,5")) {
    formattedRemarks = "Odd Weeks"
  } else if (remarks.includes("Teaching")) {
    formattedRemarks = formattedRemarks.replace("Teaching", "")
  }

  return formattedRemarks
}
