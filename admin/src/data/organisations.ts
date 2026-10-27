export type HostType = "club";

export type Organisation = {
  id: string;
  name: string;
  shortName: string;
  type: HostType;
  description: string;
  focus: string;
};

export const hostTypeLabels: Record<HostType, string> = {
  club: "Student club",
};

export const organisations: Organisation[] = [
  {
    id: "ewb",
    name: "Engineers Without Borders",
    shortName: "EWB",
    type: "club",
    description: "Student club delivering community engineering projects.",
    focus: "STEM & community builds",
  },
  {
    id: "rotaract",
    name: "Adelaide University Rotaract Club",
    shortName: "Rotaract",
    type: "club",
    description: "Service, leadership and local community projects.",
    focus: "Community service",
  },
  {
    id: "ausa",
    name: "AUSA Crew",
    shortName: "AUSA Crew",
    type: "club",
    description: "Student crew supporting campus programmes and orientation.",
    focus: "Campus life",
  },
  {
    id: "engineering-society",
    name: "Adelaide University Engineering Society",
    shortName: "AUES",
    type: "club",
    description: "Engineering students hosting showcases, open nights and STEM outreach.",
    focus: "STEM & innovation",
  },
  {
    id: "mental-health-collective",
    name: "Student Mental Health Collective",
    shortName: "SMHC",
    type: "club",
    description: "Peer-led wellbeing events and support-focused volunteering.",
    focus: "Wellbeing",
  },
  {
    id: "peer-mentors",
    name: "Peer Mentors Club",
    shortName: "Peer Mentors",
    type: "club",
    description: "Student mentors welcoming new students into campus life.",
    focus: "Mentoring",
  },
  {
    id: "international-students",
    name: "International Students Club",
    shortName: "ISC",
    type: "club",
    description: "Cultural festivals, welcome events and peer connection.",
    focus: "Culture & welcome",
  },
  {
    id: "enviro-collective",
    name: "Enviro Collective",
    shortName: "Enviro",
    type: "club",
    description: "Sustainability, regional outreach and outdoor service days.",
    focus: "Environment",
  },
  {
    id: "sports-rec",
    name: "Sports and Recreation Club",
    shortName: "Sports & Rec",
    type: "club",
    description: "Game-day volunteers, open days and active campus events.",
    focus: "Sport & recreation",
  },
];

export const studentClubs = organisations.filter(
  (organisation) => organisation.type === "club"
);

export function getOrganisation(id: string) {
  return organisations.find((organisation) => organisation.id === id);
}
