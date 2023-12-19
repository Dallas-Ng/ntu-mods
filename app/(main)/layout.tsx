import { Metadata } from "next"

export const metadata: Metadata = {
  title: `Stars*`
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <>
      <div className="absolute top-0 z-0 h-[50%] w-full bg-gradient-to-r from-blue-800 to-indigo-900" />

      <div className="container relative z-[1] sm:py-10">
        <>{children}</>
      </div>
    </>
  )
}
