/** "#" link shown beside a heading on hover or focus, so a section can be linked. */
const HeadingAnchor = ({ id, label }: { id: string; label: string }) => (
  <a href={`#${id}`} className="heading-anchor" aria-label={`Link to ${label}`}>
    #
  </a>
)

export default HeadingAnchor
