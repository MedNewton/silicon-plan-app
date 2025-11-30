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
  Typography,
} from "@mui/material";

import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";

import theme from "@/theme/theme";

type AILibraryModalTab = "upload" | "notes";

export type AILibraryModalProps = Readonly<{
  open: boolean;
  initialTab?: AILibraryModalTab;
  onClose: () => void;
}>;

const AILibraryModal: FC<AILibraryModalProps> = ({
  open,
  initialTab = "upload",
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<AILibraryModalTab>(initialTab);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [notesTitle, setNotesTitle] = useState<string>("");
  const [notesDescription, setNotesDescription] = useState<string>("");

  useEffect(() => {
    if (!open) return;
    setActiveTab(initialTab);
  }, [open, initialTab]);

  const handleClose = () => {
    setSelectedFileName(null);
    setNotesTitle("");
    setNotesDescription("");
    onClose();
  };

  const handleUploadClick = () => {
    handleClose();
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
        sx={{
          borderRadius: 4,
          border: "1.5px dashed #93C5FD",
          borderStyle: "dashed",
          borderColor: "#93C5FD",
          bgcolor: "#F9FAFF",
          px: 3,
          py: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}
      >
        <UploadFileOutlinedIcon sx={{ fontSize: 36, mb: 1.5, color: "#4B5563" }} />

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
          PDF, XLX, XLSX, PPT, PPTX, TXT, DOC, DOCX (max. 3MB)
        </Typography>

        <input
          type="file"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              setSelectedFileName(file.name);
            } else {
              setSelectedFileName(null);
            }
          }}
        />
      </Box>

      {selectedFileName && (
        <Typography
          sx={{
            mt: 1.5,
            fontSize: 13,
            color: "#4B5563",
          }}
        >
          Selected file: <strong>{selectedFileName}</strong>
        </Typography>
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
          Descriptions
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
          onClick={handleUploadClick}
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
            "&:hover": {
              boxShadow: "none",
              opacity: 0.96,
              backgroundImage:
                "linear-gradient(90deg, #4C6AD2 0%, #7B4FD6 100%)",
            },
          }}
        >
          Upload
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AILibraryModal;
