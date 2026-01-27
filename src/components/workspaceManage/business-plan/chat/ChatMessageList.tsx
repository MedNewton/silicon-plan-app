// src/components/workspaceManage/business-plan/chat/ChatMessageList.tsx
"use client";

import type { FC, RefObject } from "react";
import { Box, Stack, Typography, CircularProgress } from "@mui/material";
import type {
  BusinessPlanAiMessage,
  BusinessPlanPendingChange,
  BusinessPlanChapterWithSections,
  BusinessPlanSection,
} from "@/types/workspaces";
import ChatMessage from "./ChatMessage";
import PendingChangeCard from "./PendingChangeCard";

type ChatMessageListProps = {
  messages: BusinessPlanAiMessage[];
  pendingChanges: BusinessPlanPendingChange[];
  isStreaming: boolean;
  chaptersById: Map<string, BusinessPlanChapterWithSections>;
  sectionsById: Map<string, BusinessPlanSection>;
  onAcceptChange: (changeId: string) => Promise<void> | void;
  onRejectChange: (changeId: string) => Promise<void> | void;
  scrollRef: RefObject<HTMLDivElement | null>;
  onScroll: () => void;
};

const ChatMessageList: FC<ChatMessageListProps> = ({
  messages,
  pendingChanges,
  isStreaming,
  chaptersById,
  sectionsById,
  onAcceptChange,
  onRejectChange,
  scrollRef,
  onScroll,
}) => {
  return (
    <Box
      ref={scrollRef}
      onScroll={onScroll}
      sx={{
        flex: 1,
        minHeight: 0,
        overflowY: "auto",
        px: 3,
        pt: 3,
        pb: 2,
        bgcolor: "#FFFFFF",
      }}
    >
      <Stack spacing={2.5}>
        {messages.length === 0 ? (
          <Typography
            sx={{
              fontSize: 14,
              color: "#9CA3AF",
              textAlign: "center",
              py: 4,
            }}
          >
            Start a conversation with the AI to build your business plan.
          </Typography>
        ) : (
          messages.map((message) => {
            const relatedChanges = pendingChanges.filter(
              (change) => change.message_id === message.id
            );

            return (
              <Stack key={message.id} spacing={1.5}>
                <ChatMessage message={message} />
                {relatedChanges.map((change) => (
                  <PendingChangeCard
                    key={change.id}
                    change={change}
                    chaptersById={chaptersById}
                    sectionsById={sectionsById}
                    onAccept={onAcceptChange}
                    onReject={onRejectChange}
                  />
                ))}
              </Stack>
            );
          })
        )}

        {isStreaming ? (
          <Stack direction="row" spacing={1} alignItems="center">
            <CircularProgress size={16} sx={{ color: "#4C6AD2" }} />
            <Typography sx={{ fontSize: 13, color: "#6B7280" }}>
              AI is typing...
            </Typography>
          </Stack>
        ) : null}
      </Stack>
    </Box>
  );
};

export default ChatMessageList;
