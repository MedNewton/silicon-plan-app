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
import TravelExploreOutlinedIcon from "@mui/icons-material/TravelExploreOutlined";

export type AiFieldAssistAction = "correct" | "regenerate" | "research";

type AiFieldActionButtonProps = Readonly<{
  disabled?: boolean;
  loading?: boolean;
  onAction: (action: AiFieldAssistAction) => void;
}>;

const AiFieldActionButton = ({
  disabled = false,
  loading = false,
  onAction,
}: AiFieldActionButtonProps) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

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
      <Tooltip title="AI actions">
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
        <MenuItem onClick={() => handleAction("correct")}>
          <ListItemIcon>
            <SpellcheckOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Correct</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleAction("regenerate")}>
          <ListItemIcon>
            <AutorenewOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Regenerate</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleAction("research")}>
          <ListItemIcon>
            <TravelExploreOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Research</ListItemText>
        </MenuItem>
      </Menu>
    </InputAdornment>
  );
};

export default AiFieldActionButton;
