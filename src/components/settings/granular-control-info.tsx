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
  height,
  className
}: {
  name: string
  alt: string
  caption: string
  width: number
  height: number
  className?: string
}) => (
  <figure className={className}>
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

const Step = ({ n, title }: { n: number; title: string }) => (
  <h3 className="flex items-center gap-2 text-base font-semibold">
    <span
      aria-hidden="true"
      className="bg-primary text-primary-foreground flex size-5 shrink-0 items-center justify-center rounded-full text-xs tabular-nums">
      {n}
    </span>
    {title}
  </h3>
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
        description="Colour and fade each class type, or one module, yourself."
        className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <div className="space-y-7 text-sm">
          <p className="text-pretty">
            Set your own colour and opacity for your classes. Turn it off and
            the palette is drawn as designed. Your choices are kept either way.
          </p>

          <section className="space-y-3">
            <Step n={1} title="Colour a class type" />
            <p className="text-muted-foreground text-pretty">
              Tap LEC, LAB or any other box in the preview, then pick a colour
              and drag the opacity slider. Every block of that type changes.
            </p>
            <Shot
              name="granular-class"
              alt="The Appearance preview with the LEC box open on a colour picker and an opacity slider"
              caption="The LEC box, open on its colour and opacity."
              width={960}
              height={290}
            />
          </section>

          <section className="space-y-3">
            <Step n={2} title="Change one module" />
            <p className="text-muted-foreground text-pretty">
              Each module in your list has a palette button next to remove. It
              changes that module only, and wins over the class type. The arrow
              on a row goes back to the default.
            </p>
            <Shot
              name="granular-module"
              alt="A module's palette button open on a row for each of its class types"
              caption="A module's palette button, with one row per class type."
              className="mx-auto max-w-sm"
              width={410}
              height={208}
            />
          </section>

          <aside className="bg-muted text-muted-foreground rounded-lg p-3 text-pretty">
            <span className="text-foreground font-semibold">Tip: </span>
            fade the lectures you skip, and give tutorials and labs one colour
            each, to see how much of your week is really filled. Opacity fades
            the whole block, text included.
          </aside>
        </div>
      </ResponsiveModal>
    </>
  )
}

export default GranularControlInfo
