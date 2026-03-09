// src/components/workspaceManage/pitch-deck/PitchDeckContext.tsx
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
  PitchDeck,
  PitchDeckSlide,
  PitchDeckTemplate,
  PitchDeckWithSlides,
  PitchDeckSettings,
  PitchDeckSlideContent,
  PitchDeckSlideType,
  PitchDeckSlideId,
} from "@/types/workspaces";

// ========== TYPES ==========

type PitchDeckContextValue = {
  // Data
  pitchDeck: PitchDeck | null;
  slides: PitchDeckSlide[];
  template: PitchDeckTemplate | null;
  isLoading: boolean;
  error: string | null;

  // Selected state
  selectedSlideId: PitchDeckSlideId | null;
  setSelectedSlideId: (id: PitchDeckSlideId | null) => void;

  // Actions
  refreshData: () => Promise<void>;
  updatePitchDeck: (params: { title?: string; settings?: Partial<PitchDeckSettings>; templateId?: string }) => Promise<void>;
  addSlide: (params: { title: string; slideType?: PitchDeckSlideType; content: PitchDeckSlideContent }) => Promise<void>;
  updateSlide: (slideId: string, params: { title?: string; content?: PitchDeckSlideContent }) => Promise<void>;
  deleteSlide: (slideId: string) => Promise<void>;
  duplicateSlide: (slideId: string) => Promise<void>;
  reorderSlides: (orderedSlideIds: string[]) => Promise<void>;
};

const PitchDeckContext = createContext<PitchDeckContextValue | null>(null);

export const usePitchDeck = (): PitchDeckContextValue => {
  const ctx = useContext(PitchDeckContext);
  if (!ctx) {
    throw new Error("usePitchDeck must be used within a PitchDeckProvider");
  }
  return ctx;
};

// ========== PROVIDER ==========

type PitchDeckProviderProps = {
  workspaceId: string;
  deckId: string;
  children: ReactNode;
};

export const PitchDeckProvider: FC<PitchDeckProviderProps> = ({
  workspaceId,
  deckId,
  children,
}) => {
  const [pitchDeck, setPitchDeck] = useState<PitchDeck | null>(null);
  const [slides, setSlides] = useState<PitchDeckSlide[]>([]);
  const [template, setTemplate] = useState<PitchDeckTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSlideId, setSelectedSlideId] = useState<PitchDeckSlideId | null>(null);

  // Fetch pitch deck data
  const refreshData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/workspaces/${workspaceId}/pitch-deck/${deckId}`);
      if (!response.ok) {
        throw new Error("Failed to load pitch deck");
      }

      const data = (await response.json()) as PitchDeckWithSlides;
      setPitchDeck(data.pitchDeck);
      setSlides(data.slides);
      setTemplate(data.template);

      setSelectedSlideId((currentSelectedId) => {
        if (currentSelectedId && data.slides.some((slide) => slide.id === currentSelectedId)) {
          return currentSelectedId;
        }
        return data.slides.at(0)?.id ?? null;
      });
    } catch (err) {
      console.error("Error loading pitch deck:", err);
      setError(err instanceof Error ? err.message : "Failed to load pitch deck");
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, deckId]);

  // Load data on mount
  useEffect(() => {
    void refreshData();
  }, [refreshData]);

  // Update pitch deck
  const updatePitchDeck = useCallback(
    async (params: { title?: string; settings?: Partial<PitchDeckSettings>; templateId?: string }) => {
      if (!pitchDeck) return;

      try {
        const response = await fetch(`/api/workspaces/${workspaceId}/pitch-deck/${deckId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
        });

        if (!response.ok) {
          throw new Error("Failed to update pitch deck");
        }

        const data = (await response.json()) as { pitchDeck: PitchDeck };
        setPitchDeck(data.pitchDeck);
      } catch (err) {
        console.error("Error updating pitch deck:", err);
        throw err;
      }
    },
    [workspaceId, deckId, pitchDeck]
  );

  // Add slide
  const addSlide = useCallback(
    async (params: { title: string; slideType?: PitchDeckSlideType; content: PitchDeckSlideContent }) => {
      try {
        const response = await fetch(`/api/workspaces/${workspaceId}/pitch-deck/${deckId}/slides`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
        });

        if (!response.ok) {
          throw new Error("Failed to add slide");
        }

        const data = (await response.json()) as { slide: PitchDeckSlide };
        const createdSlide = data.slide;
        setSlides((currentSlides) =>
          [...currentSlides, createdSlide].sort((a, b) => a.order_index - b.order_index)
        );
        setSelectedSlideId((currentSelectedId) => currentSelectedId ?? createdSlide.id);
      } catch (err) {
        console.error("Error adding slide:", err);
        throw err;
      }
    },
    [workspaceId, deckId]
  );

  // Update slide
  const updateSlide = useCallback(
    async (slideId: string, params: { title?: string; content?: PitchDeckSlideContent }) => {
      try {
        const response = await fetch(
          `/api/workspaces/${workspaceId}/pitch-deck/${deckId}/slides/${slideId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(params),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to update slide");
        }

        const data = (await response.json()) as { slide: PitchDeckSlide };
        const updatedSlide = data.slide;
        setSlides((currentSlides) =>
          currentSlides.map((slide) => (slide.id === slideId ? updatedSlide : slide))
        );
      } catch (err) {
        console.error("Error updating slide:", err);
        throw err;
      }
    },
    [workspaceId, deckId]
  );

  // Delete slide
  const deleteSlide = useCallback(
    async (slideId: string) => {
      try {
        const response = await fetch(
          `/api/workspaces/${workspaceId}/pitch-deck/${deckId}/slides/${slideId}`,
          { method: "DELETE" }
        );

        if (!response.ok) {
          throw new Error("Failed to delete slide");
        }

        const deletedIndex = slides.findIndex((slide) => slide.id === slideId);
        if (deletedIndex === -1) {
          return;
        }

        const nextSlides = slides.filter((slide) => slide.id !== slideId);
        setSlides(nextSlides);

        if (selectedSlideId === slideId) {
          const fallbackSlide =
            nextSlides[deletedIndex] ?? nextSlides[deletedIndex - 1] ?? nextSlides[0] ?? null;
          setSelectedSlideId(fallbackSlide?.id ?? null);
        }
      } catch (err) {
        console.error("Error deleting slide:", err);
        throw err;
      }
    },
    [workspaceId, deckId, slides, selectedSlideId]
  );

  // Duplicate slide
  const duplicateSlide = useCallback(
    async (slideId: string) => {
      try {
        const response = await fetch(
          `/api/workspaces/${workspaceId}/pitch-deck/${deckId}/slides/${slideId}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "duplicate" }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to duplicate slide");
        }

        const data = (await response.json()) as { slide: PitchDeckSlide };
        const duplicatedSlide = data.slide;
        setSlides((currentSlides) =>
          [...currentSlides, duplicatedSlide].sort((a, b) => a.order_index - b.order_index)
        );
      } catch (err) {
        console.error("Error duplicating slide:", err);
        throw err;
      }
    },
    [workspaceId, deckId]
  );

  // Reorder slides
  const reorderSlides = useCallback(
    async (orderedSlideIds: string[]) => {
      try {
        // Optimistic update
        const reorderedSlides = orderedSlideIds
          .map((id) => slides.find((s) => s.id === id))
          .filter((s): s is PitchDeckSlide => s !== undefined);
        setSlides(reorderedSlides);

        const response = await fetch(`/api/workspaces/${workspaceId}/pitch-deck/${deckId}/slides`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "reorder", orderedSlideIds }),
        });

        if (!response.ok) {
          await refreshData();
          throw new Error("Failed to reorder slides");
        }
      } catch (err) {
        console.error("Error reordering slides:", err);
        throw err;
      }
    },
    [workspaceId, deckId, slides, refreshData]
  );

  const value: PitchDeckContextValue = {
    pitchDeck,
    slides,
    template,
    isLoading,
    error,
    selectedSlideId,
    setSelectedSlideId,
    refreshData,
    updatePitchDeck,
    addSlide,
    updateSlide,
    deleteSlide,
    duplicateSlide,
    reorderSlides,
  };

  return (
    <PitchDeckContext.Provider value={value}>
      {children}
    </PitchDeckContext.Provider>
  );
};
