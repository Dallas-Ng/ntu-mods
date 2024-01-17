import { Button } from "@/components/ui/button"
import Header from "@/components/header"
import TimetableLegend from "@/components/timetable/timetable-legend"
import TimetableOverview from "@/components/timetable/timetable-overview"
import TimetableTable from "@/components/timetable/timetable-table"

const Page = () => {
  return (
    <div className="space-y-4">
      <Header
        title="Timetable"
        subtitle={
          <span className="font-semibold text-rose-600">Read Only</span>
        }
      />

      <div className="flex gap-2">
        <Button>Build my timetable</Button>
      </div>

      <p className="text-center text-sm text-secondary">
        This timetable is being shared by someone.{" "}
        <br className="block md:hidden" />
        Copy the timetable to edit!
      </p>

      <TimetableTable />

      <div className="w-fit">
        <TimetableLegend />
      </div>

      <TimetableOverview />
    </div>
  )
}

export default Page
