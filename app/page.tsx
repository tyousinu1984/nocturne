import type { Metadata } from "next";
import { HomeExperience } from "./nocturne";

export const metadata: Metadata = {
  title: "Tokyo after dark",
  description:
    "A fictional adults-only artist directory and editorial interface demo.",
  other: {
    "codex-preview": "development",
  },
};

export default function Home() {
  return <HomeExperience />;
}
