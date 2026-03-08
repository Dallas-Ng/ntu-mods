import { M_EXAMS } from "@/data/2024/exam"

const getModuleExam = (moduleKey: string): Exam | undefined => {
  if (moduleKey in M_EXAMS) {
    return M_EXAMS[moduleKey]
  }

  return undefined
}

export default getModuleExam
