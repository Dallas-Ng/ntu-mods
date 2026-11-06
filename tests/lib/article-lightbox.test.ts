// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest"

import {
  createLightbox,
  initArticleLightbox
} from "@/astro/lib/article-lightbox"

// jsdom has no modal dialog API; these stand-ins set `open` and fire `close`
// the way the real ones do.
beforeEach(() => {
  document.body.innerHTML = ""
  document.body.style.overflow = ""
  HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
    this.open = true
  }
  HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
    this.open = false
    this.dispatchEvent(new Event("close"))
  }
})

const figureImage = (src: string, alt = "A screenshot") => {
  const article = document.createElement("article")
  article.className = "prose"
  const figure = document.createElement("figure")
  const image = document.createElement("img")
  image.src = src
  image.alt = alt
  figure.append(image)
  article.append(figure)
  document.body.append(article)
  return image
}

describe("article lightbox", () => {
  it("opens the clicked figure's image", () => {
    const source = figureImage("/articles/timetable.webp", "The timetable")
    initArticleLightbox(document)

    source.click()

    const dialog = document.querySelector("dialog") as HTMLDialogElement
    const shown = dialog.querySelector("img") as HTMLImageElement
    expect(dialog.open).toBe(true)
    expect(shown.src.endsWith("/articles/timetable.webp")).toBe(true)
    expect(shown.alt).toBe("The timetable")
  })

  it("stops the page scrolling while open and restores it on close", () => {
    const source = figureImage("/articles/timetable.webp")
    initArticleLightbox(document)

    source.click()
    expect(document.body.style.overflow).toBe("hidden")

    const dialog = document.querySelector("dialog") as HTMLDialogElement
    dialog.close()
    expect(document.body.style.overflow).toBe("")
  })

  it("closes on the backdrop but not on the image", () => {
    const source = figureImage("/articles/timetable.webp")
    const lightbox = createLightbox(document)
    lightbox.open(source)

    const shown = lightbox.dialog.querySelector("img") as HTMLImageElement
    shown.click()
    expect(lightbox.dialog.open).toBe(true)

    lightbox.dialog.click()
    expect(lightbox.dialog.open).toBe(false)
  })

  it("closes from the close button", () => {
    const lightbox = createLightbox(document)
    lightbox.open(figureImage("/articles/timetable.webp"))

    ;(lightbox.dialog.querySelector("button") as HTMLButtonElement).click()

    expect(lightbox.dialog.open).toBe(false)
  })

  it("toggles actual size when the enlarged image is clicked", () => {
    const lightbox = createLightbox(document)
    lightbox.open(figureImage("/articles/timetable.webp"))
    const shown = lightbox.dialog.querySelector("img") as HTMLImageElement

    shown.click()
    expect(shown.classList.contains("image-lightbox__image--zoomed")).toBe(true)

    shown.click()
    expect(shown.classList.contains("image-lightbox__image--zoomed")).toBe(
      false
    )
  })

  it("resets to fit-to-screen for the next image", () => {
    const lightbox = createLightbox(document)
    lightbox.open(figureImage("/articles/one.webp"))
    const shown = lightbox.dialog.querySelector("img") as HTMLImageElement
    shown.click()

    lightbox.close()
    lightbox.open(figureImage("/articles/two.webp"))

    expect(shown.classList.contains("image-lightbox__image--zoomed")).toBe(
      false
    )
    expect(shown.src.endsWith("/articles/two.webp")).toBe(true)
  })

  it("adds nothing when the page has no figure images", () => {
    initArticleLightbox(document)

    expect(document.querySelector("dialog")).toBeNull()
  })
})
