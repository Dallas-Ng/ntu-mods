"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon
} from "lucide-react"
import { Toaster as Sonner, type ToasterProps } from "sonner"

import { useTheme } from "@/hooks/use-theme"

const Toaster = ({ className, style, ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className={["toaster group", className].filter(Boolean).join(" ")}
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />
      }}
      // Clear the sticky navbar so toasts never cover the announcement banner
      offset={{ top: 80 }}
      mobileOffset={{ top: 80 }}
      toastOptions={{ classNames: { toast: "shadow-xl" } }}
      style={
        {
          // Inverted (foreground on background) so toasts stand out from the page
          "--normal-bg": "var(--color-foreground)",
          "--normal-text": "var(--color-background)",
          "--normal-border": "var(--color-foreground)",
          "--border-radius": "var(--radius)",
          ...style,
          zIndex: 2147483647
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
