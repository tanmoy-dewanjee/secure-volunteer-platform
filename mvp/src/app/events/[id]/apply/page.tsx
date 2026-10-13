import EventApplyView from "@/components/events/EventApplyView";

type ApplyPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ApplyPage({ params }: ApplyPageProps) {
  const { id } = await params;
  return <EventApplyView eventId={id} />;
}
