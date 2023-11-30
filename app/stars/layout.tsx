import "@/styles/globals.css"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: `Stars*`
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <div className="relative">
      <div className="absolute bg-gradient-to-r from-blue-800 to-indigo-900 top-0 h-[50%] w-full z-0" />

      <div className="relative container z-10 pt-10">
        <>{children}</>
      </div>
    </div>
  )
}
