import { MoreHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"

export const TimetableActionsDropdownLoading = () => (
  <Button variant="outline" size="icon" disabled>
    <MoreHorizontal className="size-4" />
    <span className="sr-only">More actions</span>
  </Button>
)
