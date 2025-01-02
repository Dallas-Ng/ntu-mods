import { X } from "lucide-react"

import { Button } from "@/components/ui/button"

import FeedbackCard from "./feedback-card"

interface ModalProps {
  onClose: () => void // Define the type for onClose
}
const FeedbackModal = ({ onClose }: ModalProps) => {
  return (
    <div className="fixed z-50 w-full">
      <div className="mx-40 rounded-md bg-card">
        <Button onClick={onClose}>
          <X />
        </Button>
        <FeedbackCard />
      </div>
    </div>
  )
}

export default FeedbackModal
