"use client";

import type { FC } from "react";
import { useState } from "react";
import {
  Box,
  Typography,
  IconButton,
  TextField,
  Stack,
  Fade,
  Button,
  CircularProgress,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

export type CanvasSectionItem = {
  id: string;
  title: string;
  description: string;
};

export type AiSuggestion = {
  title: string;
  description: string;
};

export type CanvasSectionProps = Readonly<{
  title: string;
  placeholder?: string;
  items?: CanvasSectionItem[];
  onAddItem?: (item: Omit<CanvasSectionItem, "id">) => void;
  onUpdateItem?: (item: CanvasSectionItem) => void;
  onDeleteItem?: (itemId: string) => void;
  onGenerateAI?: () => void;
  aiSuggestions?: AiSuggestion[];
  isLoadingAI?: boolean;
  onDismissAISuggestions?: () => void;
  sx?: object;
}>;

const CanvasSection: FC<CanvasSectionProps> = ({
  title,
  placeholder = "Who are our key partners?",
  items = [],
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onGenerateAI,
  aiSuggestions = [],
  isLoadingAI = false,
  onDismissAISuggestions,
  sx = {},
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isAddButtonHovered, setIsAddButtonHovered] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemDescription, setNewItemDescription] = useState("");
  const [editItemTitle, setEditItemTitle] = useState("");
  const [editItemDescription, setEditItemDescription] = useState("");

  const handleAddClick = () => {
    setIsAddingItem(true);
    setEditingItemId(null);
  };

  const handleCancelAdd = () => {
    setIsAddingItem(false);
    setNewItemTitle("");
    setNewItemDescription("");
  };

  const handleSaveItem = () => {
    if (newItemTitle.trim()) {
      onAddItem?.({
        title: newItemTitle.trim(),
        description: newItemDescription.trim(),
      });
      setIsAddingItem(false);
      setNewItemTitle("");
      setNewItemDescription("");
    }
  };

  const handleEditClick = (item: CanvasSectionItem) => {
    setEditingItemId(item.id);
    setEditItemTitle(item.title);
    setEditItemDescription(item.description);
    setIsAddingItem(false);
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setEditItemTitle("");
    setEditItemDescription("");
  };

  const handleSaveEdit = () => {
    if (editingItemId && editItemTitle.trim()) {
      onUpdateItem?.({
        id: editingItemId,
        title: editItemTitle.trim(),
        description: editItemDescription.trim(),
      });
      setEditingItemId(null);
      setEditItemTitle("");
      setEditItemDescription("");
    }
  };

  const handleDeleteItem = (itemId: string) => {
    onDeleteItem?.(itemId);
    if (editingItemId === itemId) {
      setEditingItemId(null);
    }
  };

  const handleSelectSuggestion = (suggestion: AiSuggestion) => {
    onAddItem?.({
      title: suggestion.title,
      description: suggestion.description,
    });
  };

  const placeholderItems = [
    { id: "placeholder-1", title: placeholder, description: "" },
    { id: "placeholder-2", title: placeholder, description: "" },
    { id: "placeholder-3", title: placeholder, description: "" },
  ];

  const displayItems = items.length > 0 ? items : placeholderItems;
  const hasRealItems = items.length > 0;

  return (
    <Box
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={{
        position: "relative",
        p: 2,
        minHeight: 150,
        display: "flex",
        flexDirection: "column",
        ...sx,
      }}
    >
      {/* Header with title and Add Story button */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 1.5,
        }}
      >
        <Stack direction="row" spacing={0.5} alignItems="center">
          <EditOutlinedIcon sx={{ fontSize: 16, color: "#9CA3AF" }} />
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 700,
              color: "#111827",
              textTransform: title === title.toUpperCase() ? "uppercase" : "none",
            }}
          >
            {title}
          </Typography>
        </Stack>

        {/* Add Story Button - appears on hover */}
        <Fade in={isHovered && !isAddingItem && !editingItemId}>
          <Box
            onMouseEnter={() => setIsAddButtonHovered(true)}
            onMouseLeave={() => setIsAddButtonHovered(false)}
            onClick={handleAddClick}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              bgcolor: "#4C6AD2",
              color: "#FFFFFF",
              borderRadius: 1.5,
              cursor: "pointer",
              overflow: "hidden",
              transition: "all 0.2s ease",
              px: isAddButtonHovered ? 1.5 : 0.8,
              py: 0.5,
              "&:hover": {
                bgcolor: "#3B5AC5",
              },
            }}
          >
            <AddIcon sx={{ fontSize: 18 }} />
            <Typography
              sx={{
                fontSize: 12,
                fontWeight: 600,
                whiteSpace: "nowrap",
                width: isAddButtonHovered ? "auto" : 0,
                opacity: isAddButtonHovered ? 1 : 0,
                transition: "all 0.2s ease",
                overflow: "hidden",
              }}
            >
              Add Story
            </Typography>
          </Box>
        </Fade>
      </Box>

      {/* Content area with border */}
      <Box
        sx={{
          flex: 1,
          borderTop: "1px solid #E5E7EB",
          pt: 1.5,
        }}
      >
        {/* Adding new item form */}
        {isAddingItem && (
          <Box
            sx={{
              bgcolor: "#F9FAFB",
              borderRadius: 1.5,
              border: "1px solid #E5E7EB",
              p: 2,
              mb: 1.5,
            }}
          >
            <TextField
              fullWidth
              placeholder="Title"
              value={newItemTitle}
              onChange={(e) => setNewItemTitle(e.target.value)}
              variant="standard"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSaveItem();
                } else if (e.key === "Escape") {
                  handleCancelAdd();
                }
              }}
              sx={{
                mb: 1.5,
                "& .MuiInputBase-input": {
                  fontSize: 14,
                  fontWeight: 500,
                  color: "#111827",
                  "&::placeholder": {
                    color: "#9CA3AF",
                    opacity: 1,
                  },
                },
                "& .MuiInput-underline:before": {
                  borderBottomColor: "#E5E7EB",
                },
                "& .MuiInput-underline:hover:before": {
                  borderBottomColor: "#D1D5DB",
                },
                "& .MuiInput-underline:after": {
                  borderBottomColor: "#4C6AD2",
                },
              }}
            />
            <TextField
              fullWidth
              placeholder="Description (optional)"
              value={newItemDescription}
              onChange={(e) => setNewItemDescription(e.target.value)}
              variant="standard"
              multiline
              rows={2}
              sx={{
                "& .MuiInputBase-input": {
                  fontSize: 13,
                  color: "#6B7280",
                  "&::placeholder": {
                    color: "#9CA3AF",
                    opacity: 1,
                  },
                },
                "& .MuiInput-underline:before": {
                  borderBottomColor: "transparent",
                },
                "& .MuiInput-underline:hover:before": {
                  borderBottomColor: "transparent",
                },
                "& .MuiInput-underline:after": {
                  borderBottomColor: "transparent",
                },
              }}
            />
            {/* Action buttons at bottom of form */}
            <Stack
              direction="row"
              spacing={1}
              justifyContent="space-between"
              alignItems="center"
              sx={{ mt: 2, pt: 1.5, borderTop: "1px solid #E5E7EB" }}
            >
              <Stack direction="row" spacing={0.5} alignItems="center">
                <IconButton
                  size="small"
                  sx={{ color: "#9CA3AF", "&:hover": { color: "#6B7280" } }}
                >
                  <HelpOutlineIcon sx={{ fontSize: 18 }} />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => onGenerateAI?.()}
                  sx={{ color: "#9CA3AF", "&:hover": { color: "#4C6AD2" } }}
                >
                  <AutoAwesomeOutlinedIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Stack>
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  variant="text"
                  onClick={handleCancelAdd}
                  sx={{
                    color: "#6B7280",
                    fontSize: 12,
                    fontWeight: 600,
                    textTransform: "none",
                    px: 1.5,
                    "&:hover": {
                      bgcolor: "rgba(0,0,0,0.04)",
                    },
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  onClick={handleSaveItem}
                  disabled={!newItemTitle.trim()}
                  sx={{
                    bgcolor: "#4C6AD2",
                    color: "#FFFFFF",
                    fontSize: 12,
                    fontWeight: 600,
                    textTransform: "none",
                    px: 2,
                    "&:hover": {
                      bgcolor: "#3B5AC5",
                    },
                    "&:disabled": {
                      bgcolor: "#E5E7EB",
                      color: "#9CA3AF",
                    },
                  }}
                >
                  Save
                </Button>
              </Stack>
            </Stack>
          </Box>
        )}

        {/* AI Loading state */}
        {isLoadingAI && (
          <Box
            sx={{
              bgcolor: "#F0F4FF",
              borderRadius: 1.5,
              border: "1px solid #C2D0F7",
              p: 2,
              mb: 1.5,
              display: "flex",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <CircularProgress size={18} sx={{ color: "#4C6AD2" }} />
            <Typography sx={{ fontSize: 13, color: "#4C6AD2", fontWeight: 500 }}>
              Generating AI suggestions...
            </Typography>
          </Box>
        )}

        {/* AI Suggestions */}
        {!isLoadingAI && aiSuggestions.length > 0 && (
          <Box
            sx={{
              bgcolor: "#F0F4FF",
              borderRadius: 1.5,
              border: "1px solid #C2D0F7",
              p: 2,
              mb: 1.5,
            }}
          >
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mb: 1.5 }}
            >
              <Stack direction="row" spacing={0.5} alignItems="center">
                <AutoAwesomeOutlinedIcon sx={{ fontSize: 16, color: "#4C6AD2" }} />
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#4C6AD2" }}>
                  AI Suggestions
                </Typography>
              </Stack>
              <IconButton
                size="small"
                onClick={onDismissAISuggestions}
                sx={{ color: "#9CA3AF", "&:hover": { color: "#6B7280" } }}
              >
                <CloseIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Stack>
            <Stack spacing={1}>
              {aiSuggestions.map((suggestion, index) => (
                <Box
                  key={index}
                  onClick={() => handleSelectSuggestion(suggestion)}
                  sx={{
                    bgcolor: "#FFFFFF",
                    borderRadius: 1,
                    border: "1px solid #E5E7EB",
                    p: 1.5,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    "&:hover": {
                      borderColor: "#4C6AD2",
                      bgcolor: "#FAFBFF",
                    },
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: "#111827",
                      mb: 0.25,
                    }}
                  >
                    {suggestion.title}
                  </Typography>
                  {suggestion.description && (
                    <Typography sx={{ fontSize: 12, color: "#6B7280" }}>
                      {suggestion.description}
                    </Typography>
                  )}
                </Box>
              ))}
            </Stack>
            <Typography
              sx={{
                fontSize: 11,
                color: "#9CA3AF",
                mt: 1.5,
                textAlign: "center",
              }}
            >
              Click a suggestion to add it
            </Typography>
          </Box>
        )}

        {/* Display existing items */}
        <Box>
          {displayItems.map((item) => {
            const isPlaceholder = item.id.startsWith("placeholder-");
            const isEditing = editingItemId === item.id;

            if (isEditing) {
              return (
                <Box
                  key={item.id}
                  sx={{
                    bgcolor: "#F9FAFB",
                    borderRadius: 1.5,
                    border: "1px solid #4C6AD2",
                    p: 2,
                    mb: 1,
                  }}
                >
                  <TextField
                    fullWidth
                    placeholder="Title"
                    value={editItemTitle}
                    onChange={(e) => setEditItemTitle(e.target.value)}
                    variant="standard"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSaveEdit();
                      } else if (e.key === "Escape") {
                        handleCancelEdit();
                      }
                    }}
                    sx={{
                      mb: 1,
                      "& .MuiInputBase-input": {
                        fontSize: 14,
                        fontWeight: 500,
                        color: "#111827",
                      },
                      "& .MuiInput-underline:before": {
                        borderBottomColor: "#E5E7EB",
                      },
                      "& .MuiInput-underline:after": {
                        borderBottomColor: "#4C6AD2",
                      },
                    }}
                  />
                  <TextField
                    fullWidth
                    placeholder="Description (optional)"
                    value={editItemDescription}
                    onChange={(e) => setEditItemDescription(e.target.value)}
                    variant="standard"
                    multiline
                    rows={2}
                    sx={{
                      "& .MuiInputBase-input": {
                        fontSize: 13,
                        color: "#6B7280",
                      },
                      "& .MuiInput-underline:before": {
                        borderBottomColor: "transparent",
                      },
                      "& .MuiInput-underline:after": {
                        borderBottomColor: "transparent",
                      },
                    }}
                  />
                  <Stack
                    direction="row"
                    spacing={1}
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ mt: 1.5, pt: 1, borderTop: "1px solid #E5E7EB" }}
                  >
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteItem(item.id)}
                      sx={{ color: "#9CA3AF", "&:hover": { color: "#EF4444" } }}
                    >
                      <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        variant="text"
                        onClick={handleCancelEdit}
                        sx={{
                          color: "#6B7280",
                          fontSize: 12,
                          fontWeight: 600,
                          textTransform: "none",
                          px: 1.5,
                          "&:hover": {
                            bgcolor: "rgba(0,0,0,0.04)",
                          },
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={handleSaveEdit}
                        disabled={!editItemTitle.trim()}
                        sx={{
                          bgcolor: "#4C6AD2",
                          color: "#FFFFFF",
                          fontSize: 12,
                          fontWeight: 600,
                          textTransform: "none",
                          px: 2,
                          "&:hover": {
                            bgcolor: "#3B5AC5",
                          },
                          "&:disabled": {
                            bgcolor: "#E5E7EB",
                            color: "#9CA3AF",
                          },
                        }}
                      >
                        Save
                      </Button>
                    </Stack>
                  </Stack>
                </Box>
              );
            }

            return (
              <Box
                key={item.id}
                onClick={() => !isPlaceholder && handleEditClick(item)}
                sx={{
                  py: 0.8,
                  px: 1,
                  mx: -1,
                  borderRadius: 1,
                  cursor: isPlaceholder ? "default" : "pointer",
                  transition: "background-color 0.15s ease",
                  "&:hover": {
                    bgcolor: isPlaceholder ? "transparent" : "rgba(76, 106, 210, 0.06)",
                  },
                }}
              >
                <Typography
                  sx={{
                    fontSize: 13,
                    color: hasRealItems ? "#111827" : "#9CA3AF",
                    fontWeight: hasRealItems ? 500 : 400,
                  }}
                >
                  {item.title}
                </Typography>
                {item.description && (
                  <Typography
                    sx={{
                      fontSize: 12,
                      color: "#6B7280",
                      mt: 0.25,
                    }}
                  >
                    {item.description}
                  </Typography>
                )}
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Bottom action icons - always visible on hover when not adding/editing */}
      {!isAddingItem && !editingItemId && (
        <Fade in={isHovered}>
          <Stack
            direction="row"
            spacing={0.5}
            justifyContent="space-between"
            alignItems="center"
            sx={{ mt: "auto", pt: 1.5 }}
          >
            <IconButton
              size="small"
              sx={{ color: "#9CA3AF", "&:hover": { color: "#6B7280" } }}
            >
              <HelpOutlineIcon sx={{ fontSize: 18 }} />
            </IconButton>
            <Stack direction="row" spacing={0.5}>
              <IconButton
                size="small"
                onClick={() => onGenerateAI?.()}
                disabled={isLoadingAI}
                sx={{
                  color: isLoadingAI ? "#4C6AD2" : "#9CA3AF",
                  "&:hover": { color: "#4C6AD2" },
                  "&:disabled": { color: "#4C6AD2" },
                }}
              >
                {isLoadingAI ? (
                  <CircularProgress size={18} sx={{ color: "#4C6AD2" }} />
                ) : (
                  <AutoAwesomeOutlinedIcon sx={{ fontSize: 18 }} />
                )}
              </IconButton>
            </Stack>
          </Stack>
        </Fade>
      )}
    </Box>
  );
};

export default CanvasSection;
