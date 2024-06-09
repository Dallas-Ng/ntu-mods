import { M_EXAMS } from "@/data/2024/exam"

const getModuleExam = (moduleKey: string): Exam | undefined => {
  return M_EXAMS[moduleKey]
}

export default getModuleExam
