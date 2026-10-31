// Variants for Astro's `local` font provider (see `fonts` in astro.config.mjs).
// Files and unicode-ranges come from the manifest that scripts/fonts/subset-fonts.py
// writes next to them, so a range can never drift from the font it describes.
// docs/fonts.md explains the split.
import manifest from "../assets/fonts/manifest.json" with { type: "json" }

/**
 * One @font-face per weight and file, in two groups: the core file first, then
 * the extended one. Core first matters: `FontPreload.astro` preloads only the
 * first file, and Astro takes the fallback font's metrics from the first file
 * of each weight.
 *
 * Weights stay separate faces (not one "400 700" range) so the generated
 * fallback faces keep their per-weight metrics: Arial for 400-600, Arial Bold
 * for 700.
 */
export function fontVariants(slug, weights) {
  const { files } = manifest.families[slug]
  return ["core", "ext"].flatMap((kind) =>
    weights.map((weight) => ({
      weight,
      style: "normal",
      src: [`./src/assets/fonts/${files[kind].file}`],
      unicodeRange: files[kind].unicodeRange
    }))
  )
}
