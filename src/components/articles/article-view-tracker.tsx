"use client"

import { useEffect, useState } from "react"

import { track } from "@/lib/analytics"

const VISITOR_KEY = "ntumods-visitor-id"
const POSTHOG_STORE = `ph_${import.meta.env.PUBLIC_POSTHOG_TOKEN}_posthog`

// The distinct_id PostHog already saved for this browser on an earlier visit,
// read straight from its storage so this doesn't wait for the SDK to load.
// With localStorage+cookie persistence it lives in a cookie of that name;
// the localStorage blob is checked too.
function storedPostHogId(): string | undefined {
  const parse = (raw: string | null | undefined) => {
    try {
      const id = raw ? JSON.parse(raw)?.distinct_id : undefined
      return typeof id === "string" ? id : undefined
    } catch {
      return undefined
    }
  }
  const cookie = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${POSTHOG_STORE}=`))
  return (
    parse(
      cookie && decodeURIComponent(cookie.slice(POSTHOG_STORE.length + 1))
    ) ?? parse(localStorage.getItem(POSTHOG_STORE))
  )
}

// One ID per browser, fixed on its first counted view so the same reader is
// never counted under two IDs. Readers from before this counter existed are
// seeded under their PostHog distinct_id, so that is reused when PostHog has
// already stored one; everyone else gets a random UUID.
function getVisitorId() {
  try {
    let id = localStorage.getItem(VISITOR_KEY)
    if (!id) {
      id = storedPostHogId() ?? crypto.randomUUID()
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
    track("article_viewed", { article_slug: slug })

    const visitorId = getVisitorId()
    if (!visitorId) return
    let ignore = false
    fetch("/api/article-views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, visitorId })
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!ignore && typeof data?.views === "number") setViews(data.views)
      })
      .catch(() => {})
    return () => {
      ignore = true
    }
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
