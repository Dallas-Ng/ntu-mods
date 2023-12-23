import { cn } from "@/lib/utils"

interface Props {
  children: React.ReactNode
  containerClassName?: React.HTMLAttributes<HTMLDivElement>["className"]
}

export default function PageLayout({ children, containerClassName }: Props) {
  return (
    <>
      {/* <div className="absolute top-0 z-0 h-[50vh] w-full bg-gradient-to-r from-emerald-800 to-green-900" /> */}

      <div className={cn("container p-5 md:p-0", containerClassName)}>
        <>{children}</>
      </div>
    </>
  )
}
