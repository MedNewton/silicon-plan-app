// src/app/workspaces/[workspaceId]/manage/business-plan/page.tsx

import ManageBusinessPlanPage from "@/components/workspaceManage/business-plan/ManageBusinessPlanPage";

type PageProps = {
  params: Promise<{ workspaceId: string }>;
};

export default async function BusinessPlanManageRoute({ params }: PageProps) {
  const { workspaceId } = await params;

  return <ManageBusinessPlanPage workspaceId={workspaceId} />;
}
