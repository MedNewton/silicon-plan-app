// src/components/workspaceManage/business-plan/ManageBusinessPlanPage.tsx
"use client";

import { useState } from "react";
import { Box } from "@mui/material";
import ManageSidebar from "@/components/workspaceManage/business-plan/ManageSidebar";
import ManageTopTabs, {
  type ManageTopTab,
} from "@/components/workspaceManage/business-plan/ManageTopTabs";
import ManageBusinessPlanContentArea from "@/components/workspaceManage/business-plan/ManageBusinessPlanContentArea";
import ManageActionArea from "@/components/workspaceManage/business-plan/ManageActionArea";
import type { ManageAiTab } from "@/components/workspaceManage/business-plan/ManageAiTabs";

type Props = {
  workspaceId: string;
};

export default function ManageBusinessPlanPage({ workspaceId }: Props) {
  const [activeTopTab, setActiveTopTab] = useState<ManageTopTab>("plan");
  const [activeAiTab, setActiveAiTab] = useState<ManageAiTab>("aiChat");

  return (
    <Box
      sx={{
        height: "100vh",          // hard cap at viewport
        display: "flex",
        bgcolor: "#F7F8FC",
        overflow: "hidden",       // no page scroll, only inner areas scroll
      }}
    >
      <ManageSidebar activeItem="business-plan" />

      <Box
        component="main"
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          bgcolor: "#FFFFFF",
          height: "100%",        // match parent height
          overflow: "hidden",    // children manage their own scroll
        }}
      >
        <ManageTopTabs
          activeTab={activeTopTab}
          onTabChange={setActiveTopTab}
        />

        {/* Central area: AI column + preview + right action area */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            minHeight: 0,         // critical so inner flex children can scroll
            overflow: "hidden",
          }}
        >
          <ManageBusinessPlanContentArea
            activeTopTab={activeTopTab}
            activeAiTab={activeAiTab}
            onAiTabChange={setActiveAiTab}
          />

          <ManageActionArea activeTopTab={activeTopTab} />
        </Box>
      </Box>
    </Box>
  );
}
