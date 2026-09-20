"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { useSession } from "@/hooks/useSession";
import {
  demoStudentProfile,
  getAverageRating,
  getLevelProgress,
  getReferralCode,
  getTraitAverage,
  isTopApplicant,
  pointRules,
  volunteerLevels,
  type StudentProfileData,
} from "@/data/volunteer-progress";

const PROFILE_STORAGE_KEY = "svp_profile_overrides";

function loadOverrides(): Partial<StudentProfileData> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<StudentProfileData>) : {};
  } catch {
    return {};
  }
}

function StarScore({ value }: { value: number }) {
  return (
    <span className="font-semibold text-purple-700">
      {value.toFixed(1)} / 5
    </span>
  );
}

export default function StudentProfile() {
  const { session } = useSession();
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [profile, setProfile] = useState<StudentProfileData>(demoStudentProfile);

  useEffect(() => {
    const overrides = loadOverrides();
    const username = session?.username || demoStudentProfile.studentId;
    const displayName =
      overrides.fullName ||
      session?.name ||
      window.localStorage.getItem("demoRegisteredName") ||
      demoStudentProfile.fullName;

    setProfile({
      ...demoStudentProfile,
      ...overrides,
      studentId: username,
      fullName: displayName,
      email: overrides.email || `${username}@adelaide.edu.au`,
    });
  }, [session]);

  const progress = getLevelProgress(profile.points);
  const average = getAverageRating(profile.ratings);
  const reliability = getTraitAverage(profile.ratings, "reliability");
  const teamwork = getTraitAverage(profile.ratings, "teamwork");
  const communication = getTraitAverage(profile.ratings, "communication");
  const topApplicant = isTopApplicant(profile);
  const referralCode = getReferralCode(profile.studentId);

  const skillText = useMemo(
    () => profile.skills.join(", "),
    [profile.skills]
  );

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next = {
      fullName: profile.fullName,
      campus: profile.campus,
      bio: profile.bio,
      skills: profile.skills,
      availability: profile.availability,
      emergencyContact: profile.emergencyContact,
      accessibility: profile.accessibility,
    };
    window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(next));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  const copyReferral = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="bg-white text-[#171717]">
      <section className="bg-[#f3f1ed]">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-purple-700">
            Student profile
          </p>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
                {profile.fullName}
              </h1>
              <p className="mt-3 text-gray-600">
                {profile.studentId} · {profile.campus}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <span className="bg-black px-4 py-2 text-sm font-semibold text-white">
                Level {progress.current.level} · {progress.current.name}
              </span>
              {topApplicant ? (
                <span className="bg-purple-700 px-4 py-2 text-sm font-semibold text-white">
                  Top applicant
                </span>
              ) : null}
            </div>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-4">
            <article className="bg-white p-5">
              <p className="text-sm text-gray-500">Volunteer points</p>
              <p className="mt-2 text-3xl font-semibold">{profile.points}</p>
            </article>
            <article className="bg-white p-5">
              <p className="text-sm text-gray-500">Host rating</p>
              <p className="mt-2 text-3xl font-semibold">{average.toFixed(1)}</p>
            </article>
            <article className="bg-white p-5">
              <p className="text-sm text-gray-500">Events attended</p>
              <p className="mt-2 text-3xl font-semibold">{profile.eventsAttended}</p>
            </article>
            <article className="bg-white p-5">
              <p className="text-sm text-gray-500">Hours logged</p>
              <p className="mt-2 text-3xl font-semibold">{profile.hours}</p>
            </article>
          </div>

          <div className="mt-8 bg-white p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="font-semibold">
                  {progress.next
                    ? `${progress.remaining} points to ${progress.next.name}`
                    : "Highest level reached"}
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  {progress.current.summary}
                </p>
              </div>
              <Link
                href="/discover"
                className="font-semibold text-purple-700 hover:underline"
              >
                Earn points on Discover →
              </Link>
            </div>
            <div className="mt-4 h-3 overflow-hidden bg-gray-200">
              <div
                className="h-full bg-purple-700 transition-all duration-500"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-12 px-6 py-16 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <h2 className="text-2xl font-semibold">Why clubs look at this profile</h2>
          <p className="mt-4 leading-7 text-gray-700">
            After an event, the host club can rate reliability, teamwork and
            communication. Other clubs can use that record when they only want
            proven volunteers for specialist or high-trust roles. Referrals add
            another signal: students you invite, and who complete a first event,
            strengthen your standing.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <article className="border border-gray-200 p-5">
              <p className="text-sm text-gray-500">Reliability</p>
              <p className="mt-2 text-2xl font-semibold">
                <StarScore value={reliability} />
              </p>
            </article>
            <article className="border border-gray-200 p-5">
              <p className="text-sm text-gray-500">Teamwork</p>
              <p className="mt-2 text-2xl font-semibold">
                <StarScore value={teamwork} />
              </p>
            </article>
            <article className="border border-gray-200 p-5">
              <p className="text-sm text-gray-500">Communication</p>
              <p className="mt-2 text-2xl font-semibold">
                <StarScore value={communication} />
              </p>
            </article>
          </div>

          <h2 className="mt-12 text-2xl font-semibold">Host ratings</h2>
          <div className="mt-5 space-y-4">
            {profile.ratings.map((rating) => (
              <article
                key={rating.id}
                className="border border-gray-200 bg-[#f7f7f7] p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">{rating.eventTitle}</h3>
                    <p className="mt-1 text-sm text-gray-600">
                      {rating.clubName} · {rating.ratedAt}
                    </p>
                  </div>
                  <StarScore value={rating.overall} />
                </div>
                <p className="mt-4 leading-7 text-gray-700">{rating.comment}</p>
                <p className="mt-3 text-sm text-gray-500">
                  Reliability {rating.reliability} · Teamwork {rating.teamwork} ·
                  Communication {rating.communication}
                </p>
              </article>
            ))}
          </div>

          <h2 className="mt-12 text-2xl font-semibold">Your details</h2>
          <form onSubmit={handleSave} className="mt-5 space-y-5">
            <div>
              <label htmlFor="fullName" className="block text-sm font-semibold">
                Full name
              </label>
              <input
                id="fullName"
                value={profile.fullName}
                onChange={(event) =>
                  setProfile((current) => ({
                    ...current,
                    fullName: event.target.value,
                  }))
                }
                className="mt-2 w-full border border-gray-300 px-4 py-3 outline-none focus:border-purple-700 focus:ring-2 focus:ring-purple-100"
              />
            </div>
            <div>
              <label htmlFor="campus" className="block text-sm font-semibold">
                Home campus
              </label>
              <input
                id="campus"
                value={profile.campus}
                onChange={(event) =>
                  setProfile((current) => ({
                    ...current,
                    campus: event.target.value,
                  }))
                }
                className="mt-2 w-full border border-gray-300 px-4 py-3 outline-none focus:border-purple-700 focus:ring-2 focus:ring-purple-100"
              />
            </div>
            <div>
              <label htmlFor="bio" className="block text-sm font-semibold">
                Short bio
              </label>
              <textarea
                id="bio"
                rows={4}
                value={profile.bio}
                onChange={(event) =>
                  setProfile((current) => ({
                    ...current,
                    bio: event.target.value,
                  }))
                }
                className="mt-2 w-full border border-gray-300 px-4 py-3 outline-none focus:border-purple-700 focus:ring-2 focus:ring-purple-100"
              />
            </div>
            <div>
              <label htmlFor="skills" className="block text-sm font-semibold">
                Skills
              </label>
              <input
                id="skills"
                value={skillText}
                onChange={(event) =>
                  setProfile((current) => ({
                    ...current,
                    skills: event.target.value
                      .split(",")
                      .map((item) => item.trim())
                      .filter(Boolean),
                  }))
                }
                className="mt-2 w-full border border-gray-300 px-4 py-3 outline-none focus:border-purple-700 focus:ring-2 focus:ring-purple-100"
              />
              <p className="mt-2 text-sm text-gray-500">Separate skills with commas.</p>
            </div>
            <div>
              <label htmlFor="availability" className="block text-sm font-semibold">
                Availability
              </label>
              <textarea
                id="availability"
                rows={3}
                value={profile.availability}
                onChange={(event) =>
                  setProfile((current) => ({
                    ...current,
                    availability: event.target.value,
                  }))
                }
                className="mt-2 w-full border border-gray-300 px-4 py-3 outline-none focus:border-purple-700 focus:ring-2 focus:ring-purple-100"
              />
            </div>
            <div>
              <label htmlFor="emergency" className="block text-sm font-semibold">
                Emergency contact
              </label>
              <input
                id="emergency"
                value={profile.emergencyContact}
                onChange={(event) =>
                  setProfile((current) => ({
                    ...current,
                    emergencyContact: event.target.value,
                  }))
                }
                className="mt-2 w-full border border-gray-300 px-4 py-3 outline-none focus:border-purple-700 focus:ring-2 focus:ring-purple-100"
              />
            </div>
            <div>
              <label htmlFor="access" className="block text-sm font-semibold">
                Access needs
              </label>
              <textarea
                id="access"
                rows={3}
                value={profile.accessibility}
                onChange={(event) =>
                  setProfile((current) => ({
                    ...current,
                    accessibility: event.target.value,
                  }))
                }
                className="mt-2 w-full border border-gray-300 px-4 py-3 outline-none focus:border-purple-700 focus:ring-2 focus:ring-purple-100"
              />
            </div>
            <button
              type="submit"
              className="bg-black px-6 py-3 font-semibold text-white transition hover:bg-purple-700"
            >
              Save profile
            </button>
            {saved ? (
              <p className="text-sm font-medium text-green-700">
                Profile details saved on this device.
              </p>
            ) : null}
          </form>
        </div>

        <aside className="space-y-8">
          <div className="border border-gray-200 bg-[#f7f7f7] p-6">
            <h2 className="text-xl font-semibold">Invite a friend</h2>
            <p className="mt-3 leading-7 text-gray-700">
              Share your referral code. When they complete their first event,
              you both gain standing — you earn 40 points, and clubs can see
              that you help grow the volunteer community.
            </p>
            <div className="mt-5 flex items-center justify-between gap-3 border border-gray-200 bg-white px-4 py-3">
              <span className="font-semibold tracking-wide">{referralCode}</span>
              <button
                type="button"
                onClick={copyReferral}
                className="text-sm font-semibold text-purple-700 hover:underline"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <ul className="mt-5 space-y-3 text-sm">
              {profile.referrals.map((referral) => (
                <li key={referral.name} className="flex justify-between gap-3">
                  <span>{referral.name}</span>
                  <span className="text-gray-500">
                    {referral.status}
                    {referral.pointsAwarded ? ` · +${referral.pointsAwarded}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="border border-gray-200 p-6">
            <h2 className="text-xl font-semibold">How points work</h2>
            <ul className="mt-5 space-y-4">
              {pointRules.map((rule) => (
                <li key={rule.action}>
                  <p className="font-semibold">
                    +{rule.points} · {rule.action}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-gray-600">
                    {rule.detail}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="border border-gray-200 p-6">
            <h2 className="text-xl font-semibold">Levels</h2>
            <ol className="mt-5 space-y-3">
              {volunteerLevels.map((level) => (
                <li
                  key={level.level}
                  className={
                    level.level === progress.current.level
                      ? "font-semibold text-purple-700"
                      : "text-gray-600"
                  }
                >
                  Level {level.level} · {level.name} · {level.minPoints}+ pts
                </li>
              ))}
            </ol>
          </div>

          <div className="border border-gray-200 p-6">
            <h2 className="text-xl font-semibold">Recent points</h2>
            <ul className="mt-5 space-y-3 text-sm">
              {profile.pointHistory.map((item) => (
                <li key={item.id} className="flex justify-between gap-3">
                  <span>
                    {item.label}
                    <span className="mt-1 block text-gray-500">{item.date}</span>
                  </span>
                  <span className="font-semibold">+{item.points}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </section>
    </div>
  );
}
