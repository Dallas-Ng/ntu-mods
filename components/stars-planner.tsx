"use client"

import StarsShareButton from "./stars-buttons/stars-share-button"
import StarsTable from "./stars-table"

export default function StarsPlanner() {
  return (
    <>
      <div className="flex gap-2 px-2 py-4">
        <StarsShareButton />
      </div>

      <StarsTable />
    </>
  )
}
