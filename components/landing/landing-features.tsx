import Image from "next/image"
import Link from "next/link"

import { DarkThemeIcon, LightThemeIcon } from "../settings/appearance-settings"

export default function LandingFeatures() {
  return (
    <div>
      <div className="mb-6 text-center">
        <h2 className="text-4xl font-bold">Features</h2>
        <p className="text-secondary">
          NTU Mods allows you to build your timetable your own way
        </p>
      </div>

      <div className="mx-auto flex max-w-7xl flex-col gap-5 ">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Link href="/stars" className="cursor-pointer">
            <div className="relative h-[300px] w-full rounded-xl border bg-muted p-3 shadow">
              <div className="absolute left-8 top-12 w-10/12">
                <h3 className="text-2xl font-bold">
                  Filter, Search and Manage
                </h3>
                <p className="text-lg text-secondary">
                  Stop spamming each indexes to find the best timeslots and
                  start searching for indexes easier
                </p>
              </div>
              <div className="absolute bottom-8 left-8 w-10/12">
                {/* Input Style */}
                <div className="flex h-10 w-full rounded-md border border-input bg-background px-5 py-4 text-sm ring-offset-background">
                  <span className="flex items-center text-neutral-400">
                    Search for
                    <span className="relative ml-1 h-[1em] w-36 overflow-hidden">
                      <span className="absolute h-full w-full -translate-y-full animate-slide leading-[0.9] text-white">
                        Index Code
                      </span>

                      <span className="absolute h-full w-full -translate-y-full animate-slide leading-[0.9] text-white [animation-delay:1.00s]">
                        Timeslot or Day
                      </span>

                      <span className="absolute h-full w-full -translate-y-full animate-slide leading-[0.9] text-white [animation-delay:2.00s]">
                        Tutorial Group
                      </span>
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </Link>

          <div className="relative h-[300px] w-full overflow-hidden rounded-xl border p-3 shadow">
            <div className="absolute left-8 top-12 w-10/12">
              <h3 className="text-2xl font-bold">Built for all devices</h3>
              <p className="text-lg text-secondary">
                NTU Mods supports all devices including mobile! Build your
                timetable anytime
              </p>
            </div>

            <Image
              src="/landing/mobile.svg"
              alt="use on any devices"
              width={200}
              height={110}
              className="absolute bottom-[-45%] right-5 w-[70%] p-5 md:bottom-[-58%] md:w-[60%]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <Link href="/mods" className="cursor-pointer">
            <div className="relative h-[300px] w-full overflow-hidden rounded-xl border p-3 shadow">
              <Image
                src="/landing/icc-mods.svg"
                alt="share with your friends"
                width={200}
                height={110}
                className="absolute -right-5 top-3 p-5 md:w-[60%]"
              />

              <div className="absolute bottom-8 left-8 w-10/12">
                <h3 className="mb-1 text-xl font-semibold">
                  View all Courses and Indexes
                </h3>
                <p className="text-secondary">
                  Including your ICC modules and other special indexes not shown
                  on STARS
                </p>
              </div>
            </div>
          </Link>

          <Link href="/stars" className="cursor-pointer">
            <div className="relative h-[300px] w-full overflow-hidden rounded-xl border p-3 shadow">
              <Image
                src="/landing/share.svg"
                alt="share with your friends"
                width={200}
                height={110}
                className="absolute left-1/2 top-0 w-[60%] -translate-x-1/2 p-5 md:w-[55%]"
              />

              <div className="absolute bottom-8 left-8 w-10/12">
                <h3 className="mb-1 text-xl font-semibold">
                  Share with Friends
                </h3>
                <p className="text-secondary">
                  With a simple link, you can share your timetable with anyone
                </p>
              </div>
            </div>
          </Link>

          <Link href="/settings" className="cursor-pointer">
            <div className="relative h-[300px] w-full overflow-hidden rounded-xl border bg-muted p-3 shadow">
              <div className="flex w-[500px] gap-1">
                <DarkThemeIcon label={false} /> <LightThemeIcon label={false} />
              </div>

              <div className="absolute bottom-8 left-8 w-10/12">
                <h3 className="mb-1 text-xl font-semibold">
                  Customise Your Experience
                </h3>
                <p className="text-secondary">
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
