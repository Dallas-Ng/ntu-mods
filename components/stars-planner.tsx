"use client"

import StarsShareButton from "./stars-buttons/stars-share-button"
import StarsTable from "./stars-table"

export default function StarsPlanner() {
  return (
    <>
      <div className="flex items-center gap-2 px-2 py-4">
        <StarsShareButton />

        <p className="pr-4 text-sm">
          Click the bottom <span className="hidden md:inline-flex">right</span>{" "}
          button to start!
        </p>
      </div>

      <StarsTable />
    </>
  )
}
