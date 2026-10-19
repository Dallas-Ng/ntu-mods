"use client"

import { useHighlightedCode } from "@/hooks/use-highlighted-code"
import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockContent,
  CodeBlockCopyButton,
  CodeBlockHeader,
  CodeBlockLine,
  CodeBlockTitle
} from "@/components/ui/code-block"

/** Syntax-highlighted block with a copy button. */
export const Code = ({
  code,
  lang,
  title,
  className
}: {
  code: string
  lang: string
  title?: string
  className?: string
}) => {
  const lines = useHighlightedCode(code, lang)
  return (
    <CodeBlock className={className}>
      {title && (
        <CodeBlockHeader>
          <CodeBlockTitle>{title}</CodeBlockTitle>
          <CodeBlockActions>
            <CodeBlockCopyButton value={code} />
          </CodeBlockActions>
        </CodeBlockHeader>
      )}
      <CodeBlockContent className="max-h-96">
        {lines.map((line, i) => (
          <CodeBlockLine key={i}>{line}</CodeBlockLine>
        ))}
      </CodeBlockContent>
    </CodeBlock>
  )
}

/** Renders `backtick` spans in a string as inline code. */
export const Rich = ({ text }: { text: string }) => (
  <>
    {text.split("`").map((part, i) =>
      i % 2 ? (
        <code
          key={i}
          className="bg-muted text-foreground rounded px-1 py-0.5 font-mono text-sm break-all">
          {part}
        </code>
      ) : (
        part
      )
    )}
  </>
)
