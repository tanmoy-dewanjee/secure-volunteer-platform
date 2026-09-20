"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";

import {
  getApplicationFields,
  type ApplicationField,
} from "@/data/application-fields";
import { getEventHost, type Event } from "@/data/events";
import { useSession } from "@/hooks/useSession";
import { addApplication } from "@/lib/applications";

type ApplicationFormProps = {
  event: Event;
};

const inputClass =
  "mt-2 w-full border border-gray-300 bg-white px-4 py-3 outline-none focus:border-purple-700 focus:ring-2 focus:ring-purple-100";

function ExtraField({ field }: { field: ApplicationField }) {
  const name = `extra:${field.id}`;

  if (field.type === "checkbox") {
    return (
      <div>
        <label className="flex items-start gap-3 text-sm leading-6 text-gray-700">
          <input
            type="checkbox"
            name={name}
            value="yes"
            required={field.required}
            className="mt-1 h-4 w-4"
          />
          <span>
            {field.label}
            {field.required ? " *" : ""}
            {field.help ? (
              <span className="mt-1 block text-gray-500">{field.help}</span>
            ) : null}
          </span>
        </label>
      </div>
    );
  }

  return (
    <div>
      <label htmlFor={name} className="block text-sm font-semibold text-gray-800">
        {field.label}
        {field.required ? " *" : ""}
      </label>
      {field.help ? (
        <p className="mt-1 text-sm text-gray-500">{field.help}</p>
      ) : null}

      {field.type === "select" ? (
        <select
          id={name}
          name={name}
          required={field.required}
          defaultValue=""
          className={inputClass}
        >
          <option value="" disabled>
            Select an option
          </option>
          {field.options?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : null}

      {field.type === "text" ? (
        <input
          id={name}
          name={name}
          type="text"
          required={field.required}
          placeholder={field.placeholder}
          className={inputClass}
        />
      ) : null}

      {field.type === "textarea" ? (
        <textarea
          id={name}
          name={name}
          required={field.required}
          rows={4}
          placeholder={field.placeholder}
          className={`${inputClass} resize-y`}
        />
      ) : null}
    </div>
  );
}

export default function ApplicationForm({ event }: ApplicationFormProps) {
  const { session } = useSession();
  const host = getEventHost(event);
  const extraFields = useMemo(() => getApplicationFields(event), [event]);
  const [roleId, setRoleId] = useState("");
  const [shiftIds, setShiftIds] = useState<string[]>([]);
  const [preferredShiftId, setPreferredShiftId] = useState("");
  const [shiftError, setShiftError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [alreadyApplied, setAlreadyApplied] = useState(false);

  const selectedRole = event.roles.find((role) => role.id === roleId);
  const openShifts = event.shifts.filter((shift) => shift.placesAvailable > 0);

  const toggleShift = (id: string) => {
    setShiftError("");
    setShiftIds((current) => {
      const next = current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id];

      if (!next.includes(preferredShiftId)) {
        setPreferredShiftId(next[0] ?? "");
      }
      return next;
    });
  };

  const handleSubmit = (formEvent: FormEvent<HTMLFormElement>) => {
    formEvent.preventDefault();
    if (!session) return;

    if (shiftIds.length === 0) {
      setShiftError("Select at least one shift you can work.");
      return;
    }

    const form = new FormData(formEvent.currentTarget);
    const extraAnswers: Record<string, string> = {};

    for (const field of extraFields) {
      const value = form.get(`extra:${field.id}`);
      extraAnswers[field.label] =
        field.type === "checkbox"
          ? value
            ? "Yes"
            : "No"
          : String(value || "");
    }

    const orderedShiftIds = preferredShiftId
      ? [preferredShiftId, ...shiftIds.filter((id) => id !== preferredShiftId)]
      : shiftIds;

    const shiftLabels = orderedShiftIds.map((id) => {
      const shift = event.shifts.find((item) => item.id === id);
      return shift
        ? `${shift.label} (${shift.startTime} – ${shift.endTime})`
        : id;
    });

    const result = addApplication(session.username, {
      eventId: event.id,
      eventTitle: event.title,
      role: selectedRole?.title || "Volunteer",
      campus: event.campus,
      eventDate: event.date,
      availability: shiftLabels.join("; "),
      preferredShifts: shiftLabels,
      extraAnswers,
      motivation: String(form.get("motivation") || ""),
    });

    setAlreadyApplied(!result.created);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div role="status" className="border border-green-200 bg-green-50 p-8">
        <p className="text-sm font-bold uppercase tracking-wide text-green-800">
          Application submitted
        </p>
        <h2 className="mt-3 text-3xl font-semibold">Thank you for applying</h2>
        <p className="mt-4 leading-7 text-gray-700">
          {alreadyApplied ? (
            <>
              You already have an open application for{" "}
              <strong>{event.title}</strong>.
            </>
          ) : (
            <>
              Your application for <strong>{event.title}</strong> is in My
              Applications, including your preferred shifts
              {extraFields.length > 0 ? " and the extra details this club asked for" : ""}.
            </>
          )}
        </p>
        <Link
          href="/my-applications"
          className="mt-7 inline-block bg-black px-6 py-3 font-semibold text-white hover:bg-purple-700"
        >
          View my applications
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      <div className="border-l-4 border-purple-700 bg-purple-50 p-4">
        <p className="font-semibold text-purple-900">
          Hosted by {host?.name ?? "this student club"}
        </p>
        <p className="mt-1 text-sm leading-6 text-gray-700">
          The base questions are the same for every event. Extra questions
          below change with this club and this event. Do not enter real
          sensitive information in this prototype.
        </p>
      </div>

      <fieldset className="space-y-5">
        <legend className="text-xl font-semibold">Your details</legend>
        <div>
          <label htmlFor="fullName" className="block text-sm font-semibold">
            Full name *
          </label>
          <input
            id="fullName"
            name="fullName"
            required
            maxLength={80}
            defaultValue={session?.name || ""}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-semibold">
            University email *
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            defaultValue={session ? `${session.username}@adelaide.edu.au` : ""}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-semibold">
            Mobile number
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            maxLength={20}
            placeholder="Optional — for shift-day contact"
            className={inputClass}
          />
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-xl font-semibold">Volunteer role *</legend>
        <p className="mt-2 text-sm text-gray-600">
          Choose the role you want the club to consider first.
        </p>
        <div className="mt-4 space-y-3">
          {event.roles.map((role) => {
            const selected = roleId === role.id;
            const full = role.placesAvailable <= 0;
            return (
              <label
                key={role.id}
                className={`block cursor-pointer border p-5 ${
                  selected
                    ? "border-purple-700 bg-purple-50"
                    : "border-gray-200 hover:border-purple-300"
                } ${full ? "cursor-not-allowed opacity-50" : ""}`}
              >
                <input
                  type="radio"
                  name="role"
                  value={role.id}
                  required
                  disabled={full}
                  checked={selected}
                  onChange={() => setRoleId(role.id)}
                  className="sr-only"
                />
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold">{role.title}</p>
                    <p className="mt-2 text-sm leading-6 text-gray-600">
                      {role.description}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-purple-700">
                    {full ? "Full" : `${role.placesAvailable} places`}
                  </span>
                </div>
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-xl font-semibold">Shifts *</legend>
        <p className="mt-2 text-sm text-gray-600">
          Select every shift you can work. If you choose more than one, mark
          your first preference so the club can allocate fairly.
        </p>
        {openShifts.length === 0 ? (
          <p className="mt-4 text-sm text-gray-600">
            No shifts currently have places remaining.
          </p>
        ) : (
          <div className="mt-4 grid gap-3">
            {event.shifts.map((shift) => {
              const selected = shiftIds.includes(shift.id);
              const full = shift.placesAvailable <= 0;
              return (
                <div
                  key={shift.id}
                  className={`border p-5 ${
                    selected
                      ? "border-purple-700 bg-purple-50"
                      : "border-gray-200"
                  } ${full ? "opacity-50" : ""}`}
                >
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selected}
                      disabled={full}
                      onChange={() => toggleShift(shift.id)}
                      className="mt-1 h-4 w-4"
                    />
                    <span className="flex-1">
                      <span className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-semibold">{shift.label}</span>
                        <span className="text-sm text-purple-700">
                          {full ? "Full" : `${shift.placesAvailable} places`}
                        </span>
                      </span>
                      <span className="mt-1 block text-sm text-gray-600">
                        {shift.startTime} – {shift.endTime}
                      </span>
                    </span>
                  </label>
                  {selected && shiftIds.length > 1 ? (
                    <label className="mt-3 ml-7 flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="preferredShift"
                        checked={preferredShiftId === shift.id}
                        onChange={() => setPreferredShiftId(shift.id)}
                      />
                      First preference
                    </label>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
        {shiftError ? (
          <p role="alert" className="mt-3 text-sm font-medium text-red-600">
            {shiftError}
          </p>
        ) : null}
      </fieldset>

      <fieldset>
        <legend className="text-xl font-semibold">Why this event</legend>
        <label htmlFor="motivation" className="mt-3 block text-sm font-semibold">
          Why would you like to volunteer?
        </label>
        <textarea
          id="motivation"
          name="motivation"
          rows={5}
          maxLength={600}
          placeholder="Optional — clubs read this when roles are competitive."
          className={`${inputClass} resize-y`}
        />
      </fieldset>

      {event.requirements.length > 0 ? (
        <fieldset>
          <legend className="text-xl font-semibold">Event requirements *</legend>
          <p className="mt-2 text-sm text-gray-600">
            Confirm each requirement this event has listed.
          </p>
          <div className="mt-4 space-y-4">
            {event.requirements.map((requirement) => (
              <label
                key={requirement}
                className="flex items-start gap-3 text-sm leading-6 text-gray-700"
              >
                <input
                  type="checkbox"
                  name={`requirement:${requirement}`}
                  required
                  className="mt-1 h-4 w-4"
                />
                <span>{requirement}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      {extraFields.length > 0 ? (
        <fieldset className="space-y-5">
          <legend className="text-xl font-semibold">
            Extra questions from this club
          </legend>
          <p className="text-sm text-gray-600">
            These fields are specific to this event. Other clubs will see a
            different set.
          </p>
          {extraFields.map((field) => (
            <ExtraField key={field.id} field={field} />
          ))}
        </fieldset>
      ) : null}

      <div className="flex items-start gap-3">
        <input
          id="confirmation"
          name="confirmation"
          type="checkbox"
          required
          className="mt-1 h-4 w-4"
        />
        <label htmlFor="confirmation" className="text-sm leading-6 text-gray-700">
          I confirm the information is correct and I understand this is an
          educational demonstration. *
        </label>
      </div>

      <button
        type="submit"
        className="w-full bg-black px-6 py-4 font-semibold text-white transition hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-700 focus:ring-offset-2"
      >
        Submit application
      </button>
      <p className="text-sm text-gray-500">* Required fields</p>
    </form>
  );
}
