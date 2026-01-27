// src/components/workspaceManage/pitch-deck/PitchDeckEditorPage.tsx
"use client";

import type { FC } from "react";
import { Box } from "@mui/material";
import ManageSidebar from "@/components/workspaceManage/business-plan/ManageSidebar";
import { PitchDeckProvider } from "./PitchDeckContext";
import PitchDeckEditor from "./PitchDeckEditor";

export type PitchDeckEditorPageProps = Readonly<{
  workspaceId: string;
  deckId: string;
}>;

const PitchDeckEditorPage: FC<PitchDeckEditorPageProps> = ({ workspaceId, deckId }) => {
  return (
    <PitchDeckProvider workspaceId={workspaceId} deckId={deckId}>
      <Box
        sx={{
          minHeight: "100vh",
          height: "100vh",
          maxHeight: "100vh",
          display: "flex",
          bgcolor: "#F3F4FB",
        }}
      >
        <ManageSidebar workspaceId={workspaceId} activeItem="pitch-deck" />
        <PitchDeckEditor workspaceId={workspaceId} />
      </Box>
    </PitchDeckProvider>
  );
};

export default PitchDeckEditorPage;
