export type Artist = {
  slug: string;
  name: string;
  monogram: string;
  district: "Aoyama" | "Ginza" | "Daikanyama";
  tier: "Muse" | "Signature" | "New";
  status: "Tonight" | "This week" | "Private";
  role: string;
  shortNote: string;
  biography: string;
  languages: string[];
  disciplines: string[];
  palette: [string, string, string];
  stats: Array<{ label: string; value: string }>;
  schedule: Array<{ day: string; date: string; state: string }>;
};

export const artists: Artist[] = [
  {
    slug: "aika",
    name: "Aika",
    monogram: "AI",
    district: "Aoyama",
    tier: "Muse",
    status: "Tonight",
    role: "Movement artist",
    shortNote: "Velvet rhythm, quiet wit, and a fondness for midnight jazz.",
    biography:
      "Aika is a temporary profile name used to preview the supplied photography inside this interface. The role and description are placeholder editorial copy; no booking or contact function is provided.",
    languages: ["Japanese", "English"],
    disciplines: ["Dance", "Jazz", "Editorial"],
    palette: ["#f39aac", "#5c2942", "#171017"],
    stats: [
      { label: "Practice", value: "8 years" },
      { label: "Format", value: "Live" },
      { label: "Mood", value: "Velvet" },
      { label: "Tempo", value: "Slow" },
    ],
    schedule: [
      { day: "THU", date: "06", state: "Studio" },
      { day: "FRI", date: "07", state: "Salon" },
      { day: "SAT", date: "08", state: "Archive" },
      { day: "SUN", date: "09", state: "Off" },
      { day: "MON", date: "10", state: "Studio" },
    ],
  },
  {
    slug: "ren",
    name: "Ren",
    monogram: "RE",
    district: "Ginza",
    tier: "Signature",
    status: "This week",
    role: "Sound curator",
    shortNote: "Analogue selections shaped for rain, neon, and late trains.",
    biography:
      "Ren is a temporary profile name used to preview the supplied photography inside this interface. The role and description are placeholder editorial copy; no booking or contact function is provided.",
    languages: ["Japanese", "Korean"],
    disciplines: ["Vinyl", "Ambient", "Curation"],
    palette: ["#7fc4bf", "#1f5a63", "#101b24"],
    stats: [
      { label: "Practice", value: "6 years" },
      { label: "Format", value: "Vinyl" },
      { label: "Mood", value: "Tidal" },
      { label: "Tempo", value: "Low" },
    ],
    schedule: [
      { day: "THU", date: "06", state: "Archive" },
      { day: "FRI", date: "07", state: "Studio" },
      { day: "SAT", date: "08", state: "Salon" },
      { day: "SUN", date: "09", state: "Salon" },
      { day: "MON", date: "10", state: "Off" },
    ],
  },
  {
    slug: "mio",
    name: "Mio",
    monogram: "MI",
    district: "Daikanyama",
    tier: "New",
    status: "Tonight",
    role: "Light designer",
    shortNote: "Soft prisms, sharp silhouettes, and precise visual timing.",
    biography:
      "Mio is a temporary profile name used to preview the supplied photography inside this interface. The role and description are placeholder editorial copy; no booking or contact function is provided.",
    languages: ["Japanese", "English"],
    disciplines: ["Lighting", "Installation", "Film"],
    palette: ["#ff2f91", "#ff8500", "#171717"],
    stats: [
      { label: "Practice", value: "4 years" },
      { label: "Format", value: "Light" },
      { label: "Mood", value: "Prism" },
      { label: "Tempo", value: "Pulse" },
    ],
    schedule: [
      { day: "THU", date: "06", state: "Studio" },
      { day: "FRI", date: "07", state: "Studio" },
      { day: "SAT", date: "08", state: "Off" },
      { day: "SUN", date: "09", state: "Salon" },
      { day: "MON", date: "10", state: "Archive" },
    ],
  },
  {
    slug: "sora",
    name: "Sora",
    monogram: "SO",
    district: "Aoyama",
    tier: "Signature",
    status: "Private",
    role: "Editorial host",
    shortNote: "Conversation, cinema, and impeccably chosen small details.",
    biography:
      "Sora is a temporary profile name used to preview the supplied photography inside this interface. The role and description are placeholder editorial copy; no booking or contact function is provided.",
    languages: ["Japanese", "French"],
    disciplines: ["Cinema", "Conversation", "Writing"],
    palette: ["#f2ca78", "#8f5b2f", "#24170f"],
    stats: [
      { label: "Practice", value: "9 years" },
      { label: "Format", value: "Salon" },
      { label: "Mood", value: "Amber" },
      { label: "Tempo", value: "Measured" },
    ],
    schedule: [
      { day: "THU", date: "06", state: "Archive" },
      { day: "FRI", date: "07", state: "Off" },
      { day: "SAT", date: "08", state: "Salon" },
      { day: "SUN", date: "09", state: "Salon" },
      { day: "MON", date: "10", state: "Studio" },
    ],
  },
  {
    slug: "yuna",
    name: "Yuna",
    monogram: "YU",
    district: "Ginza",
    tier: "Muse",
    status: "Tonight",
    role: "Fashion archivist",
    shortNote: "Rare silhouettes translated into modern, tactile stories.",
    biography:
      "Yuna is a temporary profile name used to preview the supplied photography inside this interface. The role and description are placeholder editorial copy; no booking or contact function is provided.",
    languages: ["Japanese", "English"],
    disciplines: ["Fashion", "Archive", "Textile"],
    palette: ["#ff9188", "#9b3e4b", "#251016"],
    stats: [
      { label: "Practice", value: "7 years" },
      { label: "Format", value: "Archive" },
      { label: "Mood", value: "Rouge" },
      { label: "Tempo", value: "Fluid" },
    ],
    schedule: [
      { day: "THU", date: "06", state: "Salon" },
      { day: "FRI", date: "07", state: "Archive" },
      { day: "SAT", date: "08", state: "Studio" },
      { day: "SUN", date: "09", state: "Off" },
      { day: "MON", date: "10", state: "Studio" },
    ],
  },
  {
    slug: "kei",
    name: "Kei",
    monogram: "KE",
    district: "Daikanyama",
    tier: "New",
    status: "This week",
    role: "Image maker",
    shortNote: "Grain, reflections, and fragments gathered after midnight.",
    biography:
      "Kei is a temporary profile name used to preview the supplied photography inside this interface. The role and description are placeholder editorial copy; no booking or contact function is provided.",
    languages: ["Japanese", "English"],
    disciplines: ["Photography", "Print", "Architecture"],
    palette: ["#7ba9ff", "#345184", "#111827"],
    stats: [
      { label: "Practice", value: "3 years" },
      { label: "Format", value: "Film" },
      { label: "Mood", value: "Cobalt" },
      { label: "Tempo", value: "Still" },
    ],
    schedule: [
      { day: "THU", date: "06", state: "Off" },
      { day: "FRI", date: "07", state: "Studio" },
      { day: "SAT", date: "08", state: "Archive" },
      { day: "SUN", date: "09", state: "Salon" },
      { day: "MON", date: "10", state: "Studio" },
    ],
  },
  {
    slug: "nami",
    name: "Nami",
    monogram: "NA",
    district: "Aoyama",
    tier: "Muse",
    status: "Tonight",
    role: "Performance poet",
    shortNote: "A low voice, exact language, and rooms held in complete focus.",
    biography:
      "Nami is a temporary profile name used to preview the supplied photography inside this interface. The role and description are placeholder editorial copy; no booking or contact function is provided.",
    languages: ["Japanese", "English"],
    disciplines: ["Poetry", "Voice", "Performance"],
    palette: ["#ff2f91", "#c1125a", "#171717"],
    stats: [
      { label: "Practice", value: "5 years" },
      { label: "Format", value: "Voice" },
      { label: "Mood", value: "Plum" },
      { label: "Tempo", value: "Cadence" },
    ],
    schedule: [
      { day: "THU", date: "06", state: "Salon" },
      { day: "FRI", date: "07", state: "Studio" },
      { day: "SAT", date: "08", state: "Salon" },
      { day: "SUN", date: "09", state: "Off" },
      { day: "MON", date: "10", state: "Archive" },
    ],
  },
  {
    slug: "rin",
    name: "Rin",
    monogram: "RI",
    district: "Ginza",
    tier: "Signature",
    status: "This week",
    role: "Tea artist",
    shortNote: "Seasonal aroma, disciplined gestures, and quiet hospitality.",
    biography:
      "Rin presents fictional tea and scent studies designed around seasonality and restrained gesture. The interface intentionally has no reservation flow.",
    languages: ["Japanese", "Mandarin"],
    disciplines: ["Tea", "Scent", "Ceremony"],
    palette: ["#9bbf7d", "#49643f", "#111b13"],
    stats: [
      { label: "Practice", value: "10 years" },
      { label: "Format", value: "Ritual" },
      { label: "Mood", value: "Moss" },
      { label: "Tempo", value: "Still" },
    ],
    schedule: [
      { day: "THU", date: "06", state: "Archive" },
      { day: "FRI", date: "07", state: "Salon" },
      { day: "SAT", date: "08", state: "Salon" },
      { day: "SUN", date: "09", state: "Studio" },
      { day: "MON", date: "10", state: "Off" },
    ],
  },
  {
    slug: "ema",
    name: "Ema",
    monogram: "EM",
    district: "Daikanyama",
    tier: "New",
    status: "Private",
    role: "Set stylist",
    shortNote: "Playful objects arranged with unusual calm and intention.",
    biography:
      "Ema is a fictional set stylist composing small worlds from paper, glass, and found geometry. The displayed portrait and profile details are original prototype material.",
    languages: ["Japanese", "English"],
    disciplines: ["Set design", "Objects", "Colour"],
    palette: ["#ffba73", "#b45335", "#28140d"],
    stats: [
      { label: "Practice", value: "4 years" },
      { label: "Format", value: "Objects" },
      { label: "Mood", value: "Tangerine" },
      { label: "Tempo", value: "Playful" },
    ],
    schedule: [
      { day: "THU", date: "06", state: "Off" },
      { day: "FRI", date: "07", state: "Archive" },
      { day: "SAT", date: "08", state: "Studio" },
      { day: "SUN", date: "09", state: "Studio" },
      { day: "MON", date: "10", state: "Salon" },
    ],
  },
  {
    slug: "hana",
    name: "Hana",
    monogram: "HA",
    district: "Aoyama",
    tier: "Signature",
    status: "Tonight",
    role: "Floral sculptor",
    shortNote: "Botanical forms with cinematic scale and surprising edges.",
    biography:
      "Hana creates fictional botanical installations inspired by cinema and urban gardens. The profile is a visual design sample, with no real-world services attached.",
    languages: ["Japanese", "English"],
    disciplines: ["Botanical", "Sculpture", "Cinema"],
    palette: ["#e17991", "#773448", "#211116"],
    stats: [
      { label: "Practice", value: "8 years" },
      { label: "Format", value: "Floral" },
      { label: "Mood", value: "Bloom" },
      { label: "Tempo", value: "Organic" },
    ],
    schedule: [
      { day: "THU", date: "06", state: "Studio" },
      { day: "FRI", date: "07", state: "Salon" },
      { day: "SAT", date: "08", state: "Archive" },
      { day: "SUN", date: "09", state: "Salon" },
      { day: "MON", date: "10", state: "Off" },
    ],
  },
  {
    slug: "noa",
    name: "Noa",
    monogram: "NO",
    district: "Ginza",
    tier: "Muse",
    status: "This week",
    role: "Choreographer",
    shortNote: "Spatial scores that turn restraint into palpable tension.",
    biography:
      "Noa is a fictional choreographer developing movement systems for compact architectural spaces. This demo contains no real performer media.",
    languages: ["Japanese", "Spanish"],
    disciplines: ["Movement", "Architecture", "Stage"],
    palette: ["#73d3d8", "#276d7e", "#0f2026"],
    stats: [
      { label: "Practice", value: "11 years" },
      { label: "Format", value: "Stage" },
      { label: "Mood", value: "Aqua" },
      { label: "Tempo", value: "Tension" },
    ],
    schedule: [
      { day: "THU", date: "06", state: "Studio" },
      { day: "FRI", date: "07", state: "Off" },
      { day: "SAT", date: "08", state: "Salon" },
      { day: "SUN", date: "09", state: "Archive" },
      { day: "MON", date: "10", state: "Studio" },
    ],
  },
  {
    slug: "mei",
    name: "Mei",
    monogram: "ME",
    district: "Daikanyama",
    tier: "New",
    status: "Tonight",
    role: "Independent editor",
    shortNote: "Small publications devoted to rooms, objects, and desire.",
    biography:
      "Mei is a fictional independent editor assembling visual essays about private space and material culture. No external publishing or commerce is connected.",
    languages: ["Japanese", "English"],
    disciplines: ["Publishing", "Essay", "Art direction"],
    palette: ["#d6c5a4", "#75644e", "#1d1915"],
    stats: [
      { label: "Practice", value: "5 years" },
      { label: "Format", value: "Print" },
      { label: "Mood", value: "Paper" },
      { label: "Tempo", value: "Quiet" },
    ],
    schedule: [
      { day: "THU", date: "06", state: "Salon" },
      { day: "FRI", date: "07", state: "Archive" },
      { day: "SAT", date: "08", state: "Studio" },
      { day: "SUN", date: "09", state: "Off" },
      { day: "MON", date: "10", state: "Salon" },
    ],
  },
];

export const featureTiles = [
  { eyebrow: "01", title: "The artists", note: "Twelve editorial dossiers" },
  { eyebrow: "02", title: "Tonight", note: "A live editorial index" },
  { eyebrow: "03", title: "The districts", note: "Three nocturnal chapters" },
  { eyebrow: "04", title: "Field notes", note: "Stories from the archive" },
  { eyebrow: "05", title: "The studio", note: "How the demo works" },
];

export const testimonials = [
  {
    quote:
      "The visual rhythm feels like wandering through a private midnight magazine.",
    source: "Prototype review 01",
  },
  {
    quote:
      "Dense enough to explore, calm enough that every profile still has its own air.",
    source: "Prototype review 02",
  },
  {
    quote:
      "The cast photography makes the interface feel immediate without losing its editorial structure.",
    source: "Prototype review 03",
  },
  {
    quote:
      "A strong demonstration of catalogue hierarchy without a transactional path.",
    source: "Prototype review 04",
  },
];
