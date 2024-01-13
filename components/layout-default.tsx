import { cn } from "@/lib/utils"

import Footer from "./footer"
import NavigationBar from "./navbar"
import { NotificationBanner } from "./notification-banner"

interface Props {
  children?: React.ReactNode
  childrenContainerClassName?: string
}

export default function LayoutDefault({
  children,
  childrenContainerClassName
}: Props) {
  return (
    <div className="flex min-h-screen flex-col">
      <NotificationBanner.inBeta />

      <NavigationBar />

      <div
        className={cn(
          "container relative z-[2] flex-1 px-2 md:px-0",
          childrenContainerClassName
        )}>
        {children}
      </div>

      <Footer className="relative z-[1] py-2" />
    </div>
  )
}
