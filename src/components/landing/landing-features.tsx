import Image from "next/image"
import Link from "next/link"

import { DarkThemeIcon, LightThemeIcon } from "../settings/appearance-settings"
import { Input } from "../ui/input"

const LandingFeatures = () => {
  return (
    <div>
      <div className="mb-6 text-center">
        <h2 className="text-4xl font-bold">Features</h2>
        <p className="text-muted-foreground">
          NTU Mods allows you to build your timetable your own way
        </p>
      </div>

      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Link href="/timetable" className="cursor-pointer">
            <div className="relative h-[300px] w-full rounded-xl border p-3 shadow">
              <div className="absolute top-12 left-8 w-10/12 md:left-3 lg:left-8">
                <h3 className="text-2xl font-bold">
                  Filter, Search and Manage
                </h3>
                <p className="text-lg text-muted-foreground">
                  Stop spamming each indexes to find the best timeslots and
                  start searching for indexes easier
                </p>
              </div>

              <div className="absolute bottom-8 left-8 w-10/12 md:bottom-3 md:left-3 lg:bottom-3 lg:left-8">
                <Input
                  className="w-full"
                  placeholder="Search for Indexes, Modules and more"
                />
              </div>
            </div>
          </Link>

          <div className="relative h-[300px] w-full overflow-hidden rounded-xl border p-3 shadow">
            <div className="absolute top-12 left-8 w-10/12 md:left-3 lg:left-8">
              <h3 className="text-2xl font-bold">Save as Photo or Calendar</h3>
              <p className="text-lg text-muted-foreground">
                NTU Mods supports exporting your timetable for your lockscreen
                photo to your calendar
              </p>
            </div>

            <Image
              src="/landing/mobile.svg"
              alt="use on any devices"
              width={200}
              height={110}
              className="absolute right-5 bottom-[-45%] w-[70%] p-5 lg:bottom-[-58%] lg:w-[60%]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <Link href="/mods" className="cursor-pointer">
            <div className="relative h-[300px] w-full overflow-hidden rounded-xl border p-3 shadow">
              <Image
                src="/landing/icc-mods.svg"
                alt="share with your friends"
                width={400}
                height={110}
                className="absolute right-[10%] bottom-[-20%] w-[70%] -rotate-45 p-5 invert dark:invert-0"
              />

              <div className="absolute bottom-8 left-8 w-10/12 md:bottom-3 md:left-3 lg:bottom-3 lg:left-8">
                <h3 className="mb-1 text-xl font-semibold">
                  View all Courses and Indexes
                </h3>
                <p className="text-muted-foreground">
                  Including your ICC modules and other special indexes not shown
                  on STARS
                </p>
              </div>
            </div>
          </Link>

          <Link href="/timetable" className="cursor-pointer">
            <div className="relative h-[300px] w-full overflow-hidden rounded-xl border p-3 shadow">
              <Image
                src="/landing/share.svg"
                alt="share with your friends"
                width={200}
                height={110}
                className="absolute top-0 left-1/2 w-[60%] -translate-x-1/2 p-5 md:top-[10%] md:w-[80%] lg:top-0 lg:w-[55%]"
              />

              <div className="absolute bottom-8 left-8 w-10/12 md:bottom-3 md:left-3 lg:bottom-3 lg:left-8">
                <h3 className="mb-1 text-xl font-semibold">
                  Share with Friends
                </h3>
                <p className="text-muted-foreground">
                  With a simple link, you can share your timetable with anyone
                </p>
              </div>
            </div>
          </Link>

          <Link href="/settings" className="cursor-pointer">
            <div className="relative h-[300px] w-full overflow-hidden rounded-xl border bg-muted p-3 shadow">
              <div className="flex w-[500px] gap-1 md:w-[300px] lg:w-[500px]">
                <DarkThemeIcon label={false} />
                <LightThemeIcon label={false} />
              </div>

              <div className="absolute bottom-8 left-8 w-10/12 md:bottom-3 md:left-3 lg:bottom-3 lg:left-8">
                <h3 className="mb-1 text-xl font-semibold">
                  Customise Your Experience
                </h3>
                <p className="text-muted-foreground">
                  Hide details of indexes and modules in the table, switch
                  themes and more
                </p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default LandingFeatures
