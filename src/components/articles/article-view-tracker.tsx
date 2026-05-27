"use client"

import { useEffect } from "react"
import posthog from "posthog-js"

const ArticleViewTracker = ({ slug }: { slug: string }) => {
  useEffect(() => {
    posthog.capture("article_viewed", { article_slug: slug })
  }, [slug])

  return null
}

export default ArticleViewTracker
