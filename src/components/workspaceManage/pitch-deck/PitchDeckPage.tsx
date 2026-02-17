// src/components/workspaceManage/pitch-deck/PitchDeckPage.tsx
"use client";

import type { FC } from "react";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Grid,
  Stack,
  Typography,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
} from "@mui/material";
import DesktopWindowsOutlinedIcon from "@mui/icons-material/DesktopWindowsOutlined";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import AddIcon from "@mui/icons-material/Add";
import type { PitchDeckTemplate, PitchDeck } from "@/types/workspaces";
import ManageSidebar from "@/components/workspaceManage/business-plan/ManageSidebar";
import { useLanguage } from "@/components/i18n/LanguageProvider";

export type PitchDeckPageProps = Readonly<{
  workspaceId: string;
}>;

type TabType = "templates" | "my-decks";

type TemplateKey =
  | "concept"
  | "prototype"
  | "growth"
  | "impact"
  | "innovation"
  | "corporate";

const TEMPLATE_KEYS: TemplateKey[] = [
  "concept",
  "prototype",
  "growth",
  "impact",
  "innovation",
  "corporate",
];

const IT_TEMPLATE_COPY: Record<TemplateKey, { name: string; description: string }> = {
  concept: {
    name: "Concept",
    description:
      "Template essenziale per presentare problema, soluzione e valore in modo chiaro e immediato.",
  },
  prototype: {
    name: "Prototype",
    description:
      "Ideale per mostrare MVP, demo prodotto e prossimi passi di sviluppo con messaggi concreti.",
  },
  growth: {
    name: "Growth",
    description:
      "Focalizzato su traction, metriche e strategia di crescita per evidenziare momentum e scalabilita.",
  },
  impact: {
    name: "Impact",
    description:
      "Pensato per startup orientate a impatto sociale o ambientale, con risultati e valore misurabile.",
  },
  innovation: {
    name: "Innovation",
    description:
      "Per prodotti innovativi: evidenzia tecnologia, vantaggio competitivo e differenziazione sul mercato.",
  },
  corporate: {
    name: "Corporate",
    description:
      "Stile professionale per contesti business tradizionali, partnership e presentazioni istituzionali.",
  },
};

const PitchDeckPage: FC<PitchDeckPageProps> = ({ workspaceId }) => {
  const router = useRouter();
  const { locale } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabType>("templates");
  const [templates, setTemplates] = useState<PitchDeckTemplate[]>([]);
  const [myDecks, setMyDecks] = useState<PitchDeck[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [isLoadingDecks, setIsLoadingDecks] = useState(false);

  // Create deck dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [newDeckTitle, setNewDeckTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Deck menu
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuDeckId, setMenuDeckId] = useState<string | null>(null);

  const copy =
    locale === "it"
      ? {
          allTemplates: "TUTTI I TEMPLATE",
          myDecks: "I MIEI DECK",
          noPitchDecksYet: "Nessun pitch deck ancora",
          createFromTemplate: "Crea da template",
          updated: "Aggiornato",
          createPitchDeck: "Crea Pitch Deck",
          deckTitle: "Titolo deck",
          cancel: "Annulla",
          creating: "Creazione...",
          create: "Crea",
          duplicate: "Duplica",
          delete: "Elimina",
          pitchDeckSuffix: "Pitch Deck",
          newPitchDeck: "Nuovo Pitch Deck",
        }
      : {
          allTemplates: "ALL TEMPLATES",
          myDecks: "MY DECKS",
          noPitchDecksYet: "No pitch decks yet",
          createFromTemplate: "Create from Template",
          updated: "Updated",
          createPitchDeck: "Create Pitch Deck",
          deckTitle: "Deck Title",
          cancel: "Cancel",
          creating: "Creating...",
          create: "Create",
          duplicate: "Duplicate",
          delete: "Delete",
          pitchDeckSuffix: "Pitch Deck",
          newPitchDeck: "New Pitch Deck",
        };

  const getTemplateKey = (template: PitchDeckTemplate): TemplateKey | null => {
    const value = `${template.name ?? ""}`.toLowerCase();
    for (const key of TEMPLATE_KEYS) {
      if (value.includes(key)) return key;
    }
    return null;
  };

  const getTemplateName = (template: PitchDeckTemplate): string => {
    const fallback = template.name ?? "Template";
    if (locale !== "it") return fallback;
    const key = getTemplateKey(template);
    return key ? IT_TEMPLATE_COPY[key].name : fallback;
  };

  const getTemplateDescription = (template: PitchDeckTemplate): string => {
    const fallback = template.description ?? "";
    if (locale !== "it") return fallback;
    const key = getTemplateKey(template);
    return key ? IT_TEMPLATE_COPY[key].description : fallback;
  };

  // Fetch templates
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setIsLoadingTemplates(true);
        const res = await fetch(`/api/workspaces/${workspaceId}/pitch-deck/templates`);
        if (res.ok) {
          const data = (await res.json()) as { templates: PitchDeckTemplate[] };
          const order = ["concept", "prototype", "growth", "impact", "innovation", "corporate"];
          const getRank = (name: string) => {
            const lower = name.toLowerCase();
            const index = order.findIndex((key) => lower.includes(key));
            return index === -1 ? Number.POSITIVE_INFINITY : index;
          };
          const sortedTemplates = [...data.templates].sort((a, b) => {
            const aKey = a.name?.toLowerCase() ?? "";
            const bKey = b.name?.toLowerCase() ?? "";
            const aRank = getRank(aKey);
            const bRank = getRank(bKey);
            if (aRank !== bRank) return aRank - bRank;
            return aKey.localeCompare(bKey);
          });
          setTemplates(sortedTemplates);
        }
      } catch (err) {
        console.error("Failed to fetch templates:", err);
      } finally {
        setIsLoadingTemplates(false);
      }
    };
    void fetchTemplates();
  }, [workspaceId]);

  // Fetch my decks
  const fetchMyDecks = useCallback(async () => {
    try {
      setIsLoadingDecks(true);
      const res = await fetch(`/api/workspaces/${workspaceId}/pitch-deck`);
      if (res.ok) {
        const data = (await res.json()) as { pitchDecks: PitchDeck[] };
        setMyDecks(data.pitchDecks);
      }
    } catch (err) {
      console.error("Failed to fetch decks:", err);
    } finally {
      setIsLoadingDecks(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    if (activeTab === "my-decks") {
      void fetchMyDecks();
    }
  }, [activeTab, fetchMyDecks]);

  // Handle template click
  const handleTemplateClick = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = templates.find((t) => t.id === templateId);
    setNewDeckTitle(
      template ? `${getTemplateName(template)} ${copy.pitchDeckSuffix}` : copy.newPitchDeck
    );
    setCreateDialogOpen(true);
  };

  // Create new deck
  const handleCreateDeck = async () => {
    if (!selectedTemplateId || !newDeckTitle.trim()) return;

    try {
      setIsCreating(true);
      const res = await fetch(`/api/workspaces/${workspaceId}/pitch-deck`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: selectedTemplateId,
          title: newDeckTitle.trim(),
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as { pitchDeck: PitchDeck };
        router.push(`/workspaces/${workspaceId}/manage/pitch-deck/${data.pitchDeck.id}`);
      }
    } catch (err) {
      console.error("Failed to create deck:", err);
    } finally {
      setIsCreating(false);
      setCreateDialogOpen(false);
    }
  };

  // Handle deck click
  const handleDeckClick = (deckId: string) => {
    router.push(`/workspaces/${workspaceId}/manage/pitch-deck/${deckId}`);
  };

  // Handle deck menu
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, deckId: string) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setMenuDeckId(deckId);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setMenuDeckId(null);
  };

  // Duplicate deck
  const handleDuplicateDeck = async () => {
    if (!menuDeckId) return;
    handleMenuClose();

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/pitch-deck/${menuDeckId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "duplicate" }),
      });

      if (res.ok) {
        await fetchMyDecks();
      }
    } catch (err) {
      console.error("Failed to duplicate deck:", err);
    }
  };

  // Delete deck
  const handleDeleteDeck = async () => {
    if (!menuDeckId) return;
    handleMenuClose();

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/pitch-deck/${menuDeckId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await fetchMyDecks();
      }
    } catch (err) {
      console.error("Failed to delete deck:", err);
    }
  };

  // Get template gradient for preview
  const getTemplateGradient = (template: PitchDeckTemplate): string => {
    if (template.cover_design?.background?.gradient) {
      return template.cover_design.background.gradient;
    }
    if (template.cover_design?.background?.color) {
      return template.cover_design.background.color;
    }
    return "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)";
  };

  const getTemplateTextColor = (template: PitchDeckTemplate): string => {
    return template.cover_design?.titleStyle?.color ?? "#FFFFFF";
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        height: "100vh",
        maxHeight: "100vh",
        display: "flex",
        bgcolor: "#F3F4FB",
      }}
    >
      <ManageSidebar workspaceId={workspaceId} activeItem="pitch-deck" />

      <Box
        component="main"
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          bgcolor: "#F9FAFF",
          minHeight: 0,
        }}
      >
        {/* Tabs */}
        <Box
          sx={{
            px: 4,
            py: 2.5,
            borderBottom: "1px solid #E5E7EB",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
          }}
        >
          <Stack
            direction="row"
            spacing={1.2}
            alignItems="center"
            onClick={() => setActiveTab("templates")}
            sx={{
              color: activeTab === "templates" ? "#324C8A" : "#6B7280",
              cursor: "pointer",
              "&:hover": { color: "#324C8A" },
            }}
          >
            <DesktopWindowsOutlinedIcon sx={{ fontSize: 22 }} />
            <Typography
              sx={{
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: 2,
              }}
            >
              {copy.allTemplates}
            </Typography>
          </Stack>
          <Stack
            direction="row"
            spacing={1.2}
            alignItems="center"
            onClick={() => setActiveTab("my-decks")}
            sx={{
              color: activeTab === "my-decks" ? "#324C8A" : "#6B7280",
              cursor: "pointer",
              "&:hover": { color: "#324C8A" },
            }}
          >
            <FolderOutlinedIcon sx={{ fontSize: 22 }} />
            <Typography
              sx={{
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: 2,
              }}
            >
              {copy.myDecks}
            </Typography>
          </Stack>
        </Box>

        {/* Content */}
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            px: 4,
            py: 4,
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            "&::-webkit-scrollbar": { display: "none" },
          }}
        >
          <Box sx={{ maxWidth: 1120, mx: "auto" }}>
            {activeTab === "templates" ? (
              isLoadingTemplates ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                  <CircularProgress size={32} sx={{ color: "#4C6AD2" }} />
                </Box>
              ) : (
                <Grid container spacing={3}>
                  {templates.map((template) => (
                    <Grid key={template.id} size={{ xs: 12, sm: 6, lg: 4 }}>
                      <Box
                        onClick={() => handleTemplateClick(template.id)}
                        sx={{
                          borderRadius: 3,
                          border: "1px solid #E2E8F0",
                          bgcolor: "#FFFFFF",
                          overflow: "hidden",
                          display: "flex",
                          flexDirection: "column",
                          height: "100%",
                          cursor: "pointer",
                          transition: "all 0.2s",
                          "&:hover": {
                            boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                            transform: "translateY(-2px)",
                          },
                        }}
                      >
                        <Box sx={{ bgcolor: "#000000" }}>
                          <Box
                            sx={{
                              height: 150,
                              borderRadius: "10px 10px 0 0",
                              background: getTemplateGradient(template),
                              backgroundSize: "cover",
                              backgroundPosition: "center",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              px: 3,
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: 20,
                                fontWeight: 700,
                                color: getTemplateTextColor(template),
                                textAlign: "center",
                              }}
                            >
                              {getTemplateName(template)}
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ px: 3, py: 2.5 }}>
                          <Typography
                            sx={{
                              fontSize: 15,
                              fontWeight: 600,
                              color: "#111827",
                              mb: 0.6,
                            }}
                          >
                            {getTemplateName(template)}
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: 13,
                              color: "#4B5563",
                              lineHeight: 1.6,
                            }}
                          >
                            {getTemplateDescription(template)}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              )
            ) : isLoadingDecks ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                <CircularProgress size={32} sx={{ color: "#4C6AD2" }} />
              </Box>
            ) : myDecks.length === 0 ? (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  py: 12,
                  gap: 2,
                }}
              >
                <FolderOutlinedIcon sx={{ fontSize: 48, color: "#9CA3AF" }} />
                <Typography sx={{ fontSize: 16, color: "#6B7280" }}>
                  {copy.noPitchDecksYet}
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setActiveTab("templates")}
                  sx={{
                    mt: 1,
                    bgcolor: "#4C6AD2",
                    "&:hover": { bgcolor: "#3D5ABF" },
                    textTransform: "none",
                    borderRadius: 2,
                  }}
                >
                  {copy.createFromTemplate}
                </Button>
              </Box>
            ) : (
              <Grid container spacing={3}>
                {myDecks.map((deck) => {
                  const deckTemplate = templates.find((t) => t.id === deck.template_id);
                  return (
                    <Grid key={deck.id} size={{ xs: 12, sm: 6, lg: 4 }}>
                      <Box
                        onClick={() => handleDeckClick(deck.id)}
                        sx={{
                          borderRadius: 3,
                          border: "1px solid #E2E8F0",
                          bgcolor: "#FFFFFF",
                          overflow: "hidden",
                          display: "flex",
                          flexDirection: "column",
                          height: "100%",
                          cursor: "pointer",
                          transition: "all 0.2s",
                          "&:hover": {
                            boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                            transform: "translateY(-2px)",
                          },
                        }}
                      >
                        <Box sx={{ bgcolor: "#000000", position: "relative" }}>
                          <Box
                            sx={{
                              height: 150,
                              borderRadius: "10px 10px 0 0",
                              background: deckTemplate
                                ? getTemplateGradient(deckTemplate)
                                : "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
                              backgroundSize: "cover",
                              backgroundPosition: "center",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              px: 3,
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: 18,
                                fontWeight: 700,
                                color: deckTemplate
                                  ? getTemplateTextColor(deckTemplate)
                                  : "#FFFFFF",
                                textAlign: "center",
                              }}
                            >
                              {deck.title}
                            </Typography>
                          </Box>
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, deck.id)}
                            sx={{
                              position: "absolute",
                              top: 8,
                              right: 8,
                              bgcolor: "rgba(255,255,255,0.9)",
                              "&:hover": { bgcolor: "#FFFFFF" },
                            }}
                          >
                            <MoreVertIcon sx={{ fontSize: 18 }} />
                          </IconButton>
                        </Box>
                        <Box sx={{ px: 3, py: 2.5 }}>
                          <Typography
                            sx={{
                              fontSize: 15,
                              fontWeight: 600,
                              color: "#111827",
                              mb: 0.6,
                            }}
                          >
                            {deck.title}
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: 12,
                              color: "#9CA3AF",
                            }}
                          >
                            {copy.updated}{" "}
                            {new Date(deck.updated_at).toLocaleDateString(
                              locale === "it" ? "it-IT" : "en-US"
                            )}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </Box>
        </Box>
      </Box>

      {/* Create Deck Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>{copy.createPitchDeck}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label={copy.deckTitle}
            value={newDeckTitle}
            onChange={(e) => setNewDeckTitle(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCreateDialogOpen(false)} sx={{ color: "#6B7280" }}>
            {copy.cancel}
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateDeck}
            disabled={isCreating || !newDeckTitle.trim()}
            sx={{
              bgcolor: "#4C6AD2",
              "&:hover": { bgcolor: "#3D5ABF" },
              textTransform: "none",
            }}
          >
            {isCreating ? copy.creating : copy.create}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Deck Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleDuplicateDeck}>{copy.duplicate}</MenuItem>
        <MenuItem onClick={handleDeleteDeck} sx={{ color: "#EF4444" }}>
          {copy.delete}
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default PitchDeckPage;
