// src/components/workspaceManage/business-plan/ConfirmDeleteModal.tsx
"use client";

import type { FC } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { useLanguage } from "@/components/i18n/LanguageProvider";

export type ConfirmDeleteModalProps = {
  open: boolean;
  title: string;
  message: string;
  itemName?: string;
  isDeleting?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

const ConfirmDeleteModal: FC<ConfirmDeleteModalProps> = ({
  open,
  title,
  message,
  itemName,
  isDeleting = false,
  onConfirm,
  onCancel,
}) => {
  const { locale } = useLanguage();
  const copy =
    locale === "it"
      ? {
          cancel: "Annulla",
          deleting: "Eliminazione...",
          delete: "Elimina",
        }
      : {
          cancel: "Cancel",
          deleting: "Deleting...",
          delete: "Delete",
        };

  return (
    <Dialog
      open={open}
      onClose={isDeleting ? undefined : onCancel}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          p: 1,
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              bgcolor: "#FEE2E2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <DeleteOutlineIcon sx={{ fontSize: 22, color: "#EF4444" }} />
          </Box>
          <Typography sx={{ fontSize: 18, fontWeight: 600, color: "#111827" }}>
            {title}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        <Typography sx={{ fontSize: 14, color: "#4B5563", lineHeight: 1.6 }}>
          {message}
        </Typography>
        {itemName && (
          <Box
            sx={{
              mt: 2,
              px: 2,
              py: 1.5,
              bgcolor: "#F9FAFB",
              borderRadius: 2,
              border: "1px solid #E5E7EB",
            }}
          >
            <Typography
              sx={{
                fontSize: 14,
                fontWeight: 600,
                color: "#374151",
                wordBreak: "break-word",
              }}
            >
              {itemName}
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, pt: 1, gap: 1.5 }}>
        <Button
          onClick={onCancel}
          disabled={isDeleting}
          sx={{
            flex: 1,
            textTransform: "none",
            fontSize: 14,
            fontWeight: 600,
            py: 1.2,
            borderRadius: 2,
            color: "#374151",
            bgcolor: "#F3F4F6",
            "&:hover": {
              bgcolor: "#E5E7EB",
            },
          }}
        >
          {copy.cancel}
        </Button>
        <Button
          onClick={onConfirm}
          disabled={isDeleting}
          sx={{
            flex: 1,
            textTransform: "none",
            fontSize: 14,
            fontWeight: 600,
            py: 1.2,
            borderRadius: 2,
            color: "#FFFFFF",
            bgcolor: "#EF4444",
            "&:hover": {
              bgcolor: "#DC2626",
            },
            "&:disabled": {
              bgcolor: "#FCA5A5",
              color: "#FFFFFF",
            },
          }}
        >
          {isDeleting ? copy.deleting : copy.delete}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDeleteModal;
