import fs from "fs/promises"
import path from "path"

import type { AllModule } from "@/types/mods"

export async function getBdeModules(): Promise<AllModule[]> {
  const filePath = path.join(process.cwd(), "public/data/api/modules.json")
  const data = await fs.readFile(filePath, "utf-8")
  const { modules } = JSON.parse(data) as { modules: AllModule[] }
  return modules.filter(
    (m) => m.isCurrentSemester && (m.searchKeys ?? []).some((k) => k.includes("GLOAD"))
  )
}
