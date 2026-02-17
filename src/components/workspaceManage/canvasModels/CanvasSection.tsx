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
import type { GeneratedContentStatus } from "@/types/workspaces";
import { useLanguage } from "@/components/i18n/LanguageProvider";

export type CanvasSectionItem = {
  id: string;
  title: string;
  description: string;
  generation_status?: GeneratedContentStatus;
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

const IT_TITLE_MAP: Record<string, string> = {
  "KEY PARTNERS": "PARTNER CHIAVE",
  "Key Activities": "Attivita chiave",
  "Value Proposition": "Proposta di valore",
  "Customer Relationships": "Relazioni con i clienti",
  "Customer Segments": "Segmenti clienti",
  "Key Resources": "Risorse chiave",
  Channels: "Canali",
  "Cost Structure": "Struttura costi",
  "Revenue Streams": "Flussi di ricavi",
  PROBLEM: "PROBLEMA",
  Solution: "Soluzione",
  "Unique Value Proposition": "Proposta di valore unica",
  "Unfair Advantage": "Vantaggio competitivo",
  "Key Metrics": "Metriche chiave",
  Objectives: "Obiettivi",
  Milestones: "Milestone",
  "Risks & Owners": "Rischi e responsabili",
  "Products & Services": "Prodotti e servizi",
  "Pain Relievers": "Riduttori di pain",
  "Gain Creators": "Generatori di gain",
  "Customer Jobs": "Customer jobs",
  Pains: "Pain",
  Gains: "Gain",
  Hook: "Hook",
  Problem: "Problema",
  "Product Demo": "Demo prodotto",
  "Market Size": "Dimensione mercato",
  "Go-to-Market": "Go-to-market",
  Traction: "Traction",
  Team: "Team",
  Competition: "Concorrenza",
  Financials: "Finanze",
  "Business Model": "Modello di business",
  "The Ask": "La richiesta",
  "UNIQUE VALUE PROPOSITION": "PROPOSTA DI VALORE UNICA",
};

const IT_PLACEHOLDER_MAP: Record<string, string> = {
  "Who are our key partners?": "Chi sono i nostri partner chiave?",
  "What key activities do our value propositions require?":
    "Quali attivita chiave richiedono le nostre proposte di valore?",
  "What value do we deliver to the customer?": "Quale valore offriamo al cliente?",
  "What type of relationship does each customer segment expect?":
    "Che tipo di relazione si aspetta ogni segmento cliente?",
  "For whom are we creating value?": "Per chi stiamo creando valore?",
  "What key resources do our value propositions require?":
    "Quali risorse chiave richiedono le nostre proposte di valore?",
  "Through which channels do our customers want to be reached?":
    "Attraverso quali canali i clienti vogliono essere raggiunti?",
  "What are the most important costs inherent in our business model?":
    "Quali sono i costi piu importanti del nostro modello di business?",
  "For what value are our customers really willing to pay?":
    "Per quale valore i nostri clienti sono davvero disposti a pagare?",
  "List your top 1-3 problems. What existing alternatives do customers use?":
    "Elenca i tuoi 1-3 problemi principali. Quali alternative esistenti usano i clienti?",
  "Outline a possible solution for each problem":
    "Descrivi una possibile soluzione per ciascun problema",
  "Single, clear, compelling message that turns an unaware visitor into an interested prospect":
    "Messaggio unico, chiaro e convincente che trasformi un visitatore in un potenziale cliente",
  "Something that cannot be easily copied or bought":
    "Qualcosa che non possa essere copiato o comprato facilmente",
  "List your target customers and users. Who are your early adopters?":
    "Elenca clienti target e utenti. Chi sono i tuoi early adopter?",
  "List the key numbers that tell you how your business is doing":
    "Elenca i numeri chiave che indicano l'andamento del business",
  "List your path to customers (inbound or outbound)":
    "Elenca i canali per raggiungere i clienti (inbound o outbound)",
  "List your fixed and variable costs": "Elenca costi fissi e variabili",
  "List your sources of revenue": "Elenca le fonti di ricavo",
  "What products and services do you offer?": "Quali prodotti e servizi offri?",
  "How do you alleviate customer pains?": "Come riduci i pain dei clienti?",
  "How do you create customer gains?": "Come crei gain per i clienti?",
  "What jobs are customers trying to get done?":
    "Quali lavori i clienti stanno cercando di svolgere?",
  "What frustrates your customers?": "Cosa frustra i tuoi clienti?",
  "What outcomes do customers want to achieve?":
    "Quali risultati vogliono raggiungere i clienti?",
  "What's your attention-grabbing opening?": "Qual e la tua apertura piu efficace?",
  "What problem are you solving?": "Quale problema stai risolvendo?",
  "How do you solve this problem?": "Come risolvi questo problema?",
  "How does your product work?": "Come funziona il tuo prodotto?",
  "How big is the opportunity?": "Quanto e grande l'opportunita?",
  "How will you reach customers?": "Come raggiungerai i clienti?",
  "What progress have you made?": "Quali progressi hai fatto?",
  "How do you make money?": "Come guadagni?",
  "Who are your competitors?": "Chi sono i tuoi concorrenti?",
  "Who is on your team?": "Chi fa parte del tuo team?",
  "What are your projections?": "Quali sono le tue proiezioni?",
  "What are you asking for?": "Cosa stai chiedendo?",
  "What problem are you solving? What's the current alternative?":
    "Quale problema risolvi? Qual e l'alternativa attuale?",
  "What is your proposed solution? How does it work?":
    "Qual e la soluzione proposta? Come funziona?",
  "Who are your target customers? Who are early adopters?":
    "Chi sono i clienti target? Chi sono gli early adopter?",
  "What is your single, clear, compelling message that states why you are different and worth buying?":
    "Qual e il tuo messaggio unico, chiaro e convincente che spiega perche sei diverso e da scegliere?",
  "What can't be easily copied or bought?":
    "Cosa non puo essere copiato o comprato facilmente?",
  "What key metrics will you track?": "Quali metriche chiave traccerai?",
  "What are your fixed and variable costs?": "Quali sono i tuoi costi fissi e variabili?",
  "How will you make money?": "Come farai soldi?",
};

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
  const { locale } = useLanguage();
  const [isHovered, setIsHovered] = useState(false);
  const [isAddButtonHovered, setIsAddButtonHovered] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemDescription, setNewItemDescription] = useState("");
  const [editItemTitle, setEditItemTitle] = useState("");
  const [editItemDescription, setEditItemDescription] = useState("");
  const [editItemStatus, setEditItemStatus] = useState<GeneratedContentStatus>("final");

  const copy =
    locale === "it"
      ? {
          addStory: "Aggiungi nota",
          titlePlaceholder: "Titolo",
          descriptionPlaceholder: "Descrizione (opzionale)",
          cancel: "Annulla",
          save: "Salva",
          aiGenerating: "Generazione suggerimenti AI...",
          aiSuggestions: "Suggerimenti AI",
          clickToAdd: "Clicca un suggerimento per aggiungerlo",
          setAsFinal: "Imposta finale",
          setAsDraft: "Imposta bozza",
          draft: "BOZZA",
          final: "FINALE",
          finalize: "Finalizza",
          markDraft: "Bozza",
        }
      : {
          addStory: "Add Story",
          titlePlaceholder: "Title",
          descriptionPlaceholder: "Description (optional)",
          cancel: "Cancel",
          save: "Save",
          aiGenerating: "Generating AI suggestions...",
          aiSuggestions: "AI Suggestions",
          clickToAdd: "Click a suggestion to add it",
          setAsFinal: "Set as Final",
          setAsDraft: "Set as Draft",
          draft: "Draft",
          final: "Final",
          finalize: "Finalize",
          markDraft: "Draft",
        };

  const resolvedTitle = locale === "it" ? IT_TITLE_MAP[title] ?? title : title;
  const resolvedPlaceholder =
    locale === "it" ? IT_PLACEHOLDER_MAP[placeholder] ?? placeholder : placeholder;

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
        generation_status: "final",
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
    setEditItemStatus(item.generation_status ?? "final");
    setIsAddingItem(false);
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setEditItemTitle("");
    setEditItemDescription("");
    setEditItemStatus("final");
  };

  const handleSaveEdit = () => {
    if (editingItemId && editItemTitle.trim()) {
      onUpdateItem?.({
        id: editingItemId,
        title: editItemTitle.trim(),
        description: editItemDescription.trim(),
        generation_status: editItemStatus,
      });
      setEditingItemId(null);
      setEditItemTitle("");
      setEditItemDescription("");
      setEditItemStatus("final");
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
      generation_status: "draft",
    });
  };

  const handleToggleItemStatus = (item: CanvasSectionItem) => {
    const currentStatus = item.generation_status ?? "final";
    const nextStatus: GeneratedContentStatus = currentStatus === "draft" ? "final" : "draft";
    onUpdateItem?.({
      ...item,
      generation_status: nextStatus,
    });
  };

  const placeholderItems: CanvasSectionItem[] = [
    { id: "placeholder-1", title: resolvedPlaceholder, description: "" },
    { id: "placeholder-2", title: resolvedPlaceholder, description: "" },
    { id: "placeholder-3", title: resolvedPlaceholder, description: "" },
  ];

  const displayItems: CanvasSectionItem[] = items.length > 0 ? items : placeholderItems;
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
              textTransform: resolvedTitle === resolvedTitle.toUpperCase() ? "uppercase" : "none",
            }}
          >
            {resolvedTitle}
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
              {copy.addStory}
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
              placeholder={copy.titlePlaceholder}
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
              placeholder={copy.descriptionPlaceholder}
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
                  {copy.cancel}
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
                  {copy.save}
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
              {copy.aiGenerating}
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
                  {copy.aiSuggestions}
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
              {copy.clickToAdd}
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
                    placeholder={copy.titlePlaceholder}
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
                    placeholder={copy.descriptionPlaceholder}
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
                  <Box sx={{ mt: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() =>
                        setEditItemStatus((prev) => (prev === "draft" ? "final" : "draft"))
                      }
                      sx={{
                        textTransform: "none",
                        fontSize: 11,
                        borderColor: editItemStatus === "draft" ? "#F59E0B" : "#4C6AD2",
                        color: editItemStatus === "draft" ? "#92400E" : "#1D4ED8",
                        "&:hover": {
                          borderColor: editItemStatus === "draft" ? "#D97706" : "#1E40AF",
                          bgcolor:
                            editItemStatus === "draft"
                              ? "rgba(245, 158, 11, 0.08)"
                              : "rgba(76, 106, 210, 0.08)",
                        },
                      }}
                    >
                      {editItemStatus === "draft" ? copy.setAsFinal : copy.setAsDraft}
                    </Button>
                  </Box>
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
                        {copy.cancel}
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
                        {copy.save}
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
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      fontSize: 13,
                      color: hasRealItems ? "#111827" : "#9CA3AF",
                      fontWeight: hasRealItems ? 500 : 400,
                    }}
                  >
                    {item.title}
                  </Typography>
                  {!isPlaceholder && (
                    <>
                      <Typography
                        sx={{
                          fontSize: 10.5,
                          fontWeight: 700,
                          px: 0.8,
                          py: 0.2,
                          borderRadius: 999,
                          bgcolor:
                            (item.generation_status ?? "final") === "draft"
                              ? "rgba(245, 158, 11, 0.16)"
                              : "rgba(22, 163, 74, 0.16)",
                          color:
                            (item.generation_status ?? "final") === "draft"
                              ? "#92400E"
                              : "#166534",
                          textTransform: "uppercase",
                          letterSpacing: 0.3,
                        }}
                      >
                        {(item.generation_status ?? "final") === "draft" ? copy.draft : copy.final}
                      </Typography>
                      <Button
                        size="small"
                        variant="text"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleToggleItemStatus(item);
                        }}
                        sx={{
                          minWidth: 0,
                          px: 0.75,
                          py: 0.2,
                          fontSize: 10.5,
                          fontWeight: 700,
                          textTransform: "none",
                          color:
                            (item.generation_status ?? "final") === "draft"
                              ? "#166534"
                              : "#92400E",
                        }}
                      >
                        {(item.generation_status ?? "final") === "draft"
                          ? copy.finalize
                          : copy.markDraft}
                      </Button>
                    </>
                  )}
                </Stack>
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
