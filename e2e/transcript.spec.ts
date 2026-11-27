import { expect, test } from "./fixtures"
import { BASE_URL } from "./lib/urls"

// A valid one-page PDF with no text layer, matching the failure in #329.
const objects = [
  "<< /Type /Catalog /Pages 2 0 R >>",
  "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
  "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 600 800] >>"
]
let pdf = "%PDF-1.4\n"
const offsets = objects.map((object, i) => {
  const offset = pdf.length
  pdf += `${i + 1} 0 obj\n${object}\nendobj\n`
  return offset
})
const xref = pdf.length
pdf += `xref\n0 4\n0000000000 65535 f \n${offsets.map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("")}trailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`

for (const { tool, theme, width } of [
  { tool: "cgpa-planner", theme: "dark", width: 390 },
  { tool: "fgo-optimiser", theme: "light", width: 1280 }
]) {
  test(`${tool}: explains that a scanned PDF has no selectable text`, async ({
    light,
    dark
  }) => {
    const page = await (theme === "light" ? light : dark).newPage()
    const errors: string[] = []
    page.on("pageerror", (error) => errors.push(error.message))
    try {
      await page.setViewportSize({ width, height: 1000 })
      await page.goto(`${BASE_URL}/tools/${tool}`)
      const choose = page.getByRole("button", { name: "Choose PDF" })
      // The button is visible before Astro attaches the upload handler.
      await page.locator("astro-island[ssr]").filter({ has: choose }).waitFor({
        state: "detached"
      })
      const [chooser] = await Promise.all([
        page.waitForEvent("filechooser"),
        choose.click()
      ])
      await chooser.setFiles({
        name: "scan.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.from(pdf)
      })
      const notice = page.getByText("This PDF has no selectable text.")
      await expect(notice).toBeVisible()
      await expect(choose).toBeEnabled()
      await page.getByRole("button", { name: "Try with sample data" }).click()
      await expect(notice).toHaveCount(0)
      expect(errors).toEqual([])
    } finally {
      await page.close()
    }
  })
}
