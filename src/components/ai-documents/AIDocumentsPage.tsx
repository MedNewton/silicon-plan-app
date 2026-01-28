// src/components/ai-documents/AIDocumentsPage.tsx
"use client";

import { useEffect, useState } from "react";
import { Box } from "@mui/material";
import { useSearchParams } from "next/navigation";

import type { Workspace } from "@/types/workspaces";

import AIDocumentsSideBar, {
  type NavKey,
} from "@/components/ai-documents/AIDocumentsSidebar";
import AIDocumentsTopTabs, {
  type ActiveTab,
} from "@/components/ai-documents/AIDocumentsTopTabs";
import AIDocumentCreateTabContent from "@/components/ai-documents/AIDocumentsCreateTabContent";
import AIDocumentMyWorkspacesTabContent from "@/components/ai-documents/AIDocumentsMyWorkspacesTabContent";
import LearningCenterContent from "@/components/learning/LearningCenterContent";

type ListWorkspacesResponse = {
  workspaces: Workspace[];
};

export default function AIDocumentsPage() {
  const searchParams = useSearchParams();

  const initialTab: ActiveTab =
    searchParams.get("tab") === "my-workspaces" ? "myWorkspaces" : "create";

  const initialNav: NavKey =
    searchParams.get("nav") === "learning" ? "learning" : "ai-documents";

  const [activeTab, setActiveTab] = useState<ActiveTab>(initialTab);
  const [activeNav, setActiveNav] = useState<NavKey>(initialNav);

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(false);

  useEffect(() => {
    const loadWorkspaces = async () => {
      try {
        setLoadingWorkspaces(true);
        const res = await fetch("/api/workspaces");
        if (!res.ok) {
          throw new Error("Failed to load workspaces");
        }
        const data = (await res.json()) as ListWorkspacesResponse;
        setWorkspaces(data.workspaces ?? []);
      } catch (error) {
        console.error("Failed to load workspaces", error);
      } finally {
        setLoadingWorkspaces(false);
      }
    };

    void loadWorkspaces();
  }, []);

  const renderMainContent = () => {
    if (activeNav === "learning") {
      return <LearningCenterContent />;
    }

    return (
      <>
        <AIDocumentsTopTabs
          activeTab={activeTab}
          workspaceCount={workspaces.length}
          onTabChange={setActiveTab}
        />

        {activeTab === "create" ? (
          <AIDocumentCreateTabContent />
        ) : (
          <AIDocumentMyWorkspacesTabContent
            workspaces={workspaces}
            loading={loadingWorkspaces}
          />
        )}
      </>
    );
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        bgcolor: "#F7F8FC",
      }}
    >
      <AIDocumentsSideBar activeNav={activeNav} onNavChange={setActiveNav} />

      <Box
        component="main"
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          bgcolor: "#FFFFFF",
        }}
      >
        {renderMainContent()}
      </Box>
    </Box>
  );
}
