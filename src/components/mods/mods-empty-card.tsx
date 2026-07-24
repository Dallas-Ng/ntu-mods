"use client"

import { Button } from "../ui/button"

const ModsEmptyCard = () => {
  return (
    <div className="w-full space-y-4 rounded-md border p-4 text-center">
      <div className="flex justify-center">
        <img
          src="/empty.svg"
          alt="theres no search results, try changing your filters..."
          width={300}
          height={200}
          className="pb-4"
        />
      </div>

      <div>
        <p>No modules found, try changing your filters</p>
      </div>

      <div>
        <Button
          variant="outline"
          onClick={() => window.location.assign("/mods")}>
          Click here to reset filters
        </Button>
      </div>
    </div>
  )
}

export default ModsEmptyCard
