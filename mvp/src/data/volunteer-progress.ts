export type VolunteerLevel = {
  level: number;
  name: string;
  minPoints: number;
  summary: string;
};

export const volunteerLevels: VolunteerLevel[] = [
  {
    level: 1,
    name: "Newcomer",
    minPoints: 0,
    summary: "Create a profile and apply for your first club event.",
  },
  {
    level: 2,
    name: "Contributor",
    minPoints: 100,
    summary: "You have started showing up. Clubs can see a short record.",
  },
  {
    level: 3,
    name: "Campus Ally",
    minPoints: 250,
    summary: "Reliable enough for busier events and repeat invitations.",
  },
  {
    level: 4,
    name: "Club Champion",
    minPoints: 500,
    summary: "Strong ratings. Clubs can shortlist you for specialist roles.",
  },
  {
    level: 5,
    name: "University Legend",
    minPoints: 800,
    summary: "Top-tier applicants for flagship events and leadership shifts.",
  },
];

export const pointRules = [
  {
    action: "Shift attended",
    points: 50,
    detail: "Checked in and completed an allocated volunteer shift.",
  },
  {
    action: "Application approved",
    points: 15,
    detail: "A club coordinator accepted you for a role.",
  },
  {
    action: "Host rating of 5 stars",
    points: 25,
    detail: "Bonus when a club rates the shift as excellent.",
  },
  {
    action: "Successful referral",
    points: 40,
    detail: "A student you invited completes their first event.",
  },
  {
    action: "First event bonus",
    points: 30,
    detail: "One-time reward for finishing your first shift.",
  },
];

export type HostRating = {
  id: string;
  eventTitle: string;
  clubName: string;
  overall: number;
  reliability: number;
  teamwork: number;
  communication: number;
  comment: string;
  ratedAt: string;
};

export type PointRecord = {
  id: string;
  label: string;
  points: number;
  date: string;
};

export type ReferralRecord = {
  name: string;
  status: "Signed up" | "First event completed";
  pointsAwarded: number;
};

export type StudentProfileData = {
  fullName: string;
  studentId: string;
  email: string;
  campus: string;
  bio: string;
  skills: string[];
  availability: string;
  emergencyContact: string;
  accessibility: string;
  hours: number;
  eventsAttended: number;
  points: number;
  ratings: HostRating[];
  pointHistory: PointRecord[];
  referrals: ReferralRecord[];
};

export const demoStudentProfile: StudentProfileData = {
  fullName: "Alex Volunteer",
  studentId: "a1991246",
  email: "a1991246@adelaide.edu.au",
  campus: "Adelaide City",
  bio: "Engineering student who likes visitor-facing roles, STEM showcases and practical community builds.",
  skills: ["Welcome desk", "Crowd flow", "First aid awareness"],
  availability: "Weekday afternoons and most Saturdays.",
  emergencyContact: "Demo contact only — not a real number.",
  accessibility: "No additional access requirements.",
  hours: 18,
  eventsAttended: 4,
  points: 320,
  ratings: [
    {
      id: "rate-1",
      eventTitle: "Ingenuity 2026",
      clubName: "AUES",
      overall: 5,
      reliability: 5,
      teamwork: 5,
      communication: 4,
      comment:
        "Arrived on time, briefed quickly and kept registration moving during the busy afternoon.",
      ratedAt: "12 November 2026",
    },
    {
      id: "rate-2",
      eventTitle: "EWB Community Build Day",
      clubName: "EWB",
      overall: 5,
      reliability: 5,
      teamwork: 4,
      communication: 5,
      comment: "Calm on the yard and helpful with visitor safety questions.",
      ratedAt: "14 November 2026",
    },
    {
      id: "rate-3",
      eventTitle: "Foodbank Packing Morning",
      clubName: "Rotaract",
      overall: 4,
      reliability: 4,
      teamwork: 5,
      communication: 4,
      comment: "Solid packing shift. Would invite back for warehouse roles.",
      ratedAt: "8 November 2026",
    },
  ],
  pointHistory: [
    { id: "p1", label: "Shift attended · Ingenuity 2026", points: 50, date: "11 Nov 2026" },
    { id: "p2", label: "5-star host rating · AUES", points: 25, date: "12 Nov 2026" },
    { id: "p3", label: "Shift attended · EWB Build Day", points: 50, date: "14 Nov 2026" },
    { id: "p4", label: "Application approved · Harmony Week", points: 15, date: "20 Sep 2026" },
    { id: "p5", label: "Referral completed · Jordan Lee", points: 40, date: "18 Sep 2026" },
    { id: "p6", label: "First event bonus", points: 30, date: "8 Nov 2026" },
  ],
  referrals: [
    {
      name: "Jordan Lee",
      status: "First event completed",
      pointsAwarded: 40,
    },
    {
      name: "Sam Nguyen",
      status: "Signed up",
      pointsAwarded: 0,
    },
  ],
};

export function getLevelForPoints(points: number) {
  return [...volunteerLevels]
    .reverse()
    .find((level) => points >= level.minPoints) ?? volunteerLevels[0];
}

export function getNextLevel(points: number) {
  return volunteerLevels.find((level) => points < level.minPoints);
}

export function getLevelProgress(points: number) {
  const current = getLevelForPoints(points);
  const next = getNextLevel(points);

  if (!next) {
    return { current, next: null, percent: 100, remaining: 0 };
  }

  const span = next.minPoints - current.minPoints;
  const earned = points - current.minPoints;
  return {
    current,
    next,
    percent: Math.min(100, Math.round((earned / span) * 100)),
    remaining: next.minPoints - points,
  };
}

export function getAverageRating(ratings: HostRating[]) {
  if (ratings.length === 0) return 0;
  const total = ratings.reduce((sum, rating) => sum + rating.overall, 0);
  return Math.round((total / ratings.length) * 10) / 10;
}

export function getTraitAverage(
  ratings: HostRating[],
  key: "reliability" | "teamwork" | "communication"
) {
  if (ratings.length === 0) return 0;
  const total = ratings.reduce((sum, rating) => sum + rating[key], 0);
  return Math.round((total / ratings.length) * 10) / 10;
}

export function isTopApplicant(profile: StudentProfileData) {
  return (
    getAverageRating(profile.ratings) >= 4.5 && profile.eventsAttended >= 3
  );
}

export function getReferralCode(studentId: string) {
  return `AU-${studentId.replace(/^a/i, "A").toUpperCase()}`;
}
