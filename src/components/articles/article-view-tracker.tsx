"use client"

import { useEffect, useState } from "react"
import posthog from "posthog-js"

const VISITOR_KEY = "ntumods-visitor-id"

// PostHog's distinct_id matches the rows seeded from PostHog history, so past
// visitors are not counted twice. localStorage UUID is the fallback.
function getVisitorId() {
  try {
    const phId = posthog.get_distinct_id()
    if (phId) return phId
    let id = localStorage.getItem(VISITOR_KEY)
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(VISITOR_KEY, id)
    }
    return id
  } catch {
    return null // storage blocked: skip counting rather than inflate it
  }
}

const ArticleViewTracker = ({ slug }: { slug: string }) => {
  const [views, setViews] = useState<number | null>(null)

  useEffect(() => {
    posthog.capture("article_viewed", { article_slug: slug })

    const visitorId = getVisitorId()
    if (!visitorId) return
    fetch("/api/article-views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, visitorId })
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => typeof data?.views === "number" && setViews(data.views))
      .catch(() => {})
  }, [slug])

  if (views === null) return null
  return (
    <>
      {" "}
      · {views.toLocaleString("en-SG")} {views === 1 ? "view" : "views"}
    </>
  )
}

export default ArticleViewTracker
