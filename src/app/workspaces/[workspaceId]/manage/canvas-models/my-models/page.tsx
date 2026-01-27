import MyCanvasModelsPage from "@/components/workspaceManage/canvasModels/MyCanvasModelsPage";

type PageProps = {
  params: Promise<{
    workspaceId: string;
  }>;
};

export default async function Page({ params }: PageProps) {
  const { workspaceId } = await params;
  return <MyCanvasModelsPage workspaceId={workspaceId} />;
}
