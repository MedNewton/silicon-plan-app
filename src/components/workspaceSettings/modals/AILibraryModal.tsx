// src/components/workspaceSettings/modals/AddLibraryItemModal.tsx
"use client";

import { useEffect, useState, type FC } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";

import { useParams } from "next/navigation";
import { toast } from "react-toastify";

type AILibraryModalTab = "upload" | "notes";

type ApiErrorResponse = {
  error?: string;
};

export type AILibraryModalProps = Readonly<{
  open: boolean;
  initialTab?: AILibraryModalTab;
  workspaceId?: string; // optional, fallback to route param
  onClose: () => void;
  onDocumentCreated?: () => void;
  onKnowledgeCreated?: () => void;
}>;

const AILibraryModal: FC<AILibraryModalProps> = ({
  open,
  initialTab = "upload",
  workspaceId,
  onClose,
  onDocumentCreated,
  onKnowledgeCreated,
}) => {
  const params = useParams<{ workspaceId?: string }>();

  const routeWorkspaceIdRaw = params?.workspaceId;
  const routeWorkspaceId =
    typeof routeWorkspaceIdRaw === "string"
      ? routeWorkspaceIdRaw
      : Array.isArray(routeWorkspaceIdRaw)
        ? routeWorkspaceIdRaw[0]
        : "";

  // Single source of truth inside the modal:
  const effectiveWorkspaceId = workspaceId ?? routeWorkspaceId ?? "";

  const [activeTab, setActiveTab] = useState<AILibraryModalTab>(initialTab);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [notesTitle, setNotesTitle] = useState<string>("");
  const [notesDescription, setNotesDescription] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (!open) return;
    setActiveTab(initialTab);
  }, [open, initialTab]);

  const resetState = () => {
    setSelectedFileName(null);
    setSelectedFile(null);
    setIsDragActive(false);
    setNotesTitle("");
    setNotesDescription("");
    setIsSubmitting(false);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    resetState();
    onClose();
  };

  const makeKeyNameFromTitle = (title: string): string => {
    const base = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/gi, "_")
      .replace(/^_+|_+$/g, "");

    return base || "custom_note";
  };

  const handlePrimaryAction = async () => {
    if (isSubmitting) return;

    if (!effectiveWorkspaceId) {
      console.warn(
        "AILibraryModal: effectiveWorkspaceId is missing (prop + route param both empty).",
      );
      toast.error("Workspace is missing. Please refresh and try again.");
      return;
    }

    if (activeTab === "upload") {
      // ------ Document upload ------
      if (!selectedFile) {
        toast.error("Please select a file to upload.");
        return;
      }

      try {
        setIsSubmitting(true);

        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("name", selectedFile.name);

        const res = await fetch(
          `/api/workspaces/${effectiveWorkspaceId}/ai-library/documents`,
          {
            method: "POST",
            body: formData,
          },
        );

        if (!res.ok) {
          let message = "Failed to upload document.";
          try {
            const data = (await res.json()) as ApiErrorResponse;
            if (data.error) message = data.error;
          } catch {
            // ignore parse errors
          }
          toast.error(message);
          return;
        }

        toast.success("Document added to AI library.");
        if (onDocumentCreated) onDocumentCreated();
        handleClose();
      } catch (error) {
        console.error("Error uploading document", error);
        toast.error("Something went wrong while uploading the document.");
      } finally {
        setIsSubmitting(false);
      }

      return;
    }

    // ------ Notes / knowledge ------
    const title = notesTitle.trim();
    const description = notesDescription.trim();

    if (!title || !description) {
      toast.error("Please fill in both title and description.");
      return;
    }

    const keyName = makeKeyNameFromTitle(title);
    const label = title;
    const value = description;

    try {
      setIsSubmitting(true);

      const res = await fetch(
        `/api/workspaces/${effectiveWorkspaceId}/ai-library/knowledge`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            keyName,
            label,
            value,
          }),
        },
      );

      if (!res.ok) {
        let message = "Failed to save knowledge.";
        try {
          const data = (await res.json()) as ApiErrorResponse;
          if (data.error) message = data.error;
        } catch {
          // ignore parse errors
        }
        toast.error(message);
        return;
      }

      toast.success("Knowledge added to AI library.");
      if (onKnowledgeCreated) onKnowledgeCreated();
      handleClose();
    } catch (error) {
      console.error("Error saving knowledge", error);
      toast.error("Something went wrong while saving the knowledge entry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const applySelectedFile = (file: File | null): void => {
    setSelectedFile(file);
    setSelectedFileName(file?.name ?? null);
  };

  const renderTabs = () => (
    <Box
      sx={{
        width: "100%",
        borderBottom: "1px solid #E5E7EB",
        mt: 1.5,
        mb: 3,
      }}
    >
      <Stack direction="row" sx={{ width: "100%" }}>
        <Button
          disableRipple
          onClick={() => setActiveTab("upload")}
          sx={{
            flex: 1,
            textTransform: "none",
            fontSize: 16,
            fontWeight: 600,
            borderRadius: 0,
            pb: 1.4,
            color: activeTab === "upload" ? "#111827" : "#6B7280",
            borderBottom:
              activeTab === "upload"
                ? "2px solid #111827"
                : "2px solid transparent",
            "&:hover": {
              bgcolor: "transparent",
            },
          }}
        >
          Upload Documents
        </Button>

        <Button
          disableRipple
          onClick={() => setActiveTab("notes")}
          sx={{
            flex: 1,
            textTransform: "none",
            fontSize: 16,
            fontWeight: 600,
            borderRadius: 0,
            pb: 1.4,
            color: activeTab === "notes" ? "#111827" : "#6B7280",
            borderBottom:
              activeTab === "notes"
                ? "2px solid #111827"
                : "2px solid transparent",
            "&:hover": {
              bgcolor: "transparent",
            },
          }}
        >
          Add Notes
        </Button>
      </Stack>
    </Box>
  );

  const renderUploadTab = () => (
    <Box
      sx={{
        mt: 1,
      }}
    >
      <Box
        component="label"
        onDragOver={(event) => {
          event.preventDefault();
          if (isSubmitting) return;
          setIsDragActive(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setIsDragActive(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          if (isSubmitting) return;
          const dropped = event.dataTransfer.files?.[0] ?? null;
          applySelectedFile(dropped);
          setIsDragActive(false);
        }}
        sx={{
          borderRadius: 4,
          border: "1.5px dashed #93C5FD",
          borderStyle: "dashed",
          borderColor: isDragActive ? "#4C6AD2" : "#93C5FD",
          bgcolor: isDragActive ? "#EEF2FF" : "#F9FAFF",
          px: 3,
          py: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}
      >
        <UploadFileOutlinedIcon
          sx={{ fontSize: 36, mb: 1.5, color: "#4B5563" }}
        />

        <Typography
          sx={{
            fontSize: 16,
            fontWeight: 600,
            mb: 0.5,
          }}
        >
          Upload{" "}
          <Typography
            component="span"
            sx={{
              fontWeight: 400,
              color: "#9CA3AF",
            }}
          >
            or drag and drop
          </Typography>
        </Typography>

        <Typography
          sx={{
            fontSize: 13,
            color: "#6B7280",
            mt: 0.5,
          }}
        >
          PDF, XLS, XLSX, PPT, PPTX, TXT, DOC, DOCX, CSV (max. 3MB)
        </Typography>

        <input
          type="file"
          hidden
          accept=".pdf,.txt,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv"
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null;
            applySelectedFile(file);
          }}
        />
      </Box>

      {selectedFileName && (
        <Tooltip title={selectedFileName} placement="top" arrow>
          <Typography
            sx={{
              mt: 1.5,
              fontSize: 13,
              color: "#4B5563",
              maxWidth: "100%",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            Selected file: <strong>{selectedFileName}</strong>
          </Typography>
        </Tooltip>
      )}
    </Box>
  );

  const renderNotesTab = () => (
    <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 2.5 }}>
      <Box>
        <Typography
          sx={{
            fontSize: 13,
            fontWeight: 600,
            mb: 0.5,
          }}
        >
          Title
        </Typography>
        <TextField
          fullWidth
          placeholder="Add title"
          value={notesTitle}
          onChange={(e) => setNotesTitle(e.target.value)}
          InputProps={{
            sx: {
              borderRadius: 3,
              bgcolor: "#FFFFFF",
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "#BFDBFE",
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: "#93C5FD",
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: "#3B82F6",
              },
              fontSize: 14.5,
            },
          }}
        />
      </Box>

      <Box>
        <Typography
          sx={{
            fontSize: 13,
            fontWeight: 600,
            mb: 0.5,
          }}
        >
          Description
        </Typography>
        <TextField
          fullWidth
          placeholder="Add description"
          multiline
          minRows={4}
          value={notesDescription}
          onChange={(e) => setNotesDescription(e.target.value)}
          InputProps={{
            sx: {
              borderRadius: 3,
              bgcolor: "#FFFFFF",
              alignItems: "flex-start",
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "#BFDBFE",
              },
              "&:hover .MuiOutlinedInput-notchedOutline": {
                borderColor: "#93C5FD",
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: "#3B82F6",
              },
              fontSize: 14.5,
            },
          }}
        />
      </Box>
    </Box>
  );

  const primaryLabel = activeTab === "upload" ? "Upload" : "Save";

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: 4,
          p: 1,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          pb: 1,
        }}
      >
        <Box>
          <Typography sx={{ fontSize: 24, fontWeight: 700, mb: 0.5 }}>
            Add Document to Library
          </Typography>
          <Typography sx={{ fontSize: 14, color: "text.secondary" }}>
            Upload documents or add notes to train your AI knowledge base.
          </Typography>
        </Box>

        <IconButton
          onClick={handleClose}
          disabled={isSubmitting}
          sx={{
            width: 32,
            height: 32,
            borderRadius: 2,
            border: "1px solid #BFDBFE",
            bgcolor: "#EFF6FF",
            color: "#1D4ED8",
          }}
        >
          <CloseOutlinedIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          pt: 0,
          pb: 3,
        }}
      >
        {renderTabs()}
        {activeTab === "upload" ? renderUploadTab() : renderNotesTab()}
      </DialogContent>

      <DialogActions
        sx={{
          px: 4,
          pb: 3,
          pt: 0,
          display: "flex",
          justifyContent: "space-between",
          gap: 3,
        }}
      >
        <Button
          type="button"
          onClick={handleClose}
          disabled={isSubmitting}
          sx={{
            flex: 1,
            maxWidth: 420,
            borderRadius: 3,
            textTransform: "none",
            fontWeight: 600,
            fontSize: 16,
            border: "1px solid #F97373",
            color: "#DC2626",
            bgcolor: "#FFFFFF",
            py: 1.3,
            "&:hover": {
              bgcolor: "#FFF5F5",
            },
          }}
        >
          Cancel
        </Button>

        <Button
          type="button"
          onClick={handlePrimaryAction}
          disabled={isSubmitting}
          sx={{
            flex: 1,
            maxWidth: 420,
            borderRadius: 3,
            textTransform: "none",
            fontWeight: 600,
            fontSize: 16,
            py: 1.3,
            backgroundImage:
              "linear-gradient(90deg, #4C6AD2 0%, #7B4FD6 100%)",
            color: "#FFFFFF",
            boxShadow: "none",
            "&.Mui-disabled": {
              opacity: 0.7,
            },
            "&:hover": {
              boxShadow: "none",
              opacity: 0.96,
              backgroundImage:
                "linear-gradient(90deg, #4C6AD2 0%, #7B4FD6 100%)",
            },
          }}
        >
          {primaryLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AILibraryModal;
