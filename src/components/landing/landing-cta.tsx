import { Fragment } from "react"

import { siteConfig } from "@/config/site"

import { Button } from "../ui/button"

const LandingCTA = () => {
  const secondaryLinks = siteConfig.navLinks.filter(
    (link) => link.route !== "/timetable"
  )

  return (
    <div className="z-10 flex items-center justify-center align-middle">
      <div className="max-w-[720px] text-center">
        <h1 className="bg-gradient-to-l from-blue-700 to-blue-800 bg-clip-text text-4xl leading-tight font-bold text-transparent md:text-6xl">
          Your NTU Timetable, Built in Minutes
        </h1>

        <p className="text-muted-foreground mx-auto mt-4 max-w-lg text-lg">
          Auto-generate a clash-free schedule, browse every module and index,
          and share it with friends — free, no login required.
        </p>

        <div className="my-6 flex justify-center">
          <a href="/timetable">
            <Button size="lg" className="w-full md:w-fit">
              Build My Timetable Now
            </Button>
          </a>
        </div>

        <div className="text-muted-foreground flex flex-wrap items-center justify-center gap-2 text-sm">
          {secondaryLinks.map((link, i) => (
            <Fragment key={link.route}>
              {i > 0 && <span className="opacity-40">·</span>}
              <a
                href={link.route}
                className="hover:text-foreground underline-offset-4 hover:underline">
                {link.label}
              </a>
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  )
}

export default LandingCTA
