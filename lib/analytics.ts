// Google Tag Manager, loaded from an inline script in app/layout.tsx (so it adds nothing to
// the pages' JavaScript bundles).
//
// It never loads on pages opened from a private link: the reveal (/r#token), an ajo
// member's or organiser's page (/ajo/x/me#token, /ajo/x/admin#token) and the unsubscribe
// page. Their URLs carry the secret that opens a match or a group, and the rule is that no
// name (and nothing that unlocks one) ever reaches analytics.
export const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || "GTM-54342JSB";

/** Paths where the tag must never run. */
export const PRIVATE_PATH = /^\/(r|ajo\/[^/]+\/(me|admin)|ajo\/unsubscribe)\/?$/;

/** The inline loader: the standard GTM bootstrap plus gtag(), skipped on private pages. */
export const gtmLoader = (id = GTM_ID) =>
  `(function(w,d){if(${PRIVATE_PATH}.test(location.pathname))return;` +
  `w.dataLayer=w.dataLayer||[];w.gtag=function(){w.dataLayer.push(arguments)};` +
  `w.gtag("js",new Date());w.dataLayer.push({"gtm.start":Date.now(),event:"gtm.js"});` +
  `var s=d.createElement("script");s.async=true;s.src="https://www.googletagmanager.com/gtm.js?id="+${JSON.stringify(id)};` +
  `d.head.appendChild(s)})(window,document)`;
