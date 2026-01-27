// src/components/workspaceManage/business-plan/chat/ChatContainer.tsx
"use client";

import type { FC } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Box, IconButton, CircularProgress, Alert } from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import type {
  BusinessPlanAiMessage,
  BusinessPlanPendingChange,
  BusinessPlanChapterWithSections,
  BusinessPlanSection,
} from "@/types/workspaces";
import ChatMessageList from "./ChatMessageList";
import ChatInput from "./ChatInput";

type ChatContainerProps = {
  messages: BusinessPlanAiMessage[];
  pendingChanges: BusinessPlanPendingChange[];
  chapters: BusinessPlanChapterWithSections[];
  isLoading: boolean;
  isStreaming: boolean;
  error?: string | null;
  onSend: (message: string) => Promise<void> | void;
  onAcceptChange: (changeId: string) => Promise<void> | void;
  onRejectChange: (changeId: string) => Promise<void> | void;
};

const flattenChapters = (
  chapters: BusinessPlanChapterWithSections[],
  chapterMap: Map<string, BusinessPlanChapterWithSections>,
  sectionMap: Map<string, BusinessPlanSection>
) => {
  chapters.forEach((chapter) => {
    chapterMap.set(chapter.id, chapter);
    chapter.sections.forEach((section) => {
      sectionMap.set(section.id, section);
    });
    if (chapter.children?.length) {
      flattenChapters(chapter.children, chapterMap, sectionMap);
    }
  });
};

const ChatContainer: FC<ChatContainerProps> = ({
  messages,
  pendingChanges,
  chapters,
  isLoading,
  isStreaming,
  error,
  onSend,
  onAcceptChange,
  onRejectChange,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const { chaptersById, sectionsById } = useMemo(() => {
    const chapterMap = new Map<string, BusinessPlanChapterWithSections>();
    const sectionMap = new Map<string, BusinessPlanSection>();
    flattenChapters(chapters, chapterMap, sectionMap);
    return { chaptersById: chapterMap, sectionsById: sectionMap };
  }, [chapters]);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    const container = scrollRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior });
  };

  const handleScroll = () => {
    const container = scrollRef.current;
    if (!container) return;
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    const atBottom = distanceFromBottom < 60;
    setIsAtBottom(atBottom);
    setShowScrollButton(!atBottom);
  };

  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom("smooth");
    }
  }, [messages, isStreaming, isAtBottom]);

  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        position: "relative",
        bgcolor: "#FFFFFF",
      }}
    >
      {isLoading ? (
        <Box
          sx={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CircularProgress size={24} sx={{ color: "#4C6AD2" }} />
        </Box>
      ) : (
        <>
          {error ? (
            <Box sx={{ px: 3, pt: 2 }}>
              <Alert severity="error">{error}</Alert>
            </Box>
          ) : null}
          <ChatMessageList
            messages={messages}
            pendingChanges={pendingChanges}
            isStreaming={isStreaming}
            chaptersById={chaptersById}
            sectionsById={sectionsById}
            onAcceptChange={onAcceptChange}
            onRejectChange={onRejectChange}
            scrollRef={scrollRef}
            onScroll={handleScroll}
          />

          {showScrollButton ? (
            <IconButton
              onClick={() => scrollToBottom("smooth")}
              sx={{
                position: "absolute",
                right: 24,
                bottom: 96,
                width: 36,
                height: 36,
                bgcolor: "#FFFFFF",
                border: "1px solid #E5E7EB",
                boxShadow: "0 8px 18px rgba(15,23,42,0.08)",
                "&:hover": { bgcolor: "#F9FAFF" },
              }}
            >
              <KeyboardArrowDownIcon sx={{ color: "#4B5563" }} />
            </IconButton>
          ) : null}
        </>
      )}

      <ChatInput onSend={onSend} disabled={isStreaming} />
    </Box>
  );
};

export default ChatContainer;
