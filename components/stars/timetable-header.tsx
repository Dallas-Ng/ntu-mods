import StarsTableLegend from "./stars-table-legend"

interface Props {
  children?: React.ReactNode
}

export default function TimetableHeader({ children }: Props) {
  return (
    <>
      <div className="flex w-full items-baseline justify-between">
        <h1 className="bg-gradient-to-r from-blue-800 to-indigo-900 bg-clip-text text-3xl font-bold text-transparent">
          Stars* Planner
        </h1>

        <StarsTableLegend />
      </div>

      <div className="my-2 flex items-center gap-2">{children}</div>
    </>
  )
}
