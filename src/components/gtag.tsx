import Script from "next/script"

import { IS_PROD } from "@/lib/constants"

const GTag = () => {
  return IS_PROD ? (
    <>
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-70VD9Q58Y0"
        strategy="afterInteractive"
      />

      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-70VD9Q58Y0');
        `}
      </Script>
    </>
  ) : (
    <></>
  )
}

export default GTag
