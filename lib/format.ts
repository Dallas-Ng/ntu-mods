export function formatTitle(courseTitle: string) {
  return courseTitle.toLowerCase().replace(/[^a-zA-Z ]/g, "")
}

export function formatRemarks(remarks: string) {
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
