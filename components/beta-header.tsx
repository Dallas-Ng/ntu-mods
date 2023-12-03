export default function BetaHeader() {
  return (
    <div className="relative isolate flex items-center justify-center gap-x-6 overflow-hidden bg-gray-100 dark:bg-slate-900 z-10 p-2">
      <div>
        <p className="text-sm leading-6 text-slate-950 dark:text-white text-center">
          We are in <strong className="font-semibold">Alpha!</strong>
          <svg
            viewBox="0 0 2 2"
            className="mx-2 hidden md:inline h-0.5 w-0.5 fill-current"
            aria-hidden="true">
            <circle cx={1} cy={1} r={1} />
          </svg>
          <br className="block md:hidden" />
          Let us know if you encounter bugs or have suggestions.
        </p>
      </div>
    </div>
  )
}
