import { SUPABASE } from "./supabase/client"

const useDB = () => {
  const getAcademicYears = async () => {
    const { data } = await SUPABASE.from("academic_years").select()
    return data
  }

  return { getAcademicYears }
}

export default useDB
