// src/components/workspaceManage/business-plan/chat/ChatMessage.tsx
"use client";

import type { FC } from "react";
import { Box, Typography } from "@mui/material";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { BusinessPlanAiMessage } from "@/types/workspaces";

type ChatMessageProps = {
  message: BusinessPlanAiMessage;
};

const ChatMessage: FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === "user";
  const timestamp = new Date(message.created_at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: isUser ? "flex-end" : "flex-start",
        gap: 0.5,
      }}
    >
      <Box
        sx={{
          maxWidth: "78%",
          px: 2,
          py: 1.5,
          borderRadius: 3,
          bgcolor: isUser ? "#4C6AD2" : "#F3F4FF",
          color: isUser ? "#FFFFFF" : "#111827",
          boxShadow: isUser
            ? "0 8px 18px rgba(76,106,210,0.25)"
            : "0 6px 14px rgba(15,23,42,0.08)",
        }}
      >
        {isUser ? (
          <Typography sx={{ fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
            {message.content}
          </Typography>
        ) : (
          <Box
            sx={{
              fontSize: 14,
              lineHeight: 1.6,
              "& p": { margin: 0 },
              "& ul": { paddingLeft: 2, margin: 0 },
              "& ol": { paddingLeft: 2, margin: 0 },
              "& li": { marginBottom: 0.25 },
              "& code": {
                fontFamily: "Menlo, Monaco, Consolas, monospace",
                fontSize: 13,
                bgcolor: "rgba(15,23,42,0.06)",
                px: 0.5,
                py: 0.2,
                borderRadius: 1,
              },
              "& pre": {
                whiteSpace: "pre-wrap",
                fontSize: 13,
                bgcolor: "rgba(15,23,42,0.08)",
                px: 1,
                py: 0.75,
                borderRadius: 2,
                overflowX: "auto",
              },
            }}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </Box>
        )}
      </Box>
      <Typography sx={{ fontSize: 11, color: "#9CA3AF" }}>{timestamp}</Typography>
    </Box>
  );
};

export default ChatMessage;
