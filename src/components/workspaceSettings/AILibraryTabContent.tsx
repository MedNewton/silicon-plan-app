// src/components/workspaceSettings/AILibraryTabContent.tsx
"use client";

import { useCallback, useEffect, useState, type FC } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  TextField,
  Stack,
  Tooltip,
  Typography,
  Select,
  MenuItem,
  type SelectChangeEvent,
} from "@mui/material";

import AutorenewOutlinedIcon from "@mui/icons-material/AutorenewOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

import { useParams } from "next/navigation";
import { toast } from "react-toastify";

import theme from "@/theme/theme";
import AILibraryModal from "@/components/workspaceSettings/modals/AILibraryModal";
import type {
  WorkspaceAiDocument,
  WorkspaceAiDocumentStatus,
  WorkspaceAiKnowledge,
} from "@/types/workspaces";

type AILibrarySubTab = "documents" | "knowledge";

type DocumentStatus = WorkspaceAiDocumentStatus;

type DocumentRow = {
  id: string;
  name: string;
  type: string;
  uploadedAt: string;
  status: DocumentStatus;
};

type KnowledgeEntry = {
  id: string;
  label: string;
  value: string;
};

export type AILibraryTabContentProps = Readonly<{
  workspaceId?: string; // optional, we will fall back to route param
  workspaceName?: string;
}>;

const formatUploadedDate = (iso: string | null): string => {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const deriveDocumentType = (doc: WorkspaceAiDocument): string => {
  if (doc.file_type) {
    return doc.file_type.toUpperCase();
  }

  const path = doc.storage_path ?? "";
  const match = /\.([a-zA-Z0-9]+)$/.exec(path);
  if (match?.[1]) {
    return match[1].toUpperCase();
  }

  return "FILE";
};

const AILibraryTabContent: FC<AILibraryTabContentProps> = ({
  workspaceId,
  workspaceName,
}) => {
  const params = useParams<{ workspaceId?: string }>();

  const routeWorkspaceIdRaw = params?.workspaceId;
  const routeWorkspaceId =
    typeof routeWorkspaceIdRaw === "string"
      ? routeWorkspaceIdRaw
      : Array.isArray(routeWorkspaceIdRaw)
        ? routeWorkspaceIdRaw[0]
        : "";

  // This is the ONLY ID we use everywhere:
  const effectiveWorkspaceId = workspaceId ?? routeWorkspaceId ?? "";

  const [activeSubTab, setActiveSubTab] =
    useState<AILibrarySubTab>("documents");

  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState<boolean>(false);

  const [knowledgeEntries, setKnowledgeEntries] = useState<KnowledgeEntry[]>(
    [],
  );
  const [knowledgeLoading, setKnowledgeLoading] = useState<boolean>(false);
  const [editingKnowledgeId, setEditingKnowledgeId] = useState<string | null>(
    null,
  );
  const [editingKnowledgeLabel, setEditingKnowledgeLabel] = useState("");
  const [editingKnowledgeValue, setEditingKnowledgeValue] = useState("");
  const [knowledgeSavingId, setKnowledgeSavingId] = useState<string | null>(
    null,
  );

  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalInitialTab, setModalInitialTab] = useState<"upload" | "notes">(
    "upload",
  );

  const fetchDocuments = useCallback(async (): Promise<void> => {
    if (!effectiveWorkspaceId) return;

    try {
      setDocumentsLoading(true);

      const res = await fetch(
        `/api/workspaces/${effectiveWorkspaceId}/ai-library/documents`,
      );

      if (!res.ok) {
        toast.error("Failed to load documents.");
        return;
      }

      const data = (await res.json()) as { documents: WorkspaceAiDocument[] };

      const mapped: DocumentRow[] = data.documents.map((doc) => ({
        id: doc.id,
        name: doc.name,
        type: deriveDocumentType(doc),
        uploadedAt: formatUploadedDate(doc.created_at ?? null),
        status: doc.status,
      }));

      setDocuments(mapped);
      setCurrentPage(0);
    } catch (error) {
      console.error("Error loading documents", error);
      toast.error("Something went wrong while loading documents.");
    } finally {
      setDocumentsLoading(false);
    }
  }, [effectiveWorkspaceId]);

  const fetchKnowledge = useCallback(async (): Promise<void> => {
    if (!effectiveWorkspaceId) return;

    try {
      setKnowledgeLoading(true);

      const res = await fetch(
        `/api/workspaces/${effectiveWorkspaceId}/ai-library/knowledge`,
      );

      if (!res.ok) {
        toast.error("Failed to load AI knowledge.");
        return;
      }

      const data = (await res.json()) as {
        knowledge: WorkspaceAiKnowledge[];
      };

      const mapped: KnowledgeEntry[] = data.knowledge.map((k) => ({
        id: k.id,
        label: k.label,
        value: k.value,
      }));

      setKnowledgeEntries(mapped);
    } catch (error) {
      console.error("Error loading AI knowledge", error);
      toast.error("Something went wrong while loading AI knowledge.");
    } finally {
      setKnowledgeLoading(false);
    }
  }, [effectiveWorkspaceId]);

  useEffect(() => {
    if (!effectiveWorkspaceId) {
      console.warn(
        "AILibraryTabContent: no effectiveWorkspaceId (prop or route param).",
      );
      return;
    }
    void fetchDocuments();
    void fetchKnowledge();
  }, [effectiveWorkspaceId, fetchDocuments, fetchKnowledge]);

  const handleRowsPerPageChange = (
    event: SelectChangeEvent<number>,
  ): void => {
    const value = Number(event.target.value);
    setRowsPerPage(value);
    setCurrentPage(0);
  };

  const handleDeleteDocument = async (id: string): Promise<void> => {
    if (!effectiveWorkspaceId) return;

    try {
      const res = await fetch(
        `/api/workspaces/${effectiveWorkspaceId}/ai-library/documents/${id}`,
        {
          method: "DELETE",
        },
      );

      if (!res.ok && res.status !== 204) {
        toast.error("Failed to delete document.");
        return;
      }

      setDocuments((prev) => prev.filter((doc) => doc.id !== id));
      toast.success("Document deleted.");
    } catch (error) {
      console.error("Error deleting document", error);
      toast.error("Something went wrong while deleting the document.");
    }
  };

  const handleDeleteKnowledge = async (id: string): Promise<void> => {
    if (!effectiveWorkspaceId) return;

    try {
      const res = await fetch(
        `/api/workspaces/${effectiveWorkspaceId}/ai-library/knowledge/${id}`,
        {
          method: "DELETE",
        },
      );

      if (!res.ok && res.status !== 204) {
        toast.error("Failed to delete knowledge item.");
        return;
      }

      setKnowledgeEntries((prev) => prev.filter((item) => item.id !== id));
      if (editingKnowledgeId === id) {
        setEditingKnowledgeId(null);
        setEditingKnowledgeLabel("");
        setEditingKnowledgeValue("");
      }
      toast.success("Knowledge item deleted.");
    } catch (error) {
      console.error("Error deleting knowledge item", error);
      toast.error("Something went wrong while deleting the knowledge item.");
    }
  };

  const startEditingKnowledge = (entry: KnowledgeEntry): void => {
    setEditingKnowledgeId(entry.id);
    setEditingKnowledgeLabel(entry.label);
    setEditingKnowledgeValue(entry.value);
  };

  const cancelEditingKnowledge = (): void => {
    setEditingKnowledgeId(null);
    setEditingKnowledgeLabel("");
    setEditingKnowledgeValue("");
  };

  const saveEditingKnowledge = async (): Promise<void> => {
    if (!effectiveWorkspaceId || !editingKnowledgeId) return;

    const label = editingKnowledgeLabel.trim();
    const value = editingKnowledgeValue.trim();

    if (!label || !value) {
      toast.error("Both title and description are required.");
      return;
    }

    try {
      setKnowledgeSavingId(editingKnowledgeId);

      const res = await fetch(
        `/api/workspaces/${effectiveWorkspaceId}/ai-library/knowledge/${editingKnowledgeId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ label, value }),
        },
      );

      const payload = (await res.json().catch(() => null)) as
        | { error?: string; knowledge?: WorkspaceAiKnowledge }
        | null;

      if (!res.ok || !payload?.knowledge) {
        toast.error(payload?.error ?? "Failed to update knowledge item.");
        return;
      }

      const updated = payload.knowledge;
      setKnowledgeEntries((prev) =>
        prev.map((entry) =>
          entry.id === updated.id
            ? { ...entry, label: updated.label, value: updated.value }
            : entry,
        ),
      );
      toast.success("Knowledge item updated.");
      cancelEditingKnowledge();
    } catch (error) {
      console.error("Error updating knowledge item", error);
      toast.error("Something went wrong while updating the knowledge item.");
    } finally {
      setKnowledgeSavingId(null);
    }
  };

  const openUploadModal = (): void => {
    setModalInitialTab("upload");
    setModalOpen(true);
  };

  const openNotesModal = (): void => {
    setModalInitialTab("notes");
    setModalOpen(true);
  };

  const handleNextPage = (): void => {
    const totalDocuments = documents.length;
    const totalPages = Math.max(
      Math.ceil(totalDocuments / rowsPerPage),
      1,
    );

    setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1));
  };

  const handlePreviousPage = (): void => {
    setCurrentPage((prev) => Math.max(prev - 1, 0));
  };

  const renderStatus = (status: DocumentStatus) => {
    if (status === "processing") {
      return (
        <Chip
          icon={<AutorenewOutlinedIcon sx={{ fontSize: 16 }} />}
          label="Processing"
          size="small"
          sx={{
            borderRadius: 999,
            bgcolor: "#FFF7E0",
            color: "#B7791F",
            "& .MuiChip-icon": {
              color: "#B7791F",
            },
          }}
        />
      );
    }

    if (status === "uploaded") {
      return (
        <Chip
          icon={<CheckCircleOutlineOutlinedIcon sx={{ fontSize: 16 }} />}
          label="Uploaded"
          size="small"
          sx={{
            borderRadius: 999,
            bgcolor: "#E6F6EA",
            color: "#15803D",
            "& .MuiChip-icon": {
              color: "#15803D",
            },
          }}
        />
      );
    }

    return (
      <Chip
        label={status}
        size="small"
        sx={{
          borderRadius: 999,
          bgcolor: "#E5E7EB",
          color: "#374151",
        }}
      />
    );
  };

  const renderTypeBadge = (type: string) => {
    const upper = type.toUpperCase();
    let bg = "#F97373";
    const color = "#FFFFFF";

    if (upper === "XLS" || upper === "XLSX" || upper === "CSV") {
      bg = "#22C55E";
    } else if (upper === "PPT" || upper === "PPTX") {
      bg = "#F97316";
    } else if (upper === "TXT") {
      bg = "#6B7280";
    }

    return (
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
          fontWeight: 700,
          bgcolor: bg,
          color,
        }}
      >
        {upper}
      </Box>
    );
  };

  const renderDocumentsView = () => {
    const totalDocuments = documents.length;
    const totalPages =
      totalDocuments === 0
        ? 1
        : Math.max(Math.ceil(totalDocuments / rowsPerPage), 1);

    const clampedPage =
      totalDocuments === 0 ? 0 : Math.min(currentPage, totalPages - 1);

    const startIndex =
      totalDocuments === 0 ? 0 : clampedPage * rowsPerPage;
    const endIndex =
      totalDocuments === 0
        ? 0
        : Math.min(startIndex + rowsPerPage, totalDocuments);

    const paginatedDocuments = documents.slice(startIndex, endIndex);

    return (
      <Box
        sx={{
          width: "100%",
          maxWidth: 980,
          borderRadius: 4,
          border: "1px solid #E1E6F5",
          bgcolor: "#F9FAFF",
          px: 6,
          pt: 4,
          pb: 5,
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 1.5,
          }}
        >
          <Box>
            <Typography sx={{ fontSize: 20, fontWeight: 600, mb: 0.5 }}>
              Documents library
            </Typography>
            <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
              All documents uploaded to your AI knowledge base
            </Typography>
          </Box>

          <Button
            disableRipple
            onClick={openUploadModal}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              fontSize: 14,
              px: 3,
              py: 0.9,
              color: theme.palette.grey[600],
              border: `1px solid ${theme.palette.grey[600]}`,
              boxShadow: "none",
              "&:hover": {
                boxShadow: "none",
                opacity: 0.96,
                backgroundImage:
                  "linear-gradient(90deg, #4C6AD2 0%, #7B4FD6 100%)",
                color: theme.palette.background.default,
                borderColor: theme.palette.background.default,
              },
            }}
          >
            Add Document
          </Button>
        </Box>

        <Box
          sx={{
            mt: 3,
            borderRadius: 3,
            border: "1px solid #E1E6F5",
            overflow: "hidden",
            bgcolor: "#FFFFFF",
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "3fr 1.1fr 1.6fr 1.5fr 1fr",
              px: 3,
              py: 1.5,
              bgcolor: "#F5F7FF",
              borderBottom: "1px solid #E1E6F5",
              fontSize: 12,
              fontWeight: 600,
              color: "#6B7280",
            }}
          >
            <Box>Document name</Box>
            <Box>Type</Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
              }}
            >
              Uploaded
              <ArrowDropDownIcon sx={{ fontSize: 18 }} />
            </Box>
            <Box>Status</Box>
            <Box textAlign="right">Actions</Box>
          </Box>

          {documentsLoading && (
            <Box
              sx={{
                px: 3,
                py: 2,
              }}
            >
              <Typography
                sx={{ fontSize: 13.5, color: "text.secondary" }}
              >
                Loading documents...
              </Typography>
            </Box>
          )}

          {!documentsLoading && totalDocuments === 0 && (
            <Box
              sx={{
                px: 3,
                py: 3,
              }}
            >
              <Typography
                sx={{ fontSize: 13.5, color: "text.secondary" }}
              >
                No documents in your AI library yet. Upload your first
                document to get started.
              </Typography>
            </Box>
          )}

          {!documentsLoading &&
            totalDocuments > 0 &&
            paginatedDocuments.map((doc) => (
              <Box
                key={doc.id}
                sx={{
                  display: "grid",
                  gridTemplateColumns: "3fr 1.1fr 1.6fr 1.5fr 1fr",
                  px: 3,
                  py: 1.4,
                  alignItems: "center",
                  borderBottom: "1px solid #EDF0FB",
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center">
                  {renderTypeBadge(doc.type)}
                  <Tooltip title={doc.name} placement="top" arrow>
                    <Typography
                      sx={{
                        fontSize: 14.5,
                        fontWeight: 500,
                        minWidth: 0,
                        maxWidth: 300,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {doc.name}
                    </Typography>
                  </Tooltip>
                </Stack>

                <Typography
                  sx={{ fontSize: 13.5, color: "text.secondary" }}
                >
                  {doc.type}
                </Typography>

                <Typography
                  sx={{ fontSize: 13.5, color: "text.secondary" }}
                >
                  {doc.uploadedAt || "—"}
                </Typography>

                <Box>{renderStatus(doc.status)}</Box>

                <Box textAlign="right">
                  <Button
                    disableRipple
                    onClick={() => {
                      void handleDeleteDocument(doc.id);
                    }}
                    sx={{
                      minWidth: 0,
                      borderRadius: 999,
                      border: "1px solid #FCA5A5",
                      color: "#DC2626",
                      textTransform: "none",
                      fontSize: 13,
                      fontWeight: 600,
                      px: 2.2,
                      py: 0.5,
                      bgcolor: "#FFF5F5",
                      "&:hover": {
                        bgcolor: "#FFE4E6",
                      },
                    }}
                  >
                    Delete
                  </Button>
                </Box>
              </Box>
            ))}

          <Box
            sx={{
              px: 3,
              py: 1.8,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: 12.5,
              bgcolor: "#FFFFFF",
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Rows per page:
              </Typography>
              <Select<number>
                value={rowsPerPage}
                onChange={handleRowsPerPageChange}
                size="small"
                sx={{
                  minWidth: 72,
                  fontSize: 13,
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#D3DBEF",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#C3CDE8",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#8A9FE4",
                  },
                }}
              >
                <MenuItem value={5}>5</MenuItem>
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={25}>25</MenuItem>
              </Select>
            </Stack>

            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ color: "text.secondary" }}
            >
              <Typography variant="body2">
                {totalDocuments === 0
                  ? "0 of 0"
                  : `${startIndex + 1}–${endIndex} of ${totalDocuments}`}
              </Typography>
              <IconButton
                size="small"
                onClick={handlePreviousPage}
                disabled={clampedPage === 0 || totalDocuments === 0}
                sx={{
                  width: 30,
                  height: 30,
                  borderRadius: 999,
                  border: "1px solid #4F4F4F",
                  bgcolor: "#FFFFFF",
                }}
              >
                <ChevronLeftIcon
                  sx={{ fontSize: 18, color: theme.palette.grey[800] }}
                />
              </IconButton>
              <IconButton
                size="small"
                onClick={handleNextPage}
                disabled={
                  totalDocuments === 0 || clampedPage >= totalPages - 1
                }
                sx={{
                  width: 30,
                  height: 30,
                  borderRadius: 999,
                  border: "1px solid #4E4E4E",
                  bgcolor: "#FFFFFF",
                }}
              >
                <ChevronRightIcon
                  sx={{ fontSize: 18, color: theme.palette.grey[800] }}
                />
              </IconButton>
            </Stack>
          </Box>
        </Box>
      </Box>
    );
  };

  const renderKnowledgeCard = (entry: KnowledgeEntry) => {
    const isEditing = editingKnowledgeId === entry.id;
    const isSaving = knowledgeSavingId === entry.id;

    return (
      <Box
        key={entry.id}
        sx={{
          borderRadius: 3,
          border: "1px solid #E1E6F5",
          bgcolor: "#FFFFFF",
          px: 3,
          py: 2.4,
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 1.2,
            gap: 1,
          }}
        >
          {isEditing ? (
            <TextField
              size="small"
              value={editingKnowledgeLabel}
              onChange={(event) => setEditingKnowledgeLabel(event.target.value)}
              placeholder="Title"
              sx={{
                minWidth: 240,
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  fontSize: 13.5,
                },
              }}
            />
          ) : (
            <Typography
              sx={{
                fontSize: 12,
                fontWeight: 600,
                color: "#64748B",
                wordBreak: "break-word",
              }}
            >
              {entry.label}
            </Typography>
          )}

          <Stack direction="row" spacing={0.6} alignItems="center">
            {!isEditing ? (
              <IconButton
                size="small"
                onClick={() => startEditingKnowledge(entry)}
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: 999,
                  border: "1px solid #E5E7EB",
                  bgcolor: "#FFFFFF",
                  color: "#4B5563",
                }}
              >
                <EditOutlinedIcon sx={{ fontSize: 16 }} />
              </IconButton>
            ) : (
              <Button
                disableRipple
                size="small"
                onClick={() => {
                  void saveEditingKnowledge();
                }}
                disabled={isSaving}
                sx={{
                  textTransform: "none",
                  fontSize: 12.5,
                  minWidth: 68,
                  borderRadius: 999,
                  px: 1.4,
                  py: 0.3,
                  border: "1px solid #BFDBFE",
                  bgcolor: "#EFF6FF",
                  color: "#1D4ED8",
                }}
              >
                {isSaving ? <CircularProgress size={14} /> : "Save"}
              </Button>
            )}

            <IconButton
              size="small"
              onClick={() => {
                if (isEditing) {
                  cancelEditingKnowledge();
                  return;
                }
                void handleDeleteKnowledge(entry.id);
              }}
              sx={{
                width: 28,
                height: 28,
                borderRadius: 999,
                border: "1px solid #FCA5A5",
                bgcolor: isEditing ? "#F8FAFC" : "#FFF5F5",
                color: isEditing ? "#64748B" : "#DC2626",
              }}
            >
              <CloseOutlinedIcon sx={{ fontSize: 15 }} />
            </IconButton>
          </Stack>
        </Box>

        {isEditing ? (
          <TextField
            fullWidth
            multiline
            minRows={3}
            value={editingKnowledgeValue}
            onChange={(event) => setEditingKnowledgeValue(event.target.value)}
            placeholder="Description"
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                fontSize: 13.5,
              },
            }}
          />
        ) : (
          <Typography
            sx={{
              fontSize: 13.5,
              whiteSpace: "pre-line",
              color: "#111827",
              wordBreak: "break-word",
            }}
          >
            {entry.value}
          </Typography>
        )}
      </Box>
    );
  };

  const renderKnowledgeView = () => (
    <Box
      sx={{
        width: "100%",
        maxWidth: 980,
        borderRadius: 4,
        border: "1px solid #E1E6F5",
        bgcolor: "#F9FAFF",
        px: 6,
        pt: 4,
        pb: 5,
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2.5,
        }}
      >
        <Box>
          <Typography sx={{ fontSize: 20, fontWeight: 600, mb: 0.5 }}>
            AI Knowledge
          </Typography>
          <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
            Manage and review structured information that your AI assistant uses
            to understand this business.
          </Typography>
        </Box>

        <Button
          disableRipple
          onClick={openNotesModal}
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
            fontSize: 14,
            px: 3,
            py: 0.9,
            color: theme.palette.grey[600],
            border: `1px solid ${theme.palette.grey[600]}`,
            whiteSpace: "nowrap",
            boxShadow: "none",
            "&:hover": {
              boxShadow: "none",
              opacity: 0.96,
              backgroundImage:
                "linear-gradient(90deg, #4C6AD2 0%, #7B4FD6 100%)",
              color: theme.palette.background.default,
              borderColor: theme.palette.background.default,
            },
          }}
        >
          Add Knowledge
        </Button>
      </Box>

      {knowledgeLoading && (
        <Typography sx={{ fontSize: 13.5, color: "text.secondary" }}>
          Loading AI knowledge...
        </Typography>
      )}

      {!knowledgeLoading && knowledgeEntries.length === 0 && (
        <Typography sx={{ fontSize: 13.5, color: "text.secondary" }}>
          No AI knowledge entries yet. Add notes to give your assistant
          structured context about this business.
        </Typography>
      )}

      {!knowledgeLoading && knowledgeEntries.length > 0 && (
        <Stack spacing={2.2}>
          {knowledgeEntries.map((entry) => renderKnowledgeCard(entry))}
        </Stack>
      )}
    </Box>
  );

  const disabledFooterButtons = true;

  return (
    <>
      <Box
        sx={{
          flex: 1,
          flexDirection: "column",
          display: "flex",
          alignItems: "center",
          gap: 2,
          mt: 4,
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: 980,
            mb: 1,
          }}
        >
          <Typography sx={{ fontSize: 22, fontWeight: 600, mb: 0.5 }}>
            AI Library
          </Typography>
          <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
            Manage documents and knowledge that your AI assistant uses for this
            workspace{workspaceName ? ` (${workspaceName})` : ""}.
          </Typography>
        </Box>

        <Box
          sx={{
            width: "100%",
            maxWidth: 980,
            display: "flex",
            justifyContent: "center",
            mt: 1,
          }}
        >
          <Box
            sx={{
              width: "100%",
              borderBottom: "1px solid #E1E6F5",
              display: "flex",
            }}
          >
            <Button
              disableRipple
              onClick={() => setActiveSubTab("documents")}
              sx={{
                flex: 1,
                justifyContent: "center",
                textTransform: "none",
                fontSize: 14,
                fontWeight: 600,
                pb: 1.4,
                borderRadius: 0,
                color:
                  activeSubTab === "documents"
                    ? "#111827"
                    : "rgba(55,65,81,0.8)",
                borderBottom:
                  activeSubTab === "documents"
                    ? "2px solid #4C6AD2"
                    : "2px solid transparent",
                "&:hover": {
                  bgcolor: "transparent",
                },
              }}
            >
              Documents Library
            </Button>

            <Button
              disableRipple
              onClick={() => setActiveSubTab("knowledge")}
              sx={{
                flex: 1,
                justifyContent: "center",
                textTransform: "none",
                fontSize: 14,
                fontWeight: 600,
                pb: 1.4,
                borderRadius: 0,
                color:
                  activeSubTab === "knowledge"
                    ? "#111827"
                    : "rgba(55,65,81,0.8)",
                borderBottom:
                  activeSubTab === "knowledge"
                    ? "2px solid #4C6AD2"
                    : "2px solid transparent",
                "&:hover": {
                  bgcolor: "transparent",
                },
              }}
            >
              AI Knowledge About Your Business
            </Button>
          </Box>
        </Box>

        {activeSubTab === "documents"
          ? renderDocumentsView()
          : renderKnowledgeView()}

        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            gap: 3,
            width: "100%",
            mt: 2,
          }}
        >
          <Button
            type="button"
            disabled={disabledFooterButtons}
            sx={{
              width: "50%",
              maxWidth: 480,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              fontSize: 15,
              border: "1px solid #F97373",
              color: "#DC2626",
              bgcolor: "#FFFFFF",
              py: 1.3,
              "&:hover": {
                bgcolor: "#FFF5F5",
              },
              "&.Mui-disabled": {
                borderColor: "#F3F4F6",
                color: "#9CA3AF",
              },
            }}
          >
            Cancel Changes
          </Button>

          <Button
            type="button"
            disabled={disabledFooterButtons}
            sx={{
              width: "50%",
              maxWidth: 480,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              fontSize: 15,
              py: 1.3,
              backgroundImage:
                "linear-gradient(90deg, #4C6AD2 0%, #7B4FD6 100%)",
              color: "#FFFFFF",
              boxShadow: "none",
              "&.Mui-disabled": {
                backgroundImage: "none",
                backgroundColor: "#E5E7EB",
                color: "#9CA3AF",
              },
              "&:hover": {
                boxShadow: "none",
                opacity: 0.96,
                backgroundImage:
                  "linear-gradient(90deg, #4C6AD2 0%, #7B4FD6 100%)",
              },
            }}
          >
            Save
          </Button>
        </Box>
      </Box>

      <AILibraryModal
        open={modalOpen}
        initialTab={modalInitialTab}
        workspaceId={effectiveWorkspaceId}
        onClose={() => setModalOpen(false)}
        onDocumentCreated={() => {
          void fetchDocuments();
        }}
        onKnowledgeCreated={() => {
          void fetchKnowledge();
        }}
      />
    </>
  );
};

export default AILibraryTabContent;
