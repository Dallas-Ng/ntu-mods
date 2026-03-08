import type { ApiModule } from "@/lib/server/get-module-metadata"
import type { ApiExam } from "@/lib/server/get-module-exam-data"

interface Props {
  module: ApiModule
  exam?: ApiExam | null
}

const NotAvailable = () => <span className="text-muted-foreground">N/A</span>

const ModsInfoTable = ({ module, exam }: Props) => {
  return (
    <table className="bg-background text-sm">
      <tbody>
        <tr>
          <td className="p-2">AUs</td>
          <td className="p-2">{module.au} AUs</td>
        </tr>

        <tr>
          <td className="p-2">Not Available To Programme</td>
          <td className="p-2">
            {module.notAvailableToProgramme ?? <NotAvailable />}
          </td>
        </tr>

        <tr>
          <td className="p-2">Exam</td>
          <td className="p-2">
            {exam ? `${exam.date}, ${exam.start_time} - ${exam.end_time}` : <NotAvailable />}
          </td>
        </tr>
      </tbody>
    </table>
  )
}

export default ModsInfoTable
