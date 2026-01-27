// src/components/workspaceManage/business-plan/chat/ChatInput.tsx
"use client";

import type { FC, KeyboardEvent } from "react";
import { useState } from "react";
import { Box, IconButton, TextField, CircularProgress } from "@mui/material";
import SendRoundedIcon from "@mui/icons-material/SendRounded";

type ChatInputProps = {
  onSend: (message: string) => Promise<void> | void;
  disabled?: boolean;
  placeholder?: string;
};

const ChatInput: FC<ChatInputProps> = ({
  onSend,
  disabled = false,
  placeholder = "Ask a question or request a modification...",
}) => {
  const [value, setValue] = useState("");

  const handleSend = async () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    setValue("");
    await onSend(trimmed);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };

  return (
    <Box
      sx={{
        borderTop: "1px solid #E5E7EB",
        px: 3,
        py: 1.75,
        bgcolor: "#FFFFFF",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          borderRadius: 3,
          border: "1px solid #CBD5F5",
          px: 2,
          py: 1.2,
          bgcolor: "#FDFDFF",
          boxShadow: "0 0 0 1px rgba(148,163,255,0.2)",
        }}
      >
        <TextField
          fullWidth
          multiline
          minRows={1}
          maxRows={4}
          placeholder={placeholder}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          variant="standard"
          InputProps={{
            disableUnderline: true,
            sx: { fontSize: 15 },
          }}
        />
        <IconButton
          disableRipple
          onClick={() => void handleSend()}
          disabled={disabled || value.trim().length === 0}
          sx={{
            ml: 1.5,
            width: 40,
            height: 40,
            borderRadius: 2,
            background: "linear-gradient(135deg, #4C6AD2 0%, #7F54D9 100%)",
            boxShadow: "0px 8px 20px rgba(76,106,210,0.35)",
            "&:hover": {
              background: "linear-gradient(135deg, #435ABF 0%, #744BD5 100%)",
            },
            "&.Mui-disabled": {
              background: "rgba(76,106,210,0.3)",
              color: "#FFFFFF",
              boxShadow: "none",
            },
          }}
        >
          {disabled ? (
            <CircularProgress size={18} sx={{ color: "#FFFFFF" }} />
          ) : (
            <SendRoundedIcon sx={{ fontSize: 22, color: "#FFFFFF" }} />
          )}
        </IconButton>
      </Box>
    </Box>
  );
};

export default ChatInput;
