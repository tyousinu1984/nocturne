import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { artists } from "../../data";
import { ProfileExperience } from "../../nocturne";

type ProfilePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: ProfilePageProps): Promise<Metadata> {
  const { slug } = await params;
  const artist = artists.find((candidate) => candidate.slug === slug);
  if (!artist) return { title: "Profile not found" };
  return {
    title: `${artist.name} Profile`,
    description: artist.shortNote,
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { slug } = await params;
  const artist = artists.find((candidate) => candidate.slug === slug);
  if (!artist) notFound();
  return <ProfileExperience artist={artist} />;
}
