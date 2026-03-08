import type { ApiModule } from "@/lib/server/get-module-metadata"

interface Props {
  module: ApiModule
}

const NotAvailable = () => <span className="text-muted-foreground">N/A</span>

const ModsInfoTable = ({ module }: Props) => {
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
      </tbody>
    </table>
  )
}

export default ModsInfoTable
