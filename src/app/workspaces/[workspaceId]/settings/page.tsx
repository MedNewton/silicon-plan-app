// src/app/workspaces/[workspaceId]/settings/page.tsx
"use client";

import { Box, useTheme } from "@mui/material";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";

import type { Workspace } from "@/types/workspaces";

import GeneralTabContent from "@/components/workspaceSettings/GeneralTabContent";
import BusinessActivitiesTabContent from "@/components/workspaceSettings/BusinessActivitiesTabContent";
import MembersTabContent from "@/components/workspaceSettings/MembersTabContent";
import AILibraryTabContent from "@/components/workspaceSettings/AILibraryTabContent";

import SettingsSidebar, {
  type NavKey,
} from "@/components/workspaceSettings/SettingsSidebar";
import SettingsTopTabs, {
  type TopTab,
} from "@/components/workspaceSettings/SettingsTopTabs";
import SettingsSecondarySidebar, {
  type SettingsTab,
} from "@/components/workspaceSettings/SettingsSecondarySidebar";

type GetWorkspaceResponse = {
  workspace: Workspace;
};

type ListWorkspacesResponse = {
  workspaces: Workspace[];
};

export default function WorkspaceSettingsPage() {
  const theme = useTheme();
  const router = useRouter();
  const params = useParams();

  const workspaceId =
    typeof params.workspaceId === "string"
      ? params.workspaceId
      : Array.isArray(params.workspaceId)
        ? params.workspaceId[0]
        : "";

  const [activeNav, setActiveNav] = useState<NavKey>("ai-documents");
  const [topTab, setTopTab] = useState<TopTab>("myWorkspaces");
  const [settingsTab, setSettingsTab] = useState<SettingsTab>("general");

  const [workspaceCount, setWorkspaceCount] = useState<number>(0);
  const [workspaceName, setWorkspaceName] = useState<string>("");

  // -------- Load workspace count --------
  useEffect(() => {
    const loadCount = async () => {
      try {
        const listRes = await fetch("/api/workspaces");
        if (!listRes.ok) return;

        const json = (await listRes.json()) as ListWorkspacesResponse;
        setWorkspaceCount(json.workspaces.length);
      } catch (error) {
        console.error("Failed to load workspace count", error);
      }
    };

    void loadCount();
  }, []);

  // -------- Load current workspace name for sidebar --------
  useEffect(() => {
    if (!workspaceId) return;

    let cancelled = false;

    const loadWorkspaceName = async () => {
      try {
        const res = await fetch(`/api/workspaces/${workspaceId}`);
        if (!res.ok) return;

        const json = (await res.json()) as GetWorkspaceResponse;
        if (cancelled) return;

        setWorkspaceName(json.workspace.name ?? "");
      } catch (error) {
        console.error("Failed to load workspace name", error);
      }
    };

    void loadWorkspaceName();

    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

  // -------- Handlers --------

  const handleTopTabChange = (next: TopTab) => {
    setTopTab(next);
    if (next === "create") {
      router.push("/?tab=create");
    } else {
      router.push("/?tab=my-workspaces");
    }
  };

  const handleNavChange = (next: NavKey) => {
    setActiveNav(next);
    // optional: route to other sections later based on nav key
  };

  const handleSettingsTabChange = (next: SettingsTab) => {
    setSettingsTab(next);
  };

  // -------- Secondary content (tab body) --------

  const renderSecondaryContent = () => {
    if (!workspaceId) {
      return (
        <Box
          sx={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: theme.palette.text.secondary,
          }}
        >
          Invalid workspace.
        </Box>
      );
    }

    if (settingsTab === "general") {
      return <GeneralTabContent workspaceId={workspaceId} />;
    }

    if (settingsTab === "business") {
      return <BusinessActivitiesTabContent workspaceId={workspaceId} />;
    }

    if (settingsTab === "members") {
      return <MembersTabContent workspaceId={workspaceId} />;
    }

    if (settingsTab === "library") {
      return <AILibraryTabContent workspaceName={workspaceName} />;
    }

    return null;
  };

  // -------- Layout --------

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        bgcolor: "#F7F8FC",
      }}
    >
      <SettingsSidebar activeNav={activeNav} onNavChange={handleNavChange} />

      <Box
        component="main"
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          bgcolor: "#FFFFFF",
        }}
      >
        <SettingsTopTabs
          workspaceCount={workspaceCount}
          topTab={topTab}
          onTabChange={handleTopTabChange}
        />

        <Box
          sx={{
            flex: 1,
            display: "flex",
            px: 6,
            pb: 5,
            bgcolor: "#FFFFFF",
          }}
        >
          <SettingsSecondarySidebar
            workspaceName={workspaceName}
            settingsTab={settingsTab}
            onTabChange={handleSettingsTabChange}
          />
          {renderSecondaryContent()}
        </Box>
      </Box>
    </Box>
  );
}
