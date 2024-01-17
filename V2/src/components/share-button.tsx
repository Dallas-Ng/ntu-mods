import { Link } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"

import ButtonCollapsable from "./button-collapsable"
import { Button } from "./ui/button"

interface Props {
  link: string
  title: string
  description: string
}

const ShareButton = ({ link, title, description }: Props) => {
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

  return <ButtonCollapsable onClick={handleShare} icon={Link} text="Share" />
}

export default ShareButton
