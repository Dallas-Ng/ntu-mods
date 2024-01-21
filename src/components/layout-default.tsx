import { cn } from "@/lib/utils"

import { Banner } from "./banner"
import Breadcrumbs from "./breadcrumbs"
import Footer from "./footer"
import Navbar from "./navbar"

interface Props {
  children?: React.ReactNode
  containerClassName?: string
  breadcrumbs?: boolean
}

const LayoutDefault = ({
  children,
  containerClassName,
  breadcrumbs = true
}: Props) => {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Banner.release />
      <Navbar />

      {breadcrumbs && <Breadcrumbs />}

      <main
        className={cn(
          "container relative flex-1 px-3 lg:px-5 ",
          containerClassName
        )}>
        {children}
      </main>

      <Footer />
    </div>
  )
}

export default LayoutDefault
