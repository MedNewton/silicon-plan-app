import CanvasModelsPage from "@/components/workspaceManage/canvasModels/CanvasModelsPage";

type PageProps = {
  params: Promise<{ workspaceId: string }>;
};

export default async function CanvasModelsRoute({ params }: PageProps) {
  const { workspaceId } = await params;

  // workspaceId is not used yet, but we pass it for future API wiring
  return <CanvasModelsPage workspaceId={workspaceId} />;
}
