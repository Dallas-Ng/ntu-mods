interface Props {
  title?: React.ReactNode
  subtitle?: React.ReactNode
}

const Header = (props: Props) => {
  const { title, subtitle } = props

  return (
    <div className="space-y-1">
      <h1 className="break-words text-3xl font-semibold leading-[1]">
        {title}
      </h1>

      {subtitle && <p className="text-secondary-foreground">{subtitle}</p>}
    </div>
  )
}

export default Header
