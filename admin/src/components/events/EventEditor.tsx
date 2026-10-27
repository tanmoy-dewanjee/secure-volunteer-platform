"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import LocationPicker from "@/components/maps/LocationPicker";
import { useToast } from "@/components/ui/Toast";
import {
  campusCoordinates,
  campusOptions,
  categoryOptions,
  statusOptions,
  type Event,
  type VolunteerRole,
  type VolunteerShift,
} from "@/data/events";
import type { ApplicationField } from "@/data/application-fields";
import { studentClubs } from "@/data/organisations";
import { persistAdminEvent } from "@/lib/store/events";
import { appendAudit } from "@/lib/store/ops";

const steps = [
  "Details",
  "When & where",
  "Roles & questions",
  "Shifts",
  "Review",
];

export default function EventEditor({
  initial,
  actor = "rotaract.admin",
}: {
  initial: Event;
  actor?: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState(initial);
  const [dirty, setDirty] = useState(false);
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    const onLeave = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [dirty]);

  const patch = (partial: Partial<Event>) => {
    setDirty(true);
    setDraft((current) => ({ ...current, ...partial }));
  };

  const setDraftAndDirty = (updater: (current: Event) => Event) => {
    setDirty(true);
    setDraft(updater);
  };

  const save = async (status?: Event["status"]) => {
    const next = {
      ...draft,
      status: status ?? draft.status,
      posterImage: draft.posterImage || draft.bannerImage,
      placesAvailable: draft.roles.reduce((sum, role) => sum + role.placesAvailable, 0),
      capacity: Math.max(
        draft.capacity,
        draft.roles.reduce((sum, role) => sum + role.placesAvailable, 0)
      ),
    };
    await persistAdminEvent(next);
    appendAudit({
      at: new Date().toLocaleString("en-AU"),
      who: actor,
      action: status === "Open" ? "event.publish" : "event.update",
      target: next.title || next.id,
      ip: "127.0.0.1",
    });
    setDirty(false);
    toast(status === "Open" ? "Event published." : "Draft saved.");
    router.push(`/events/${next.id}`);
  };

  const addRole = () => {
    const role: VolunteerRole = {
      id: `role-${Date.now()}`,
      title: "",
      description: "",
      placesAvailable: 4,
    };
    patch({ roles: [...draft.roles, role] });
  };

  const addShift = () => {
    const shift: VolunteerShift = {
      id: `shift-${Date.now()}`,
      label: "",
      startTime: draft.startTime,
      endTime: draft.endTime,
      placesAvailable: 4,
    };
    patch({ shifts: [...draft.shifts, shift] });
  };

  const addQuestion = () => {
    const field: ApplicationField = {
      id: `q-${Date.now()}`,
      label: "",
      type: "text",
      required: false,
    };
    patch({ customFields: [...(draft.customFields ?? []), field] });
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (step < steps.length - 1) {
      setStep(step + 1);
      return;
    }
    void save(draft.status);
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-4xl px-4 py-8 lg:px-8">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-purple-700">
        Event editor
      </p>
      <h1 className="mt-2 text-2xl font-semibold">
        {initial.title ? `Edit ${initial.title}` : "Create event"}
      </h1>

      <ol className="mt-6 flex flex-wrap gap-2">
        {steps.map((label, index) => (
          <li key={label}>
            <button
              type="button"
              onClick={() => setStep(index)}
              className={`rounded-full px-3 py-1 text-sm ${
                index === step
                  ? "bg-purple-700 text-white"
                  : index < step
                    ? "bg-purple-50 text-purple-900"
                    : "bg-gray-100 text-gray-600"
              }`}
            >
              {index + 1}. {label}
            </button>
          </li>
        ))}
      </ol>

      <div className="mt-8 space-y-6 rounded-xl border border-gray-200 bg-white p-6">
        {step === 0 ? (
          <>
            <Field label="Title *">
              <input
                required
                value={draft.title}
                onChange={(event) => patch({ title: event.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Tagline">
              <input
                value={draft.tagline}
                onChange={(event) => patch({ tagline: event.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Description *">
              <textarea
                required
                rows={5}
                value={draft.description}
                onChange={(event) => patch({ description: event.target.value })}
                className={inputClass}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Category">
                <select
                  value={draft.category}
                  onChange={(event) => patch({ category: event.target.value })}
                  className={inputClass}
                >
                  {categoryOptions.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </Field>
              <Field label="Host club">
                <select
                  value={draft.organisationId}
                  onChange={(event) => patch({ organisationId: event.target.value })}
                  className={inputClass}
                >
                  {studentClubs.map((club) => (
                    <option key={club.id} value={club.id}>
                      {club.shortName}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Tags">
              <div className="flex flex-wrap gap-2">
                {draft.tags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() =>
                      patch({ tags: draft.tags.filter((item) => item !== tag) })
                    }
                    className="rounded-full bg-purple-50 px-3 py-1 text-sm text-purple-900"
                  >
                    {tag} ×
                  </button>
                ))}
              </div>
              <div className="mt-2 flex gap-2">
                <input
                  value={tagInput}
                  onChange={(event) => setTagInput(event.target.value)}
                  placeholder="Add a tag"
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => {
                    const tag = tagInput.trim();
                    if (!tag || draft.tags.includes(tag)) return;
                    patch({ tags: [...draft.tags, tag] });
                    setTagInput("");
                  }}
                  className="border border-black px-4 font-semibold hover:bg-[#f3f1ed]"
                >
                  Add
                </button>
              </div>
            </Field>
            <Field label="Banner image URL">
              <input
                value={draft.bannerImage}
                onChange={(event) =>
                  patch({
                    bannerImage: event.target.value,
                    posterImage: event.target.value,
                  })
                }
                className={inputClass}
              />
            </Field>
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={Boolean(draft.askResume)}
                onChange={(event) => patch({ askResume: event.target.checked })}
                className="h-4 w-4 accent-[#7C00E8]"
              />
              Ask volunteers to attach a resume
            </label>
          </>
        ) : null}

        {step === 1 ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Date">
                <input
                  value={draft.date}
                  onChange={(event) => patch({ date: event.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="Application deadline">
                <input
                  value={draft.applicationDeadline}
                  onChange={(event) =>
                    patch({ applicationDeadline: event.target.value })
                  }
                  className={inputClass}
                />
              </Field>
              <Field label="Start">
                <input
                  value={draft.startTime}
                  onChange={(event) => patch({ startTime: event.target.value })}
                  className={inputClass}
                />
              </Field>
              <Field label="End">
                <input
                  value={draft.endTime}
                  onChange={(event) => patch({ endTime: event.target.value })}
                  className={inputClass}
                />
              </Field>
            </div>
            <Field label="Campus">
              <select
                value={draft.campus}
                onChange={(event) => {
                  const campus = event.target.value;
                  const coords = campusCoordinates[campus];
                  const hasCustomPin =
                    typeof draft.lat === "number" &&
                    typeof draft.lng === "number" &&
                    Boolean(draft.location);
                  patch(
                    hasCustomPin
                      ? { campus }
                      : { campus, lat: coords?.lat, lng: coords?.lng }
                  );
                }}
                className={inputClass}
              >
                {campusOptions.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </Field>
            <Field label="Find and pin the venue">
              <LocationPicker
                campus={draft.campus}
                value={
                  draft.location
                    ? {
                        address: draft.location,
                        lat: draft.lat,
                        lng: draft.lng,
                      }
                    : null
                }
                onChange={(value) =>
                  setDraftAndDirty((current) => ({
                    ...current,
                    location: value.address,
                    lat: value.lat,
                    lng: value.lng,
                  }))
                }
              />
            </Field>
            <Field label="Venue / meeting point">
              <input
                value={draft.location}
                onChange={(event) => patch({ location: event.target.value })}
                placeholder="Written meeting point shown to volunteers"
                className={inputClass}
              />
            </Field>
            <Field label="Contact email">
              <input
                type="email"
                value={draft.contactEmail}
                onChange={(event) => patch({ contactEmail: event.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Accessibility notes">
              <textarea
                rows={3}
                value={draft.accessibilityNotes}
                onChange={(event) =>
                  patch({ accessibilityNotes: event.target.value })
                }
                className={inputClass}
              />
            </Field>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Volunteer roles</h2>
              <button type="button" onClick={addRole} className="text-sm font-semibold text-[#7C00E8]">
                Add role
              </button>
            </div>
            {draft.roles.map((role, index) => (
              <div key={role.id} className="grid gap-3 border border-gray-200 p-4 sm:grid-cols-2">
                <input
                  placeholder="Role title"
                  value={role.title}
                  onChange={(event) => {
                    const roles = [...draft.roles];
                    roles[index] = { ...role, title: event.target.value };
                    patch({ roles });
                  }}
                  className={inputClass}
                />
                <input
                  type="number"
                  min={0}
                  value={role.placesAvailable}
                  onChange={(event) => {
                    const roles = [...draft.roles];
                    roles[index] = {
                      ...role,
                      placesAvailable: Number(event.target.value),
                    };
                    patch({ roles });
                  }}
                  className={inputClass}
                />
                <textarea
                  placeholder="What this role does"
                  value={role.description}
                  onChange={(event) => {
                    const roles = [...draft.roles];
                    roles[index] = { ...role, description: event.target.value };
                    patch({ roles });
                  }}
                  className={`${inputClass} sm:col-span-2`}
                />
              </div>
            ))}
            <Field label="Eligibility / requirements">
              <textarea
                rows={3}
                value={draft.requirements.join("\n")}
                onChange={(event) =>
                  patch({
                    requirements: event.target.value.split("\n").filter(Boolean),
                  })
                }
                className={inputClass}
              />
            </Field>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Custom application questions</h2>
              <button type="button" onClick={addQuestion} className="text-sm font-semibold text-[#7C00E8]">
                Add question
              </button>
            </div>
            {(draft.customFields ?? []).map((field, index) => (
              <div key={field.id} className="grid gap-3 border border-gray-200 p-4 sm:grid-cols-2">
                <input
                  placeholder="Question"
                  value={field.label}
                  onChange={(event) => {
                    const customFields = [...(draft.customFields ?? [])];
                    customFields[index] = { ...field, label: event.target.value };
                    patch({ customFields });
                  }}
                  className={inputClass}
                />
                <select
                  value={field.type}
                  onChange={(event) => {
                    const customFields = [...(draft.customFields ?? [])];
                    customFields[index] = {
                      ...field,
                      type: event.target.value as ApplicationField["type"],
                    };
                    patch({ customFields });
                  }}
                  className={inputClass}
                >
                  <option value="text">Short text</option>
                  <option value="textarea">Long text</option>
                  <option value="select">Select</option>
                  <option value="checkbox">Checkbox</option>
                </select>
              </div>
            ))}
          </>
        ) : null}

        {step === 3 ? (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Shifts</h2>
              <button type="button" onClick={addShift} className="text-sm font-semibold text-[#7C00E8]">
                Add shift
              </button>
            </div>
            {draft.shifts.map((shift, index) => (
              <div key={shift.id} className="grid gap-3 border border-gray-200 p-4 sm:grid-cols-4">
                <input
                  placeholder="Label"
                  value={shift.label}
                  onChange={(event) => {
                    const shifts = [...draft.shifts];
                    shifts[index] = { ...shift, label: event.target.value };
                    patch({ shifts });
                  }}
                  className={inputClass}
                />
                <input
                  value={shift.startTime}
                  onChange={(event) => {
                    const shifts = [...draft.shifts];
                    shifts[index] = { ...shift, startTime: event.target.value };
                    patch({ shifts });
                  }}
                  className={inputClass}
                />
                <input
                  value={shift.endTime}
                  onChange={(event) => {
                    const shifts = [...draft.shifts];
                    shifts[index] = { ...shift, endTime: event.target.value };
                    patch({ shifts });
                  }}
                  className={inputClass}
                />
                <input
                  type="number"
                  min={0}
                  value={shift.placesAvailable}
                  onChange={(event) => {
                    const shifts = [...draft.shifts];
                    shifts[index] = {
                      ...shift,
                      placesAvailable: Number(event.target.value),
                    };
                    patch({ shifts });
                  }}
                  className={inputClass}
                />
              </div>
            ))}
            <p className="text-sm text-gray-500">
              Recurring copies: duplicate this event after publishing if the same
              roster repeats weekly.
            </p>
          </>
        ) : null}

        {step === 4 ? (
          <>
            <Field label="Status">
              <select
                value={draft.status}
                onChange={(event) =>
                  patch({ status: event.target.value as Event["status"] })
                }
                className={inputClass}
              >
                {statusOptions.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </Field>
            <div className="border-l-4 border-[#7C00E8] bg-[#f4ecff] p-4 text-sm leading-6">
              <p className="font-semibold">{draft.title || "Untitled event"}</p>
              <p className="mt-1 text-gray-700">
                {draft.campus} · {draft.date} · {draft.roles.length} roles ·{" "}
                {draft.shifts.length} shifts · resume{" "}
                {draft.askResume ? "required" : "optional"} ·{" "}
                {(draft.customFields ?? []).length} extra questions
              </p>
            </div>
          </>
        ) : null}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {step > 0 ? (
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            className="border border-black px-5 py-3 font-semibold hover:bg-[#f3f1ed]"
          >
            Back
          </button>
        ) : null}
        <button
          type="submit"
          className="bg-black px-5 py-3 font-semibold text-white transition hover:bg-purple-700"
        >
          {step < steps.length - 1 ? "Next" : "Save event"}
        </button>
        <button
          type="button"
          onClick={() => void save("Open")}
          className="font-semibold text-[#7C00E8] hover:underline"
        >
          Save and publish
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block font-semibold">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

const inputClass =
  "w-full border border-gray-300 px-4 py-3 outline-none focus:border-[#7C00E8] focus:ring-2 focus:ring-purple-200";
