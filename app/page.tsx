import CTA from "@/components/landing/landing-cta"
import Features from "@/components/landing/landing-features"
import Product from "@/components/landing/landing-product"
import Roadmap from "@/components/landing/landing-roadmap"
import LayoutDefault from "@/components/layout-default"

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
