import { LinkArrow } from "@/components/ui/text-link"

const BANNER_TEXT =
  "New: calendar export now follows the NTU academic calendar, with public holidays and exam weeks"
const BANNER_HREF = "/changelog"

/**
 * Derived from the text, so editing the banner re-shows it to people who closed
 * the previous one.
 */
export const BANNER_ID = (() => {
  let h = 0
  for (const c of BANNER_TEXT + BANNER_HREF) h = (h * 31 + c.charCodeAt(0)) | 0
  return (h >>> 0).toString(36)
})()

export const Banner = () => (
  <a href={BANNER_HREF} className="group">
    <div
      data-nosnippet
      className="bg-primary relative z-10 flex items-center justify-center px-2 py-1.5 md:p-1">
      <p className="text-primary-foreground text-center text-sm leading-[1.2] font-medium text-balance md:leading-5">
        {BANNER_TEXT}
        <LinkArrow className="ml-1 inline align-[-3px]" />
      </p>
    </div>
  </a>
)
