import {
  getOrganisation,
  hostTypeLabels,
  type HostType,
} from "@/data/organisations";

export type EventStatus = "Open" | "Closed" | "Full" | "Coming soon";

export type VolunteerRole = {
  id: string;
  title: string;
  description: string;
  placesAvailable: number;
};

export type VolunteerShift = {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
  placesAvailable: number;
};

export type Event = {
  id: string;
  title: string;
  tagline: string;
  category: string;
  tags: string[];
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  campus: string;
  location: string;
  organisationId: string;
  contactEmail: string;
  capacity: number;
  placesAvailable: number;
  status: EventStatus;
  requirements: string[];
  roles: VolunteerRole[];
  shifts: VolunteerShift[];
  bannerImage: string;
  posterImage: string;
  featured?: boolean;
  trendingScore: number;
  applicationDeadline: string;
  accessibilityNotes: string;
};

export const events: Event[] = [
  {
    id: "ingenuity-2026",
    title: "Ingenuity 2026",
    tagline: "Showcase student innovation across STEM.",
    category: "STEM",
    tags: ["STEM", "Visitors", "Innovation", "City"],
    description:
      "Support a flagship university event showcasing student innovation, technology and engineering projects. Volunteers welcome visitors, staff registration points and help the event team deliver a smooth experience.",
    date: "11 November 2026",
    startTime: "9:00 AM",
    endTime: "5:00 PM",
    campus: "Adelaide City",
    location: "Adelaide Convention Centre, North Terrace, Adelaide SA",
    organisationId: "engineering-society",
    contactEmail: "events@example.edu.au",
    capacity: 30,
    placesAvailable: 12,
    status: "Open",
    requirements: [
      "Current Adelaide University student or approved volunteer",
      "Available for the allocated volunteer shift",
      "Complete the volunteer briefing before the event",
    ],
    roles: [
      {
        id: "registration",
        title: "Registration Support",
        description:
          "Welcome attendees, assist with registration and direct visitors.",
        placesAvailable: 4,
      },
      {
        id: "visitor-support",
        title: "Visitor Support",
        description:
          "Help attendees locate exhibits, facilities and information.",
        placesAvailable: 5,
      },
      {
        id: "event-support",
        title: "Event Support",
        description: "Assist coordinators with general event operations.",
        placesAvailable: 3,
      },
    ],
    shifts: [
      {
        id: "ing-am",
        label: "Morning",
        startTime: "9:00 AM",
        endTime: "1:00 PM",
        placesAvailable: 6,
      },
      {
        id: "ing-pm",
        label: "Afternoon",
        startTime: "1:00 PM",
        endTime: "5:00 PM",
        placesAvailable: 6,
      },
    ],
    bannerImage:
      "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1800&q=80",
    posterImage:
      "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=900&q=80",
    featured: true,
    trendingScore: 98,
    applicationDeadline: "1 November 2026",
    accessibilityNotes:
      "Step-free access, quiet room available, seated rest points.",
  },
  {
    id: "wellbeing-expo",
    title: "Student Wellbeing Expo",
    tagline: "Help students find support across campus.",
    category: "Wellbeing",
    tags: ["Wellbeing", "Welcome", "Support"],
    description:
      "Help deliver a student wellbeing event and support attendees throughout the day. Volunteers guide students to services, activities and information booths.",
    date: "18 November 2026",
    startTime: "10:00 AM",
    endTime: "3:00 PM",
    campus: "Mawson Lakes",
    location: "Mawson Lakes Campus, Building C Atrium",
    organisationId: "mental-health-collective",
    contactEmail: "wellbeing@example.edu.au",
    capacity: 20,
    placesAvailable: 8,
    status: "Open",
    requirements: [
      "Available during the allocated shift",
      "Attend the volunteer briefing",
    ],
    roles: [
      {
        id: "welcome",
        title: "Welcome Volunteer",
        description: "Welcome students and help them find their way around.",
        placesAvailable: 4,
      },
      {
        id: "activity-support",
        title: "Activity Support",
        description: "Help staff with activities and information booths.",
        placesAvailable: 4,
      },
    ],
    shifts: [
      {
        id: "wb-full",
        label: "Full day",
        startTime: "10:00 AM",
        endTime: "3:00 PM",
        placesAvailable: 8,
      },
    ],
    bannerImage:
      "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1800&q=80",
    posterImage:
      "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=900&q=80",
    trendingScore: 84,
    applicationDeadline: "10 November 2026",
    accessibilityNotes: "Indoor venue with lift access and quiet space.",
  },
  {
    id: "peer-mentor",
    title: "Peer Mentor Welcome Day",
    tagline: "Welcome new students into campus life.",
    category: "Mentoring",
    tags: ["Mentoring", "Orientation", "Welcome"],
    description:
      "Help welcome new students and support peer connection and orientation activities across Magill campus.",
    date: "25 November 2026",
    startTime: "9:30 AM",
    endTime: "2:30 PM",
    campus: "Magill",
    location: "Magill Campus, Hartley Building",
    organisationId: "peer-mentors",
    contactEmail: "mentoring@example.edu.au",
    capacity: 16,
    placesAvailable: 0,
    status: "Coming soon",
    requirements: [
      "Current student mentor or approved volunteer",
      "Attend the briefing once applications open",
    ],
    roles: [
      {
        id: "orientation-support",
        title: "Orientation Support",
        description: "Guide new students through welcome activities.",
        placesAvailable: 0,
      },
    ],
    shifts: [
      {
        id: "pm-day",
        label: "Welcome session",
        startTime: "9:30 AM",
        endTime: "2:30 PM",
        placesAvailable: 0,
      },
    ],
    bannerImage:
      "https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=1800&q=80",
    posterImage:
      "https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=900&q=80",
    trendingScore: 76,
    applicationDeadline: "18 November 2026",
    accessibilityNotes: "Outdoor and indoor mix; shaded rest areas available.",
  },
  {
    id: "open-day-city",
    title: "City Campus Open Day",
    tagline: "Help future students explore the city campus.",
    category: "Community",
    tags: ["Visitors", "Campus", "Welcome", "City"],
    description:
      "Support campus tours, information tents and wayfinding for prospective students and families during Open Day.",
    date: "5 December 2026",
    startTime: "8:30 AM",
    endTime: "4:00 PM",
    campus: "Adelaide City",
    location: "North Terrace Campus, Hub Central",
    organisationId: "ausa",
    contactEmail: "openday@example.edu.au",
    capacity: 40,
    placesAvailable: 18,
    status: "Open",
    requirements: [
      "Comfortable being on your feet for a shift",
      "Complete the Open Day briefing",
    ],
    roles: [
      {
        id: "tour-guide",
        title: "Campus Tour Support",
        description: "Help tour leaders keep groups together and on time.",
        placesAvailable: 8,
      },
      {
        id: "info-tent",
        title: "Information Tent",
        description: "Answer basic wayfinding questions and hand out maps.",
        placesAvailable: 10,
      },
    ],
    shifts: [
      {
        id: "od-am",
        label: "Morning",
        startTime: "8:30 AM",
        endTime: "12:30 PM",
        placesAvailable: 9,
      },
      {
        id: "od-pm",
        label: "Afternoon",
        startTime: "12:30 PM",
        endTime: "4:00 PM",
        placesAvailable: 9,
      },
    ],
    bannerImage:
      "https://images.unsplash.com/photo-1541339906-3ea1bd3d1560?auto=format&fit=crop&w=1800&q=80",
    posterImage:
      "https://images.unsplash.com/photo-1541339906-3ea1bd3d1560?auto=format&fit=crop&w=900&q=80",
    featured: true,
    trendingScore: 91,
    applicationDeadline: "20 November 2026",
    accessibilityNotes: "Multiple step-free routes; maps include accessible paths.",
  },
  {
    id: "ewb-community-build",
    title: "EWB Community Build Day",
    tagline: "Hands-on engineering with a community partner.",
    category: "STEM",
    tags: ["STEM", "Community", "Hands-on"],
    description:
      "Join Engineers Without Borders for a practical community build. Volunteers help with materials, safety marshalling and visitor briefings.",
    date: "14 November 2026",
    startTime: "8:00 AM",
    endTime: "3:00 PM",
    campus: "Mawson Lakes",
    location: "Mawson Lakes Campus, Engineering Yard",
    organisationId: "ewb",
    contactEmail: "ewb@example.edu.au",
    capacity: 22,
    placesAvailable: 9,
    status: "Open",
    requirements: [
      "Closed-toe shoes",
      "Safety briefing on the day",
    ],
    roles: [
      {
        id: "build-crew",
        title: "Build Crew",
        description: "Support the practical build under supervisor direction.",
        placesAvailable: 6,
      },
      {
        id: "safety-marshal",
        title: "Safety Marshal",
        description: "Help keep walkways clear and visitors in safe zones.",
        placesAvailable: 3,
      },
    ],
    shifts: [
      {
        id: "ewb-day",
        label: "Build day",
        startTime: "8:00 AM",
        endTime: "3:00 PM",
        placesAvailable: 9,
      },
    ],
    bannerImage:
      "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1800&q=80",
    posterImage:
      "https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=900&q=80",
    trendingScore: 80,
    applicationDeadline: "7 November 2026",
    accessibilityNotes: "Outdoor site; please tell us about access needs in advance.",
  },
  {
    id: "ausa-orientation-crew",
    title: "AUSA Orientation Crew",
    tagline: "Shape the first-week student experience.",
    category: "Mentoring",
    tags: ["Orientation", "Welcome", "Campus life"],
    description:
      "Volunteer with AUSA Crew during orientation. Help with events, student programmes and behind-the-scenes setup.",
    date: "16 February 2027",
    startTime: "10:00 AM",
    endTime: "6:00 PM",
    campus: "Adelaide City",
    location: "Union House and Barr Smith Lawns",
    organisationId: "ausa",
    contactEmail: "crew@example.edu.au",
    capacity: 28,
    placesAvailable: 14,
    status: "Open",
    requirements: [
      "Available for at least one full orientation shift",
      "Complete Crew induction",
    ],
    roles: [
      {
        id: "event-crew",
        title: "Event Crew",
        description: "Support student events, queues and activity rotations.",
        placesAvailable: 8,
      },
      {
        id: "setup-crew",
        title: "Setup and Pack Down",
        description: "Help set spaces, move equipment and close venues.",
        placesAvailable: 6,
      },
    ],
    shifts: [
      {
        id: "ausa-day",
        label: "Day crew",
        startTime: "10:00 AM",
        endTime: "3:00 PM",
        placesAvailable: 8,
      },
      {
        id: "ausa-eve",
        label: "Evening crew",
        startTime: "3:00 PM",
        endTime: "6:00 PM",
        placesAvailable: 6,
      },
    ],
    bannerImage:
      "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1800&q=80",
    posterImage:
      "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=900&q=80",
    trendingScore: 88,
    applicationDeadline: "20 January 2027",
    accessibilityNotes: "Mix of indoor and outdoor venues; rest breaks rostered.",
  },
  {
    id: "foodbank-packing",
    title: "Foodbank Packing Morning",
    tagline: "Pack food hampers with a community partner.",
    category: "Community",
    tags: ["Community", "Hands-on", "Service"],
    description:
      "A verified community-partner shift packing hampers and sorting donations with Foodbank SA. Suitable for volunteers who want a practical off-campus contribution.",
    date: "8 November 2026",
    startTime: "9:00 AM",
    endTime: "12:30 PM",
    campus: "Adelaide City",
    location: "Foodbank SA, Pooraka (transport notes provided after approval)",
    organisationId: "rotaract",
    contactEmail: "partners@example.edu.au",
    capacity: 15,
    placesAvailable: 6,
    status: "Open",
    requirements: [
      "Closed-toe shoes",
      "Ability to stand for the shift or request a seated role",
    ],
    roles: [
      {
        id: "packing",
        title: "Hamper Packing",
        description: "Pack and label food hampers in a warehouse team.",
        placesAvailable: 4,
      },
      {
        id: "sorting",
        title: "Donation Sorting",
        description: "Sort incoming donations into storage categories.",
        placesAvailable: 2,
      },
    ],
    shifts: [
      {
        id: "fb-am",
        label: "Morning packing",
        startTime: "9:00 AM",
        endTime: "12:30 PM",
        placesAvailable: 6,
      },
    ],
    bannerImage:
      "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1800&q=80",
    posterImage:
      "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=900&q=80",
    trendingScore: 73,
    applicationDeadline: "1 November 2026",
    accessibilityNotes: "Warehouse environment; seated sorting roles available.",
  },
  {
    id: "science-open-night",
    title: "Science Open Night",
    tagline: "Bring public science to campus after dark.",
    category: "STEM",
    tags: ["STEM", "Visitors", "Research"],
    description:
      "Support a faculty public science night with exhibit stewards, queue management and family-friendly activity helpers.",
    date: "21 November 2026",
    startTime: "5:00 PM",
    endTime: "9:00 PM",
    campus: "Adelaide City",
    location: "The Braggs and adjacent science precinct",
    organisationId: "engineering-society",
    contactEmail: "science@example.edu.au",
    capacity: 24,
    placesAvailable: 11,
    status: "Open",
    requirements: [
      "Available for an evening shift",
      "Complete the exhibit briefing",
    ],
    roles: [
      {
        id: "exhibit-steward",
        title: "Exhibit Steward",
        description: "Help researchers explain exhibits to visiting families.",
        placesAvailable: 7,
      },
      {
        id: "queue-support",
        title: "Queue and Flow",
        description: "Keep popular exhibits moving safely.",
        placesAvailable: 4,
      },
    ],
    shifts: [
      {
        id: "sci-eve",
        label: "Evening",
        startTime: "5:00 PM",
        endTime: "9:00 PM",
        placesAvailable: 11,
      },
    ],
    bannerImage:
      "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1800&q=80",
    posterImage:
      "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=900&q=80",
    trendingScore: 86,
    applicationDeadline: "12 November 2026",
    accessibilityNotes: "Lift access to all public exhibit floors.",
  },
  {
    id: "harmony-week",
    title: "Harmony Week Festival",
    tagline: "Celebrate culture, food and student community.",
    category: "Wellbeing",
    tags: ["Wellbeing", "Culture", "Campus life"],
    description:
      "Volunteer at a campus festival celebrating cultural diversity. Roles include welcome, stall support and crowd flow.",
    date: "17 March 2027",
    startTime: "11:00 AM",
    endTime: "4:00 PM",
    campus: "Adelaide City",
    location: "Barr Smith Lawns",
    organisationId: "international-students",
    contactEmail: "culture@example.edu.au",
    capacity: 20,
    placesAvailable: 10,
    status: "Open",
    requirements: ["Sun protection for outdoor work", "Briefing on the morning"],
    roles: [
      {
        id: "festival-welcome",
        title: "Festival Welcome",
        description: "Greet visitors and share the programme.",
        placesAvailable: 5,
      },
      {
        id: "stall-support",
        title: "Stall Support",
        description: "Help student groups run cultural stalls.",
        placesAvailable: 5,
      },
    ],
    shifts: [
      {
        id: "hw-day",
        label: "Festival day",
        startTime: "11:00 AM",
        endTime: "4:00 PM",
        placesAvailable: 10,
      },
    ],
    bannerImage:
      "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=1800&q=80",
    posterImage:
      "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=900&q=80",
    trendingScore: 79,
    applicationDeadline: "1 March 2027",
    accessibilityNotes: "Outdoor lawns; accessible viewing and seating nearby.",
  },
  {
    id: "rotaract-cleanup",
    title: "Rotaract River Cleanup",
    tagline: "Local service with a student club.",
    category: "Community",
    tags: ["Community", "Outdoors", "Service"],
    description:
      "Join Rotaract for a Torrens-side cleanup and community stall. Volunteers collect, sort and speak with passers-by about the project.",
    date: "29 November 2026",
    startTime: "8:00 AM",
    endTime: "12:00 PM",
    campus: "Adelaide City",
    location: "Elder Park / River Torrens edge",
    organisationId: "rotaract",
    contactEmail: "rotaract@example.edu.au",
    capacity: 18,
    placesAvailable: 7,
    status: "Open",
    requirements: ["Sun protection", "Comfortable outdoor clothing"],
    roles: [
      {
        id: "cleanup-crew",
        title: "Cleanup Crew",
        description: "Collect and sort litter in assigned zones.",
        placesAvailable: 5,
      },
      {
        id: "community-stall",
        title: "Community Stall",
        description: "Talk with the public about the cleanup.",
        placesAvailable: 2,
      },
    ],
    shifts: [
      {
        id: "rc-am",
        label: "Morning",
        startTime: "8:00 AM",
        endTime: "12:00 PM",
        placesAvailable: 7,
      },
    ],
    bannerImage:
      "https://images.unsplash.com/photo-1618477388954-7852f72348ae?auto=format&fit=crop&w=1800&q=80",
    posterImage:
      "https://images.unsplash.com/photo-1618477388954-7852f72348ae?auto=format&fit=crop&w=900&q=80",
    trendingScore: 70,
    applicationDeadline: "22 November 2026",
    accessibilityNotes: "Uneven riverside paths; alternative stall role available.",
  },
  {
    id: "roseworthy-open",
    title: "Roseworthy Animal Open Day",
    tagline: "Welcome families to the Roseworthy campus.",
    category: "Community",
    tags: ["Campus", "Families", "Regional"],
    description:
      "Help families move between animal exhibits, information tents and campus tours at Roseworthy.",
    date: "12 December 2026",
    startTime: "9:00 AM",
    endTime: "3:00 PM",
    campus: "Roseworthy",
    location: "Roseworthy Campus, Main Precinct",
    organisationId: "sports-rec",
    contactEmail: "roseworthy@example.edu.au",
    capacity: 16,
    placesAvailable: 5,
    status: "Open",
    requirements: ["Closed-toe shoes", "Outdoor briefing on arrival"],
    roles: [
      {
        id: "exhibit-help",
        title: "Exhibit Helper",
        description: "Support animal exhibit teams with visitor flow.",
        placesAvailable: 3,
      },
      {
        id: "family-welcome",
        title: "Family Welcome",
        description: "Help families with maps, times and facilities.",
        placesAvailable: 2,
      },
    ],
    shifts: [
      {
        id: "rw-day",
        label: "Open day",
        startTime: "9:00 AM",
        endTime: "3:00 PM",
        placesAvailable: 5,
      },
    ],
    bannerImage:
      "https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=1800&q=80",
    posterImage:
      "https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=900&q=80",
    trendingScore: 67,
    applicationDeadline: "28 November 2026",
    accessibilityNotes: "Mostly outdoor; shuttle drop-off near the main precinct.",
  },
  {
    id: "whyalla-outreach",
    title: "Whyalla Community Outreach Day",
    tagline: "Regional volunteering with the Enviro Collective.",
    category: "Community",
    tags: ["Regional", "Community", "Outreach"],
    description:
      "Support a regional engagement day in Whyalla. Volunteers help with welcome, activity stations and family information.",
    date: "6 February 2027",
    startTime: "10:00 AM",
    endTime: "3:00 PM",
    campus: "Whyalla",
    location: "Whyalla Campus and community marquee",
    organisationId: "enviro-collective",
    contactEmail: "regional@example.edu.au",
    capacity: 12,
    placesAvailable: 4,
    status: "Open",
    requirements: [
      "Able to travel to Whyalla campus or already based regionally",
      "Complete partner induction",
    ],
    roles: [
      {
        id: "outreach-welcome",
        title: "Outreach Welcome",
        description: "Meet families and direct them to activities.",
        placesAvailable: 2,
      },
      {
        id: "activity-station",
        title: "Activity Station",
        description: "Help run a family activity station.",
        placesAvailable: 2,
      },
    ],
    shifts: [
      {
        id: "wh-day",
        label: "Outreach day",
        startTime: "10:00 AM",
        endTime: "3:00 PM",
        placesAvailable: 4,
      },
    ],
    bannerImage:
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1800&q=80",
    posterImage:
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=900&q=80",
    trendingScore: 62,
    applicationDeadline: "15 January 2027",
    accessibilityNotes: "Marquee and indoor backup if weather is severe.",
  },
  {
    id: "city-sports-carnival",
    title: "City Sports Carnival",
    tagline: "Keep game day running for student sport.",
    category: "Sport",
    tags: ["Sport", "Outdoors", "Campus life", "City"],
    description:
      "Volunteer with Sports and Recreation on carnival day. Help with check-in, marshalling, water stations and spectator flow.",
    date: "4 March 2027",
    startTime: "8:30 AM",
    endTime: "4:00 PM",
    campus: "Adelaide City",
    location: "Park 10 / University sports precinct",
    organisationId: "sports-rec",
    contactEmail: "sport@example.edu.au",
    capacity: 20,
    placesAvailable: 9,
    status: "Open",
    requirements: [
      "Comfortable outdoors for a full shift",
      "Sun protection",
    ],
    roles: [
      {
        id: "game-day-checkin",
        title: "Team Check-in",
        description: "Check teams in and direct them to courts and fields.",
        placesAvailable: 4,
      },
      {
        id: "marshal",
        title: "Field Marshal",
        description: "Keep spectator areas and walkways clear.",
        placesAvailable: 5,
      },
    ],
    shifts: [
      {
        id: "sc-am",
        label: "Morning",
        startTime: "8:30 AM",
        endTime: "12:30 PM",
        placesAvailable: 5,
      },
      {
        id: "sc-pm",
        label: "Afternoon",
        startTime: "12:30 PM",
        endTime: "4:00 PM",
        placesAvailable: 4,
      },
    ],
    bannerImage:
      "https://images.unsplash.com/photo-1461896836934-ffe607ba6851?auto=format&fit=crop&w=1800&q=80",
    posterImage:
      "https://images.unsplash.com/photo-1461896836934-ffe607ba6851?auto=format&fit=crop&w=900&q=80",
    trendingScore: 74,
    applicationDeadline: "15 February 2027",
    accessibilityNotes: "Mostly outdoor grass and paths; seated roles at check-in.",
  },
];

export const campusOptions = [
  "Adelaide City",
  "Magill",
  "Mawson Lakes",
  "Waite",
  "Roseworthy",
  "Mount Gambier",
  "Whyalla",
] as const;

export const categoryOptions = [
  "STEM",
  "Wellbeing",
  "Mentoring",
  "Community",
  "Sport",
] as const;

export const statusOptions = ["Open", "Coming soon", "Full", "Closed"] as const;

export function getAllEventTags() {
  return [...new Set(events.flatMap((event) => event.tags))].sort();
}

export function getEventDateValue(event: Event) {
  return Date.parse(event.date);
}

export function getEvent(id: string) {
  return events.find((event) => event.id === id);
}

export function getEventHost(event: Event) {
  return getOrganisation(event.organisationId);
}

export function getEventHostType(event: Event): HostType | undefined {
  return getEventHost(event)?.type;
}

export function getEventHostLabel(event: Event) {
  const host = getEventHost(event);
  if (!host) return "Host organisation";
  return `${host.shortName} · ${hostTypeLabels[host.type]}`;
}
