import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://nocturne.shinpei.cc.cd"),
  title: {
    default: "NOCTURNE TOKYO | Cast Directory",
    template: "%s | NOCTURNE TOKYO",
  },
  description:
    "A high-density Tokyo night directory featuring editorial profiles, schedules, journals and visual updates.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    type: "website",
    siteName: "NOCTURNE TOKYO",
    title: "NOCTURNE TOKYO | Cast Directory",
    description:
      "Explore editorial profiles, schedules and Tokyo night visual updates.",
    images: [
      {
        url: "/og.png",
        width: 1536,
        height: 1024,
        alt: "NOCTURNE TOKYO cast directory",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NOCTURNE TOKYO | Cast Directory",
    description:
      "Explore editorial profiles, schedules and Tokyo night visual updates.",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
