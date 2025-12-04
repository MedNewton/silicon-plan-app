// src/components/workspaceManage/ManageAiTabs.tsx
"use client";

import type { FC } from "react";
import { useState } from "react";
import {
  Box,
  Button,
  Typography,
  Stack,
  InputBase,
  IconButton,
  Collapse,
} from "@mui/material";

import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import MoreHorizOutlinedIcon from "@mui/icons-material/MoreHorizOutlined";

export type ManageAiTab = "aiChat" | "planChapters";

export type ManageAiTabsProps = Readonly<{
  activeTab: ManageAiTab;
  onTabChange: (tab: ManageAiTab) => void;
}>;

const ManageAiTabs: FC<ManageAiTabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%", // parent central area should be flex:1 + minHeight:0
        maxHeight: "100% !important",
        borderRight: "1px solid #E5E7EB",
        bgcolor: "#FFFFFF",
      }}
    >
      {/* Tabs header */}
      <Box
        sx={{
          borderBottom: "1px solid #E5E7EB",
          display: "flex",
          bgcolor: "#FFFFFF",
        }}
      >
        <Button
          disableRipple
          onClick={() => onTabChange("aiChat")}
          sx={{
            flex: 1,
            textTransform: "none",
            fontSize: 16,
            fontWeight: 600,
            py: 1.6,
            borderRadius: 0,
            borderBottom:
              activeTab === "aiChat"
                ? "3px solid #4C6AD2"
                : "3px solid transparent",
            color: activeTab === "aiChat" ? "#FFFFFF" : "#6B7280",
            bgcolor: activeTab === "aiChat" ? "#4C6AD2" : "#FFFFFF",
            "&:hover": {
              bgcolor:
                activeTab === "aiChat" ? "#435ABF" : "rgba(15,23,42,0.02)",
            },
          }}
        >
          AI Chat
        </Button>
        <Button
          disableRipple
          onClick={() => onTabChange("planChapters")}
          sx={{
            flex: 1,
            textTransform: "none",
            fontSize: 16,
            fontWeight: 600,
            py: 1.6,
            borderRadius: 0,
            borderBottom:
              activeTab === "planChapters"
                ? "3px solid #4C6AD2"
                : "3px solid transparent",
            color: activeTab === "planChapters" ? "#111827" : "#6B7280",
            bgcolor: activeTab === "planChapters" ? "#F9FAFF" : "#FFFFFF",
            "&:hover": {
              bgcolor:
                activeTab === "planChapters"
                  ? "#F1F5FF"
                  : "rgba(15,23,42,0.02)",
            },
          }}
        >
          Plan Chapters
        </Button>
      </Box>

      {activeTab === "aiChat" ? <AiChatPane /> : <PlanChaptersPane />}
    </Box>
  );
};

export default ManageAiTabs;

/* ------------------------------------------------------------------ */
/* AI CHAT PANE                                                        */
/* ------------------------------------------------------------------ */

const AiChatPane: FC = () => {
  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        bgcolor: "#FFFFFF",
      }}
    >
      {/* Scrollable messages */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          px: 3,
          pt: 3,
          pb: 2,
        }}
      >
        <AiMessage
          text={
            "Hello! That sounds great. Let’s start with the basics. Could you briefly describe the idea you want to implement?"
          }
        />

        <UserMessage
          text={
            "I’m planning to launch an online platform for local artisans so they can sell their products without intermediaries."
          }
        />

        <AiMessage
          text={
            "Very interesting! This could support small businesses and craftsmen.\nI suggest the following structure for your business plan:\n\n1. Brief description of the idea\n2. Market analysis\n3. Target audience\n4. Competitors\n5. Business model"
          }
        />
      </Box>

      {/* Fixed input */}
      <Box
        sx={{
          borderTop: "1px solid #E5E7EB",
          px: 3,
          py: 1.75,
          bgcolor: "#FFFFFF",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            borderRadius: 3,
            border: "1px solid #CBD5F5",
            px: 2,
            py: 1.2,
            bgcolor: "#FDFDFF",
            boxShadow: "0 0 0 1px rgba(148,163,255,0.2)",
          }}
        >
          <InputBase
            placeholder="Type"
            sx={{
              flex: 1,
              fontSize: 15,
            }}
          />
          <IconButton
            disableRipple
            sx={{
              ml: 1.5,
              width: 40,
              height: 40,
              borderRadius: 2,
              background:
                "linear-gradient(135deg, #4C6AD2 0%, #7F54D9 100%)",
              boxShadow: "0px 8px 20px rgba(76,106,210,0.35)",
              "&:hover": {
                background:
                  "linear-gradient(135deg, #435ABF 0%, #744BD5 100%)",
              },
            }}
          >
            <SendRoundedIcon sx={{ fontSize: 22, color: "#FFFFFF" }} />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

type MessageProps = {
  text: string;
};

const AiMessage: FC<MessageProps> = ({ text }) => (
  <Box sx={{ mb: 3 }}>
    <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at 0% 0%, #E0E7FF 0%, #C7D2FE 50%, #EDE9FE 100%)",
        }}
      >
        <AutoAwesomeIcon sx={{ fontSize: 18, color: "#4C6AD2" }} />
      </Box>
      <Typography
        sx={{ fontWeight: 700, fontSize: 16, color: "#111827" }}
      >
        Silicon Plan AI
      </Typography>
    </Stack>
    <Box
      sx={{
        borderRadius: 3,
        bgcolor: "#F3F4FF",
        px: 2.5,
        py: 2,
      }}
    >
      <Typography
        sx={{ fontSize: 15, lineHeight: 1.6, whiteSpace: "pre-line" }}
      >
        {text}
      </Typography>
    </Box>
  </Box>
);

const UserMessage: FC<MessageProps> = ({ text }) => (
  <Box sx={{ mb: 3 }}>
    <Box
      sx={{
        borderRadius: 3,
        bgcolor: "#F9FAFB",
        px: 2.5,
        py: 2,
      }}
    >
      <Typography sx={{ fontSize: 15, lineHeight: 1.6 }}>
        {text}
      </Typography>
    </Box>
  </Box>
);

/* ------------------------------------------------------------------ */
/* PLAN CHAPTERS PANE – ACCORDION / COLLAPSE                          */
/* ------------------------------------------------------------------ */

type Chapter = {
  id: string;
  title: string;
  items: string[];
};

const PlanChaptersPane: FC = () => {
  const chapters: Chapter[] = [
    {
      id: "executive-summary",
      title: "Executive Summary",
      items: [
        "Business Overview",
        "Vision",
        "Mossion",
        "Management Team",
        "Management Team",
      ],
    },
    {
      id: "business-overview",
      title: "Business Overview",
      items: [
        "Business Overview",
        "Vision",
        "Mossion",
        "Management Team",
        "Management Team",
      ],
    },
    {
      id: "industry-analysis",
      title: "Industry Analysis",
      items: [
        "Business Overview",
        "Vision",
        "Mossion",
        "Management Team",
        "Management Team",
      ],
    },
  ];

  const [openId, setOpenId] = useState<string | null>(
    chapters[0]?.id ?? null,
  );

  const handleToggle = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        overflowY: "auto",
        px: 3,
        pt: 3,
        pb: 3,
        bgcolor: "#FFFFFF",
      }}
    >
      <Stack spacing={2}>
        {chapters.map((chapter) => {
          const isOpen = openId === chapter.id;
          return (
            <Box
              key={chapter.id}
              sx={{
                borderRadius: 3,
                border: "1px solid #CBD5F5",
                bgcolor: "#FFFFFF",
                boxShadow: "0 1px 3px rgba(15,23,42,0.04)",
                overflow: "hidden",
              }}
            >
              {/* Header (always visible) */}
              <Box
                onClick={() => handleToggle(chapter.id)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  px: 2.5,
                  py: 1.8,
                  cursor: "pointer",
                  bgcolor: isOpen ? "#F8FAFF" : "#FFFFFF",
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <DragIndicatorIcon
                    sx={{ fontSize: 20, color: "#9CA3AF" }}
                  />
                  <Typography
                    sx={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#1F2933",
                    }}
                  >
                    {chapter.title}
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <VisibilityOutlinedIcon
                    sx={{ fontSize: 20, color: "#4C6AD2" }}
                  />
                  <MoreHorizOutlinedIcon
                    sx={{ fontSize: 20, color: "#9CA3AF" }}
                  />
                </Stack>
              </Box>

              {/* Collapsible body */}
              <Collapse in={isOpen} timeout="auto" unmountOnExit>
                <Box
                  sx={{
                    borderTop: "1px solid #E5E7EB",
                    px: 2.5,
                    py: 1.8,
                  }}
                >
                  <Stack spacing={0.75} sx={{ pl: 4 }}>
                    {chapter.items.map((item, idx) => (
                      <Typography
                        key={`${item}-${idx}`}
                        sx={{ fontSize: 15, color: "#111827" }}
                      >
                        {item}
                      </Typography>
                    ))}
                  </Stack>
                </Box>
              </Collapse>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
};
