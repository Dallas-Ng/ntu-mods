import Footer from "./footer"
import NavigationBar from "./navbar"
import { NotificationBanner } from "./notification-banner"

interface Props {
  children?: React.ReactNode
  containerProps?: React.HTMLAttributes<HTMLDivElement>
}

export default function LayoutDefault({ children, containerProps }: Props) {
  return (
    <div className="flex min-h-screen flex-col" {...containerProps}>
      <NotificationBanner.inBeta />

      <NavigationBar />

      <div className="container relative z-[2] flex-1 px-2 md:px-0">
        {children}
      </div>

      <Footer className="relative z-[1] py-2" />
    </div>
  )
}
