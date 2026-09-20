import type { Event } from "@/data/events";

export type ApplicationFieldType = "text" | "textarea" | "select" | "checkbox";

export type ApplicationField = {
  id: string;
  label: string;
  type: ApplicationFieldType;
  required: boolean;
  help?: string;
  placeholder?: string;
  options?: string[];
};

const clubFields: Record<string, ApplicationField[]> = {
  ewb: [
    {
      id: "ewb-safety",
      label: "I will follow supervisor instructions and stay in marked safe zones.",
      type: "checkbox",
      required: true,
    },
  ],
  rotaract: [
    {
      id: "rotaract-wwcc",
      label: "Working with Children Check",
      type: "select",
      required: true,
      help: "Rotaract may request this for community-facing roles.",
      options: [
        "I hold a current WWCC",
        "I can obtain one before the event",
        "Not applicable for this role",
      ],
    },
  ],
  "mental-health-collective": [
    {
      id: "smhc-confidentiality",
      label: "I will treat student conversations as confidential unless there is a safety concern.",
      type: "checkbox",
      required: true,
    },
  ],
  "sports-rec": [
    {
      id: "sports-physical",
      label: "I understand this may involve outdoor physical activity and will tell the host about any limits.",
      type: "checkbox",
      required: true,
    },
  ],
  "enviro-collective": [
    {
      id: "enviro-outdoor",
      label: "I am comfortable with outdoor work and will bring weather-appropriate clothing.",
      type: "checkbox",
      required: true,
    },
  ],
  "peer-mentors": [
    {
      id: "mentor-first-year",
      label: "I am comfortable supporting first-year students in a welcoming, respectful way.",
      type: "checkbox",
      required: true,
    },
  ],
  ausa: [
    {
      id: "ausa-induction",
      label: "I can complete AUSA Crew induction before my first shift.",
      type: "checkbox",
      required: true,
    },
  ],
  "engineering-society": [
    {
      id: "aues-visitors",
      label: "I am comfortable speaking with the public and directing visitors.",
      type: "checkbox",
      required: true,
    },
  ],
};

const eventFields: Record<string, ApplicationField[]> = {
  "ingenuity-2026": [
    {
      id: "ingenuity-shirt",
      label: "Volunteer shirt size",
      type: "select",
      required: true,
      options: ["XS", "S", "M", "L", "XL", "I will wear my own plain black top"],
    },
    {
      id: "ingenuity-dietary",
      label: "Dietary requirements for the volunteer meal",
      type: "text",
      required: false,
      placeholder: "None, vegetarian, allergies...",
    },
  ],
  "ewb-community-build": [
    {
      id: "ewb-shoes",
      label: "I will wear closed-toe shoes on the build site.",
      type: "checkbox",
      required: true,
    },
    {
      id: "ewb-experience",
      label: "Previous practical or build experience",
      type: "select",
      required: true,
      options: ["None — happy to learn", "Some DIY or workshop experience", "Regular construction or engineering practicals"],
    },
    {
      id: "ewb-allergies",
      label: "Allergies or site access needs the supervisor should know",
      type: "textarea",
      required: false,
      placeholder: "Optional",
    },
  ],
  "foodbank-packing": [
    {
      id: "foodbank-seated",
      label: "I would prefer a seated sorting role if one is available.",
      type: "checkbox",
      required: false,
    },
    {
      id: "foodbank-shoes",
      label: "I can wear closed-toe shoes in the warehouse.",
      type: "checkbox",
      required: true,
    },
  ],
  "whyalla-outreach": [
    {
      id: "whyalla-travel",
      label: "How will you get to Whyalla campus?",
      type: "select",
      required: true,
      options: [
        "I am already based regionally",
        "I can arrange my own travel",
        "I need the club to advise on travel options",
      ],
    },
  ],
  "open-day-city": [
    {
      id: "openday-standing",
      label: "I am comfortable being on my feet for most of a shift, with rostered breaks.",
      type: "checkbox",
      required: true,
    },
  ],
  "science-open-night": [
    {
      id: "science-evening",
      label: "I can attend the full evening shift, including the exhibit briefing.",
      type: "checkbox",
      required: true,
    },
  ],
  "city-sports-carnival": [
    {
      id: "sports-first-aid",
      label: "First aid",
      type: "select",
      required: true,
      options: [
        "No current first-aid certificate",
        "Provide first-aid certificate details if asked",
        "Happy to be placed near a first-aid station",
      ],
    },
  ],
  "harmony-week": [
    {
      id: "harmony-sun",
      label: "I will bring sun protection for the outdoor lawns.",
      type: "checkbox",
      required: true,
    },
  ],
  "rotaract-cleanup": [
    {
      id: "cleanup-terrain",
      label: "I can work on uneven riverside paths, or I will request the stall role.",
      type: "checkbox",
      required: true,
    },
  ],
  "roseworthy-open": [
    {
      id: "roseworthy-shoes",
      label: "I will wear closed-toe shoes around animal exhibits.",
      type: "checkbox",
      required: true,
    },
  ],
  "ausa-orientation-crew": [
    {
      id: "ausa-days",
      label: "Extra notes for Crew coordinators",
      type: "textarea",
      required: false,
      placeholder: "Preferred activities, lifting limits, or other notes",
    },
  ],
};

export function getApplicationFields(event: Event): ApplicationField[] {
  const fromClub = clubFields[event.organisationId] ?? [];
  const fromEvent = eventFields[event.id] ?? [];
  const seen = new Set<string>();

  return [...fromClub, ...fromEvent].filter((field) => {
    if (seen.has(field.id)) return false;
    seen.add(field.id);
    return true;
  });
}
