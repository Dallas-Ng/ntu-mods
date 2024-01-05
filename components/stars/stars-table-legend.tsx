export default function StarsTableLegend() {
  return (
    <div className="grid grid-cols-3 items-center justify-end gap-x-2 gap-y-1 md:grid-cols-6">
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

      <div className="flex items-center gap-1">
        <span className="h-[10px] w-[10px] rounded-full bg-indigo-500" />
        <span className="text-xs">DES</span>
      </div>

      <div className="flex items-center gap-1">
        <span className="h-[10px] w-[10px] rounded-full bg-rose-500" />
        <span className="text-xs">PRJ</span>
      </div>
    </div>
  )
}
