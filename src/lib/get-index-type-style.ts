import { getIndexType } from "./get-index-type"

export const getIndexTypeStyle = (indexType: string) => {
  const type = getIndexType(indexType)

  switch (type) {
    case "LEC":
      return {
        borderLeft: "border-l-teal-600",
        text: "text-teal-800 dark:text-teal-300",
        textAlt: "text-teal-600 dark:text-teal-500",
        background:
          "bg-teal-200 dark:bg-teal-500 hover:bg-teal-300 dark:bg-opacity-20 dark:hover:bg-opacity-30 transition-opacity duration-300"
      }

    case "LAB":
      return {
        borderLeft: "border-l-lime-600",
        text: "text-lime-800 dark:text-lime-300",
        textAlt: "text-lime-600 dark:text-lime-500",
        background:
          "bg-lime-200 dark:bg-lime-500 hover:bg-lime-300 dark:bg-opacity-20 dark:hover:bg-opacity-30 transition-opacity duration-300"
      }

    case "SEM":
      return {
        borderLeft: "border-l-yellow-600",
        text: "text-yellow-800 dark:text-yellow-300",
        textAlt: "text-yellow-600 dark:text-yellow-400",
        background:
          "bg-yellow-200 dark:bg-yellow-500 hover:bg-yellow-300 dark:bg-opacity-20 dark:hover:bg-opacity-30 transition-opacity duration-300"
      }

    case "TUT":
      return {
        borderLeft: "border-l-sky-600",
        text: "text-sky-800 dark:text-sky-300",
        textAlt: "text-sky-600 dark:text-sky-500",
        background:
          "bg-sky-200 dark:bg-sky-500 hover:bg-sky-300 dark:bg-opacity-20 dark:hover:bg-opacity-30 transition-opacity duration-300"
      }

    case "DES":
      return {
        borderLeft: "border-l-indigo-600",
        text: "text-indigo-800 dark:text-indigo-300",
        textAlt: "text-indigo-600 dark:text-indigo-400",
        background:
          "bg-indigo-200 dark:bg-indigo-500 hover:bg-indigo-300 dark:bg-opacity-20 dark:hover:bg-opacity-30 transition-opacity duration-300"
      }

    case "PRJ":
      return {
        borderLeft: "border-l-rose-600",
        text: "text-rose-800 dark:text-rose-300",
        textAlt: "text-rose-600 dark:text-rose-500",
        background:
          "bg-rose-200 dark:bg-rose-500 hover:bg-rose-300 dark:bg-opacity-20 dark:hover:bg-opacity-30 transition-opacity duration-300"
      }
  }
}
