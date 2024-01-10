import Image from "next/image"
import Link from "next/link"

import { Button } from "../ui/button"

export default function LandingCTA() {
  return (
    <div className="z-10 flex items-center justify-center align-middle">
      <div className="max-w-[800px]">
        <div className="mb-5 flex flex-col items-center justify-center text-center md:flex-row md:text-left">
          <Image src="/logo.png" alt="Logo" height={200} width={200} />

          <h1 className="bg-gradient-to-l from-blue-700 to-blue-800 bg-clip-text text-5xl font-bold text-transparent md:text-6xl">
            Dabao your <br />
            mods better
          </h1>
        </div>

        <p className="text-center">
          Get access to all indexes including ICC modules and plan your
          timetable with ease.
        </p>

        <div className="my-4 flex justify-center">
          <Button>
            <Link href="/stars">Build My Timetable Now</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
