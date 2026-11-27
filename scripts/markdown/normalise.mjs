export function normaliseMarkdown(markdown) {
  let fence
  let level = 0
  return markdown
    .split("\n")
    .map((line) => {
      const marker = /^\s*([\x60]{3,}|~{3,})(.*)$/.exec(line)
      if (fence) {
        if (
          marker &&
          marker[1][0] === fence[0] &&
          marker[1].length >= fence.length &&
          !marker[2].trim()
        ) {
          fence = undefined
        }
        return line
      }
      if (marker) {
        fence = marker[1]
        return marker[2].trim() ? line : line.trimEnd() + "text"
      }
      const heading = /^(#{1,6})( +.*)$/.exec(line)
      if (!heading) return line
      level = level ? Math.max(2, Math.min(heading[1].length, level + 1)) : 1
      return "#".repeat(level) + heading[2]
    })
    .join("\n")
}
