import { Metadata } from "next"

export const metadata: Metadata = {
  title: `Stars* Planner`,
  description: `Plan your timetable`
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <>
      <div className="absolute top-0 z-0 h-[50vh] w-full bg-gradient-to-r from-emerald-800 to-green-900" />

      <div className="container relative z-[1] sm:py-10">
        <>{children}</>
      </div>
    </>
  )
}
