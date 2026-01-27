import CanvasModelEditPage from "@/components/workspaceManage/canvasModels/CanvasModelEditPage";

type PageProps = {
  params: Promise<{
    workspaceId: string;
    canvasId: string;
  }>;
};

export default async function Page({ params }: PageProps) {
  const { workspaceId, canvasId } = await params;
  return <CanvasModelEditPage workspaceId={workspaceId} canvasId={canvasId} />;
}
