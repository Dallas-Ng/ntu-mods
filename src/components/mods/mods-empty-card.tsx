"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"

import { Button } from "../ui/button"

const ModsEmptyCard = () => {
  const router = useRouter()

  return (
    <div className="w-full space-y-4 rounded-md border p-4 text-center">
      <div className="flex justify-center">
        <Image
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
        <Button variant="outline" onClick={() => router.push("/mods")}>
          Click here to reset filters
        </Button>
      </div>
    </div>
  )
}

export default ModsEmptyCard
