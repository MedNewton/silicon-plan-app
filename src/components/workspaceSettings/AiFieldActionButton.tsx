"use client";

import {
  CircularProgress,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
} from "@mui/material";
import type { MouseEvent } from "react";
import { useState } from "react";

import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import SpellcheckOutlinedIcon from "@mui/icons-material/SpellcheckOutlined";
import AutorenewOutlinedIcon from "@mui/icons-material/AutorenewOutlined";

import { useLanguage } from "@/components/i18n/LanguageProvider";

export type AiFieldAssistAction = "correct" | "regenerate" | "generate";

type AiFieldActionButtonProps = Readonly<{
  disabled?: boolean;
  loading?: boolean;
  fieldValue?: string;
  onAction: (action: AiFieldAssistAction) => void;
}>;

const AiFieldActionButton = ({
  disabled = false,
  loading = false,
  fieldValue = "",
  onAction,
}: AiFieldActionButtonProps) => {
  const { locale } = useLanguage();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const hasContent = fieldValue.trim().length > 0;

  const copy =
    locale === "it"
      ? {
          tooltip: "Azioni AI",
          generate: "Genera",
          correct: "Correggi",
          regenerate: "Rigenera",
          generateTip:
            "Genera automaticamente il contenuto del campo usando l'AI",
          correctTip:
            "Correggi grammatica e ortografia mantenendo il significato originale",
          regenerateTip:
            "Rigenera una versione più forte e professionale del testo",
        }
      : {
          tooltip: "AI actions",
          generate: "Generate",
          correct: "Correct",
          regenerate: "Regenerate",
          generateTip:
            "Automatically generate the field content using AI",
          correctTip:
            "Fix grammar and spelling while keeping the original meaning",
          regenerateTip:
            "Regenerate a stronger, more business-ready version of the text",
        };

  const handleOpen = (event: MouseEvent<HTMLElement>) => {
    if (disabled || loading) return;
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleAction = (action: AiFieldAssistAction) => {
    onAction(action);
    handleClose();
  };

  return (
    <InputAdornment position="end" sx={{ alignSelf: "flex-start", mt: 0.6, mr: 0.4 }}>
      <Tooltip title={copy.tooltip}>
        <span>
          <IconButton
            size="small"
            onClick={handleOpen}
            disabled={disabled || loading}
            sx={{
              width: 30,
              height: 30,
              borderRadius: 999,
              border: "1px solid #C7D2FE",
              bgcolor: "#EEF2FF",
              color: "#4F46E5",
            }}
          >
            {loading ? (
              <CircularProgress size={15} sx={{ color: "#4F46E5" }} />
            ) : (
              <AutoAwesomeOutlinedIcon sx={{ fontSize: 18 }} />
            )}
          </IconButton>
        </span>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        MenuListProps={{ dense: true }}
      >
        {!hasContent ? (
          <Tooltip title={copy.generateTip} placement="left" arrow>
            <MenuItem onClick={() => handleAction("generate")}>
              <ListItemIcon>
                <AutoAwesomeOutlinedIcon fontSize="small" sx={{ color: "#4F46E5" }} />
              </ListItemIcon>
              <ListItemText>{copy.generate}</ListItemText>
            </MenuItem>
          </Tooltip>
        ) : (
          [
            <Tooltip key="correct" title={copy.correctTip} placement="left" arrow>
              <MenuItem onClick={() => handleAction("correct")}>
                <ListItemIcon>
                  <SpellcheckOutlinedIcon fontSize="small" sx={{ color: "#4F46E5" }} />
                </ListItemIcon>
                <ListItemText>{copy.correct}</ListItemText>
              </MenuItem>
            </Tooltip>,
            <Tooltip key="regenerate" title={copy.regenerateTip} placement="left" arrow>
              <MenuItem onClick={() => handleAction("regenerate")}>
                <ListItemIcon>
                  <AutorenewOutlinedIcon fontSize="small" sx={{ color: "#4F46E5" }} />
                </ListItemIcon>
                <ListItemText>{copy.regenerate}</ListItemText>
              </MenuItem>
            </Tooltip>,
          ]
        )}
      </Menu>
    </InputAdornment>
  );
};

export default AiFieldActionButton;
