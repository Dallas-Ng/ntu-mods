import { Tbl } from "@/types/database.types"

import { SUPABASE } from "./supabase/client"

export const getAcademicYears = async (): Promise<Tbl<"academic_years">[]> => {
  const { data } = (await SUPABASE.from("academic_years").select()) || []
  return data as Tbl<"academic_years">[]
}

export const getCoursesByAy = async (yearCode: string) => {
  const { data } = await SUPABASE.from("courses")
    .select()
    .eq("academic_year", yearCode)
    .limit(100)

  return data as Tbl<"courses">[]
}
