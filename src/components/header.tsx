interface Props {
  title?: React.ReactNode
  subtitle?: React.ReactNode
}

const Header = (props: Props) => {
  const { title, subtitle } = props

  return (
    <div className="space-y-3">
      <h1 className="text-3xl leading-[1] font-semibold break-words">
        {title}
      </h1>

      {subtitle !== undefined && (
        <p className="text-muted-foreground">{subtitle}</p>
      )}
    </div>
  )
}

export default Header
