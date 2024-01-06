"use client"

import { useRouter } from "next/navigation"
import { useBoundState } from "@/state/bound-state"
import { toast } from "sonner"

import { useQueryStringCTI } from "@/hooks/use-qs-CTI"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

export default function StarsCopyTimetableButton() {
  const router = useRouter()
  const coursesToIndexFromQueryString = useQueryStringCTI()
  const { replaceCourseToIndex } = useBoundState()

  const handleOk = () => {
    replaceCourseToIndex(coursesToIndexFromQueryString)
    toast("Copied timetable")
    router.push("/stars")
  }

  return (
    <>
      <AlertDialog>
        <AlertDialogTrigger>
          <Button variant="outline">Copy Timetable</Button>
        </AlertDialogTrigger>

        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Copying will replace your current timetable
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will overwrite your current
              timetable with the one you are copying.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleOk}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
