import PitchDeckEditorPage from "@/components/workspaceManage/pitch-deck/PitchDeckEditorPage";

type PageProps = {
  params: Promise<{ workspaceId: string; deckId: string }>;
};

export default async function PitchDeckEditorRoute({ params }: PageProps) {
  const { workspaceId, deckId } = await params;

  return <PitchDeckEditorPage workspaceId={workspaceId} deckId={deckId} />;
}
