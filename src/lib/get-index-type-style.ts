import { getIndexType } from "./get-index-type"

export const getIndexTypeStyle = (indexType: string) => {
  const type = getIndexType(indexType)

  switch (type) {
    case "LEC":
      return {
        borderLeft: "border-l-[hsl(var(--index-lec-border))]",
        text: "text-[hsl(var(--index-lec-text))] dark:text-[hsl(var(--index-lec-text-dark))]",
        textAlt:
          "text-[hsl(var(--index-lec-text-alt))] dark:text-[hsl(var(--index-lec-text-alt-dark))]",
        background:
          "bg-[hsl(var(--index-lec-bg))] hover:bg-[hsl(var(--index-lec-bg-hover))] dark:bg-[hsl(var(--index-lec-bg-dark)/var(--index-bg-opacity-dark))] dark:hover:bg-[hsl(var(--index-lec-bg-dark)/var(--index-bg-opacity-dark-hover))] transition-colors duration-300"
      } as const

    case "LAB":
      return {
        borderLeft: "border-l-[hsl(var(--index-lab-border))]",
        text: "text-[hsl(var(--index-lab-text))] dark:text-[hsl(var(--index-lab-text-dark))]",
        textAlt:
          "text-[hsl(var(--index-lab-text-alt))] dark:text-[hsl(var(--index-lab-text-alt-dark))]",
        background:
          "bg-[hsl(var(--index-lab-bg))] hover:bg-[hsl(var(--index-lab-bg-hover))] dark:bg-[hsl(var(--index-lab-bg-dark)/var(--index-bg-opacity-dark))] dark:hover:bg-[hsl(var(--index-lab-bg-dark)/var(--index-bg-opacity-dark-hover))] transition-colors duration-300"
      } as const

    case "SEM":
      return {
        borderLeft: "border-l-[hsl(var(--index-sem-border))]",
        text: "text-[hsl(var(--index-sem-text))] dark:text-[hsl(var(--index-sem-text-dark))]",
        textAlt:
          "text-[hsl(var(--index-sem-text-alt))] dark:text-[hsl(var(--index-sem-text-alt-dark))]",
        background:
          "bg-[hsl(var(--index-sem-bg))] hover:bg-[hsl(var(--index-sem-bg-hover))] dark:bg-[hsl(var(--index-sem-bg-dark)/var(--index-bg-opacity-dark))] dark:hover:bg-[hsl(var(--index-sem-bg-dark)/var(--index-bg-opacity-dark-hover))] transition-colors duration-300"
      } as const

    case "TUT":
      return {
        borderLeft: "border-l-[hsl(var(--index-tut-border))]",
        text: "text-[hsl(var(--index-tut-text))] dark:text-[hsl(var(--index-tut-text-dark))]",
        textAlt:
          "text-[hsl(var(--index-tut-text-alt))] dark:text-[hsl(var(--index-tut-text-alt-dark))]",
        background:
          "bg-[hsl(var(--index-tut-bg))] hover:bg-[hsl(var(--index-tut-bg-hover))] dark:bg-[hsl(var(--index-tut-bg-dark)/var(--index-bg-opacity-dark))] dark:hover:bg-[hsl(var(--index-tut-bg-dark)/var(--index-bg-opacity-dark-hover))] transition-colors duration-300"
      } as const

    case "DES":
      return {
        borderLeft: "border-l-[hsl(var(--index-des-border))]",
        text: "text-[hsl(var(--index-des-text))] dark:text-[hsl(var(--index-des-text-dark))]",
        textAlt:
          "text-[hsl(var(--index-des-text-alt))] dark:text-[hsl(var(--index-des-text-alt-dark))]",
        background:
          "bg-[hsl(var(--index-des-bg))] hover:bg-[hsl(var(--index-des-bg-hover))] dark:bg-[hsl(var(--index-des-bg-dark)/var(--index-bg-opacity-dark))] dark:hover:bg-[hsl(var(--index-des-bg-dark)/var(--index-bg-opacity-dark-hover))] transition-colors duration-300"
      } as const

    case "PRJ":
      return {
        borderLeft: "border-l-[hsl(var(--index-prj-border))]",
        text: "text-[hsl(var(--index-prj-text))] dark:text-[hsl(var(--index-prj-text-dark))]",
        textAlt:
          "text-[hsl(var(--index-prj-text-alt))] dark:text-[hsl(var(--index-prj-text-alt-dark))]",
        background:
          "bg-[hsl(var(--index-prj-bg))] hover:bg-[hsl(var(--index-prj-bg-hover))] dark:bg-[hsl(var(--index-prj-bg-dark)/var(--index-bg-opacity-dark))] dark:hover:bg-[hsl(var(--index-prj-bg-dark)/var(--index-bg-opacity-dark-hover))] transition-colors duration-300"
      } as const
  }
}
