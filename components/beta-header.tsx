export default function BetaHeader() {
  return (
    <div className="relative isolate flex items-center justify-center gap-x-6 overflow-hidden bg-gray-100 dark:bg-slate-900 px-6 py-2.5 sm:px-3.5 z-10">
      <div>
        <p className="text-sm leading-6 text-slate-950 dark:text-white">
          We are in <strong className="font-semibold">Beta!</strong>
          <svg
            viewBox="0 0 2 2"
            className="mx-2 inline h-0.5 w-0.5 fill-current"
            aria-hidden="true">
            <circle cx={1} cy={1} r={1} />
          </svg>
          Let us know if you encounter bugs or have suggestions.
        </p>
      </div>
    </div>
  )
}
