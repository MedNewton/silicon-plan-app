// src/components/workspaceManage/business-plan/ManageAiTabs.tsx
"use client";

import type { FC, ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Collapse,
  CircularProgress,
  IconButton,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  type SelectChangeEvent,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import AutoFixHighRoundedIcon from "@mui/icons-material/AutoFixHighRounded";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import NotesRoundedIcon from "@mui/icons-material/NotesRounded";
import SchemaRoundedIcon from "@mui/icons-material/SchemaRounded";
import TaskRoundedIcon from "@mui/icons-material/TaskRounded";
import { useParams } from "next/navigation";

import { useBusinessPlan } from "./BusinessPlanContext";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import ChatContainer from "./chat/ChatContainer";
import type {
  BusinessPlanChapterWithSections,
  BusinessPlanTaskStatus,
  BusinessPlanTaskWithChildren,
} from "@/types/workspaces";

export type ManageAiTab = "aiChat" | "planChapters" | "planTasks";

export type ManageAiTabsProps = Readonly<{
  activeTab: ManageAiTab;
  onTabChange: (tab: ManageAiTab) => void;
}>;

const TAB_META: Record<
  ManageAiTab,
  { label: string; icon: ReactNode; subtitle: string }
> = {
  aiChat: {
    label: "AI Chat",
    icon: <NotesRoundedIcon sx={{ fontSize: 16 }} />,
    subtitle: "Discuss and approve AI changes",
  },
  planChapters: {
    label: "Chapters",
    icon: <SchemaRoundedIcon sx={{ fontSize: 16 }} />,
    subtitle: "Manage chapter structure",
  },
  planTasks: {
    label: "Plan Tasks",
    icon: <TaskRoundedIcon sx={{ fontSize: 16 }} />,
    subtitle: "Track H1/H2 writing tasks",
  },
};

const statusOptions: Array<{ value: BusinessPlanTaskStatus; label: string }> = [
  { value: "todo", label: "To do" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
];

const statusPillColor = (status: BusinessPlanTaskStatus): string => {
  switch (status) {
    case "done":
      return "#DCFCE7";
    case "in_progress":
      return "#DBEAFE";
    default:
      return "#FFEDD5";
  }
};

const statusDotColor = (status: BusinessPlanTaskStatus): string => {
  switch (status) {
    case "done":
      return "#16A34A";
    case "in_progress":
      return "#2563EB";
    default:
      return "#EA580C";
  }
};

const ManageAiTabs: FC<ManageAiTabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        maxHeight: "100% !important",
        borderRight: "1px solid #E2E8F0",
        bgcolor: "#FFFFFF",
      }}
    >
      <Box
        sx={{
          px: 1.5,
          pt: 1.5,
          pb: 1,
          borderBottom: "1px solid #E5E7EB",
          bgcolor: "#F8FAFC",
        }}
      >
        <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#334155", mb: 1 }}>
          Workspace Assistant
        </Typography>
        <Stack direction="row" spacing={0.75}>
          {(Object.keys(TAB_META) as ManageAiTab[]).map((tabKey) => {
            const isActive = activeTab === tabKey;
            const tab = TAB_META[tabKey];
            return (
              <Button
                key={tabKey}
                disableRipple
                onClick={() => onTabChange(tabKey)}
                startIcon={tab.icon}
                sx={{
                  flex: 1,
                  textTransform: "none",
                  fontSize: 12,
                  fontWeight: 700,
                  px: 1,
                  py: 0.8,
                  borderRadius: 2,
                  minWidth: 0,
                  border: isActive ? "1px solid #C7D2FE" : "1px solid #E2E8F0",
                  color: isActive ? "#1E3A8A" : "#475569",
                  bgcolor: isActive ? "#EEF2FF" : "#FFFFFF",
                  "& .MuiButton-startIcon": { mr: 0.5 },
                  "&:hover": {
                    bgcolor: isActive ? "#E0E7FF" : "#F8FAFC",
                  },
                }}
              >
                {tab.label}
              </Button>
            );
          })}
        </Stack>
      </Box>

      <PaneIntro activeTab={activeTab} />

      {activeTab === "aiChat" ? <AiChatPane /> : null}
      {activeTab === "planChapters" ? <PlanChaptersPane /> : null}
      {activeTab === "planTasks" ? <PlanTasksPane /> : null}
    </Box>
  );
};

export default ManageAiTabs;

const PaneIntro: FC<{ activeTab: ManageAiTab }> = ({ activeTab }) => {
  const meta = TAB_META[activeTab];
  return (
    <Box sx={{ px: 2, py: 1.25, borderBottom: "1px solid #EEF2F7", bgcolor: "#FFFFFF" }}>
      <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: "#1E293B" }}>
        {meta.label}
      </Typography>
      <Typography sx={{ fontSize: 11.5, color: "#64748B" }}>{meta.subtitle}</Typography>
    </Box>
  );
};

const PaneBody: FC<{ children: ReactNode }> = ({ children }) => (
  <Box
    sx={{
      flex: 1,
      minHeight: 0,
      overflowY: "auto",
      px: 2,
      pt: 2,
      pb: 2,
      bgcolor: "#F8FAFC",
    }}
  >
    <Stack spacing={1.5}>{children}</Stack>
  </Box>
);

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

const PlanChaptersPane: FC = () => {
  const { chapters, isLoading, addChapter, updateChapter, deleteChapter } = useBusinessPlan();
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [isAddingChapter, setIsAddingChapter] = useState(false);
  const [openChapterIds, setOpenChapterIds] = useState<string[]>([]);

  useEffect(() => {
    const collectIds = (nodes: BusinessPlanChapterWithSections[]): string[] =>
      nodes.flatMap((node) => [node.id, ...collectIds(node.children ?? [])]);

    const chapterIds = new Set(collectIds(chapters));

    setOpenChapterIds((prev) => {
      const filtered = prev.filter((id) => chapterIds.has(id));
      if (filtered.length > 0) {
        return filtered;
      }

      const first = chapters[0];
      return first ? [first.id] : [];
    });
  }, [chapters]);

  const toggleChapterOpen = (chapterId: string) => {
    setOpenChapterIds((prev) =>
      prev.includes(chapterId)
        ? prev.filter((id) => id !== chapterId)
        : [...prev, chapterId]
    );
  };

  const handleAddChapter = async () => {
    const title = newChapterTitle.trim();
    if (!title) return;

    setIsAddingChapter(true);
    try {
      await addChapter(title);
      setNewChapterTitle("");
    } finally {
      setIsAddingChapter(false);
    }
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "#F8FAFC",
        }}
      >
        <CircularProgress size={24} sx={{ color: "#4C6AD2" }} />
      </Box>
    );
  }

  return (
    <PaneBody>
      {chapters.length === 0 ? (
        <Typography sx={{ fontSize: 13, color: "#64748B", textAlign: "center", py: 2 }}>
          No chapters yet. Add your first chapter below.
        </Typography>
      ) : (
        chapters.map((chapter) => (
          <ChapterCard
            key={chapter.id}
            chapter={chapter}
            depth={0}
            openChapterIds={openChapterIds}
            onToggle={() => toggleChapterOpen(chapter.id)}
            onToggleById={toggleChapterOpen}
            onUpdate={(title) => updateChapter(chapter.id, title)}
            onDelete={() => deleteChapter(chapter.id)}
            onUpdateChild={updateChapter}
            onDeleteChild={deleteChapter}
          />
        ))
      )}

      <CreateCard
        placeholder="New chapter title..."
        value={newChapterTitle}
        onChange={setNewChapterTitle}
        onSubmit={() => void handleAddChapter()}
        isLoading={isAddingChapter}
      />
    </PaneBody>
  );
};

type ChapterCardProps = {
  chapter: BusinessPlanChapterWithSections;
  depth: number;
  openChapterIds: string[];
  onToggle: () => void;
  onToggleById: (chapterId: string) => void;
  onUpdate: (title: string) => Promise<void>;
  onDelete: () => Promise<void>;
  onUpdateChild: (chapterId: string, title: string) => Promise<void>;
  onDeleteChild: (chapterId: string) => Promise<void>;
};

const ChapterCard: FC<ChapterCardProps> = ({
  chapter,
  depth,
  openChapterIds,
  onToggle,
  onToggleById,
  onUpdate,
  onDelete,
  onUpdateChild,
  onDeleteChild,
}) => {
  const isOpen = openChapterIds.includes(chapter.id);
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(chapter.title);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setTitle(chapter.title);
  }, [chapter.title]);

  const handleSave = async () => {
    const normalized = title.trim();
    if (!normalized) return;
    setIsSaving(true);
    try {
      await onUpdate(normalized);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete();
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const sectionPreview = chapter.sections.slice(0, 4).map((section) => {
    if (section.content.type === "section_title" || section.content.type === "subsection") {
      return section.content.text;
    }
    if (section.content.type === "text") {
      return section.content.text.slice(0, 56);
    }
    return section.content.type.replace(/_/g, " ");
  });

  return (
    <Box sx={{ pl: depth > 0 ? 1.5 : 0 }}>
      <ConfirmDeleteModal
        open={showDeleteModal}
        title="Delete Chapter"
        message="Are you sure you want to delete this chapter? All nested content will be deleted."
        itemName={chapter.title}
        isDeleting={isDeleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setShowDeleteModal(false)}
      />

      <Box
        sx={{
          borderRadius: 3,
          border: "1px solid #E2E8F0",
          bgcolor: "#FFFFFF",
          boxShadow: "0 1px 2px rgba(15,23,42,0.06)",
          overflow: "hidden",
        }}
      >
        <Box sx={{ pl: 0.2, pr: 1, py: 1, display: "flex", alignItems: "center", gap: 0.55 }}>
          <IconButton
            size="small"
            onClick={onToggle}
            sx={{ p: 0.15, ml: -0.1, color: "#475569" }}
          >
            <ExpandMoreIcon
              sx={{
                fontSize: 18,
                color: "#475569",
                transform: isOpen ? "rotate(0deg)" : "rotate(-90deg)",
                transition: "transform 0.15s ease",
              }}
            />
          </IconButton>

          <Chip
            size="small"
            label={depth === 0 ? "Chapter" : "Subchapter"}
            sx={{ fontSize: 10, bgcolor: "#EEF2FF", color: "#3730A3" }}
          />

          <Box sx={{ flex: 1, minWidth: 0 }}>
            {isEditing ? (
              <TextField
                size="small"
                fullWidth
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void handleSave();
                  if (e.key === "Escape") setIsEditing(false);
                }}
                disabled={isSaving}
                autoFocus
                sx={{ "& .MuiOutlinedInput-root": { fontSize: 13 } }}
              />
            ) : (
              <>
                <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: "#0F172A" }} noWrap>
                  {chapter.title}
                </Typography>
                <Typography sx={{ fontSize: 11.5, color: "#64748B" }}>
                  {chapter.sections.length} section{chapter.sections.length === 1 ? "" : "s"}
                </Typography>
              </>
            )}
          </Box>

          {isEditing ? (
            <>
              <IconButton size="small" onClick={() => setIsEditing(false)} disabled={isSaving}>
                <CloseIcon sx={{ fontSize: 16 }} />
              </IconButton>
              <IconButton size="small" onClick={() => void handleSave()} disabled={isSaving}>
                <CheckIcon sx={{ fontSize: 16, color: "#1D4ED8" }} />
              </IconButton>
            </>
          ) : (
            <>
              <IconButton size="small" onClick={() => setIsEditing(true)}>
                <EditOutlinedIcon sx={{ fontSize: 16, color: "#64748B" }} />
              </IconButton>
              <IconButton size="small" onClick={() => setShowDeleteModal(true)}>
                <DeleteOutlineIcon sx={{ fontSize: 16, color: "#64748B" }} />
              </IconButton>
            </>
          )}
        </Box>

        <Collapse in={isOpen} timeout="auto" unmountOnExit>
          <Box sx={{ px: 2, pb: 1.5, pt: 0.2, borderTop: "1px solid #F1F5F9" }}>
            {sectionPreview.length === 0 ? (
              <Typography sx={{ fontSize: 12, color: "#94A3B8", fontStyle: "italic", py: 1 }}>
                No sections in this chapter.
              </Typography>
            ) : (
              <Stack spacing={0.6} sx={{ py: 1 }}>
                {sectionPreview.map((label, index) => (
                  <Typography
                    key={`${chapter.id}-preview-${index}`}
                    sx={{ fontSize: 12, color: "#475569" }}
                  >
                    {label}
                  </Typography>
                ))}
              </Stack>
            )}

            {chapter.children?.length ? (
              <Stack spacing={1} sx={{ mt: 0.4 }}>
                {chapter.children.map((child) => (
                  <ChapterCard
                    key={child.id}
                    chapter={child}
                    depth={depth + 1}
                    openChapterIds={openChapterIds}
                    onToggle={() => onToggleById(child.id)}
                    onToggleById={onToggleById}
                    onUpdate={(title) => onUpdateChild(child.id, title)}
                    onDelete={() => onDeleteChild(child.id)}
                    onUpdateChild={onUpdateChild}
                    onDeleteChild={onDeleteChild}
                  />
                ))}
              </Stack>
            ) : null}
          </Box>
        </Collapse>
      </Box>
    </Box>
  );
};

const PlanTasksPane: FC = () => {
  const {
    tasks,
    isTasksLoading,
    addTask,
    updateTask,
    deleteTask,
    lastAppliedTaskChange,
  } = useBusinessPlan();
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [openTaskIds, setOpenTaskIds] = useState<string[]>([]);
  const [hasAutoOpenedTask, setHasAutoOpenedTask] = useState(false);
  const [lastHandledTaskChangeAt, setLastHandledTaskChangeAt] = useState<number>(0);

  useEffect(() => {
    const first = tasks[0];
    if (first && openTaskIds.length === 0 && !hasAutoOpenedTask) {
      setOpenTaskIds([first.id]);
      setHasAutoOpenedTask(true);
    }
  }, [tasks, openTaskIds.length, hasAutoOpenedTask]);

  useEffect(() => {
    if (!lastAppliedTaskChange) return;
    if (lastAppliedTaskChange.changedAt <= lastHandledTaskChangeAt) return;

    const parentOrSelf = lastAppliedTaskChange.parentTaskId ?? lastAppliedTaskChange.taskId;
    setOpenTaskIds((prev) =>
      prev.includes(parentOrSelf) ? prev : [...prev, parentOrSelf]
    );
    setLastHandledTaskChangeAt(lastAppliedTaskChange.changedAt);
  }, [lastAppliedTaskChange, lastHandledTaskChangeAt]);

  const toggleTaskOpen = (taskId: string) => {
    setOpenTaskIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  const handleAddH1 = async () => {
    const title = newTaskTitle.trim();
    if (!title) return;

    setIsAddingTask(true);
    try {
      await addTask({
        title,
        hierarchyLevel: "h1",
      });
      setNewTaskTitle("");
    } finally {
      setIsAddingTask(false);
    }
  };

  if (isTasksLoading) {
    return (
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "#F8FAFC",
        }}
      >
        <CircularProgress size={24} sx={{ color: "#4C6AD2" }} />
      </Box>
    );
  }

  return (
    <PaneBody>
      <Box
        sx={{
          borderRadius: 2,
          border: "1px solid #DBEAFE",
          bgcolor: "#EFF6FF",
          px: 1.2,
          py: 0.9,
        }}
      >
        <Typography sx={{ fontSize: 11.5, color: "#1E40AF", fontWeight: 700 }}>
          Auto Context Enabled
        </Typography>
        <Typography sx={{ fontSize: 11.5, color: "#334155", mt: 0.2 }}>
          AI Draft automatically reuses workspace setup and AI library context for each task.
        </Typography>
      </Box>

      {tasks.length === 0 ? (
        <Typography sx={{ fontSize: 13, color: "#64748B", textAlign: "center", py: 2 }}>
          No tasks yet. Add your first H1 task below.
        </Typography>
      ) : (
        tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            isOpen={openTaskIds.includes(task.id)}
            onToggle={() => toggleTaskOpen(task.id)}
            onUpdateTitle={(title) => updateTask(task.id, { title })}
            onUpdateStatus={(status) => updateTask(task.id, { status })}
            onDelete={() => deleteTask(task.id)}
            onAddSubTask={(title) =>
              addTask({ title, hierarchyLevel: "h2", parentTaskId: task.id })
            }
            onUpdateSubTaskTitle={(taskId, title) => updateTask(taskId, { title })}
            onUpdateSubTaskStatus={(taskId, status) => updateTask(taskId, { status })}
            onDeleteSubTask={(taskId) => deleteTask(taskId)}
          />
        ))
      )}

      <CreateCard
        placeholder="New H1 task title..."
        value={newTaskTitle}
        onChange={setNewTaskTitle}
        onSubmit={() => void handleAddH1()}
        isLoading={isAddingTask}
      />
    </PaneBody>
  );
};

type TaskCardProps = {
  task: BusinessPlanTaskWithChildren;
  isOpen: boolean;
  onToggle: () => void;
  onUpdateTitle: (title: string) => Promise<void>;
  onUpdateStatus: (status: BusinessPlanTaskStatus) => Promise<void>;
  onDelete: () => Promise<void>;
  onAddSubTask: (title: string) => Promise<void>;
  onUpdateSubTaskTitle: (taskId: string, title: string) => Promise<void>;
  onUpdateSubTaskStatus: (taskId: string, status: BusinessPlanTaskStatus) => Promise<void>;
  onDeleteSubTask: (taskId: string) => Promise<void>;
};

const TaskCard: FC<TaskCardProps> = ({
  task,
  isOpen,
  onToggle,
  onUpdateTitle,
  onUpdateStatus,
  onDelete,
  onAddSubTask,
  onUpdateSubTaskTitle,
  onUpdateSubTaskStatus,
  onDeleteSubTask,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newSubTaskTitle, setNewSubTaskTitle] = useState("");
  const [isAddingSubTask, setIsAddingSubTask] = useState(false);

  useEffect(() => {
    setTitle(task.title);
  }, [task.title]);

  const handleSave = async () => {
    const normalized = title.trim();
    if (!normalized) return;
    setIsSaving(true);
    try {
      await onUpdateTitle(normalized);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete();
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddSubTask = async () => {
    const normalized = newSubTaskTitle.trim();
    if (!normalized) return;

    setIsAddingSubTask(true);
    try {
      await onAddSubTask(normalized);
      setNewSubTaskTitle("");
    } finally {
      setIsAddingSubTask(false);
    }
  };

  return (
    <>
      <ConfirmDeleteModal
        open={showDeleteModal}
        title="Delete Task"
        message="Are you sure you want to delete this task? Its subtasks will also be deleted."
        itemName={task.title}
        isDeleting={isDeleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setShowDeleteModal(false)}
      />

      <Box
        sx={{
          borderRadius: 3,
          border: "1px solid #E2E8F0",
          bgcolor: "#FFFFFF",
          boxShadow: "0 1px 2px rgba(15,23,42,0.06)",
          overflow: "hidden",
        }}
      >
        <Box sx={{ pl: 0.6, pr: 1, py: 1, display: "flex", alignItems: "center", gap: 0.8 }}>
          <IconButton size="small" onClick={onToggle} sx={{ p: 0.4, color: "#475569" }}>
            <ExpandMoreIcon
              sx={{
                fontSize: 18,
                color: "#475569",
                transform: isOpen ? "rotate(0deg)" : "rotate(-90deg)",
                transition: "transform 0.15s ease",
              }}
            />
          </IconButton>

          <Chip
            size="small"
            label="H1"
            sx={{ fontSize: 10, bgcolor: "#EEF2FF", color: "#3730A3", minWidth: 34 }}
          />
          <Box
            sx={{
              width: 9,
              height: 9,
              borderRadius: "50%",
              bgcolor: statusDotColor(task.status),
              border: "1px solid #FFFFFF",
              boxShadow: "0 0 0 1px rgba(148,163,184,0.35)",
            }}
          />

          <Box sx={{ flex: 1, minWidth: 0 }}>
            {isEditing ? (
              <TextField
                size="small"
                fullWidth
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void handleSave();
                  if (e.key === "Escape") setIsEditing(false);
                }}
                disabled={isSaving}
                autoFocus
                sx={{ "& .MuiOutlinedInput-root": { fontSize: 13 } }}
              />
            ) : (
              <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: "#0F172A" }} noWrap>
                {task.title}
              </Typography>
            )}
          </Box>

          {isEditing ? (
            <>
              <IconButton size="small" onClick={() => setIsEditing(false)} disabled={isSaving}>
                <CloseIcon sx={{ fontSize: 16 }} />
              </IconButton>
              <IconButton size="small" onClick={() => void handleSave()} disabled={isSaving}>
                <CheckIcon sx={{ fontSize: 16, color: "#1D4ED8" }} />
              </IconButton>
            </>
          ) : (
            <>
              <IconButton size="small" onClick={() => setIsEditing(true)}>
                <EditOutlinedIcon sx={{ fontSize: 16, color: "#64748B" }} />
              </IconButton>
              <IconButton size="small" onClick={() => setShowDeleteModal(true)}>
                <DeleteOutlineIcon sx={{ fontSize: 16, color: "#64748B" }} />
              </IconButton>
            </>
          )}
        </Box>

        <Box
          sx={{
            px: 1.4,
            py: 0.9,
            borderTop: "1px solid #F1F5F9",
            bgcolor: "#FAFCFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
          }}
        >
          <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: "#475569" }}>
            Task status
          </Typography>
          <Select
            size="small"
            value={task.status}
            onChange={(event: SelectChangeEvent<BusinessPlanTaskStatus>) => {
              void onUpdateStatus(event.target.value);
            }}
            sx={{
              minWidth: 140,
              height: 31,
              borderRadius: 999,
              bgcolor: statusPillColor(task.status),
              border: "1px solid #D1D9E6",
              "& .MuiSelect-select": {
                fontSize: 11.8,
                fontWeight: 700,
                py: 0.45,
                px: 1.2,
                color: "#334155",
              },
              "& .MuiSelect-icon": {
                color: "#475569",
                right: 9,
              },
              "& fieldset": { border: "none" },
            }}
          >
            {statusOptions.map((option) => (
              <MenuItem key={option.value} value={option.value} sx={{ fontSize: 12 }}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </Box>

        <Collapse in={isOpen} timeout="auto" unmountOnExit>
          <Box sx={{ px: 2, pb: 1.5, pt: 0.4, borderTop: "1px solid #F1F5F9" }}>
            <Stack spacing={0.9}>
              {(task.children ?? []).length === 0 ? (
                <Typography sx={{ fontSize: 12, color: "#94A3B8", fontStyle: "italic", py: 0.6 }}>
                  No H2 subtasks yet.
                </Typography>
              ) : (
                (task.children ?? []).map((subTask) => (
                  <SubTaskRow
                    key={subTask.id}
                    subTask={subTask}
                    onUpdateTitle={(title) => onUpdateSubTaskTitle(subTask.id, title)}
                    onUpdateStatus={(status) => onUpdateSubTaskStatus(subTask.id, status)}
                    onDelete={() => onDeleteSubTask(subTask.id)}
                  />
                ))
              )}

              <CreateCard
                placeholder="New H2 subtask title..."
                value={newSubTaskTitle}
                onChange={setNewSubTaskTitle}
                onSubmit={() => void handleAddSubTask()}
                isLoading={isAddingSubTask}
              />
            </Stack>
          </Box>
        </Collapse>
      </Box>
    </>
  );
};

type SubTaskRowProps = {
  subTask: BusinessPlanTaskWithChildren;
  onUpdateTitle: (title: string) => Promise<void>;
  onUpdateStatus: (status: BusinessPlanTaskStatus) => Promise<void>;
  onDelete: () => Promise<void>;
};

const SubTaskRow: FC<SubTaskRowProps> = ({
  subTask,
  onUpdateTitle,
  onUpdateStatus,
  onDelete,
}) => {
  const params = useParams<{ workspaceId: string }>();
  const workspaceId = params.workspaceId;

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(subTask.title);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDraft, setGeneratedDraft] = useState<string | null>(null);
  const [draftError, setDraftError] = useState<string | null>(null);

  useEffect(() => {
    setTitle(subTask.title);
  }, [subTask.title]);

  const handleSave = async () => {
    const normalized = title.trim();
    if (!normalized) return;
    setIsSaving(true);
    try {
      await onUpdateTitle(normalized);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete();
    } finally {
      setIsDeleting(false);
    }
  };

  const handleGenerateDraft = async () => {
    if (!workspaceId) return;
    setIsGenerating(true);
    setDraftError(null);

    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/business-plan/tasks/${subTask.id}/ai-draft`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate AI draft");
      }

      const data = (await response.json()) as { draft?: string };
      setGeneratedDraft(data.draft?.trim() ?? null);
    } catch (error) {
      console.error("Error generating task draft:", error);
      setDraftError("Failed to generate draft. Try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Box
      sx={{
        borderRadius: 2,
        border: "1px solid #E2E8F0",
        bgcolor: "#FFFFFF",
        px: 1,
        py: 0.9,
      }}
    >
      <Stack direction="row" spacing={0.8} alignItems="center">
        <Chip
          size="small"
          label="H2"
          sx={{ fontSize: 10, bgcolor: "#ECFDF5", color: "#065F46", minWidth: 32 }}
        />

        <Box sx={{ flex: 1, minWidth: 0 }}>
          {isEditing ? (
            <TextField
              size="small"
              fullWidth
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleSave();
                if (e.key === "Escape") setIsEditing(false);
              }}
              disabled={isSaving}
              autoFocus
              sx={{ "& .MuiOutlinedInput-root": { fontSize: 12.5 } }}
            />
          ) : (
            <Typography sx={{ fontSize: 12.8, color: "#1E293B" }} noWrap>
              {subTask.title}
            </Typography>
          )}
        </Box>

        <Select
          size="small"
          value={subTask.status}
          onChange={(event: SelectChangeEvent<BusinessPlanTaskStatus>) => {
            void onUpdateStatus(event.target.value);
          }}
          sx={{
            minWidth: 122,
            height: 26,
            borderRadius: 999,
            bgcolor: statusPillColor(subTask.status),
            border: "1px solid #D1D9E6",
            "& .MuiSelect-select": { fontSize: 11, fontWeight: 700, py: 0.3, px: 0.9, color: "#334155" },
            "& .MuiSelect-icon": { color: "#475569", right: 7 },
            "& fieldset": { border: "none" },
          }}
        >
          {statusOptions.map((option) => (
            <MenuItem key={option.value} value={option.value} sx={{ fontSize: 12 }}>
              {option.label}
            </MenuItem>
          ))}
        </Select>

        <IconButton
          size="small"
          onClick={() => void handleGenerateDraft()}
          disabled={isGenerating}
          title="Ask AI to Draft"
        >
          {isGenerating ? (
            <CircularProgress size={14} />
          ) : (
            <AutoFixHighRoundedIcon sx={{ fontSize: 16, color: "#1D4ED8" }} />
          )}
        </IconButton>

        {isEditing ? (
          <>
            <IconButton size="small" onClick={() => setIsEditing(false)} disabled={isSaving}>
              <CloseIcon sx={{ fontSize: 16 }} />
            </IconButton>
            <IconButton size="small" onClick={() => void handleSave()} disabled={isSaving}>
              <CheckIcon sx={{ fontSize: 16, color: "#1D4ED8" }} />
            </IconButton>
          </>
        ) : (
          <>
            <IconButton size="small" onClick={() => setIsEditing(true)}>
              <EditOutlinedIcon sx={{ fontSize: 16, color: "#64748B" }} />
            </IconButton>
            <IconButton size="small" onClick={() => void handleDelete()} disabled={isDeleting}>
              {isDeleting ? (
                <CircularProgress size={14} />
              ) : (
                <DeleteOutlineIcon sx={{ fontSize: 16, color: "#64748B" }} />
              )}
            </IconButton>
          </>
        )}
      </Stack>

      {draftError ? (
        <Typography sx={{ mt: 0.7, fontSize: 11.5, color: "#DC2626" }}>{draftError}</Typography>
      ) : null}

      {generatedDraft ? (
        <Box
          sx={{
            mt: 0.8,
            borderRadius: 1.5,
            border: "1px solid #DBEAFE",
            bgcolor: "#EFF6FF",
            px: 1,
            py: 0.9,
          }}
        >
          <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: "#1E40AF", mb: 0.4 }}>
            AI Draft
          </Typography>
          <Typography
            sx={{
              whiteSpace: "pre-wrap",
              fontSize: 12,
              lineHeight: 1.45,
              color: "#1F2937",
            }}
          >
            {generatedDraft}
          </Typography>
        </Box>
      ) : null}
    </Box>
  );
};

const CreateCard: FC<{
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}> = ({ placeholder, value, onChange, onSubmit, isLoading }) => {
  return (
    <Box
      sx={{
        borderRadius: 2.5,
        border: "1px dashed #CBD5E1",
        bgcolor: "#FFFFFF",
        px: 1.2,
        py: 1,
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center">
        <AddIcon sx={{ fontSize: 18, color: "#3B82F6" }} />
        <TextField
          fullWidth
          size="small"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !isLoading) {
              onSubmit();
            }
          }}
          disabled={isLoading}
          sx={{ "& .MuiOutlinedInput-root": { fontSize: 12.5, bgcolor: "#FFFFFF" } }}
        />
        <IconButton size="small" onClick={onSubmit} disabled={isLoading || !value.trim()}>
          {isLoading ? <CircularProgress size={15} /> : <CheckIcon sx={{ fontSize: 16 }} />}
        </IconButton>
      </Stack>
    </Box>
  );
};
