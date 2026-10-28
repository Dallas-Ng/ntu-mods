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

for (const tool of ["cgpa-planner", "fgo-optimiser"]) {
  for (const theme of ["light", "dark"] as const) {
    for (const width of [390, 1280]) {
      test(`${tool}: PDF without text, ${theme}, ${width}px`, async ({
        light,
        dark
      }, testInfo) => {
        const page = await (theme === "light" ? light : dark).newPage()
        const errors: string[] = []
        page.on("pageerror", (error) => errors.push(error.message))
        try {
          await page.setViewportSize({ width, height: 1000 })
          await page.goto(`${BASE_URL}/tools/${tool}`)
          await page.getByRole("button", { name: "Choose PDF" }).click()
          await page.locator('input[type="file"]').setInputFiles({
            name: "scan.pdf",
            mimeType: "application/pdf",
            buffer: Buffer.from(pdf)
          })
          await expect(
            page.getByText("This PDF has no selectable text.", { exact: false })
          ).toBeVisible()
          await expect(
            page.getByRole("button", { name: "Choose PDF" })
          ).toBeEnabled()
          await page.screenshot({
            path: testInfo.outputPath("upload-error.png")
          })
          await page
            .getByRole("button", { name: "Try with sample data" })
            .click()
          await expect(
            page.getByText("This PDF has no selectable text.", { exact: false })
          ).toHaveCount(0)
          expect(errors).toEqual([])
        } finally {
          await page.close()
        }
      })
    }
  }
}
