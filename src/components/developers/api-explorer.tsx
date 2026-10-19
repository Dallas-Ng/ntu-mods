"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import TryModuleApi from "@/components/developers/try-module-api"

export interface ApiOp {
  id: string
  path: string
  tag: string
  summary: string
  description?: string
  params: { name: string; description: string }[]
  responses: { status: string; description: string }[]
  fields?: [string, string, string][]
  example?: string
  exampleLabel?: string
  tryIt?: boolean
}

export interface ApiGroup {
  name: string
  description?: string
  ops: ApiOp[]
}

const STATUS_STYLE: Record<string, string> = {
  "2": "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  "3": "bg-sky-500/15 text-sky-700 dark:text-sky-400",
  "4": "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  "5": "bg-rose-500/15 text-rose-700 dark:text-rose-400"
}

const Method = () => (
  <span className="bg-primary text-primary-foreground shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold">
    GET
  </span>
)

const Pre = ({ children }: { children: string }) => (
  <pre className="bg-muted max-h-96 overflow-auto rounded-lg p-3 text-xs">
    {children}
  </pre>
)

const Operation = ({ op }: { op: ApiOp }) => {
  const tabs = [
    "responses",
    ...(op.fields ? ["fields"] : []),
    ...(op.example ? ["example"] : []),
    ...(op.tryIt ? ["try"] : [])
  ]
  const label: Record<string, string> = {
    responses: "Responses",
    fields: "Fields",
    example: "Example",
    try: "Try it"
  }

  return (
    <div className="space-y-4">
      {op.description && (
        <p className="text-foreground/80 text-sm">{op.description}</p>
      )}
      {op.params.length > 0 && (
        <ul className="space-y-1 text-sm">
          {op.params.map((p) => (
            <li key={p.name}>
              <code className="text-xs font-semibold">{p.name}</code>
              <span className="text-foreground/80"> {p.description}</span>
            </li>
          ))}
        </ul>
      )}
      <Tabs defaultValue="responses">
        <TabsList className="h-auto flex-wrap">
          {tabs.map((t) => (
            <TabsTrigger
              key={t}
              value={t}
              className="text-foreground/80 data-[state=active]:text-foreground dark:text-foreground/80 dark:data-[state=active]:text-foreground">
              {label[t]}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="responses">
          <ul>
            {op.responses.map((r) => (
              <li
                key={r.status}
                className="flex items-baseline gap-3 border-t py-2 text-sm first:border-t-0">
                <span
                  className={`shrink-0 rounded-md px-2 py-0.5 font-mono text-xs font-semibold ${STATUS_STYLE[r.status[0]]}`}>
                  {r.status}
                </span>
                <span className="text-foreground/80">{r.description}</span>
              </li>
            ))}
          </ul>
        </TabsContent>
        {op.fields && (
          <TabsContent value="fields">
            <ul>
              {op.fields.map(([name, type, description]) => (
                <li
                  key={name}
                  className="space-y-0.5 border-t py-2 text-sm first:border-t-0">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <code className="text-xs font-semibold break-all">
                      {name}
                    </code>
                    <code className="text-foreground/80 text-xs">{type}</code>
                  </div>
                  {description && (
                    <p className="text-foreground/80">{description}</p>
                  )}
                </li>
              ))}
            </ul>
          </TabsContent>
        )}
        {op.example && (
          <TabsContent value="example" className="space-y-2">
            {op.exampleLabel && (
              <code className="text-xs font-semibold">{op.exampleLabel}</code>
            )}
            <Pre>{op.example}</Pre>
          </TabsContent>
        )}
        {op.tryIt && (
          <TabsContent value="try">
            <TryModuleApi />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

const ApiExplorer = ({ groups }: { groups: ApiGroup[] }) => (
  <div className="space-y-6">
    {groups.map((g) => (
      <section key={g.name} className="space-y-2">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{g.name}</h2>
          {g.description && (
            <p className="text-foreground/80 text-sm">{g.description}</p>
          )}
        </div>
        <Accordion type="multiple" className="space-y-2">
          {g.ops.map((op) => (
            <AccordionItem
              key={op.id}
              value={op.id}
              className="rounded-xl border px-4 last:border-b">
              <AccordionTrigger className="items-center py-3 hover:no-underline">
                <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
                  <Method />
                  <code className="text-sm font-semibold break-all">
                    {op.path}
                  </code>
                  <span className="text-foreground/80 text-xs font-normal">
                    {op.summary}
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <Operation op={op} />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    ))}
  </div>
)

export default ApiExplorer
