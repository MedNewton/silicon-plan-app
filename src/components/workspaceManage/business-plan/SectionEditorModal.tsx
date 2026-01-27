// src/components/workspaceManage/business-plan/SectionEditorModal.tsx
"use client";

import type { FC } from "react";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  Stack,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import type {
  BusinessPlanSection,
  BusinessPlanSectionContent,
  TextSectionContent,
  SectionTitleContent,
  SubsectionContent,
  ListSectionContent,
  TableSectionContent,
  ComparisonTableContent,
  ImageSectionContent,
  TimelineSectionContent,
  EmbedSectionContent,
  EmptySpaceContent,
} from "@/types/workspaces";

export type SectionEditorModalProps = {
  open: boolean;
  section: BusinessPlanSection | null;
  isSaving: boolean;
  onSave: (content: BusinessPlanSectionContent) => void;
  onCancel: () => void;
};

const SectionEditorModal: FC<SectionEditorModalProps> = ({
  open,
  section,
  isSaving,
  onSave,
  onCancel,
}) => {
  const [content, setContent] = useState<BusinessPlanSectionContent | null>(null);

  useEffect(() => {
    if (section) {
      // Deep clone the content to avoid mutating the original
      setContent(JSON.parse(JSON.stringify(section.content)) as BusinessPlanSectionContent);
    }
  }, [section]);

  if (!section || !content) return null;

  const handleSave = () => {
    if (content) {
      onSave(content);
    }
  };

  const getTitle = () => {
    switch (content.type) {
      case "section_title":
        return "Edit Section Title";
      case "subsection":
        return "Edit Subsection";
      case "text":
        return "Edit Text";
      case "list":
        return "Edit List";
      case "table":
        return "Edit Table";
      case "comparison_table":
        return "Edit Comparison Table";
      case "image":
        return "Edit Image";
      case "timeline":
        return "Edit Timeline";
      case "embed":
        return "Edit Embed";
      case "empty_space":
        return "Edit Empty Space";
      case "page_break":
        return "Page Break";
      default:
        return "Edit Section";
    }
  };

  return (
    <Dialog
      open={open}
      onClose={isSaving ? undefined : onCancel}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: "85vh",
        },
      }}
    >
      <DialogTitle sx={{ borderBottom: "1px solid #E5E7EB", pb: 2 }}>
        <Typography sx={{ fontSize: 18, fontWeight: 600, color: "#111827" }}>
          {getTitle()}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {content.type === "section_title" && (
          <TextBasedEditor
            content={content}
            onChange={(c) => setContent(c)}
            label="Section Title"
            multiline={false}
          />
        )}

        {content.type === "subsection" && (
          <TextBasedEditor
            content={content}
            onChange={(c) => setContent(c)}
            label="Subsection Title"
            multiline={false}
          />
        )}

        {content.type === "text" && (
          <TextBasedEditor
            content={content}
            onChange={(c) => setContent(c)}
            label="Text Content"
            multiline={true}
          />
        )}

        {content.type === "list" && (
          <ListEditor
            content={content}
            onChange={(c) => setContent(c)}
          />
        )}

        {content.type === "table" && (
          <TableEditor
            content={content}
            onChange={(c) => setContent(c)}
          />
        )}

        {content.type === "comparison_table" && (
          <ComparisonTableEditor
            content={content}
            onChange={(c) => setContent(c)}
          />
        )}

        {content.type === "image" && (
          <ImageEditor
            content={content}
            onChange={(c) => setContent(c)}
          />
        )}

        {content.type === "timeline" && (
          <TimelineEditor
            content={content}
            onChange={(c) => setContent(c)}
          />
        )}

        {content.type === "embed" && (
          <EmbedEditor
            content={content}
            onChange={(c) => setContent(c)}
          />
        )}

        {content.type === "empty_space" && (
          <EmptySpaceEditor
            content={content}
            onChange={(c) => setContent(c)}
          />
        )}

        {content.type === "page_break" && (
          <Typography sx={{ color: "#6B7280", textAlign: "center", py: 4 }}>
            Page breaks have no editable content. They simply indicate where a new page should start when exporting.
          </Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, pt: 1, gap: 1.5, borderTop: "1px solid #E5E7EB" }}>
        <Button
          onClick={onCancel}
          disabled={isSaving}
          sx={{
            textTransform: "none",
            fontSize: 14,
            fontWeight: 600,
            py: 1.2,
            px: 3,
            borderRadius: 2,
            color: "#374151",
            bgcolor: "#F3F4F6",
            "&:hover": { bgcolor: "#E5E7EB" },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          sx={{
            textTransform: "none",
            fontSize: 14,
            fontWeight: 600,
            py: 1.2,
            px: 3,
            borderRadius: 2,
            color: "#FFFFFF",
            bgcolor: "#4C6AD2",
            "&:hover": { bgcolor: "#3B5AC5" },
            "&:disabled": { bgcolor: "#A5B4FC", color: "#FFFFFF" },
          }}
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SectionEditorModal;

// ========== TEXT-BASED EDITOR ==========

type TextBasedEditorProps = {
  content: TextSectionContent | SectionTitleContent | SubsectionContent;
  onChange: (content: TextSectionContent | SectionTitleContent | SubsectionContent) => void;
  label: string;
  multiline: boolean;
};

const TextBasedEditor: FC<TextBasedEditorProps> = ({ content, onChange, label, multiline }) => {
  return (
    <TextField
      fullWidth
      label={label}
      value={content.text}
      onChange={(e) => onChange({ ...content, text: e.target.value })}
      multiline={multiline}
      minRows={multiline ? 6 : 1}
      sx={{
        "& .MuiOutlinedInput-root": {
          fontSize: 14,
        },
      }}
    />
  );
};

// ========== LIST EDITOR ==========

type ListEditorProps = {
  content: ListSectionContent;
  onChange: (content: ListSectionContent) => void;
};

const ListEditor: FC<ListEditorProps> = ({ content, onChange }) => {
  const handleItemChange = (index: number, value: string) => {
    const newItems = [...content.items];
    newItems[index] = value;
    onChange({ ...content, items: newItems });
  };

  const handleAddItem = () => {
    onChange({ ...content, items: [...content.items, ""] });
  };

  const handleRemoveItem = (index: number) => {
    const newItems = content.items.filter((_, i) => i !== index);
    onChange({ ...content, items: newItems.length > 0 ? newItems : [""] });
  };

  return (
    <Stack spacing={2}>
      <FormControlLabel
        control={
          <Switch
            checked={content.ordered}
            onChange={(e) => onChange({ ...content, ordered: e.target.checked })}
          />
        }
        label="Numbered list"
      />

      <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>
        List Items
      </Typography>

      <Stack spacing={1.5}>
        {content.items.map((item, index) => (
          <Stack key={index} direction="row" spacing={1} alignItems="center">
            <DragIndicatorIcon sx={{ fontSize: 20, color: "#9CA3AF" }} />
            <Typography sx={{ fontSize: 14, color: "#6B7280", minWidth: 24 }}>
              {content.ordered ? `${index + 1}.` : "•"}
            </Typography>
            <TextField
              fullWidth
              size="small"
              value={item}
              onChange={(e) => handleItemChange(index, e.target.value)}
              placeholder={`Item ${index + 1}`}
            />
            <IconButton
              size="small"
              onClick={() => handleRemoveItem(index)}
              disabled={content.items.length <= 1}
              sx={{ color: "#9CA3AF", "&:hover": { color: "#EF4444" } }}
            >
              <DeleteOutlineIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Stack>
        ))}
      </Stack>

      <Button
        startIcon={<AddIcon />}
        onClick={handleAddItem}
        sx={{
          alignSelf: "flex-start",
          textTransform: "none",
          fontSize: 14,
          color: "#4C6AD2",
        }}
      >
        Add Item
      </Button>
    </Stack>
  );
};

// ========== TABLE EDITOR ==========

type TableEditorProps = {
  content: TableSectionContent;
  onChange: (content: TableSectionContent) => void;
};

const TableEditor: FC<TableEditorProps> = ({ content, onChange }) => {
  const handleHeaderChange = (index: number, value: string) => {
    const newHeaders = [...content.headers];
    newHeaders[index] = value;
    onChange({ ...content, headers: newHeaders });
  };

  const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
    const newRows = content.rows.map((row, ri) =>
      ri === rowIndex ? row.map((cell, ci) => (ci === colIndex ? value : cell)) : row
    );
    onChange({ ...content, rows: newRows });
  };

  const handleAddColumn = () => {
    const newHeaders = [...content.headers, `Column ${content.headers.length + 1}`];
    const newRows = content.rows.map((row) => [...row, ""]);
    onChange({ ...content, headers: newHeaders, rows: newRows });
  };

  const handleRemoveColumn = (index: number) => {
    if (content.headers.length <= 1) return;
    const newHeaders = content.headers.filter((_, i) => i !== index);
    const newRows = content.rows.map((row) => row.filter((_, i) => i !== index));
    onChange({ ...content, headers: newHeaders, rows: newRows });
  };

  const handleAddRow = () => {
    const newRow = content.headers.map(() => "");
    onChange({ ...content, rows: [...content.rows, newRow] });
  };

  const handleRemoveRow = (index: number) => {
    if (content.rows.length <= 1) return;
    const newRows = content.rows.filter((_, i) => i !== index);
    onChange({ ...content, rows: newRows });
  };

  return (
    <Stack spacing={2}>
      <Box sx={{ overflowX: "auto" }}>
        <Box sx={{ minWidth: 500 }}>
          {/* Headers */}
          <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
            <Box sx={{ width: 40 }} />
            {content.headers.map((header, index) => (
              <Box key={index} sx={{ flex: 1, minWidth: 120 }}>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <TextField
                    fullWidth
                    size="small"
                    value={header}
                    onChange={(e) => handleHeaderChange(index, e.target.value)}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        bgcolor: "#F3F4F6",
                        fontWeight: 600,
                      },
                    }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveColumn(index)}
                    disabled={content.headers.length <= 1}
                    sx={{ color: "#9CA3AF", "&:hover": { color: "#EF4444" } }}
                  >
                    <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Stack>
              </Box>
            ))}
            <Box sx={{ width: 40 }} />
          </Stack>

          {/* Rows */}
          {content.rows.map((row, rowIndex) => (
            <Stack key={rowIndex} direction="row" spacing={1} sx={{ mb: 1 }}>
              <Box sx={{ width: 40, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <DragIndicatorIcon sx={{ fontSize: 18, color: "#9CA3AF" }} />
              </Box>
              {row.map((cell, colIndex) => (
                <Box key={colIndex} sx={{ flex: 1, minWidth: 120 }}>
                  <TextField
                    fullWidth
                    size="small"
                    value={cell}
                    onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                  />
                </Box>
              ))}
              <Box sx={{ width: 40, display: "flex", alignItems: "center" }}>
                <IconButton
                  size="small"
                  onClick={() => handleRemoveRow(rowIndex)}
                  disabled={content.rows.length <= 1}
                  sx={{ color: "#9CA3AF", "&:hover": { color: "#EF4444" } }}
                >
                  <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Box>
            </Stack>
          ))}
        </Box>
      </Box>

      <Stack direction="row" spacing={2}>
        <Button
          startIcon={<AddIcon />}
          onClick={handleAddRow}
          sx={{ textTransform: "none", fontSize: 14, color: "#4C6AD2" }}
        >
          Add Row
        </Button>
        <Button
          startIcon={<AddIcon />}
          onClick={handleAddColumn}
          sx={{ textTransform: "none", fontSize: 14, color: "#4C6AD2" }}
        >
          Add Column
        </Button>
      </Stack>
    </Stack>
  );
};

// ========== COMPARISON TABLE EDITOR ==========

type ComparisonTableEditorProps = {
  content: ComparisonTableContent;
  onChange: (content: ComparisonTableContent) => void;
};

const ComparisonTableEditor: FC<ComparisonTableEditorProps> = ({ content, onChange }) => {
  // Reuse TableEditor logic - it's the same structure
  const handleHeaderChange = (index: number, value: string) => {
    const newHeaders = [...content.headers];
    newHeaders[index] = value;
    onChange({ ...content, headers: newHeaders });
  };

  const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
    const newRows = content.rows.map((row, ri) =>
      ri === rowIndex ? row.map((cell, ci) => (ci === colIndex ? value : cell)) : row
    );
    onChange({ ...content, rows: newRows });
  };

  const handleAddColumn = () => {
    const newHeaders = [...content.headers, `Option ${content.headers.length}`];
    const newRows = content.rows.map((row) => [...row, ""]);
    onChange({ ...content, headers: newHeaders, rows: newRows });
  };

  const handleRemoveColumn = (index: number) => {
    if (content.headers.length <= 2) return;
    const newHeaders = content.headers.filter((_, i) => i !== index);
    const newRows = content.rows.map((row) => row.filter((_, i) => i !== index));
    onChange({ ...content, headers: newHeaders, rows: newRows });
  };

  const handleAddRow = () => {
    const newRow = content.headers.map(() => "");
    onChange({ ...content, rows: [...content.rows, newRow] });
  };

  const handleRemoveRow = (index: number) => {
    if (content.rows.length <= 1) return;
    const newRows = content.rows.filter((_, i) => i !== index);
    onChange({ ...content, rows: newRows });
  };

  return (
    <Stack spacing={2}>
      <Typography sx={{ fontSize: 13, color: "#6B7280" }}>
        First column is typically used for feature names, other columns for comparing options.
      </Typography>

      <Box sx={{ overflowX: "auto" }}>
        <Box sx={{ minWidth: 500 }}>
          {/* Headers */}
          <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
            <Box sx={{ width: 40 }} />
            {content.headers.map((header, index) => (
              <Box key={index} sx={{ flex: 1, minWidth: 120 }}>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <TextField
                    fullWidth
                    size="small"
                    value={header}
                    onChange={(e) => handleHeaderChange(index, e.target.value)}
                    placeholder={index === 0 ? "Feature" : `Option ${index}`}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        bgcolor: "#F3F4F6",
                        fontWeight: 600,
                      },
                    }}
                  />
                  {index > 0 && (
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveColumn(index)}
                      disabled={content.headers.length <= 2}
                      sx={{ color: "#9CA3AF", "&:hover": { color: "#EF4444" } }}
                    >
                      <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  )}
                </Stack>
              </Box>
            ))}
            <Box sx={{ width: 40 }} />
          </Stack>

          {/* Rows */}
          {content.rows.map((row, rowIndex) => (
            <Stack key={rowIndex} direction="row" spacing={1} sx={{ mb: 1 }}>
              <Box sx={{ width: 40, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <DragIndicatorIcon sx={{ fontSize: 18, color: "#9CA3AF" }} />
              </Box>
              {row.map((cell, colIndex) => (
                <Box key={colIndex} sx={{ flex: 1, minWidth: 120 }}>
                  <TextField
                    fullWidth
                    size="small"
                    value={cell}
                    onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                    placeholder={colIndex === 0 ? "Feature name" : "Value"}
                  />
                </Box>
              ))}
              <Box sx={{ width: 40, display: "flex", alignItems: "center" }}>
                <IconButton
                  size="small"
                  onClick={() => handleRemoveRow(rowIndex)}
                  disabled={content.rows.length <= 1}
                  sx={{ color: "#9CA3AF", "&:hover": { color: "#EF4444" } }}
                >
                  <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Box>
            </Stack>
          ))}
        </Box>
      </Box>

      <Stack direction="row" spacing={2}>
        <Button
          startIcon={<AddIcon />}
          onClick={handleAddRow}
          sx={{ textTransform: "none", fontSize: 14, color: "#4C6AD2" }}
        >
          Add Feature
        </Button>
        <Button
          startIcon={<AddIcon />}
          onClick={handleAddColumn}
          sx={{ textTransform: "none", fontSize: 14, color: "#4C6AD2" }}
        >
          Add Option
        </Button>
      </Stack>
    </Stack>
  );
};

// ========== IMAGE EDITOR ==========

type ImageEditorProps = {
  content: ImageSectionContent;
  onChange: (content: ImageSectionContent) => void;
};

const ImageEditor: FC<ImageEditorProps> = ({ content, onChange }) => {
  return (
    <Stack spacing={3}>
      <TextField
        fullWidth
        label="Image URL"
        value={content.url}
        onChange={(e) => onChange({ ...content, url: e.target.value })}
        placeholder="https://example.com/image.jpg"
        helperText="Enter the URL of the image you want to display"
      />

      <TextField
        fullWidth
        label="Alt Text"
        value={content.alt_text ?? ""}
        onChange={(e) => onChange({ ...content, alt_text: e.target.value })}
        placeholder="Describe the image for accessibility"
        helperText="Alternative text for screen readers"
      />

      <TextField
        fullWidth
        label="Caption (optional)"
        value={content.caption ?? ""}
        onChange={(e) => onChange({ ...content, caption: e.target.value })}
        placeholder="Image caption"
      />

      {content.url && (
        <Box sx={{ mt: 2 }}>
          <Typography sx={{ fontSize: 13, color: "#6B7280", mb: 1 }}>Preview:</Typography>
          <Box
            component="img"
            src={content.url}
            alt={content.alt_text ?? "Preview"}
            sx={{
              maxWidth: "100%",
              maxHeight: 300,
              borderRadius: 2,
              border: "1px solid #E5E7EB",
            }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </Box>
      )}
    </Stack>
  );
};

// ========== TIMELINE EDITOR ==========

type TimelineEditorProps = {
  content: TimelineSectionContent;
  onChange: (content: TimelineSectionContent) => void;
};

const TimelineEditor: FC<TimelineEditorProps> = ({ content, onChange }) => {
  const handleEntryChange = (index: number, field: "date" | "title" | "description", value: string) => {
    const newEntries = content.entries.map((entry, i) =>
      i === index ? { ...entry, [field]: value } : entry
    );
    onChange({ ...content, entries: newEntries });
  };

  const handleAddEntry = () => {
    onChange({
      ...content,
      entries: [...content.entries, { date: "", title: "", description: "" }],
    });
  };

  const handleRemoveEntry = (index: number) => {
    if (content.entries.length <= 1) return;
    const newEntries = content.entries.filter((_, i) => i !== index);
    onChange({ ...content, entries: newEntries });
  };

  return (
    <Stack spacing={3}>
      <Typography sx={{ fontSize: 13, color: "#6B7280" }}>
        Add timeline entries with dates, titles, and descriptions.
      </Typography>

      {content.entries.map((entry, index) => (
        <Box
          key={index}
          sx={{
            p: 2,
            borderRadius: 2,
            border: "1px solid #E5E7EB",
            bgcolor: "#FAFBFC",
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>
              Entry {index + 1}
            </Typography>
            <IconButton
              size="small"
              onClick={() => handleRemoveEntry(index)}
              disabled={content.entries.length <= 1}
              sx={{ color: "#9CA3AF", "&:hover": { color: "#EF4444" } }}
            >
              <DeleteOutlineIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Stack>

          <Stack spacing={2}>
            <TextField
              fullWidth
              size="small"
              label="Date"
              value={entry.date}
              onChange={(e) => handleEntryChange(index, "date", e.target.value)}
              placeholder="e.g., Q1 2024, January 2024, 2024"
            />
            <TextField
              fullWidth
              size="small"
              label="Title"
              value={entry.title}
              onChange={(e) => handleEntryChange(index, "title", e.target.value)}
              placeholder="Milestone title"
            />
            <TextField
              fullWidth
              size="small"
              label="Description"
              value={entry.description}
              onChange={(e) => handleEntryChange(index, "description", e.target.value)}
              placeholder="Brief description"
              multiline
              minRows={2}
            />
          </Stack>
        </Box>
      ))}

      <Button
        startIcon={<AddIcon />}
        onClick={handleAddEntry}
        sx={{
          alignSelf: "flex-start",
          textTransform: "none",
          fontSize: 14,
          color: "#4C6AD2",
        }}
      >
        Add Timeline Entry
      </Button>
    </Stack>
  );
};

// ========== EMBED EDITOR ==========

type EmbedEditorProps = {
  content: EmbedSectionContent;
  onChange: (content: EmbedSectionContent) => void;
};

const EmbedEditor: FC<EmbedEditorProps> = ({ content, onChange }) => {
  return (
    <Stack spacing={3}>
      <FormControl fullWidth size="small">
        <InputLabel>Embed Type</InputLabel>
        <Select
          value={content.embed_type}
          label="Embed Type"
          onChange={(e) => onChange({ ...content, embed_type: e.target.value })}
        >
          <MenuItem value="html">HTML</MenuItem>
          <MenuItem value="iframe">iFrame</MenuItem>
          <MenuItem value="video">Video</MenuItem>
        </Select>
      </FormControl>

      <TextField
        fullWidth
        label={content.embed_type === "video" ? "Video URL" : "Embed Code"}
        value={content.code}
        onChange={(e) => onChange({ ...content, code: e.target.value })}
        multiline
        minRows={6}
        placeholder={
          content.embed_type === "video"
            ? "https://www.youtube.com/watch?v=..."
            : content.embed_type === "iframe"
            ? '<iframe src="..." />'
            : "<div>Your HTML code here</div>"
        }
        helperText={
          content.embed_type === "video"
            ? "Enter a YouTube or Vimeo URL"
            : content.embed_type === "iframe"
            ? "Enter the full iframe code"
            : "Enter custom HTML code"
        }
      />
    </Stack>
  );
};

// ========== EMPTY SPACE EDITOR ==========

type EmptySpaceEditorProps = {
  content: EmptySpaceContent;
  onChange: (content: EmptySpaceContent) => void;
};

const EmptySpaceEditor: FC<EmptySpaceEditorProps> = ({ content, onChange }) => {
  return (
    <Stack spacing={2}>
      <TextField
        fullWidth
        label="Height (pixels)"
        type="number"
        value={content.height}
        onChange={(e) => onChange({ ...content, height: parseInt(e.target.value) || 0 })}
        inputProps={{ min: 10, max: 500 }}
        helperText="Set the height of the empty space (10-500 pixels)"
      />

      <Box
        sx={{
          mt: 2,
          height: content.height,
          bgcolor: "#F3F4F6",
          borderRadius: 2,
          border: "2px dashed #D1D5DB",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography sx={{ fontSize: 12, color: "#9CA3AF" }}>
          {content.height}px empty space
        </Typography>
      </Box>
    </Stack>
  );
};
