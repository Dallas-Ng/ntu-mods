import dynamic from "next/dynamic"
import Image from "next/image"

import { Skeleton } from "@/components/ui/skeleton"
import CTA from "@/components/landing/landing-cta"
import Features from "@/components/landing/landing-features"
import Roadmap from "@/components/landing/landing-roadmap"
import LayoutDefault from "@/components/layout-default"

const Product = dynamic(() => import("@/components/landing/landing-product"), {
  ssr: false,
  loading: () => (
    <div className="bg-background dark:bg-slate-950">
      <Skeleton className="z-[2] h-[59vh] w-full " />
    </div>
  )
})

export default function IndexPage() {
  return (
    <LayoutDefault childrenContainerClassName="max-w-full">
      <div className="relative z-[3] space-y-10 p-3">
        <CTA />
      </div>

      <div className="relative">
        <div className="container relative z-[2] p-3">
          <Product />
        </div>

        <Image
          height={600}
          width={900}
          alt="some cool waves"
          src="/landing/product-bg.svg"
          className="absolute  bottom-1/2 left-0 z-[1] hidden w-full md:block"
        />
        <Image
          height={600}
          width={900}
          alt="some cool waves"
          src="/landing/product-bg.svg"
          className="absolute top-1/2 z-[1] hidden w-full rotate-180 md:block"
        />
      </div>

      <div className="relative mt-10 space-y-10 p-3">
        <Features />

        <Roadmap />
      </div>
    </LayoutDefault>
  )
}
