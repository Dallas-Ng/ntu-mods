import Script from "next/script"

import { IS_PROD } from "@/lib/constants"

const ClarityTag = () => {
  return IS_PROD ? (
    <Script id="microsoft-clarity" strategy="lazyOnload">
      {`
        (function(c,l,a,r,i,t,y){
          c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window,document,"clarity","script","k9d6cixduy");
      `}
    </Script>
  ) : (
    <></>
  )
}

export default ClarityTag
