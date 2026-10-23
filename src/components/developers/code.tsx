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
import { InlineCode } from "@/components/ui/inline-code"

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
      {!title && (
        <CodeBlockActions className="absolute top-2 right-2 z-10">
          <CodeBlockCopyButton value={code} />
        </CodeBlockActions>
      )}
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
        <InlineCode key={i} className="break-all">
          {part}
        </InlineCode>
      ) : (
        part
      )
    )}
  </>
)
