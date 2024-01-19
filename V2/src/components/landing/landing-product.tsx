import TimetableTable from "../timetable/timetable-table"

const TEMPLATE_COURSES = {
  MH1812: "10122",
  MH1810: "50001",
  CC0007: "83019",
  BA2204: "00187",
  IM2073: "32361",
  EE4208: "32263"
}

export default function LandingProduct() {
  return (
    <div className="relative h-[59vh] w-full justify-center overflow-hidden rounded-lg border-4 bg-background shadow-xl dark:bg-slate-950">
      <TimetableTable timetable={TEMPLATE_COURSES} fullCell />
    </div>
  )
}
