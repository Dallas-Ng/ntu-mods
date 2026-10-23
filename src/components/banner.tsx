import { LinkArrow } from "@/components/ui/text-link"

const BANNER_TEXT = "New: see the walk between your classes on the timetable"
const BANNER_HREF = "/timetable"

/** Derived from the text, so editing the banner re-shows it to people who
 * closed the previous one. */
export const BANNER_ID = (() => {
  let h = 0
  for (const c of BANNER_TEXT + BANNER_HREF) h = (h * 31 + c.charCodeAt(0)) | 0
  return (h >>> 0).toString(36)
})()

export const Banner = () => (
  <a href={BANNER_HREF} className="group">
    <div
      data-nosnippet
      className="relative z-10 flex items-center justify-center bg-yellow-300 px-2 py-1.5 md:p-1">
      <p className="text-center text-sm leading-[1.2] font-medium text-balance text-black md:leading-5">
        {BANNER_TEXT}
        <LinkArrow className="ml-1 inline align-[-3px]" />
      </p>
    </div>
  </a>
)
