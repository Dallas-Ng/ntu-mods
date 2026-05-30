import { cn } from "@/lib/utils"

import Container from "./container"
import Footer from "./footer"
import Navbar from "./navbar"

interface Props {
  children?: React.ReactNode
  size?: "full" | "md" | "sm"
  containerClassName?: string
}

const LayoutDefault = ({
  children,
  size = "full",
  containerClassName
}: Props) => (
  <div className="bg-background flex min-h-screen flex-col">
    <Navbar />

    <main className="relative flex-1 px-3 lg:px-5">
      <Container size={size} className={containerClassName}>
        {children}
      </Container>
    </main>

    <Footer />
  </div>
)

export default LayoutDefault
