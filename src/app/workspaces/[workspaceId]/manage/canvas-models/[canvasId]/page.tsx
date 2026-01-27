import CanvasModelViewPage from "@/components/workspaceManage/canvasModels/CanvasModelViewPage";

type PageProps = {
  params: Promise<{
    workspaceId: string;
    canvasId: string;
  }>;
};

export default async function Page({ params }: PageProps) {
  const { workspaceId, canvasId } = await params;
  return <CanvasModelViewPage workspaceId={workspaceId} canvasId={canvasId} />;
}
