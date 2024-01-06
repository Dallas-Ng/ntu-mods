import dynamic from "next/dynamic"

import { Skeleton } from "@/components/ui/skeleton"
import CTA from "@/components/landing/landing-cta"
import Features from "@/components/landing/landing-features"
import Roadmap from "@/components/landing/landing-roadmap"
import LayoutDefault from "@/components/layout-default"

const Product = dynamic(() => import("@/components/landing/landing-product"), {
  ssr: false,
  loading: () => <Skeleton className="h-[59vh] w-full" />
})

export default function IndexPage() {
  return (
    <LayoutDefault>
      <div className="container space-y-10 p-3">
        <CTA />

        <Product />

        <Features />

        <Roadmap />
      </div>
    </LayoutDefault>
  )
}
