import LayoutDefault from "@/components/layout-default"

interface Props {
  children?: React.ReactNode
}

export default function Layout({ children }: Props) {
  return <LayoutDefault>{children}</LayoutDefault>
}
