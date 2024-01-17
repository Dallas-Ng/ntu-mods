import { M_EXAMS } from "@/data/2023/exam"

const getModuleExam = (moduleKey: string): Exam | undefined => {
  return M_EXAMS[moduleKey]
}

export default getModuleExam
