export function formatTitle(courseTitle: string) {
  return courseTitle.toLowerCase().replace(/[^a-zA-Z ]/g, "")
}

export function capitaliseEachWord(input: string): string {
  return input
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
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
      borderLeft: "border-l-teal-600",
      text: "text-teal-800 dark:text-teal-300",
      textAlt: "text-teal-500",
      background:
        "bg-teal-100 dark:bg-teal-500 hover:bg-teal-200 dark:bg-opacity-20 dark:hover:bg-opacity-30 transition-colors duration-300"
    }

  if (courseType.includes("LAB"))
    return {
      borderLeft: "border-l-lime-600",
      text: "text-lime-800 dark:text-lime-300",
      textAlt: "text-lime-500",
      background:
        "bg-lime-100 dark:bg-lime-500 hover:bg-lime-200 dark:bg-opacity-20 dark:hover:bg-opacity-30 transition-colors duration-300"
    }

  if (courseType.includes("SEM"))
    return {
      borderLeft: "border-l-yellow-600",
      text: "text-yellow-800 dark:text-yellow-300",
      textAlt: "text-yellow-500",
      background:
        "bg-yellow-100 dark:bg-yellow-500 hover:bg-yellow-200 dark:bg-opacity-20 dark:hover:bg-opacity-30 transition-colors duration-300"
    }

  if (courseType.includes("TUT"))
    return {
      borderLeft: "border-l-sky-600",
      text: "text-sky-800 dark:text-sky-300",
      textAlt: "text-sky-500",
      background:
        "bg-sky-100 dark:bg-sky-500 hover:bg-sky-200 dark:bg-opacity-20 dark:hover:bg-opacity-30 transition-colors duration-300"
    }

  if (courseType.includes("DES"))
    return {
      borderLeft: "border-l-indigo-600",
      text: "text-indigo-800 dark:text-indigo-300",
      textAlt: "text-indigo-500",
      background:
        "bg-indigo-100 dark:bg-indigo-500 hover:bg-indigo-200 dark:bg-opacity-20 dark:hover:bg-opacity-30 transition-colors duration-300"
    }

  if (courseType.includes("PRJ"))
    return {
      borderLeft: "border-l-rose-600",
      text: "text-rose-800 dark:text-rose-300",
      textAlt: "text-rose-500",
      background:
        "bg-rose-100 dark:bg-rose-500 hover:bg-rose-200 dark:bg-opacity-20 dark:hover:bg-opacity-30 transition-colors duration-300"
    }

  return {
    borderLeft: "border-l-gray-500",
    text: "text-secondary",
    textAlt: "text-secondary",
    background: "bg-secondary-foreground"
  }
}
