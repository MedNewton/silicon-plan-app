// src/components/consultants/ConsultantMessagesContent.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  IconButton,
  InputAdornment,
  Skeleton,
  CircularProgress,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EmojiEmotionsOutlinedIcon from "@mui/icons-material/EmojiEmotionsOutlined";
import AttachFileOutlinedIcon from "@mui/icons-material/AttachFileOutlined";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import { useLanguage } from "@/components/i18n/LanguageProvider";

/* ── types ── */

type Thread = {
  id: string;
  consultant_id: string;
  consultant_name: string;
  preview: string;
};

type Message = {
  id: string;
  sender_name: string;
  text: string;
  created_at: string;
  is_own: boolean;
};

/* ── helpers ── */

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const month = d.toLocaleString("en", { month: "short" });
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${day} ${month}, ${hh}:${mm}`;
}

/* ── component ── */

type Props = {
  consultantId?: string;
  onBack: () => void;
  onViewProfile: () => void;
  onBookConsultation: () => void;
};

export default function ConsultantMessagesContent({
  consultantId,
  onBack,
  onViewProfile,
  onBookConsultation,
}: Props) {
  const { t } = useLanguage();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [consultantName, setConsultantName] = useState("");
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load threads
  const fetchThreads = useCallback(async () => {
    try {
      setLoadingThreads(true);
      const res = await fetch("/api/messages");
      if (!res.ok) return;
      const data = (await res.json()) as { threads?: Thread[] };
      const allThreads = data.threads ?? [];
      setThreads(allThreads);

      // Auto-select: if consultantId is provided, pick the thread for that consultant
      if (allThreads.length > 0 && !selectedThreadId) {
        const match = consultantId
          ? allThreads.find((t) => t.consultant_id === consultantId)
          : null;
        setSelectedThreadId(match?.id ?? allThreads[0]?.id ?? null);
      }
    } catch (err) {
      console.error("Failed to load threads", err);
    } finally {
      setLoadingThreads(false);
    }
  }, [consultantId, selectedThreadId]);

  useEffect(() => {
    void fetchThreads();
  }, [fetchThreads]);

  // Load messages for selected thread
  const fetchMessages = useCallback(async () => {
    if (!selectedThreadId) return;
    try {
      setLoadingMessages(true);
      const res = await fetch(`/api/messages/${selectedThreadId}`);
      if (!res.ok) return;
      const data = (await res.json()) as { messages?: Message[]; consultantName?: string };
      setMessages(data.messages ?? []);
      setConsultantName(data.consultantName ?? "");
    } catch (err) {
      console.error("Failed to load messages", err);
    } finally {
      setLoadingMessages(false);
    }
  }, [selectedThreadId]);

  useEffect(() => {
    void fetchMessages();
  }, [fetchMessages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const text = messageText.trim();
    if (!text || !selectedThreadId) return;
    try {
      setSending(true);
      setMessageText("");
      const res = await fetch(`/api/messages/${selectedThreadId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error("Failed to send");
      await fetchMessages();
    } catch (err) {
      console.error("Failed to send message", err);
    } finally {
      setSending(false);
    }
  };

  const currentThread = threads.find((t) => t.id === selectedThreadId);

  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        bgcolor: "#F7F8FC",
        minHeight: 0,
        height: "100vh",
      }}
    >
      {/* Left panel: thread list */}
      <Box
        sx={{
          width: 320,
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          borderRight: "1px solid #E2E8F0",
          bgcolor: "#fff",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            px: 2.5,
            py: 2,
            borderBottom: "1px solid #E2E8F0",
          }}
        >
          <IconButton size="small" onClick={onBack} sx={{ color: "#1E2B42" }}>
            <ArrowBackIcon sx={{ fontSize: 20 }} />
          </IconButton>
          <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#1E2B42" }}>
            {t("consultants.allMessages")}
          </Typography>
        </Box>

        {/* Thread list */}
        <Box sx={{ flex: 1, overflowY: "auto" }}>
          {loadingThreads ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={28} sx={{ color: "#3B5998" }} />
            </Box>
          ) : threads.map((thread) => (
            <Box
              key={thread.id}
              onClick={() => setSelectedThreadId(thread.id)}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                px: 2.5,
                py: 1.5,
                cursor: "pointer",
                bgcolor:
                  selectedThreadId === thread.id
                    ? "rgba(76,106,210,0.06)"
                    : "transparent",
                "&:hover": {
                  bgcolor:
                    selectedThreadId === thread.id
                      ? "rgba(76,106,210,0.08)"
                      : "rgba(15,23,42,0.02)",
                },
              }}
            >
              <Skeleton
                variant="circular"
                width={44}
                height={44}
                sx={{ flexShrink: 0 }}
              />
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  sx={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#1E2B42",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {thread.consultant_name}
                </Typography>
                <Typography
                  sx={{
                    fontSize: 12,
                    color: "text.secondary",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {thread.preview}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>


      {/* Right panel: chat */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          bgcolor: "#fff",
        }}
      >
        {/* Chat header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 3,
            py: 1.5,
            borderBottom: "1px solid #E2E8F0",
          }}
        >
          <Box>
            <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#1E2B42" }}>
              {currentThread?.consultant_name ?? consultantName}
            </Typography>
            <Typography
              onClick={onViewProfile}
              sx={{
                fontSize: 13,
                color: "text.secondary",
                cursor: "pointer",
                "&:hover": { textDecoration: "underline" },
              }}
            >
              {t("consultants.viewProfile")}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            onClick={onBookConsultation}
            sx={{
              textTransform: "none",
              borderRadius: 2,
              borderColor: "#E2E8F0",
              color: "#1E2B42",
              fontWeight: 500,
              fontSize: 13,
              px: 3,
              "&:hover": { borderColor: "#CBD5E1", bgcolor: "#F8FAFC" },
            }}
          >
            {t("consultants.bookConsultation")}
          </Button>
        </Box>

        {/* Messages area */}
        <Box
          sx={{
            flex: 1,
            overflowY: "auto",
            px: 3,
            py: 2,
            display: "flex",
            flexDirection: "column",
            gap: 1,
          }}
        >
          {loadingMessages ? (
            <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CircularProgress size={28} sx={{ color: "#3B5998" }} />
            </Box>
          ) : messages.map((msg) => (
            <Box
              key={msg.id}
              sx={{
                py: 2,
                px: 2.5,
                alignSelf: msg.is_own ? "flex-end" : "flex-start",
                maxWidth: "75%",
                bgcolor: msg.is_own ? "#F5F6FA" : "#FAFBFF",
                borderRadius: 3,
              }}
            >
              {/* Sender row */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 1,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Skeleton
                    variant="circular"
                    width={32}
                    height={32}
                    sx={{ flexShrink: 0 }}
                  />
                  <Typography
                    sx={{ fontSize: 14, fontWeight: 600, color: "#1E2B42" }}
                  >
                    {msg.sender_name}
                  </Typography>
                </Box>
                <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                  {formatTimestamp(msg.created_at)}
                </Typography>
              </Box>

              {/* Message text */}
              <Typography
                sx={{
                  fontSize: 13.5,
                  color: "#1E2B42",
                  lineHeight: 1.7,
                  whiteSpace: "pre-line",
                }}
              >
                {msg.text}
              </Typography>
            </Box>
          ))}
          <div ref={messagesEndRef} />
        </Box>

        {/* Input bar */}
        <Box
          sx={{
            px: 3,
            py: 1.5,
            borderTop: "1px solid #E2E8F0",
          }}
        >
          <TextField
            fullWidth
            size="small"
            placeholder={t("consultants.typeMessage")}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
            disabled={sending}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <IconButton size="small" sx={{ color: "#94A3B8" }}>
                      <EmojiEmotionsOutlinedIcon sx={{ fontSize: 20 }} />
                    </IconButton>
                    <IconButton size="small" sx={{ color: "#94A3B8" }}>
                      <AttachFileOutlinedIcon sx={{ fontSize: 20 }} />
                    </IconButton>
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      sx={{ color: "#94A3B8" }}
                      onClick={() => void handleSend()}
                      disabled={sending}
                    >
                      <SendOutlinedIcon sx={{ fontSize: 20 }} />
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 50,
                bgcolor: "#F7F8FC",
              },
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "#E2E8F0",
              },
              "& .MuiInputBase-input": {
                py: 1.2,
                fontSize: 14,
              },
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}
