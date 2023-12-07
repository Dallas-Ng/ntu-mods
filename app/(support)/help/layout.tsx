import { Metadata } from "next"

export const metadata: Metadata = {
  title: `Help`
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <>
      <div className="container md:py-10">
        <>{children}</>
      </div>
    </>
  )
}
