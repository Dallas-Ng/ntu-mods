"use client"

import { useState } from "react"
import { BadgeInfo } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ResponsiveModal } from "@/components/ui/responsive-modal"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TextLink } from "@/components/ui/text-link"
import { SectionHeading } from "@/components/header"

type PhoneType = "android" | "ios" | "web"

const detectPhone = (): PhoneType =>
  typeof navigator === "undefined"
    ? "ios"
    : /Android/i.test(navigator.userAgent)
      ? "android"
      : /iPhone|iPad|iPod/i.test(navigator.userAgent)
        ? "ios"
        : "web"

const ScreenshotInfoButton = () => {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [tabValue, setTabValue] = useState<PhoneType>(detectPhone)

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className="text-primary"
        aria-label="How to take a screenshot"
        onClick={() => setDialogOpen(true)}>
        <BadgeInfo className="size-5" />
      </Button>

      <ResponsiveModal
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        nested={false}
        title="How to take a screenshot"
        className="max-h-[90svh] overflow-y-auto">
        <Tabs
          value={tabValue}
          onValueChange={(val) => setTabValue(val as PhoneType)}>
          <TabsList className="mb-2 grid w-full grid-cols-3">
            <TabsTrigger value="ios">iOS</TabsTrigger>
            <TabsTrigger value="android">Android</TabsTrigger>
            <TabsTrigger value="web">Web</TabsTrigger>
          </TabsList>

          <TabsContent value="ios" className="space-y-2">
            <SectionHeading as="h3">Take a full-page screenshot</SectionHeading>

            <p className="text-muted-foreground">
              You can take a screenshot of content that exceeds the length of
              your iPhone screen, such as an entire webpage in Safari.
            </p>

            <ol className="list-inside list-decimal">
              <li>
                Quickly press and release the side button and volume up button
                at the same time.
              </li>
              <li>
                Tap the screenshot thumbnail in the lower-left corner of the
                screen.
              </li>
              <li>Tap Full Page, tap Done</li>
            </ol>

            <p>
              For more info visit{" "}
              <TextLink
                rel="noopener noreferrer"
                href="https://support.apple.com/en-ie/guide/iphone/iphc872c0115/ios"
                className="font-semibold">
                here
              </TextLink>
            </p>
          </TabsContent>

          <TabsContent value="android" className="space-y-2">
            <SectionHeading as="h3">Take a scrolling screenshot</SectionHeading>

            <p className="text-muted-foreground">
              These steps work on devices running Android 12 and up, on most
              screens that allow you to scroll.
            </p>

            <ol className="list-inside list-decimal">
              <li>Open the screen that you want to capture.</li>
              <li>Press the Power and Volume down buttons at the same time.</li>
              <li>At the bottom, tap Capture more.</li>
              <li>
                To select the content you want to capture, use the crop
                guidelines.
              </li>
            </ol>

            <p>
              For more info visit{" "}
              <TextLink
                rel="noopener noreferrer"
                href="https://support.google.com/android/answer/9075928?hl=en"
                className="font-semibold">
                here
              </TextLink>
            </p>
          </TabsContent>

          <TabsContent value="web" className="space-y-4">
            <div className="space-y-2">
              <SectionHeading as="h3">Mac OS</SectionHeading>

              <p className="text-muted-foreground">Use Screenshot</p>

              <div className="flex items-center gap-2">
                <kbd className="bg-muted text-muted-foreground pointer-events-none inline-flex h-5 items-center gap-1 rounded border px-1.5 py-1 font-mono text-xs font-medium opacity-100 select-none">
                  SHIFT + ⌘ + 3
                </kbd>
                or
                <kbd className="bg-muted text-muted-foreground pointer-events-none inline-flex h-5 items-center gap-1 rounded border px-1.5 py-1 font-mono text-xs font-medium opacity-100 select-none">
                  SHIFT + ⌘ + 4
                </kbd>
              </div>

              <p>
                For more info visit{" "}
                <TextLink
                  rel="noopener noreferrer"
                  href="https://support.apple.com/en-sg/102646"
                  className="font-semibold">
                  here
                </TextLink>
              </p>
            </div>

            <div className="space-y-2">
              <SectionHeading as="h3">Windows</SectionHeading>

              <p className="text-muted-foreground">Use Snipping Tool</p>

              <ol className="list-inside list-decimal">
                <li>
                  Select the Start button, enter snipping tool, then select
                  Snipping Tool from the results.
                </li>

                <li>
                  Press{" "}
                  <kbd className="bg-muted text-muted-foreground pointer-events-none inline-flex h-5 items-center gap-1 rounded border px-1.5 py-1 font-mono text-xs font-medium opacity-100 select-none">
                    [Windows Logo Key] + SHIFT + S
                  </kbd>{" "}
                  for a static image snip.
                </li>
              </ol>

              <p>
                For more info visit{" "}
                <TextLink
                  rel="noopener noreferrer"
                  href="https://support.microsoft.com/en-us/windows/use-snipping-tool-to-capture-screenshots-00246869-1843-655f-f220-97299b865f6b"
                  className="font-semibold">
                  here
                </TextLink>
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </ResponsiveModal>
    </>
  )
}
export default ScreenshotInfoButton
