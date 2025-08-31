// src/components/Header/navMenuConfig.js
export const navSections = [
  { labelKey: "index", href: "/" },
  {
    labelKey: "newsEvents",
    items: [
      { labelKey: "news", href: "/news" },
      { labelKey: "events", href: "/events" },
    ],
  },
  {
    labelKey: "contents",
    items: [
      { labelKey: "currentIssue", href: "/contents/current-issue" },
      { labelKey: "onlineOnly", href: "/contents/online-only" },
      { labelKey: "archive", href: "/contents/archive" },
    ],
  },
  {
    labelKey: "orderSubscribe",
    items: [
      { labelKey: "subscription", href: "/order/subscribe" },
      { labelKey: "singleIssue", href: "/subscribe/single-issue" },
    ],
  },
  {
    labelKey: "aboutUs",
    items: [
      { labelKey: "history", href: "/about/history" },
      { labelKey: "editorialTeam", href: "/about/editorial" },
      { labelKey: "speakers", href: "/about/speakers" },
      { labelKey: "network", href: "/about/network" },
      { labelKey: "contact", href: "/about/contact" },
      { labelKey: "legalNotice", href: "/about/legal-notice" },
      { labelKey: "terms", href: "/about/terms" },
      { labelKey: "privacy", href: "/about/privacy" },
    ],
  },
  {
    labelKey: "supportIla",
    labelKey: "supportIla",
    items: [
      { labelKey: "donate", href: "/support/donations" },
      { labelKey: "getInvolved", href: "/support/participate" },
      {
        labelKey: "service",
        items: [
          { labelKey: "advertise", href: "/support/service/ads" },
          { labelKey: "referents", href: "/support/service/referent-service" },
          {
            labelKey: "translations",
            href: "/support/service/translation-service",
          },
        ],
      },
    ],
  },
];
