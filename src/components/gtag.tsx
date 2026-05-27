import Script from "next/script"

import { IS_PROD } from "@/lib/constants"

const GTag = () => {
  return IS_PROD ? (
    <>
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-70VD9Q58Y0"
        strategy="lazyOnload"
      />

      <Script id="google-analytics" strategy="lazyOnload">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('consent', 'default', {
            analytics_storage: 'denied',
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied'
          });
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
