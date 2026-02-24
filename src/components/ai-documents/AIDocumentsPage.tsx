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
  const [missingLibraryIds, setMissingLibraryIds] = useState<string[]>([]);

  useEffect(() => {
    const loadWorkspaces = async () => {
      try {
        setLoadingWorkspaces(true);
        const [wsRes, libRes] = await Promise.all([
          fetch("/api/workspaces"),
          fetch("/api/workspaces/ai-library-status"),
        ]);
        if (!wsRes.ok) {
          throw new Error("Failed to load workspaces");
        }
        const wsData = (await wsRes.json()) as ListWorkspacesResponse;
        setWorkspaces(wsData.workspaces ?? []);

        if (libRes.ok) {
          const libData = (await libRes.json()) as { missingLibrary: string[] };
          setMissingLibraryIds(libData.missingLibrary ?? []);
        }
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
            missingLibraryIds={missingLibraryIds}
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
