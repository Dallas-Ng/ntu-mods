import type { Metadata } from "next"
import Image from "next/image"

import Articles from "@/components/landing/landing-articles"
import CTA from "@/components/landing/landing-cta"
import Features from "@/components/landing/landing-features"
import Product from "@/components/landing/landing-product"
import Roadmap from "@/components/landing/landing-roadmap"
import LayoutDefault from "@/components/layout-default"

export const metadata: Metadata = {
  title: "NTUMods | NTU Timetable Planner and Module Finder",
  description:
    "Plan NTU timetables, browse modules, compare indexes, check exams, share schedules, and export calendars or wallpapers in one course planning tool.",
  alternates: { canonical: "/" }
}

export default function IndexPage() {
  return (
    <LayoutDefault containerClassName="max-w-full p-0 lg:px-0">
      <div className="relative z-[3] space-y-10 p-3">
        <CTA />
      </div>

      <div className="relative overflow-hidden">
        <div className="relative z-[2] container p-3">
          <Product />
        </div>

        <Image
          height={600}
          width={900}
          loading="eager"
          alt="some cool waves"
          src="/landing/product-bg.svg"
          className="absolute bottom-1/2 left-0 z-[1] hidden w-full lg:block"
        />
        <Image
          height={600}
          width={900}
          loading="eager"
          alt="some cool waves"
          src="/landing/product-bg.svg"
          className="absolute top-1/2 z-[1] hidden w-full rotate-180 lg:block"
        />
      </div>

      <div className="relative z-[3] mt-10 space-y-10 p-3">
        <Features />

        <div className="xl:container xl:py-20">
          <Articles />
        </div>

        <Roadmap />
      </div>
    </LayoutDefault>
  )
}
