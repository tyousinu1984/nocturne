import type { Metadata } from "next";
import { HomeExperience } from "./nocturne";

export const metadata: Metadata = {
  title: "Cast Directory",
  description:
    "Explore the latest editorial profiles, schedules, rankings and visual notes from NOCTURNE TOKYO.",
};

export default function Home() {
  return <HomeExperience />;
}
