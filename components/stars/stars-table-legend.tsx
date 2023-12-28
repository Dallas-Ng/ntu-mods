export default function StarsTableLegend() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        <span className="h-[10px] w-[10px] rounded-full bg-orange-500" />
        <span className="text-xs">LEC</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="h-[10px] w-[10px] rounded-full bg-emerald-500" />
        <span className="text-xs">LAB</span>
      </div>

      <div className="flex items-center gap-1">
        <span className="h-[10px] w-[10px] rounded-full bg-yellow-500" />
        <span className="text-xs">SEM</span>
      </div>

      <div className="flex items-center gap-1">
        <span className="h-[10px] w-[10px] rounded-full bg-blue-500" />
        <span className="text-xs">TUT</span>
      </div>

      {/* <div className="flex items-center gap-1">
        <span className="h-[10px] w-[10px] rounded-full bg-gray-500" />
        <span className="text-xs">Others</span>
      </div> */}
    </div>
  )
}
