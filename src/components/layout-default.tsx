import { cn } from "@/lib/utils"

import Footer from "./footer"
import Navbar from "./navbar"

interface Props {
  children?: React.ReactNode
  containerClassName?: string
}

const LayoutDefault = ({ children, containerClassName }: Props) => (
  <div className="flex min-h-screen flex-col bg-background">
    <Navbar />

    <main
      className={cn(
        "relative container flex-1 px-3 lg:px-5",
        containerClassName
      )}>
      {children}
    </main>

    <Footer />
  </div>
)

export default LayoutDefault
