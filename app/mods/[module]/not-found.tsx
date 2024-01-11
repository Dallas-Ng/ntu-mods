"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { getRelatedModules } from "@/lib/consolidated-data"
import ModuleCard from "@/components/module-card"

interface IProps {
  missingModule?: string
}

export default function NotFoundModulePage({ missingModule }: IProps) {
  const router = useRouter()
  let relatedModules: CourseData[] = []

  if (missingModule) {
    relatedModules = getRelatedModules(missingModule)
  }

  return (
    <>
      <span
        className="flex cursor-pointer items-center hover:text-secondary-foreground"
        onClick={() => router.back()}>
        <ArrowLeft className="mr-1 h-5 w-5" /> Click here to return back to{" "}
        {missingModule || "the previous page"}
      </span>

      <h1 className="my-5 mb-2 text-2xl">This module does not exists.</h1>

      <p className="text-secondary">
        We current do not support academic years before AY 2023-2024. If this is
        a bug, please contact us.
      </p>

      {relatedModules.length > 0 && (
        <div className="mt-4">
          <h2 className="mb-2 text-lg">Do you mean?</h2>

          <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-3">
            {relatedModules.map((module) => (
              <ModuleCard key={module.code} module={module} />
            ))}
          </div>
        </div>
      )}
    </>
  )
}
