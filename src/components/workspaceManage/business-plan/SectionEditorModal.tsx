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
import { useLanguage } from "@/components/i18n/LanguageProvider";

export type SectionEditorModalProps = {
  open: boolean;
  section: BusinessPlanSection | null;
  isSaving: boolean;
  onSave: (content: BusinessPlanSectionContent) => void;
  onCancel: () => void;
};

const getSectionEditorCopy = (locale: "en" | "it") =>
  locale === "it"
    ? {
        editSectionTitle: "Modifica titolo sezione",
        editSubsection: "Modifica sottosezione",
        editText: "Modifica testo",
        editList: "Modifica elenco",
        editTable: "Modifica tabella",
        editComparisonTable: "Modifica tabella confronto",
        editImage: "Modifica immagine",
        editTimeline: "Modifica timeline",
        editEmbed: "Modifica embed",
        editEmptySpace: "Modifica spazio vuoto",
        pageBreak: "Interruzione pagina",
        editSection: "Modifica sezione",
        sectionTitle: "Titolo sezione",
        subsectionTitle: "Titolo sottosezione",
        textContent: "Contenuto testo",
        pageBreakMessage:
          "Le interruzioni pagina non hanno contenuto modificabile. Indicano solo l'inizio di una nuova pagina in esportazione.",
        cancel: "Annulla",
        saving: "Salvataggio...",
        saveChanges: "Salva modifiche",
        numberedList: "Elenco numerato",
        listItems: "Elementi elenco",
        itemLabel: "Elemento",
        addItem: "Aggiungi elemento",
        columnLabel: "Colonna",
        addRow: "Aggiungi riga",
        addColumn: "Aggiungi colonna",
        comparisonHint:
          "La prima colonna e in genere usata per le caratteristiche, le altre per confrontare opzioni.",
        feature: "Caratteristica",
        featureName: "Nome caratteristica",
        value: "Valore",
        optionLabel: "Opzione",
        addFeature: "Aggiungi caratteristica",
        addOption: "Aggiungi opzione",
        imageUrl: "URL immagine",
        imageUrlHelp: "Inserisci l'URL dell'immagine da mostrare",
        altText: "Testo alternativo",
        altTextPlaceholder: "Descrivi l'immagine per l'accessibilita",
        altTextHelp: "Testo alternativo per screen reader",
        captionOptional: "Didascalia (opzionale)",
        captionPlaceholder: "Didascalia immagine",
        imagePreview: "Anteprima:",
        previewAlt: "Anteprima",
        timelineHint: "Aggiungi voci timeline con date, titoli e descrizioni.",
        entry: "Voce",
        date: "Data",
        dateExample: "es. Q1 2024, Gennaio 2024, 2024",
        title: "Titolo",
        description: "Descrizione",
        milestoneTitle: "Titolo milestone",
        briefDescription: "Breve descrizione",
        addTimelineEntry: "Aggiungi voce timeline",
        embedType: "Tipo embed",
        html: "HTML",
        iframe: "iFrame",
        video: "Video",
        videoUrl: "URL video",
        embedCode: "Codice embed",
        videoUrlHelp: "Inserisci un URL YouTube o Vimeo",
        iframeHelp: "Inserisci il codice iframe completo",
        htmlHelp: "Inserisci codice HTML personalizzato",
        emptySpaceHeight: "Altezza (pixel)",
        emptySpaceHelp: "Imposta l'altezza dello spazio vuoto (10-500 pixel)",
        emptySpacePreview: "spazio vuoto",
      }
    : {
        editSectionTitle: "Edit Section Title",
        editSubsection: "Edit Subsection",
        editText: "Edit Text",
        editList: "Edit List",
        editTable: "Edit Table",
        editComparisonTable: "Edit Comparison Table",
        editImage: "Edit Image",
        editTimeline: "Edit Timeline",
        editEmbed: "Edit Embed",
        editEmptySpace: "Edit Empty Space",
        pageBreak: "Page Break",
        editSection: "Edit Section",
        sectionTitle: "Section Title",
        subsectionTitle: "Subsection Title",
        textContent: "Text Content",
        pageBreakMessage:
          "Page breaks have no editable content. They simply indicate where a new page should start when exporting.",
        cancel: "Cancel",
        saving: "Saving...",
        saveChanges: "Save Changes",
        numberedList: "Numbered list",
        listItems: "List Items",
        itemLabel: "Item",
        addItem: "Add Item",
        columnLabel: "Column",
        addRow: "Add Row",
        addColumn: "Add Column",
        comparisonHint:
          "First column is typically used for feature names, other columns for comparing options.",
        feature: "Feature",
        featureName: "Feature name",
        value: "Value",
        optionLabel: "Option",
        addFeature: "Add Feature",
        addOption: "Add Option",
        imageUrl: "Image URL",
        imageUrlHelp: "Enter the URL of the image you want to display",
        altText: "Alt Text",
        altTextPlaceholder: "Describe the image for accessibility",
        altTextHelp: "Alternative text for screen readers",
        captionOptional: "Caption (optional)",
        captionPlaceholder: "Image caption",
        imagePreview: "Preview:",
        previewAlt: "Preview",
        timelineHint: "Add timeline entries with dates, titles, and descriptions.",
        entry: "Entry",
        date: "Date",
        dateExample: "e.g., Q1 2024, January 2024, 2024",
        title: "Title",
        description: "Description",
        milestoneTitle: "Milestone title",
        briefDescription: "Brief description",
        addTimelineEntry: "Add Timeline Entry",
        embedType: "Embed Type",
        html: "HTML",
        iframe: "iFrame",
        video: "Video",
        videoUrl: "Video URL",
        embedCode: "Embed Code",
        videoUrlHelp: "Enter a YouTube or Vimeo URL",
        iframeHelp: "Enter the full iframe code",
        htmlHelp: "Enter custom HTML code",
        emptySpaceHeight: "Height (pixels)",
        emptySpaceHelp: "Set the height of the empty space (10-500 pixels)",
        emptySpacePreview: "empty space",
      };

const SectionEditorModal: FC<SectionEditorModalProps> = ({
  open,
  section,
  isSaving,
  onSave,
  onCancel,
}) => {
  const { locale } = useLanguage();
  const copy = getSectionEditorCopy(locale);
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
        return copy.editSectionTitle;
      case "subsection":
        return copy.editSubsection;
      case "text":
        return copy.editText;
      case "list":
        return copy.editList;
      case "table":
        return copy.editTable;
      case "comparison_table":
        return copy.editComparisonTable;
      case "image":
        return copy.editImage;
      case "timeline":
        return copy.editTimeline;
      case "embed":
        return copy.editEmbed;
      case "empty_space":
        return copy.editEmptySpace;
      case "page_break":
        return copy.pageBreak;
      default:
        return copy.editSection;
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
            label={copy.sectionTitle}
            multiline={false}
          />
        )}

        {content.type === "subsection" && (
          <TextBasedEditor
            content={content}
            onChange={(c) => setContent(c)}
            label={copy.subsectionTitle}
            multiline={false}
          />
        )}

        {content.type === "text" && (
          <TextBasedEditor
            content={content}
            onChange={(c) => setContent(c)}
            label={copy.textContent}
            multiline={true}
          />
        )}

        {content.type === "list" && (
          <ListEditor
            content={content}
            onChange={(c) => setContent(c)}
            copy={copy}
          />
        )}

        {content.type === "table" && (
          <TableEditor
            content={content}
            onChange={(c) => setContent(c)}
            copy={copy}
          />
        )}

        {content.type === "comparison_table" && (
          <ComparisonTableEditor
            content={content}
            onChange={(c) => setContent(c)}
            copy={copy}
          />
        )}

        {content.type === "image" && (
          <ImageEditor
            content={content}
            onChange={(c) => setContent(c)}
            copy={copy}
          />
        )}

        {content.type === "timeline" && (
          <TimelineEditor
            content={content}
            onChange={(c) => setContent(c)}
            copy={copy}
          />
        )}

        {content.type === "embed" && (
          <EmbedEditor
            content={content}
            onChange={(c) => setContent(c)}
            copy={copy}
          />
        )}

        {content.type === "empty_space" && (
          <EmptySpaceEditor
            content={content}
            onChange={(c) => setContent(c)}
            copy={copy}
          />
        )}

        {content.type === "page_break" && (
          <Typography sx={{ color: "#6B7280", textAlign: "center", py: 4 }}>
            {copy.pageBreakMessage}
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
          {copy.cancel}
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
          {isSaving ? copy.saving : copy.saveChanges}
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
  copy: ReturnType<typeof getSectionEditorCopy>;
};

const ListEditor: FC<ListEditorProps> = ({ content, onChange, copy }) => {
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
        label={copy.numberedList}
      />

      <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#374151" }}>
        {copy.listItems}
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
              placeholder={`${copy.itemLabel} ${index + 1}`}
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
        {copy.addItem}
      </Button>
    </Stack>
  );
};

// ========== TABLE EDITOR ==========

type TableEditorProps = {
  content: TableSectionContent;
  onChange: (content: TableSectionContent) => void;
  copy: ReturnType<typeof getSectionEditorCopy>;
};

const TableEditor: FC<TableEditorProps> = ({ content, onChange, copy }) => {
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
    const newHeaders = [...content.headers, `${copy.columnLabel} ${content.headers.length + 1}`];
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
          {copy.addRow}
        </Button>
        <Button
          startIcon={<AddIcon />}
          onClick={handleAddColumn}
          sx={{ textTransform: "none", fontSize: 14, color: "#4C6AD2" }}
        >
          {copy.addColumn}
        </Button>
      </Stack>
    </Stack>
  );
};

// ========== COMPARISON TABLE EDITOR ==========

type ComparisonTableEditorProps = {
  content: ComparisonTableContent;
  onChange: (content: ComparisonTableContent) => void;
  copy: ReturnType<typeof getSectionEditorCopy>;
};

const ComparisonTableEditor: FC<ComparisonTableEditorProps> = ({ content, onChange, copy }) => {
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
    const newHeaders = [...content.headers, `${copy.optionLabel} ${content.headers.length}`];
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
        {copy.comparisonHint}
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
                    placeholder={index === 0 ? copy.feature : `${copy.optionLabel} ${index}`}
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
                    placeholder={colIndex === 0 ? copy.featureName : copy.value}
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
          {copy.addFeature}
        </Button>
        <Button
          startIcon={<AddIcon />}
          onClick={handleAddColumn}
          sx={{ textTransform: "none", fontSize: 14, color: "#4C6AD2" }}
        >
          {copy.addOption}
        </Button>
      </Stack>
    </Stack>
  );
};

// ========== IMAGE EDITOR ==========

type ImageEditorProps = {
  content: ImageSectionContent;
  onChange: (content: ImageSectionContent) => void;
  copy: ReturnType<typeof getSectionEditorCopy>;
};

const ImageEditor: FC<ImageEditorProps> = ({ content, onChange, copy }) => {
  return (
    <Stack spacing={3}>
      <TextField
        fullWidth
        label={copy.imageUrl}
        value={content.url}
        onChange={(e) => onChange({ ...content, url: e.target.value })}
        placeholder="https://example.com/image.jpg"
        helperText={copy.imageUrlHelp}
      />

      <TextField
        fullWidth
        label={copy.altText}
        value={content.alt_text ?? ""}
        onChange={(e) => onChange({ ...content, alt_text: e.target.value })}
        placeholder={copy.altTextPlaceholder}
        helperText={copy.altTextHelp}
      />

      <TextField
        fullWidth
        label={copy.captionOptional}
        value={content.caption ?? ""}
        onChange={(e) => onChange({ ...content, caption: e.target.value })}
        placeholder={copy.captionPlaceholder}
      />

      {content.url && (
        <Box sx={{ mt: 2 }}>
          <Typography sx={{ fontSize: 13, color: "#6B7280", mb: 1 }}>{copy.imagePreview}</Typography>
          <Box
            component="img"
            src={content.url}
            alt={content.alt_text ?? copy.previewAlt}
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
  copy: ReturnType<typeof getSectionEditorCopy>;
};

const TimelineEditor: FC<TimelineEditorProps> = ({ content, onChange, copy }) => {
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
        {copy.timelineHint}
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
              {copy.entry} {index + 1}
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
              label={copy.date}
              value={entry.date}
              onChange={(e) => handleEntryChange(index, "date", e.target.value)}
              placeholder={copy.dateExample}
            />
            <TextField
              fullWidth
              size="small"
              label={copy.title}
              value={entry.title}
              onChange={(e) => handleEntryChange(index, "title", e.target.value)}
              placeholder={copy.milestoneTitle}
            />
            <TextField
              fullWidth
              size="small"
              label={copy.description}
              value={entry.description}
              onChange={(e) => handleEntryChange(index, "description", e.target.value)}
              placeholder={copy.briefDescription}
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
        {copy.addTimelineEntry}
      </Button>
    </Stack>
  );
};

// ========== EMBED EDITOR ==========

type EmbedEditorProps = {
  content: EmbedSectionContent;
  onChange: (content: EmbedSectionContent) => void;
  copy: ReturnType<typeof getSectionEditorCopy>;
};

const EmbedEditor: FC<EmbedEditorProps> = ({ content, onChange, copy }) => {
  return (
    <Stack spacing={3}>
      <FormControl fullWidth size="small">
        <InputLabel>{copy.embedType}</InputLabel>
        <Select
          value={content.embed_type}
          label={copy.embedType}
          onChange={(e) => onChange({ ...content, embed_type: e.target.value })}
        >
          <MenuItem value="html">{copy.html}</MenuItem>
          <MenuItem value="iframe">{copy.iframe}</MenuItem>
          <MenuItem value="video">{copy.video}</MenuItem>
        </Select>
      </FormControl>

      <TextField
        fullWidth
        label={content.embed_type === "video" ? copy.videoUrl : copy.embedCode}
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
            ? copy.videoUrlHelp
            : content.embed_type === "iframe"
            ? copy.iframeHelp
            : copy.htmlHelp
        }
      />
    </Stack>
  );
};

// ========== EMPTY SPACE EDITOR ==========

type EmptySpaceEditorProps = {
  content: EmptySpaceContent;
  onChange: (content: EmptySpaceContent) => void;
  copy: ReturnType<typeof getSectionEditorCopy>;
};

const EmptySpaceEditor: FC<EmptySpaceEditorProps> = ({ content, onChange, copy }) => {
  return (
    <Stack spacing={2}>
      <TextField
        fullWidth
        label={copy.emptySpaceHeight}
        type="number"
        value={content.height}
        onChange={(e) => onChange({ ...content, height: parseInt(e.target.value) || 0 })}
        inputProps={{ min: 10, max: 500 }}
        helperText={copy.emptySpaceHelp}
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
          {content.height}px {copy.emptySpacePreview}
        </Typography>
      </Box>
    </Stack>
  );
};
