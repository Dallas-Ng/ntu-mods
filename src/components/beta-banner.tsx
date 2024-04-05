import Link from "next/link"

import { BannerWrapper } from "./banner"
import BetaWrapper from "./beta"

const BetaBanner = () => (
  <BetaWrapper>
    <Link href="/settings#beta">
      <BannerWrapper>
        You are in <strong className="font-semibold">Beta mode!</strong> Click
        to turn off Beta
      </BannerWrapper>
    </Link>
  </BetaWrapper>
)

export default BetaBanner
