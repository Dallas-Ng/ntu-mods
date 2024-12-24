import { X } from "lucide-react"

import FeedbackCard from "./feedback-card"

interface ModalProps {
  onClose: () => void // Define the type for onClose
}
const Modal = ({ onClose }: ModalProps) => {
  return (
    <div className="fixed z-50 w-full">
      <div className="mx-40 rounded-md bg-card">
        <button onClick={onClose} className="close-button">
          <X />
        </button>
        <FeedbackCard />
      </div>
    </div>
  )
}

export default Modal
