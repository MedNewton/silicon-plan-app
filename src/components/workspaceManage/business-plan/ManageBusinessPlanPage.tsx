// src/components/workspaceManage/business-plan/ManageBusinessPlanPage.tsx
"use client";

import { useState } from "react";
import { Alert, Box, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { toast } from "react-toastify";
import ManageSidebar from "@/components/workspaceManage/business-plan/ManageSidebar";
import ManageTopTabs, {
  type ManageTopTab,
} from "@/components/workspaceManage/business-plan/ManageTopTabs";
import ManageBusinessPlanContentArea from "@/components/workspaceManage/business-plan/ManageBusinessPlanContentArea";
import ManageActionArea from "@/components/workspaceManage/business-plan/ManageActionArea";
import type { ManageAiTab } from "@/components/workspaceManage/business-plan/ManageAiTabs";
import {
  BusinessPlanProvider,
  useBusinessPlan,
} from "@/components/workspaceManage/business-plan/BusinessPlanContext";
import ConfirmGenerateModal from "@/components/workspaceManage/business-plan/ConfirmGenerateModal";
import FinancialProjectionsPage from "@/components/valuation/FinancialProjectionsPage";
import { FinancialProjectionsProvider } from "@/components/valuation/FinancialProjectionsContext";
import { useLanguage } from "@/components/i18n/LanguageProvider";

type Props = {
  workspaceId: string;
};

export default function ManageBusinessPlanPage({ workspaceId }: Props) {
  const [activeTopTab, setActiveTopTab] = useState<ManageTopTab>("plan");
  const [activeAiTab, setActiveAiTab] = useState<ManageAiTab>("aiChat");

  return (
    <BusinessPlanProvider workspaceId={workspaceId}>
      <ManageBusinessPlanPageInner
        workspaceId={workspaceId}
        activeTopTab={activeTopTab}
        setActiveTopTab={setActiveTopTab}
        activeAiTab={activeAiTab}
        setActiveAiTab={setActiveAiTab}
      />
    </BusinessPlanProvider>
  );
}

function ManageBusinessPlanPageInner({
  workspaceId,
  activeTopTab,
  setActiveTopTab,
  activeAiTab,
  setActiveAiTab,
}: {
  workspaceId: string;
  activeTopTab: ManageTopTab;
  setActiveTopTab: (tab: ManageTopTab) => void;
  activeAiTab: ManageAiTab;
  setActiveAiTab: (tab: ManageAiTab) => void;
}) {
  const { chapters } = useBusinessPlan();
  const { locale } = useLanguage();
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSourcePriorityBanner, setShowSourcePriorityBanner] = useState(true);

  const copy =
    locale === "it"
      ? {
          noContext:
            "Nessuna base di conoscenza trovata. Aggiungi contesto nella Libreria AI delle impostazioni del workspace.",
          noContextLink: "Vai alla Libreria AI",
          generateSuccess: "Business plan generato con successo!",
          generateFailed: "Impossibile generare il business plan.",
          sourcePriority:
            "I dati del Setup Workspace hanno priorita sui documenti della Libreria AI. In caso di conflitto (es. team, dati finanziari), il setup viene utilizzato come fonte autorevole.",
        }
      : {
          noContext:
            "No knowledge base found. Add context in the AI Library in your workspace settings.",
          noContextLink: "Go to AI Library",
          generateSuccess: "Business plan generated successfully!",
          generateFailed: "Failed to generate business plan.",
          sourcePriority:
            "Workspace Setup data takes priority over AI Library documents. If there are conflicts (e.g. team info, financials), the setup is used as the authoritative source.",
        };

  const handleAutoGenerateClick = () => {
    setShowGenerateModal(true);
  };

  const handleGenerateConfirm = async () => {
    const force = chapters.length > 0;
    setIsGenerating(true);

    // 4-minute client timeout to prevent hanging forever
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 240_000);

    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/business-plan/generate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ force, locale }),
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error("Failed to generate business plan");
      }

      const data = (await response.json()) as {
        success?: boolean;
        skipped?: boolean;
        error?: string;
      };

      if (data.error === "no_context") {
        setIsGenerating(false);
        setShowGenerateModal(false);
        toast.error(
          <span>
            {copy.noContext}{" "}
            <a
              href={`/workspaces/${workspaceId}/settings?tab=library`}
              style={{ color: "#4C6AD2", textDecoration: "underline" }}
            >
              {copy.noContextLink}
            </a>
          </span>,
          { autoClose: 8000 }
        );
        return;
      }

      if (data.success) {
        window.location.reload();
        return;
      }

      setIsGenerating(false);
      setShowGenerateModal(false);
    } catch {
      clearTimeout(timeoutId);
      setIsGenerating(false);
      setShowGenerateModal(false);
      toast.error(copy.generateFailed);
    }
  };

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        bgcolor: "#F7F8FC",
        overflow: "hidden",
      }}
    >
      <ManageSidebar workspaceId={workspaceId} activeItem="business-plan" />

      <Box
        component="main"
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          bgcolor: "#FFFFFF",
          height: "100%",
          overflow: "hidden",
        }}
      >
        <ManageTopTabs
          activeTab={activeTopTab}
          onTabChange={setActiveTopTab}
          onAutoGenerate={handleAutoGenerateClick}
          isGenerating={isGenerating}
        />

        <ConfirmGenerateModal
          open={showGenerateModal}
          isGenerating={isGenerating}
          onConfirm={handleGenerateConfirm}
          onCancel={() => setShowGenerateModal(false)}
        />

        {activeTopTab !== "financials" && showSourcePriorityBanner && chapters.length > 0 && (
          <Alert
            severity="info"
            sx={{
              mx: 2,
              mt: 1,
              borderRadius: 2,
              fontSize: 13,
              "& .MuiAlert-message": { flex: 1 },
            }}
            action={
              <IconButton
                size="small"
                onClick={() => setShowSourcePriorityBanner(false)}
                sx={{ color: "inherit" }}
              >
                <CloseIcon sx={{ fontSize: 18 }} />
              </IconButton>
            }
          >
            {copy.sourcePriority}
          </Alert>
        )}

        {activeTopTab === "financials" ? (
          <FinancialProjectionsProvider workspaceId={workspaceId}>
            <FinancialProjectionsPage />
          </FinancialProjectionsProvider>
        ) : (
          <Box
            sx={{
              flex: 1,
              display: "flex",
              minHeight: 0,
              overflow: "hidden",
            }}
          >
            <ManageBusinessPlanContentArea
              activeTopTab={activeTopTab}
              activeAiTab={activeAiTab}
              onAiTabChange={setActiveAiTab}
            />

            <ManageActionArea
              activeTopTab={activeTopTab}
              workspaceId={workspaceId}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
}
