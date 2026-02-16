// src/components/workspaceManage/business-plan/ManageBusinessPlanContentArea.tsx
"use client";

import type { FC, ReactNode, HTMLAttributes } from "react";
import { useCallback, useMemo, useState } from "react";
import {
  Box,
  IconButton,
  Typography,
  CircularProgress,
} from "@mui/material";
import { toast } from "react-toastify";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import OpenWithRoundedIcon from "@mui/icons-material/OpenWithRounded";
import AutoFixHighRoundedIcon from "@mui/icons-material/AutoFixHighRounded";

import ManageAiTabs, { type ManageAiTab } from "./ManageAiTabs";
import type { ManageTopTab } from "./ManageTopTabs";
import { useBusinessPlan } from "./BusinessPlanContext";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import SectionEditorModal from "./SectionEditorModal";
import SectionAiDrawer from "./SectionAiDrawer";
import type {
  BusinessPlanChapterWithSections,
  BusinessPlanSection,
  BusinessPlanSectionContent,
} from "@/types/workspaces";

export type ManageBusinessPlanContentAreaProps = Readonly<{
  activeTopTab: ManageTopTab;
  activeAiTab: ManageAiTab;
  onAiTabChange: (tab: ManageAiTab) => void;
}>;

const ManageBusinessPlanContentArea: FC<ManageBusinessPlanContentAreaProps> = ({
  activeTopTab: _activeTopTab,
  activeAiTab,
  onAiTabChange,
}) => {
  const renderChatColumn = () => (
    <Box
      sx={{
        width: 360,
        borderRight: "1px solid #E5E7EB",
        bgcolor: "#FFFFFF",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        minHeight: 0,
      }}
    >
      <ManageAiTabs activeTab={activeAiTab} onTabChange={onAiTabChange} />
    </Box>
  );

  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        minHeight: 0,
      }}
    >
      {renderChatColumn()}
      <BusinessPlanPreview />
    </Box>
  );
};

export default ManageBusinessPlanContentArea;

// ========== BUSINESS PLAN PREVIEW ==========

const BusinessPlanPreview: FC = () => {
  const { businessPlan, chapters, isLoading, error, updateSection } = useBusinessPlan();
  const [aiDrawerSection, setAiDrawerSection] = useState<BusinessPlanSection | null>(
    null
  );
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);

  const blocks = useMemo(() => {
    const items: Array<{ id: string; node: ReactNode }> = [];
    items.push({
      id: "plan-title",
      node: <PlanTitleBlock title={businessPlan?.title ?? "Business Plan"} />,
    });
    if (chapters.length === 0) {
      items.push({ id: "empty-state", node: <EmptyState /> });
    } else {
      chapters.forEach((chapter) => {
        items.push({
          id: chapter.id,
          node: (
            <ChapterBlock
              chapter={chapter}
              onOpenAi={(section) => {
                setAiDrawerSection(section);
                setIsAiDrawerOpen(true);
              }}
            />
          ),
        });
      });
    }
    return items;
  }, [businessPlan?.title, chapters]);


  if (isLoading) {
    return (
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "#F3F4FB",
        }}
      >
        <CircularProgress sx={{ color: "#4C6AD2" }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "#F3F4FB",
        }}
      >
        <Typography sx={{ color: "#EF4444" }}>{error}</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        flex: 1,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        bgcolor: "#F3F4FB",
      }}
    >
      <Box
        sx={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          overflowY: "auto",
          px: 4,
          py: 3,
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: 720,
            borderRadius: 3,
            border: "1px solid #E5E7EB",
            bgcolor: "#FFFFFF",
            px: 4,
            py: 3.2,
            display: "flex",
            flexDirection: "column",
            gap: 2.2,
          }}
        >
          {blocks.map((block) => (
            <Box key={block.id}>{block.node}</Box>
          ))}
        </Box>
      </Box>

      <SectionAiDrawer
        open={isAiDrawerOpen}
        section={aiDrawerSection}
        onClose={() => setIsAiDrawerOpen(false)}
        onSave={async (content) => {
          if (!aiDrawerSection) return;
          await updateSection(aiDrawerSection.id, content);
        }}
      />
    </Box>
  );
};

const PlanTitleBlock: FC<{ title: string }> = ({ title }) => (
  <Box>
    <Typography
      sx={{
        fontSize: 24,
        fontWeight: 700,
        color: "#111827",
        mb: 1.2,
      }}
    >
      {title}
    </Typography>
    <Box
      sx={{
        height: 2,
        borderRadius: 999,
        bgcolor: "#D3DDF5",
      }}
    />
  </Box>
);

// ========== EMPTY STATE ==========

const EmptyState: FC = () => {
  const { addChapter } = useBusinessPlan();
  const [isAdding, setIsAdding] = useState(false);

  const handleAddChapter = async () => {
    setIsAdding(true);
    try {
      await addChapter("Executive Summary");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Box
      sx={{
        py: 6,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Typography
        sx={{
          fontSize: 16,
          color: "#6B7280",
          mb: 2,
          textAlign: "center",
        }}
      >
        Your business plan is empty. Add a chapter to get started.
      </Typography>
      <Box
        onClick={isAdding ? undefined : handleAddChapter}
        sx={{
          px: 3,
          py: 1.5,
          borderRadius: 2,
          bgcolor: "#4C6AD2",
          color: "#FFFFFF",
          fontSize: 14,
          fontWeight: 600,
          cursor: isAdding ? "default" : "pointer",
          opacity: isAdding ? 0.7 : 1,
          "&:hover": {
            bgcolor: isAdding ? "#4C6AD2" : "#3B5AC5",
          },
        }}
      >
        {isAdding ? "Adding..." : "Add First Chapter"}
      </Box>
    </Box>
  );
};

// ========== CHAPTER BLOCK ==========

type ChapterBlockProps = {
  chapter: BusinessPlanChapterWithSections;
  onOpenAi?: (section: BusinessPlanSection) => void;
};

const ChapterBlock: FC<ChapterBlockProps> = ({ chapter, onOpenAi }) => {
  const { reorderSections, selectedChapterId, setSelectedChapterId } = useBusinessPlan();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleSectionDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const sectionIds = chapter.sections.map((section) => section.id);
    const oldIndex = sectionIds.indexOf(active.id as string);
    const newIndex = sectionIds.indexOf(over.id as string);
    if (oldIndex == -1 || newIndex == -1) return;

    const orderedSectionIds = arrayMove(sectionIds, oldIndex, newIndex);
    void reorderSections(chapter.id, orderedSectionIds);
  };

  const sectionIds = chapter.sections.map((section) => section.id);
  const isSelected = selectedChapterId === chapter.id;

  const handleChapterClick = (event: React.MouseEvent) => {
    // Don't select if clicking on a child element (section)
    if (event.target !== event.currentTarget) return;
    setSelectedChapterId(isSelected ? null : chapter.id);
  };

  return (
    <Box sx={{ mb: 2 }}>
      {/* Chapter Title - Now clickable for selection */}
      <Typography
        onClick={handleChapterClick}
        sx={{
          fontSize: 20,
          fontWeight: 700,
          color: isSelected ? "#4C6AD2" : "#111827",
          bgcolor: isSelected ? "rgba(76,106,210,0.08)" : "transparent",
          mb: 1.5,
          px: 1.5,
          py: 0.75,
          mx: -1.5,
          borderRadius: 2,
          cursor: "pointer",
          transition: "all 0.2s ease",
          border: isSelected ? "2px solid #4C6AD2" : "2px solid transparent",
          "&:hover": {
            bgcolor: isSelected ? "rgba(76,106,210,0.12)" : "rgba(76,106,210,0.04)",
            borderColor: isSelected ? "#4C6AD2" : "rgba(76,106,210,0.2)",
          },
        }}
      >
        {chapter.title}
        {isSelected && (
          <Box
            component="span"
            sx={{
              ml: 1.5,
              fontSize: 11,
              fontWeight: 600,
              color: "#4C6AD2",
              bgcolor: "#FFFFFF",
              px: 1,
              py: 0.25,
              borderRadius: 1,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            Selected
          </Box>
        )}
      </Typography>

      {/* Sections */}
      {chapter.sections.length === 0 ? (
        <Typography
          sx={{
            fontSize: 14,
            color: "#9CA3AF",
            fontStyle: "italic",
            py: 2,
          }}
        >
          No content yet. Add sections from the right sidebar.
        </Typography>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleSectionDragEnd}
        >
          <SortableContext items={sectionIds} strategy={verticalListSortingStrategy}>
            {chapter.sections.map((section) => (
              <SortableSectionBlock
                key={section.id}
                section={section}
                onOpenAi={onOpenAi}
              />
            ))}
          </SortableContext>
        </DndContext>
      )}

      {/* Nested chapters */}
      {chapter.children && chapter.children.length > 0 && (
        <Box sx={{ ml: 3, mt: 2 }}>
          {chapter.children.map((child) => (
            <ChapterBlock key={child.id} chapter={child} onOpenAi={onOpenAi} />
          ))}
        </Box>
      )}
    </Box>
  );
};

type SortableSectionBlockProps = {
  section: BusinessPlanSection;
  onOpenAi?: (section: BusinessPlanSection) => void;
};

const SortableSectionBlock: FC<SortableSectionBlockProps> = ({
  section,
  onOpenAi,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Box ref={setNodeRef} style={style} sx={{ opacity: isDragging ? 0.6 : 1 }}>
      <SectionBlock
        section={section}
        onOpenAi={onOpenAi}
        dragHandleProps={{ ...attributes, ...listeners } as HTMLAttributes<HTMLSpanElement>}
        dragHandleRef={setActivatorNodeRef as (element: HTMLSpanElement | null) => void}
      />
    </Box>
  );
};

// ========== SECTION BLOCK ==========


type SectionBlockProps = {
  section: BusinessPlanSection;
  onOpenAi?: (section: BusinessPlanSection) => void;
  dragHandleProps?: HTMLAttributes<HTMLSpanElement>;
  dragHandleRef?: (element: HTMLSpanElement | null) => void;
};

const SectionBlock: FC<SectionBlockProps> = ({
  section,
  onOpenAi,
  dragHandleProps,
  dragHandleRef,
}) => {
  const { updateSection, deleteSection, selectedSectionId, setSelectedSectionId } =
    useBusinessPlan();
  const [showEditorModal, setShowEditorModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isSelected = selectedSectionId === section.id;

  // Check if this section type is editable (page_break is not)
  const isEditable = section.content.type !== "page_break";
  const isAiSupported =
    section.content.type === "text" ||
    section.content.type === "section_title" ||
    section.content.type === "subsection" ||
    section.content.type === "list" ||
    section.content.type === "table" ||
    section.content.type === "comparison_table";

  const handleStartEdit = useCallback(() => {
    setShowEditorModal(true);
  }, []);

  const handleSaveEdit = async (newContent: BusinessPlanSectionContent) => {
    setIsSaving(true);
    try {
      await updateSection(section.id, newContent);
      setShowEditorModal(false);
    } catch (err) {
      console.error("Failed to save:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteSection(section.id);
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  // Get a label for the section to show in the delete modal
  const getSectionLabel = () => {
    const content = section.content;
    if (content?.type === "text") {
      return content.text.length > 50 ? content.text.slice(0, 50) + "..." : content.text;
    } else if (content?.type === "section_title" || content?.type === "subsection") {
      return content.text;
    }
    const contentType = (content as { type?: string } | null | undefined)?.type;
    const fallbackType = contentType?.replace("_", " ") ?? "unsupported";
    return `${fallbackType} section`;
  };

  const getSectionPlainText = () => {
    const content = section.content;
    if (!content || typeof content !== "object") return "";
    switch (content.type) {
      case "section_title":
      case "subsection":
      case "text":
        return content.text ?? "";
      case "list":
        return content.items?.join("\n") ?? "";
      case "table":
      case "comparison_table":
        return [content.headers?.join("\t"), ...(content.rows ?? []).map((r) => r.join("\t"))]
          .filter(Boolean)
          .join("\n");
      case "timeline":
        return (content.entries ?? [])
          .map((entry) => `${entry.date} - ${entry.title}${entry.description ? `: ${entry.description}` : ""}`)
          .join("\n");
      case "image":
        return content.caption ?? content.alt_text ?? content.url ?? "";
      case "embed":
        return content.code ?? "";
      case "page_break":
      case "empty_space":
      default:
        return "";
    }
  };

  const handleCopy = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    const text = getSectionPlainText();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch (err) {
      console.error("Failed to copy section content:", err);
    }
  };

  const renderContent = () => {
    const content = section.content;

    switch (content.type) {
      case "section_title":
        return (
          <Typography
            component="h2"
            sx={{
              fontSize: 20,
              fontWeight: 600,
              color: "#111827",
              m: 0,
            }}
          >
            {content.text}
          </Typography>
        );

      case "subsection":
        return (
          <Typography
            component="h3"
            sx={{
              fontSize: 17,
              fontWeight: 600,
              color: "#111827",
              m: 0,
            }}
          >
            {content.text}
          </Typography>
        );

      case "text":
        return (
          <Typography
            sx={{ fontSize: 14, color: "#4B5563", lineHeight: 1.7 }}
          >
            {content.text}
          </Typography>
        );

      case "list": {
        const ListComponent = content.ordered ? "ol" : "ul";
        return (
          <Box component={ListComponent} sx={{ m: 0, pl: 3 }}>
            {content.items.map((item, idx) => (
              <Box component="li" key={idx} sx={{ fontSize: 14, color: "#4B5563", mb: 0.5 }}>
                {item}
              </Box>
            ))}
          </Box>
        );
      }

      case "table":
      case "comparison_table":
        return (
          <Box sx={{ overflowX: "auto" }}>
            <Box
              component="table"
              sx={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 14,
                "& th, & td": {
                  border: "1px solid #E5E7EB",
                  px: 2,
                  py: 1,
                  textAlign: "left",
                },
                "& th": {
                  bgcolor: "#F9FAFB",
                  fontWeight: 600,
                  color: "#374151",
                },
                "& td": {
                  color: "#4B5563",
                },
              }}
            >
              <thead>
                <tr>
                  {content.headers.map((header, idx) => (
                    <Box component="th" key={idx}>{header}</Box>
                  ))}
                </tr>
              </thead>
              <tbody>
                {content.rows.map((row, rowIdx) => (
                  <tr key={rowIdx}>
                    {row.map((cell, cellIdx) => (
                      <Box component="td" key={cellIdx}>{cell}</Box>
                    ))}
                  </tr>
                ))}
              </tbody>
            </Box>
          </Box>
        );

      case "image":
        return (
          <Box sx={{ textAlign: "center" }}>
            {content.url ? (
              <>
                <Box
                  component="img"
                  src={content.url}
                  alt={content.alt_text ?? "Image"}
                  sx={{
                    maxWidth: "100%",
                    maxHeight: 300,
                    borderRadius: 2,
                    border: "1px solid #E5E7EB",
                  }}
                />
                {content.caption && (
                  <Typography
                    sx={{
                      mt: 1,
                      fontSize: 12,
                      color: "#6B7280",
                      fontStyle: "italic",
                    }}
                  >
                    {content.caption}
                  </Typography>
                )}
              </>
            ) : (
              <Box
                sx={{
                  py: 4,
                  px: 3,
                  bgcolor: "#F9FAFB",
                  borderRadius: 2,
                  border: "1px dashed #D1D5DB",
                }}
              >
                <Typography sx={{ fontSize: 14, color: "#9CA3AF" }}>
                  No image URL set
                </Typography>
              </Box>
            )}
          </Box>
        );

      case "timeline":
        return (
          <Box sx={{ pl: 2 }}>
            {content.entries.length === 0 ? (
              <Typography sx={{ fontSize: 14, color: "#9CA3AF", fontStyle: "italic" }}>
                No timeline entries
              </Typography>
            ) : (
              content.entries.map((entry, idx) => (
                <Box
                  key={idx}
                  sx={{
                    position: "relative",
                    pl: 3,
                    pb: 2,
                    borderLeft: idx < content.entries.length - 1 ? "2px solid #E5E7EB" : "none",
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      left: -5,
                      top: 0,
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      bgcolor: "#4C6AD2",
                    },
                  }}
                >
                  <Typography sx={{ fontSize: 12, color: "#6B7280", mb: 0.5 }}>
                    {entry.date}
                  </Typography>
                  <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>
                    {entry.title}
                  </Typography>
                  {entry.description && (
                    <Typography sx={{ fontSize: 13, color: "#4B5563", mt: 0.5 }}>
                      {entry.description}
                    </Typography>
                  )}
                </Box>
              ))
            )}
          </Box>
        );

      case "embed":
        return (
          <Box
            sx={{
              py: 3,
              px: 3,
              bgcolor: "#F9FAFB",
              borderRadius: 2,
              border: "1px solid #E5E7EB",
              textAlign: "center",
            }}
          >
            <Typography sx={{ fontSize: 14, color: "#6B7280" }}>
              Embedded content ({content.embed_type})
            </Typography>
            {content.code && (
              <Typography sx={{ fontSize: 12, color: "#9CA3AF", mt: 0.5, wordBreak: "break-all" }}>
                {content.code.length > 100 ? `${content.code.slice(0, 100)}...` : content.code}
              </Typography>
            )}
          </Box>
        );

      case "empty_space":
        return (
          <Box
            sx={{
              height: content.height ?? 40,
              bgcolor: "#F9FAFB",
              borderRadius: 1,
              border: "1px dashed #E5E7EB",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography sx={{ fontSize: 12, color: "#9CA3AF" }}>
              Empty space ({content.height ?? 40}px)
            </Typography>
          </Box>
        );

      case "page_break":
        return (
          <Box
            sx={{
              py: 2,
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Box sx={{ flex: 1, height: 1, bgcolor: "#D1D5DB" }} />
            <Typography sx={{ fontSize: 12, color: "#9CA3AF", textTransform: "uppercase" }}>
              Page Break
            </Typography>
            <Box sx={{ flex: 1, height: 1, bgcolor: "#D1D5DB" }} />
          </Box>
        );

      default:
        return (
          <Typography sx={{ fontSize: 14, color: "#9CA3AF", fontStyle: "italic" }}>
            {typeof (content as { type?: string })?.type === "string"
              ? `${(content as { type: string }).type.replace("_", " ")} section`
              : "Unsupported section"}
          </Typography>
        );
    }
  };

  return (
    <>
      {/* Section Editor Modal */}
      <SectionEditorModal
        open={showEditorModal}
        section={section}
        isSaving={isSaving}
        onSave={(newContent) => void handleSaveEdit(newContent)}
        onCancel={() => setShowEditorModal(false)}
      />

      <Box
        onClick={() => setSelectedSectionId(isSelected ? null : section.id)}
        onDoubleClick={() => {
          if (isEditable) {
            handleStartEdit();
          }
        }}
      sx={{
        borderRadius: 2,
        border: "1px solid transparent",
        bgcolor: isSelected ? "#F9FAFF" : "transparent",
        px: 0,
        py: 0.5,
        mb: 1,
        cursor: "pointer",
        transition: "all 0.15s ease",
        "&:hover": {
          bgcolor: "rgba(79,70,229,0.04)",
        },
        position: "relative",
        "&:hover .section-action-bar": {
          opacity: 1,
          transform: "translateY(0)",
          pointerEvents: "auto",
        },
      }}
    >
      {renderContent()}

      <Box
        className="section-action-bar"
        sx={{
          position: "absolute",
          left: 16,
          bottom: -18,
          display: "flex",
          gap: 1,
          bgcolor: "#FFFFFF",
          border: "1px solid #E5E7EB",
          borderRadius: 2,
          px: 1,
          py: 0.6,
          boxShadow: "0 10px 20px rgba(15,23,42,0.08)",
          opacity: 0,
          transform: "translateY(6px)",
          transition: "all 0.2s ease",
          pointerEvents: "none",
          zIndex: 2,
        }}
      >
        <Box
          component="span"
          ref={dragHandleRef}
          {...dragHandleProps}
          onClick={(event) => {
            event.stopPropagation();
            dragHandleProps?.onClick?.(event);
          }}
          sx={{ display: "inline-flex", touchAction: "none" }}
        >
          <IconButton
            size="small"
            sx={{
              width: 32,
              height: 32,
              borderRadius: 1.5,
              border: "1px solid #D7DDEA",
              color: "#5B74D6",
              cursor: "grab",
              "&:hover": { bgcolor: "#F4F6FF" },
            }}
          >
            <OpenWithRoundedIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
        <IconButton
          size="small"
          onClick={handleCopy}
          sx={{
            width: 32,
            height: 32,
            borderRadius: 1.5,
            border: "1px solid #D7DDEA",
            color: "#5B74D6",
            "&:hover": { bgcolor: "#F4F6FF" },
          }}
        >
          <ContentCopyIcon sx={{ fontSize: 16 }} />
        </IconButton>
        <IconButton
          size="small"
          onClick={(event) => {
            event.stopPropagation();
            onOpenAi?.(section);
          }}
          disabled={!isAiSupported}
          sx={{
            width: 32,
            height: 32,
            borderRadius: 1.5,
            border: "1px solid #D7DDEA",
            color: "#5B74D6",
            "&:hover": { bgcolor: "#F4F6FF" },
            "&.Mui-disabled": {
              color: "#C7CBD8",
              borderColor: "#E5E7EB",
            },
          }}
        >
          <AutoFixHighRoundedIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      {isSelected && (
        <Box
          sx={{
            mt: 1.8,
            display: "flex",
            justifyContent: "flex-end",
            gap: 1,
          }}
        >
          {isEditable && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleStartEdit();
              }}
              sx={{ color: "#9CA3AF", "&:hover": { color: "#4C6AD2" } }}
            >
              <EditOutlinedIcon sx={{ fontSize: 18 }} />
            </IconButton>
          )}
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setShowDeleteModal(true);
            }}
            sx={{ color: "#9CA3AF", "&:hover": { color: "#EF4444" } }}
          >
            <DeleteOutlineIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
      )}

      <ConfirmDeleteModal
        open={showDeleteModal}
        title="Delete Section"
        message="Are you sure you want to delete this section? This action cannot be undone."
        itemName={getSectionLabel()}
        isDeleting={isDeleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setShowDeleteModal(false)}
      />
    </Box>
    </>
  );
};
