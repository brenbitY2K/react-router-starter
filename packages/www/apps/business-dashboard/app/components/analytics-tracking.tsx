import { getPublicConfig } from "~/public-config";
import { GA_MEASUREMENT_ID } from "~/utils/analytics/google/ga4";

const publicConfig = getPublicConfig();

export function GoogleAnalyticsScripts() {
  return (
    <>
      <script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', {
              send_page_view: false
            });
          `,
        }}
      />
    </>
  );
}

export function KlaviyoAnalyticsScripts() {
  return (
    <>
      <script
        type="text/javascript"
        async
        src={`https://static.klaviyo.com/onsite/js/${publicConfig.klaviyo.publicApiKey}/klaviyo.js`}
      />
      <script
        dangerouslySetInnerHTML={{
          __html: `
            window._learnq = window._learnq || [];
            window._learnq.push(['account', '${publicConfig.klaviyo.publicApiKey}']);
          `,
        }}
      />
    </>
  );
}
