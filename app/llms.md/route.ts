import { getLlmsContent } from "@/lib/llms-content"

export const dynamic = "force-static"

export function GET() {
  return new Response(getLlmsContent(), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" }
  })
}
