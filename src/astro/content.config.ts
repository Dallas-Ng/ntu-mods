import { fileURLToPath } from "node:url"
import { defineCollection, z } from "astro:content"
import { glob } from "astro/loaders"

const articles = defineCollection({
  loader: glob({
    pattern: ["*.md", "!_*.md"],
    base: fileURLToPath(new URL("../../content/articles", import.meta.url))
  }),
  schema: z.object({
    title: z.string(),
    description: z.string().default("Read the latest NTUMods article."),
    date: z.string(),
    updated: z.string().optional(),
    author: z.string().default("NTUMods"),
    category: z.string().default("General"),
    tags: z
      .union([z.array(z.string()), z.string()])
      .optional()
      .transform((value) => {
        if (!value) return []
        if (Array.isArray(value)) return value
        return value
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
      }),
    thumbnail: z.string().optional().default(""),
    thumbnailAlt: z.string().optional(),
    thumbnailText: z.string().optional().default("")
  })
})

export const collections = { articles }
