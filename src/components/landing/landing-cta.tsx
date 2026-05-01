import Image from "next/image"
import Link from "next/link"

import { Button } from "../ui/button"

const LandingCTA = () => {
  return (
    <div className="z-10 flex items-center justify-center align-middle">
      <div className="max-w-[800px]">
        <div className="mb-5 flex flex-col items-center justify-center text-center md:flex-row md:text-left">
          <Image
            src="/logo.png"
            alt="Logo"
            height={200}
            width={200}
            loading="eager"
          />

          <h1 className="bg-gradient-to-l from-blue-700 to-blue-800 bg-clip-text text-5xl font-bold text-transparent md:text-6xl">
            Plan your <br />
            mods better
          </h1>
        </div>

        <p className="text-center">
          Plan, share and find out more about different modules in NTU.
        </p>

        <div className="my-4 flex justify-center gap-2">
          <Link href="/timetable">
            <Button>Build My Timetable Now</Button>
          </Link>

          <Link href="/mods">
            <Button variant="outline">Find a Module</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default LandingCTA
