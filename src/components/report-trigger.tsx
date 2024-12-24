import { useState } from "react"

import { Button } from "@/components/ui/button"
import Modal from "@/components/feedback-modal"

const ReportTrigger = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleButtonClick = () => {
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }
  return (
    <>
      <div className="fixed bottom-0 left-0 z-50">
        <Button onClick={handleButtonClick}>
          <span role="img" aria-label="exclamation mark">
            ❗
          </span>{" "}
        </Button>
      </div>
      {isModalOpen && (
        <Modal onClose={handleCloseModal} /> // Pass the close handler to Modal
      )}
    </>
  )
}

export default ReportTrigger
