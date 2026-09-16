import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Public-facing URLs use a legacy-style ".html" suffix
  // (/ja/cast/list.html, /ja/cast/profile/5.html, /ja/schedule.html) while
  // the actual App Router routes underneath stay clean
  // (app/[locale]/cast/page.tsx, app/[locale]/cast/profile/[id]/page.tsx,
  // app/[locale]/schedule/page.tsx). These rewrites are pure path
  // substitution — no data lookup happens here, so `:id` just passes
  // through unchanged to the dynamic route, which does its own lookup.
  async rewrites() {
    return [
      {
        source: "/:locale(en|ja|zh)/cast/list.html",
        destination: "/:locale/cast",
      },
      {
        source: "/:locale(en|ja|zh)/cast/profile/:id.html",
        destination: "/:locale/cast/profile/:id",
      },
      {
        source: "/:locale(en|ja|zh)/schedule.html",
        destination: "/:locale/schedule",
      },
      {
        source: "/:locale(en|ja|zh)/system.html",
        destination: "/:locale/system",
      },
      {
        source: "/:locale(en|ja|zh)/blog.html",
        destination: "/:locale/blog",
      },
      {
        source: "/:locale(en|ja|zh)/faq.html",
        destination: "/:locale/faq",
      },
      {
        source: "/:locale(en|ja|zh)/contact.html",
        destination: "/:locale/contact",
      },
      {
        source: "/:locale(en|ja|zh)/recruit.html",
        destination: "/:locale/recruit",
      },
    ];
  },
};

export default nextConfig;
