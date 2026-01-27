// src/components/workspaceManage/business-plan/ManageAiTabs.tsx
"use client";

import type { FC, HTMLAttributes, MouseEventHandler } from "react";
import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Typography,
  Stack,
  Collapse,
  TextField,
  CircularProgress,
  IconButton,
} from "@mui/material";

import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AddIcon from "@mui/icons-material/Add";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { useBusinessPlan } from "./BusinessPlanContext";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import type { BusinessPlanChapterWithSections } from "@/types/workspaces";
import ChatContainer from "./chat/ChatContainer";

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
        height: "100%",
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
  const {
    chapters,
    messages,
    pendingChanges,
    isChatLoading,
    isChatSending,
    chatError,
    refreshChat,
    sendChatMessage,
    acceptPendingChange,
    rejectPendingChange,
  } = useBusinessPlan();

  useEffect(() => {
    void refreshChat();
  }, [refreshChat]);

  return (
    <ChatContainer
      messages={messages}
      pendingChanges={pendingChanges}
      chapters={chapters}
      isLoading={isChatLoading}
      isStreaming={isChatSending}
      error={chatError}
      onSend={sendChatMessage}
      onAcceptChange={acceptPendingChange}
      onRejectChange={rejectPendingChange}
    />
  );
};

/* ------------------------------------------------------------------ */
/* PLAN CHAPTERS PANE – REAL DATA FROM CONTEXT                         */
/* ------------------------------------------------------------------ */

const PlanChaptersPane: FC = () => {
  const { chapters, isLoading, addChapter, reorderChapters } = useBusinessPlan();
  const [openId, setOpenId] = useState<string | null>(null);
  const [isAddingChapter, setIsAddingChapter] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleToggle = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  const handleAddChapter = async () => {
    if (!newChapterTitle.trim()) return;

    setIsAddingChapter(true);
    try {
      await addChapter(newChapterTitle.trim());
      setNewChapterTitle("");
    } finally {
      setIsAddingChapter(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = chapters.findIndex((chapter) => chapter.id === active.id);
    const newIndex = chapters.findIndex((chapter) => chapter.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const orderedChapterIds = arrayMove(chapters, oldIndex, newIndex).map(
      (chapter) => chapter.id
    );
    void reorderChapters(orderedChapterIds);
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "#FFFFFF",
        }}
      >
        <CircularProgress size={24} sx={{ color: "#4C6AD2" }} />
      </Box>
    );
  }

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
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={chapters.map((chapter) => chapter.id)}
          strategy={verticalListSortingStrategy}
        >
          <Stack spacing={2}>
            {chapters.length === 0 ? (
              <Typography
                sx={{
                  fontSize: 14,
                  color: "#9CA3AF",
                  textAlign: "center",
                  py: 4,
                }}
              >
                No chapters yet. Add your first chapter below.
              </Typography>
            ) : (
              chapters.map((chapter) => (
                <SortableChapter
                  key={chapter.id}
                  chapter={chapter}
                  isOpen={openId === chapter.id}
                  onToggle={() => handleToggle(chapter.id)}
                />
              ))
            )}

            {/* Add Chapter Input */}
            <Box
              sx={{
                borderRadius: 3,
                border: "1px dashed #CBD5F5",
                bgcolor: "#FAFBFF",
                px: 2.5,
                py: 2,
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center">
                <AddIcon sx={{ fontSize: 20, color: "#4C6AD2" }} />
                <TextField
                  fullWidth
                  size="small"
                  placeholder="New chapter title..."
                  value={newChapterTitle}
                  onChange={(e) => setNewChapterTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isAddingChapter) {
                      void handleAddChapter();
                    }
                  }}
                  disabled={isAddingChapter}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      fontSize: 14,
                      bgcolor: "#FFFFFF",
                    },
                  }}
                />
                <IconButton
                  size="small"
                  onClick={handleAddChapter}
                  disabled={isAddingChapter || !newChapterTitle.trim()}
                  sx={{ color: "#4C6AD2" }}
                >
                  {isAddingChapter ? (
                    <CircularProgress size={18} />
                  ) : (
                    <CheckIcon sx={{ fontSize: 18 }} />
                  )}
                </IconButton>
              </Stack>
            </Box>
          </Stack>
        </SortableContext>
      </DndContext>
    </Box>
  );
};

type SortableChapterProps = {
  chapter: BusinessPlanChapterWithSections;
  isOpen: boolean;
  onToggle: () => void;
};

const SortableChapter: FC<SortableChapterProps> = ({
  chapter,
  isOpen,
  onToggle,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: chapter.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      sx={{
        opacity: isDragging ? 0.6 : 1,
      }}
    >
      <ChapterAccordion
        chapter={chapter}
        isOpen={isOpen}
        onToggle={onToggle}
        dragHandleProps={{
          ...attributes,
          ...listeners,
        }}
        dragHandleRef={setActivatorNodeRef}
      />
    </Box>
  );
};

type ChapterAccordionProps = {
  chapter: BusinessPlanChapterWithSections;
  isOpen: boolean;
  onToggle: () => void;
  dragHandleProps?: HTMLAttributes<HTMLDivElement>;
  dragHandleRef?: (element: HTMLDivElement | null) => void;
};

const ChapterAccordion: FC<ChapterAccordionProps> = ({
  chapter,
  isOpen,
  onToggle,
  dragHandleProps,
  dragHandleRef,
}) => {
  const { updateChapter, deleteChapter, setSelectedChapterId, selectedChapterId } = useBusinessPlan();
  const isSelected = selectedChapterId === chapter.id;
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(chapter.title);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const isDraggable = Boolean(dragHandleProps);

  const handleSaveTitle = async () => {
    if (!editTitle.trim()) return;

    setIsSaving(true);
    try {
      await updateChapter(chapter.id, editTitle.trim());
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteChapter(chapter.id);
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDragHandleClick: MouseEventHandler<HTMLDivElement> = (event) => {
    if (!isDraggable) return;
    event.stopPropagation();
    dragHandleProps?.onClick?.(event);
  };

  return (
    <>
      <ConfirmDeleteModal
        open={showDeleteModal}
        title="Delete Chapter"
        message="Are you sure you want to delete this chapter? All sections within this chapter will also be deleted. This action cannot be undone."
        itemName={chapter.title}
        isDeleting={isDeleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setShowDeleteModal(false)}
      />
    <Box
      sx={{
        borderRadius: 3,
        border: isSelected ? "2px solid #4C6AD2" : "1px solid #CBD5F5",
        bgcolor: isSelected ? "#F0F4FF" : "#FFFFFF",
        boxShadow: isSelected
          ? "0 2px 8px rgba(76, 106, 210, 0.2)"
          : "0 1px 3px rgba(15,23,42,0.04)",
        overflow: "hidden",
        transition: "all 0.15s ease",
      }}
    >
      {/* Header (always visible) */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2.5,
          py: 1.8,
          cursor: "pointer",
          bgcolor: isSelected ? "#F0F4FF" : isOpen ? "#F8FAFF" : "#FFFFFF",
        }}
      >
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
          onClick={() => {
            onToggle();
            setSelectedChapterId(chapter.id);
          }}
          sx={{ flex: 1 }}
        >
          <Box
            ref={dragHandleRef}
            sx={{
              display: "flex",
              alignItems: "center",
              cursor: isDraggable ? "grab" : "default",
              color: "#9CA3AF",
              touchAction: isDraggable ? "none" : "auto",
            }}
            {...dragHandleProps}
            onClick={isDraggable ? handleDragHandleClick : undefined}
          >
            <DragIndicatorIcon sx={{ fontSize: 20 }} />
          </Box>
          {isEditing ? (
            <TextField
              size="small"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleSaveTitle();
                if (e.key === "Escape") setIsEditing(false);
              }}
              disabled={isSaving}
              autoFocus
              sx={{
                flex: 1,
                "& .MuiOutlinedInput-root": {
                  fontSize: 14,
                  fontWeight: 600,
                },
              }}
            />
          ) : (
            <Typography
              sx={{
                fontSize: 14,
                fontWeight: 600,
                color: "#1F2933",
              }}
            >
              {chapter.title}
            </Typography>
          )}
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center">
          {isEditing ? (
            <>
              <IconButton
                size="small"
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
              >
                <CloseIcon sx={{ fontSize: 18 }} />
              </IconButton>
              <IconButton
                size="small"
                onClick={handleSaveTitle}
                disabled={isSaving}
                sx={{ color: "#4C6AD2" }}
              >
                <CheckIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </>
          ) : (
            <>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditTitle(chapter.title);
                  setIsEditing(true);
                }}
              >
                <EditOutlinedIcon sx={{ fontSize: 18, color: "#9CA3AF" }} />
              </IconButton>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteModal(true);
                }}
                sx={{ "&:hover": { color: "#EF4444" } }}
              >
                <DeleteOutlineIcon sx={{ fontSize: 18, color: "#9CA3AF" }} />
              </IconButton>
            </>
          )}
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
          {chapter.sections.length === 0 ? (
            <Typography
              sx={{
                fontSize: 13,
                color: "#9CA3AF",
                fontStyle: "italic",
                pl: 4,
              }}
            >
              No sections yet. Add content from the right sidebar.
            </Typography>
          ) : (
            <Stack spacing={0.75} sx={{ pl: 4 }}>
              {chapter.sections.map((section) => {
                const label =
                  section.content.type === "section_title" ||
                  section.content.type === "subsection"
                    ? (section.content as { text: string }).text
                    : section.content.type === "text"
                    ? (section.content as { text: string }).text.slice(0, 50) +
                      ((section.content as { text: string }).text.length > 50
                        ? "..."
                        : "")
                    : `${section.content.type.replace("_", " ")} section`;

                return (
                  <Typography
                    key={section.id}
                    sx={{ fontSize: 13, color: "#4B5563" }}
                  >
                    {label}
                  </Typography>
                );
              })}
            </Stack>
          )}

          {/* Nested chapters */}
          {chapter.children && chapter.children.length > 0 && (
            <Box sx={{ mt: 2, pl: 2 }}>
              {chapter.children.map((child) => (
                <ChapterAccordion
                  key={child.id}
                  chapter={child}
                  isOpen={false}
                  onToggle={() => { /* nested children not toggled */ }}
                />
              ))}
            </Box>
          )}
        </Box>
      </Collapse>
    </Box>
    </>
  );
};
