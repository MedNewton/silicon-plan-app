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
  BusinessPlanChapterWithSections,
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
  isLoading: boolean;
  error: string | null;

  // Selected state
  selectedChapterId: BusinessPlanChapterId | null;
  selectedSectionId: BusinessPlanSectionId | null;
  setSelectedChapterId: (id: BusinessPlanChapterId | null) => void;
  setSelectedSectionId: (id: BusinessPlanSectionId | null) => void;

  // Actions
  refreshData: () => Promise<void>;
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

  // AI chat state
  conversationId: BusinessPlanAiConversationId | null;
  messages: BusinessPlanAiMessage[];
  pendingChanges: BusinessPlanPendingChange[];
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<BusinessPlanChapterId | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<BusinessPlanSectionId | null>(null);
  const [conversationId, setConversationId] = useState<BusinessPlanAiConversationId | null>(null);
  const [messages, setMessages] = useState<BusinessPlanAiMessage[]>([]);
  const [pendingChanges, setPendingChanges] = useState<BusinessPlanPendingChange[]>([]);
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

  // Load data on mount
  useEffect(() => {
    void refreshData();
  }, [refreshData]);

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
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to send message");
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
    [workspaceId, conversationId]
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
          throw new Error("Failed to accept change");
        }

        await refreshData();
        await refreshChat();
      } catch (err) {
        console.error("Error accepting pending change:", err);
        setChatError(err instanceof Error ? err.message : "Failed to accept change");
      }
    },
    [workspaceId, refreshData, refreshChat]
  );

  const rejectPendingChange = useCallback(
    async (changeId: string) => {
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
          throw new Error("Failed to reject change");
        }

        await refreshChat();
      } catch (err) {
        console.error("Error rejecting pending change:", err);
        setChatError(err instanceof Error ? err.message : "Failed to reject change");
      }
    },
    [workspaceId, refreshChat]
  );

  const value: BusinessPlanContextValue = {
    businessPlan,
    chapters,
    isLoading,
    error,
    selectedChapterId,
    selectedSectionId,
    setSelectedChapterId,
    setSelectedSectionId,
    refreshData,
    updateBusinessPlanTitle,
    addChapter,
    updateChapter,
    deleteChapter,
    reorderChapters,
    addSection,
    updateSection,
    reorderSections,
    deleteSection,
    conversationId,
    messages,
    pendingChanges,
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
