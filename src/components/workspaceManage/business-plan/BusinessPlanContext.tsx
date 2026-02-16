"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type FC,
  type ReactNode,
} from "react";
import type {
  BusinessPlan,
  BusinessPlanChapter,
  BusinessPlanSection,
  BusinessPlanTask,
  BusinessPlanChapterWithSections,
  BusinessPlanTaskWithChildren,
  BusinessPlanTaskStatus,
  BusinessPlanSectionType,
  BusinessPlanSectionContent,
  BusinessPlanChapterId,
  BusinessPlanSectionId,
  BusinessPlanAiMessage,
  BusinessPlanAiConversationId,
  BusinessPlanPendingChange,
} from "@/types/workspaces";

// ========== TYPES ==========

type BusinessPlanContextValue = {
  // Data
  businessPlan: BusinessPlan | null;
  chapters: BusinessPlanChapterWithSections[];
  tasks: BusinessPlanTaskWithChildren[];
  isLoading: boolean;
  isTasksLoading: boolean;
  error: string | null;

  // Selected state
  selectedChapterId: BusinessPlanChapterId | null;
  selectedSectionId: BusinessPlanSectionId | null;
  setSelectedChapterId: (id: BusinessPlanChapterId | null) => void;
  setSelectedSectionId: (id: BusinessPlanSectionId | null) => void;

  // Actions
  refreshData: () => Promise<void>;
  refreshTasks: () => Promise<void>;
  updateBusinessPlanTitle: (title: string) => Promise<void>;
  addChapter: (title: string, parentChapterId?: string | null) => Promise<void>;
  updateChapter: (chapterId: string, title: string) => Promise<void>;
  deleteChapter: (chapterId: string) => Promise<void>;
  reorderChapters: (orderedChapterIds: string[]) => Promise<void>;
  addSection: (
    chapterId: string,
    sectionType: BusinessPlanSectionType,
    content: BusinessPlanSectionContent
  ) => Promise<void>;
  updateSection: (
    sectionId: string,
    content: BusinessPlanSectionContent
  ) => Promise<void>;
  reorderSections: (chapterId: string, orderedSectionIds: string[]) => Promise<void>;
  deleteSection: (sectionId: string) => Promise<void>;
  addTask: (params: {
    title: string;
    hierarchyLevel: "h1" | "h2";
    parentTaskId?: string | null;
    instructions?: string;
    aiPrompt?: string;
  }) => Promise<void>;
  updateTask: (
    taskId: string,
    updates: {
      title?: string;
      instructions?: string;
      aiPrompt?: string;
      status?: BusinessPlanTaskStatus;
    }
  ) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;

  // AI chat state
  conversationId: BusinessPlanAiConversationId | null;
  messages: BusinessPlanAiMessage[];
  pendingChanges: BusinessPlanPendingChange[];
  lastAppliedTaskChange: {
    taskId: string;
    parentTaskId: string | null;
    changedAt: number;
  } | null;
  isChatLoading: boolean;
  isChatSending: boolean;
  chatError: string | null;
  refreshChat: () => Promise<void>;
  sendChatMessage: (content: string) => Promise<void>;
  acceptPendingChange: (changeId: string) => Promise<void>;
  rejectPendingChange: (changeId: string) => Promise<void>;
};

const BusinessPlanContext = createContext<BusinessPlanContextValue | null>(null);

export const useBusinessPlan = (): BusinessPlanContextValue => {
  const ctx = useContext(BusinessPlanContext);
  if (!ctx) {
    throw new Error("useBusinessPlan must be used within a BusinessPlanProvider");
  }
  return ctx;
};

// ========== PROVIDER ==========

type BusinessPlanProviderProps = {
  workspaceId: string;
  children: ReactNode;
};

export const BusinessPlanProvider: FC<BusinessPlanProviderProps> = ({
  workspaceId,
  children,
}) => {
  const [businessPlan, setBusinessPlan] = useState<BusinessPlan | null>(null);
  const [chapters, setChapters] = useState<BusinessPlanChapterWithSections[]>([]);
  const [tasks, setTasks] = useState<BusinessPlanTaskWithChildren[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTasksLoading, setIsTasksLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<BusinessPlanChapterId | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<BusinessPlanSectionId | null>(null);
  const [conversationId, setConversationId] = useState<BusinessPlanAiConversationId | null>(null);
  const [messages, setMessages] = useState<BusinessPlanAiMessage[]>([]);
  const [pendingChanges, setPendingChanges] = useState<BusinessPlanPendingChange[]>([]);
  const [lastAppliedTaskChange, setLastAppliedTaskChange] = useState<{
    taskId: string;
    parentTaskId: string | null;
    changedAt: number;
  } | null>(null);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isChatSending, setIsChatSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  // Fetch business plan data
  const refreshData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/workspaces/${workspaceId}/business-plan`);
      if (!response.ok) {
        throw new Error("Failed to load business plan");
      }

      const data = (await response.json()) as {
        businessPlan: BusinessPlan | null;
        chapters: BusinessPlanChapterWithSections[];
      };
      setBusinessPlan(data.businessPlan);
      setChapters(data.chapters ?? []);
    } catch (err) {
      console.error("Error loading business plan:", err);
      setError(err instanceof Error ? err.message : "Failed to load business plan");
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  const refreshTasks = useCallback(async () => {
    try {
      setIsTasksLoading(true);

      const response = await fetch(`/api/workspaces/${workspaceId}/business-plan/tasks`);
      if (!response.ok) {
        throw new Error("Failed to load business plan tasks");
      }

      const data = (await response.json()) as {
        businessPlanId: string;
        tasks: BusinessPlanTaskWithChildren[];
      };
      setTasks(data.tasks ?? []);
    } catch (err) {
      console.error("Error loading business plan tasks:", err);
      setError(err instanceof Error ? err.message : "Failed to load business plan tasks");
    } finally {
      setIsTasksLoading(false);
    }
  }, [workspaceId]);

  // Load data on mount
  useEffect(() => {
    void refreshData();
  }, [refreshData]);

  useEffect(() => {
    void refreshTasks();
  }, [refreshTasks]);

  // Update business plan title
  const updateBusinessPlanTitle = useCallback(
    async (title: string) => {
      if (!businessPlan) return;

      try {
        const response = await fetch(`/api/workspaces/${workspaceId}/business-plan`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ businessPlanId: businessPlan.id, title }),
        });

        if (!response.ok) {
          throw new Error("Failed to update title");
        }

        const data = (await response.json()) as { businessPlan: BusinessPlan };
        setBusinessPlan(data.businessPlan);
      } catch (err) {
        console.error("Error updating title:", err);
        throw err;
      }
    },
    [workspaceId, businessPlan]
  );

  // Add chapter
  const addChapter = useCallback(
    async (title: string, parentChapterId?: string | null) => {
      if (!businessPlan) return;

      try {
        const response = await fetch(
          `/api/workspaces/${workspaceId}/business-plan/chapters`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              businessPlanId: businessPlan.id,
              title,
              parentChapterId: parentChapterId ?? null,
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to add chapter");
        }

        // Refresh to get updated structure
        await refreshData();
      } catch (err) {
        console.error("Error adding chapter:", err);
        throw err;
      }
    },
    [workspaceId, businessPlan, refreshData]
  );

  // Update chapter
  const updateChapter = useCallback(
    async (chapterId: string, title: string) => {
      try {
        const response = await fetch(
          `/api/workspaces/${workspaceId}/business-plan/chapters/${chapterId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to update chapter");
        }

        await refreshData();
      } catch (err) {
        console.error("Error updating chapter:", err);
        throw err;
      }
    },
    [workspaceId, refreshData]
  );

  // Delete chapter
  const deleteChapter = useCallback(
    async (chapterId: string) => {
      try {
        const response = await fetch(
          `/api/workspaces/${workspaceId}/business-plan/chapters/${chapterId}`,
          { method: "DELETE" }
        );

        if (!response.ok) {
          throw new Error("Failed to delete chapter");
        }

        // Clear selection if deleted chapter was selected
        if (selectedChapterId === chapterId) {
          setSelectedChapterId(null);
          setSelectedSectionId(null);
        }

        await refreshData();
      } catch (err) {
        console.error("Error deleting chapter:", err);
        throw err;
      }
    },
    [workspaceId, refreshData, selectedChapterId]
  );

  // Reorder chapters
  const reorderChapters = useCallback(
    async (orderedChapterIds: string[]) => {
      try {
        // Optimistically update the local state
        const reorderedChapters = orderedChapterIds
          .map((id) => chapters.find((c) => c.id === id))
          .filter((c): c is BusinessPlanChapterWithSections => c !== undefined);
        setChapters(reorderedChapters);

        // Send the new order to the server
        const response = await fetch(
          `/api/workspaces/${workspaceId}/business-plan/chapters/reorder`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderedChapterIds }),
          }
        );

        if (!response.ok) {
          // Revert on error
          await refreshData();
          throw new Error("Failed to reorder chapters");
        }
      } catch (err) {
        console.error("Error reordering chapters:", err);
        throw err;
      }
    },
    [workspaceId, chapters, refreshData]
  );

  // Add section
  const addSection = useCallback(
    async (
      chapterId: string,
      sectionType: BusinessPlanSectionType,
      content: BusinessPlanSectionContent
    ) => {
      try {
        const response = await fetch(
          `/api/workspaces/${workspaceId}/business-plan/sections`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chapterId, sectionType, content }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to add section");
        }

        await refreshData();
      } catch (err) {
        console.error("Error adding section:", err);
        throw err;
      }
    },
    [workspaceId, refreshData]
  );

  // Update section
  const updateSection = useCallback(
    async (sectionId: string, content: BusinessPlanSectionContent) => {
      try {
        const response = await fetch(
          `/api/workspaces/${workspaceId}/business-plan/sections/${sectionId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to update section");
        }

        await refreshData();
      } catch (err) {
        console.error("Error updating section:", err);
        throw err;
      }
    },
    [workspaceId, refreshData]
  );

  // Delete section
  const deleteSection = useCallback(
    async (sectionId: string) => {
      try {
        const response = await fetch(
          `/api/workspaces/${workspaceId}/business-plan/sections/${sectionId}`,
          { method: "DELETE" }
        );

        if (!response.ok) {
          throw new Error("Failed to delete section");
        }

        if (selectedSectionId === sectionId) {
          setSelectedSectionId(null);
        }

        await refreshData();
      } catch (err) {
        console.error("Error deleting section:", err);
        throw err;
      }
    },
    [workspaceId, refreshData, selectedSectionId]
  );

  // Reorder sections within a chapter
  const reorderSections = useCallback(
    async (chapterId: string, orderedSectionIds: string[]) => {
      try {
        // Optimistically update local state
        setChapters((prev) => {
          const reorderInTree = (
            nodes: BusinessPlanChapterWithSections[]
          ): BusinessPlanChapterWithSections[] =>
            nodes.map((node) => {
              if (node.id === chapterId) {
                const orderedSections = orderedSectionIds
                  .map((id) => node.sections.find((section) => section.id === id))
                  .filter(
                    (section): section is BusinessPlanChapterWithSections["sections"][number] =>
                      section != null
                  );
                return {
                  ...node,
                  sections: orderedSections,
                };
              }
              if (node.children?.length) {
                return { ...node, children: reorderInTree(node.children) };
              }
              return node;
            });

          return reorderInTree(prev);
        });

        await Promise.all(
          orderedSectionIds.map((sectionId, index) =>
            fetch(`/api/workspaces/${workspaceId}/business-plan/sections/${sectionId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderIndex: index }),
            })
          )
        );

        await refreshData();
      } catch (err) {
        console.error("Error reordering sections:", err);
        await refreshData();
        throw err;
      }
    },
    [workspaceId, refreshData]
  );

  const addTask = useCallback(
    async (params: {
      title: string;
      hierarchyLevel: "h1" | "h2";
      parentTaskId?: string | null;
      instructions?: string;
      aiPrompt?: string;
    }) => {
      if (!businessPlan) {
        throw new Error("Business plan is not ready yet.");
      }

      const response = await fetch(`/api/workspaces/${workspaceId}/business-plan/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessPlanId: businessPlan.id,
          title: params.title,
          parentTaskId: params.parentTaskId ?? null,
          instructions: params.instructions,
          aiPrompt: params.aiPrompt,
          hierarchyLevel: params.hierarchyLevel,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create task");
      }

      await refreshTasks();
    },
    [workspaceId, businessPlan, refreshTasks]
  );

  const updateTask = useCallback(
    async (
      taskId: string,
      updates: {
        title?: string;
        instructions?: string;
        aiPrompt?: string;
        status?: BusinessPlanTaskStatus;
      }
    ) => {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/business-plan/tasks/${taskId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update task");
      }

      await refreshTasks();
    },
    [workspaceId, refreshTasks]
  );

  const deleteTask = useCallback(
    async (taskId: string) => {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/business-plan/tasks/${taskId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete task");
      }

      await refreshTasks();
    },
    [workspaceId, refreshTasks]
  );

  const refreshChat = useCallback(async () => {
    try {
      setIsChatLoading(true);
      setChatError(null);

      const [conversationRes, pendingRes] = await Promise.all([
        fetch(`/api/workspaces/${workspaceId}/business-plan/ai/conversation`),
        fetch(`/api/workspaces/${workspaceId}/business-plan/ai/pending-changes`),
      ]);

      if (!conversationRes.ok) {
        throw new Error("Failed to load AI conversation");
      }

      const conversationData = (await conversationRes.json()) as {
        conversation: { id: BusinessPlanAiConversationId };
        messages: BusinessPlanAiMessage[];
      };
      setConversationId(conversationData.conversation.id);
      setMessages(conversationData.messages ?? []);

      if (!pendingRes.ok) {
        throw new Error("Failed to load pending changes");
      }

      const pendingData = (await pendingRes.json()) as {
        pendingChanges: BusinessPlanPendingChange[];
      };
      setPendingChanges(pendingData.pendingChanges ?? []);
    } catch (err) {
      console.error("Error loading AI conversation:", err);
      setChatError(err instanceof Error ? err.message : "Failed to load AI conversation");
    } finally {
      setIsChatLoading(false);
    }
  }, [workspaceId]);

  const sendChatMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      const tempId = `temp-${Date.now()}`;
      const optimisticMessage: BusinessPlanAiMessage = {
        id: tempId,
        conversation_id: conversationId ?? "temp",
        role: "user",
        content: content.trim(),
        metadata: null,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, optimisticMessage]);
      setIsChatSending(true);
      setChatError(null);

      try {
        const response = await fetch(
          `/api/workspaces/${workspaceId}/business-plan/ai/chat`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              conversationId,
              message: content.trim(),
              selectedChapterId,
              selectedTaskId: null, // TODO: Add selectedTaskId to context if needed
            }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || "Failed to send message");
        }

        const data = (await response.json()) as {
          conversation: { id: BusinessPlanAiConversationId };
          userMessage: BusinessPlanAiMessage;
          assistantMessage: BusinessPlanAiMessage;
          pendingChanges?: BusinessPlanPendingChange[];
        };

        setConversationId(data.conversation.id);
        setMessages((prev) => [
          ...prev.filter((msg) => msg.id !== tempId),
          data.userMessage,
          data.assistantMessage,
        ]);

        const newChanges = data.pendingChanges ?? [];
        if (newChanges.length > 0) {
          setPendingChanges((prev) => [...prev, ...newChanges]);
        }
      } catch (err) {
        console.error("Error sending chat message:", err);
        setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
        setChatError(err instanceof Error ? err.message : "Failed to send message");
      } finally {
        setIsChatSending(false);
      }
    },
    [workspaceId, conversationId, selectedChapterId]
  );

  const acceptPendingChange = useCallback(
    async (changeId: string) => {
      try {
        const response = await fetch(
          `/api/workspaces/${workspaceId}/business-plan/ai/pending-changes/${changeId}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "accept" }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          const actionableError = parseActionableError(errorText);
          throw new Error(actionableError);
        }

        const data = (await response.json()) as {
          success: boolean;
          action: "accepted";
          result?: {
            chapter?: BusinessPlanChapter;
            section?: BusinessPlanSection;
            task?: BusinessPlanTask;
          };
        };

        if (data.result?.section) {
          setSelectedChapterId(data.result.section.chapter_id);
          setSelectedSectionId(data.result.section.id);
        } else if (data.result?.chapter) {
          setSelectedChapterId(data.result.chapter.id);
          setSelectedSectionId(null);
        }

        if (data.result?.task) {
          setLastAppliedTaskChange({
            taskId: data.result.task.id,
            parentTaskId: data.result.task.parent_task_id ?? null,
            changedAt: Date.now(),
          });
        }

        await refreshData();
        await refreshTasks();
        await refreshChat();
      } catch (err) {
        console.error("Error accepting pending change:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to accept change";
        setChatError(errorMessage);
      }
    },
    [workspaceId, refreshData, refreshTasks, refreshChat]
  );

  // Helper to parse server errors into actionable messages
  const parseActionableError = (errorText: string): string => {
    // Map common server errors to user-friendly messages
    if (errorText.includes("target chapter could not be resolved")) {
      return "Could not find the target chapter. It may have been deleted or renamed. Please try again with the correct chapter.";
    }
    if (errorText.includes("target section ID is missing")) {
      return "Could not identify the section to update. Please try again.";
    }
    if (errorText.includes("target task is missing")) {
      return "Could not find the target task. It may have been deleted. Please try again.";
    }
    if (errorText.includes("no updates provided")) {
      return "No changes were specified. Please provide the updates you want to make.";
    }
    if (errorText.includes("parent H1 task could not be resolved")) {
      return "Could not find the parent task for this subtask. Please ensure the parent task exists.";
    }
    if (errorText.includes("chapter could not be resolved")) {
      return "Could not find the target chapter. Please ensure the chapter exists or specify it more precisely.";
    }
    if (errorText.includes("already been resolved")) {
      return "This change has already been processed. Please refresh to see the latest state.";
    }
    // Return original if no specific mapping
    return errorText || "An unexpected error occurred. Please try again.";
  };

  const rejectPendingChange = useCallback(
    async (changeId: string) => {
      setChatError(null);
      try {
        const response = await fetch(
          `/api/workspaces/${workspaceId}/business-plan/ai/pending-changes/${changeId}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "reject" }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || "Failed to reject change");
        }

        await refreshChat();
      } catch (err) {
        console.error("Error rejecting pending change:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to reject change";
        setChatError(errorMessage);
      }
    },
    [workspaceId, refreshChat]
  );

  const value: BusinessPlanContextValue = {
    businessPlan,
    chapters,
    tasks,
    isLoading,
    isTasksLoading,
    error,
    selectedChapterId,
    selectedSectionId,
    setSelectedChapterId,
    setSelectedSectionId,
    refreshData,
    refreshTasks,
    updateBusinessPlanTitle,
    addChapter,
    updateChapter,
    deleteChapter,
    reorderChapters,
    addSection,
    updateSection,
    reorderSections,
    deleteSection,
    addTask,
    updateTask,
    deleteTask,
    conversationId,
    messages,
    pendingChanges,
    lastAppliedTaskChange,
    isChatLoading,
    isChatSending,
    chatError,
    refreshChat,
    sendChatMessage,
    acceptPendingChange,
    rejectPendingChange,
  };

  return (
    <BusinessPlanContext.Provider value={value}>
      {children}
    </BusinessPlanContext.Provider>
  );
};
