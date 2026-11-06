/**
 * Click-to-zoom for screenshots in article bodies.
 *
 * A native <dialog>, so Escape, focus trapping and the modal backdrop come from
 * the browser. Click the image to toggle between fit-to-screen and actual size
 * (scroll to pan); click the backdrop or the close button to dismiss.
 */

const IMAGE_CLASS = "image-lightbox__image"
const ZOOMED_CLASS = "image-lightbox__image--zoomed"

export interface ArticleLightbox {
  dialog: HTMLDialogElement
  open: (source: HTMLImageElement) => void
  close: () => void
}

/** Build the (closed) lightbox and add it to `doc`. */
export const createLightbox = (doc: Document = document): ArticleLightbox => {
  const dialog = doc.createElement("dialog")
  dialog.className = "image-lightbox"
  dialog.setAttribute("aria-label", "Image preview")

  const closeButton = doc.createElement("button")
  closeButton.type = "button"
  closeButton.className = "image-lightbox__close"
  closeButton.setAttribute("aria-label", "Close image")
  closeButton.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>'

  const image = doc.createElement("img")
  image.className = IMAGE_CLASS
  image.alt = ""

  dialog.append(closeButton, image)
  doc.body.append(dialog)

  const close = () => {
    if (dialog.open) dialog.close()
  }

  closeButton.addEventListener("click", close)

  // The dialog itself fills the screen, so a click that lands on it (and not on
  // the image or the button) came from the backdrop.
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) close()
  })

  image.addEventListener("click", () => {
    image.classList.toggle(ZOOMED_CLASS)
  })

  // Fires for every way out: the button, the backdrop or Escape.
  dialog.addEventListener("close", () => {
    doc.body.style.overflow = ""
  })

  const open = (source: HTMLImageElement) => {
    image.src = source.currentSrc || source.src
    image.alt = source.alt
    image.classList.remove(ZOOMED_CLASS)
    // Stop the article scrolling underneath the fixed overlay.
    doc.body.style.overflow = "hidden"
    dialog.showModal()
  }

  return { dialog, open, close }
}

/** Wire every body figure image to a lightbox. No images, no lightbox. */
export const initArticleLightbox = (doc: Document = document) => {
  const images = doc.querySelectorAll<HTMLImageElement>(
    "article.prose figure img"
  )
  if (images.length === 0) return

  const lightbox = createLightbox(doc)
  for (const image of images)
    image.addEventListener("click", () => lightbox.open(image))
}
