"use client"

import { useState } from "react"
import { Info } from "lucide-react"

import { track } from "@/lib/analytics"

import { Button } from "../ui/button"
import { ResponsiveModal } from "../ui/responsive-modal"

/** An image with a caption in the articles' style: muted, italic, centred. */
const Shot = ({
  name,
  alt,
  caption,
  width,
  height
}: {
  name: string
  alt: string
  caption: string
  width: number
  height: number
}) => (
  <figure>
    <img
      src={`/appearance/${name}.webp`}
      width={width}
      height={height}
      alt={alt}
      loading="lazy"
      decoding="async"
      className="bg-background h-auto w-full rounded-lg border dark:hidden"
    />
    <img
      src={`/appearance/${name}-dark.webp`}
      width={width}
      height={height}
      alt={alt}
      loading="lazy"
      decoding="async"
      className="bg-background hidden h-auto w-full rounded-lg border dark:block"
    />
    <figcaption className="text-muted-foreground mt-2 text-center text-sm italic">
      {caption}
    </figcaption>
  </figure>
)

/** The (i) beside Granular control, and the modal that explains it. */
const GranularControlInfo = ({ onOpen }: { onOpen?: () => void }) => {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label="How granular control works"
        className="size-6 min-w-0"
        onClick={() => {
          setOpen(true)
          onOpen?.()
          track("settings_appearance_changed", {
            setting: "granular_info",
            value: true
          })
        }}>
        <Info className="size-4" />
      </Button>

      <ResponsiveModal
        open={open}
        onOpenChange={setOpen}
        title="Granular control"
        showDescription
        description="Colour and fade each class type, or one module, yourself."
        className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <div className="space-y-6 text-sm">
          <p className="text-muted-foreground">
            Turn it on to set your own colour and opacity. Turn it off and the
            palette is drawn as designed. Your choices are kept either way, so
            you can switch back and forth.
          </p>

          <section className="space-y-2">
            <h3 className="font-semibold">1. Colour a class type</h3>
            <p className="text-muted-foreground">
              Tap LEC, LAB or any other box in the preview, then pick a colour
              and drag the opacity slider. Every block of that type changes, in
              every module.
            </p>
            <Shot
              name="granular-class"
              alt="The Appearance preview with the LEC box open on a colour picker and an opacity slider"
              caption="The LEC box, open on its colour and opacity."
              width={960}
              height={290}
            />
            <p className="text-muted-foreground">
              Fade the lectures you skip, and give tutorials and labs one colour
              each, to see how much of your week is really filled.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold">2. Change one module</h3>
            <p className="text-muted-foreground">
              Each module in your list gets a palette button next to remove. It
              sets colour and opacity for that module only, and wins over the
              class type setting. The arrow on a row puts it back to the
              default.
            </p>
            <Shot
              name="granular-module"
              alt="A module's palette button open on a row for each of its class types"
              caption="A module's palette button, with one row per class type."
              width={410}
              height={215}
            />
          </section>

          <p className="text-muted-foreground">
            Opacity fades the whole block, text included.
          </p>
        </div>
      </ResponsiveModal>
    </>
  )
}

export default GranularControlInfo
