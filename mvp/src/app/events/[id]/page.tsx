import EventDetailsView from "@/components/events/EventDetailsView";

type EventDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EventDetailsPage({
  params,
}: EventDetailsPageProps) {
  const { id } = await params;
  return <EventDetailsView eventId={id} />;
}
