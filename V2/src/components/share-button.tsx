import { Link } from "lucide-react"
import { toast } from "sonner"

import ButtonCollapsable from "./button-collapsable"

interface Props {
  link: string
  title: string
  description: string
  disabled?: boolean
}

const ShareButton = ({ link, title, description, disabled }: Props) => {
  const handleShare = () => {
    try {
      navigator.share({
        title: title,
        text: description,
        url: link
      })
    } catch {
      // It means that theres no share functionality
      navigator.clipboard.writeText(link)
      toast("Share link copied to clipboard")
    }
  }

  return (
    <ButtonCollapsable
      onClick={handleShare}
      icon={Link}
      text="Share"
      disabled={disabled}
    />
  )
}

export default ShareButton
