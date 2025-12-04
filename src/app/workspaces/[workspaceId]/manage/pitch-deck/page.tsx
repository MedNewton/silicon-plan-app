import PitchDeckPage from "@/components/workspaceManage/pitch-deck/PitchDeckPage";

type PageProps = {
  params: Promise<{ workspaceId: string }>;
};

export default async function PitchDeckRoute({ params }: PageProps) {
  const { workspaceId } = await params;

  // Not used yet, but kept for future API wiring
  return <PitchDeckPage workspaceId={workspaceId} />;
}
