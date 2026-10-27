"use client";

import { FormEvent, useState } from "react";

import AdminShell from "@/components/layout/AdminShell";
import { useToast } from "@/components/ui/Toast";
import { useAdminData } from "@/hooks/useAdminData";
import { getOps, setOps } from "@/lib/store/ops";

const templates = [
  {
    id: "reminder",
    name: "Shift reminder",
    subject: "Your shift is coming up",
    body: "This is a reminder of your volunteer shift. Please arrive 10 minutes early and bring your student ID.",
  },
  {
    id: "change",
    name: "Event change",
    subject: "Update to your volunteer event",
    body: "A detail of this event has changed. Please check the time, meeting point and role notes in the student portal.",
  },
  {
    id: "cancel",
    name: "Cancellation",
    subject: "Event cancelled — volunteer shift no longer required",
    body: "This event has been cancelled. You do not need to attend. Thank you for offering your time.",
  },
];

export default function CommunicationsPage() {
  return (
    <AdminShell>
      <Composer />
    </AdminShell>
  );
}

function Composer() {
  const toast = useToast();
  const { events, ops } = useAdminData();
  const [templateId, setTemplateId] = useState("");
  const [audience, setAudience] = useState("all");
  const [eventId, setEventId] = useState(events[0]?.id ?? "");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [when, setWhen] = useState("now");

  const applyTemplate = (id: string) => {
    setTemplateId(id);
    const template = templates.find((item) => item.id === id);
    if (!template) return;
    setSubject(template.subject);
    setBody(template.body);
  };

  const send = (event: FormEvent) => {
    event.preventDefault();
    const opsState = getOps();
    const live = ops.applications.length ? ops : opsState;
    setOps({
      ...live,
      announcements: [
        {
          id: `ann-${Date.now()}`,
          subject: subject || "Untitled",
          audience:
            audience === "event"
              ? events.find((item) => item.id === eventId)?.title || "Event"
              : audience === "all"
                ? "All volunteers"
                : "Selected people",
          at: new Date().toLocaleString("en-AU"),
          status: when === "now" ? "Sent" : "Scheduled",
        },
        ...opsState.announcements,
      ],
    });
    toast(when === "now" ? "Announcement sent." : "Announcement scheduled.");
    setSubject("");
    setBody("");
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 lg:px-8">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-purple-700">
        Outreach
      </p>
      <h1 className="mt-2 text-2xl font-semibold">Communications</h1>
      <form onSubmit={send} className="mt-8 space-y-6 rounded-xl border border-gray-200 bg-white p-6">
        <label className="block">
          <span className="font-semibold">Template</span>
          <select
            value={templateId}
            onChange={(event) => applyTemplate(event.target.value)}
            className="mt-2 w-full border border-gray-300 px-4 py-3"
          >
            <option value="">Choose a template</option>
            {templates.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="font-semibold">Audience</span>
          <select
            value={audience}
            onChange={(event) => setAudience(event.target.value)}
            className="mt-2 w-full border border-gray-300 px-4 py-3"
          >
            <option value="all">All volunteers</option>
            <option value="event">A specific event</option>
            <option value="selected">Selected people</option>
          </select>
        </label>
        {audience === "event" ? (
          <select
            value={eventId}
            onChange={(event) => setEventId(event.target.value)}
            className="w-full border border-gray-300 px-4 py-3"
          >
            {events.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        ) : null}
        <label className="block">
          <span className="font-semibold">Subject</span>
          <input
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            className="mt-2 w-full border border-gray-300 px-4 py-3 outline-none focus:border-[#7C00E8]"
          />
        </label>
        <label className="block">
          <span className="font-semibold">Message</span>
          <textarea
            rows={6}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            className="mt-2 w-full border border-gray-300 px-4 py-3 outline-none focus:border-[#7C00E8]"
          />
        </label>
        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={when === "later"}
            onChange={(event) => setWhen(event.target.checked ? "later" : "now")}
            className="accent-[#7C00E8]"
          />
          Schedule for later (demo queues it)
        </label>
        <button type="submit" className="bg-black px-6 py-3 font-semibold text-white hover:bg-purple-700">
          {when === "now" ? "Send" : "Schedule"}
        </button>
      </form>
      <section className="mt-8 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-xl font-semibold">Sent history</h2>
        <ul className="mt-4 space-y-3 text-sm">
          {ops.announcements.map((item) => (
            <li key={item.id}>
              <span className="font-semibold">{item.subject}</span>
              <span className="mt-1 block text-gray-500">
                {item.at} · {item.audience} · {item.status}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
