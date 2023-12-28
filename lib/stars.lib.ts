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

export function getIndexTypeStyle(courseType: string) {
  if (courseType.includes("LEC"))
    return {
      borderLeft: "border-l-orange-500",
      text: "text-orange-600",
      background: "bg-orange-200"
    }

  if (courseType.includes("LAB"))
    return {
      borderLeft: "border-l-emerald-500",
      text: "text-emerald-600",
      background: "bg-emerald-200"
    }

  if (courseType.includes("SEM"))
    return {
      borderLeft: "border-l-yellow-500",
      text: "text-yellow-600",
      background: "bg-yellow-200"
    }

  if (courseType.includes("TUT"))
    return {
      borderLeft: "border-l-blue-500",
      text: "text-blue-600",
      background: "bg-blue-200"
    }

  if (courseType.includes("DES"))
    return {
      borderLeft: "border-l-indigo-500",
      text: "text-indigo-600",
      background: "bg-indigo-200"
    }

  if (courseType.includes("PRJ"))
    return {
      borderLeft: "border-l-rose-500",
      text: "text-rose-600",
      background: "bg-rose-200"
    }

  return {
    borderLeft: "border-l-gray-500",
    text: "text-gray-600",
    background: "bg-gray-200"
  }
}
