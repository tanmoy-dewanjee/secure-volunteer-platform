"use client";

import { use } from "react";

import EventForm from "@/components/admin/EventForm";

export default function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return <EventForm mode="edit" eventId={id} />;
}
