// src/components/workspaceSettings/AILibraryTabContent.tsx
"use client";

import { useState, type FC } from "react";
import {
  Box,
  Button,
  Chip,
  IconButton,
  Stack,
  Typography,
  Select,
  MenuItem,
  type SelectChangeEvent,
} from "@mui/material";

import AutorenewOutlinedIcon from "@mui/icons-material/AutorenewOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

import theme from "@/theme/theme";
import AILibraryModal from "@/components/workspaceSettings/modals/AILibraryModal";

type AILibrarySubTab = "documents" | "knowledge";

type DocumentStatus = "processing" | "uploaded";

type DocumentRow = {
  id: string;
  name: string;
  type: string;
  uploadedAt: string;
  status: DocumentStatus;
};

type KnowledgeEntry = {
  id: string;
  label: string;
  value: string;
};

export type AILibraryTabContentProps = Readonly<{
  workspaceName?: string;
}>;

const initialDocuments: DocumentRow[] = [
  {
    id: "1",
    name: "Business Draft",
    type: "PDF",
    uploadedAt: "12 June 2024",
    status: "processing",
  },
  {
    id: "2",
    name: "Business Draft",
    type: "XLX",
    uploadedAt: "12 June 2024",
    status: "uploaded",
  },
  {
    id: "3",
    name: "Business Draft",
    type: "PPTX",
    uploadedAt: "12 June 2024",
    status: "uploaded",
  },
  {
    id: "4",
    name: "Custom Notes",
    type: "PPTX",
    uploadedAt: "12 June 2024",
    status: "uploaded",
  },
  {
    id: "5",
    name: "Business Draft",
    type: "TXT",
    uploadedAt: "12 June 2024",
    status: "uploaded",
  },
];

const initialKnowledge: KnowledgeEntry[] = [
  {
    id: "k1",
    label: "Industry",
    value: "Business Software / SaaS",
  },
  {
    id: "k2",
    label: "Company Stage",
    value: "Early Growth (Seed to Series A)",
  },
  {
    id: "k3",
    label: "Problem You Solve",
    value:
      "Founders and small businesses struggle to structure and present professional business plans quickly.",
  },
  {
    id: "k4",
    label: "Solution and Uniqueness",
    value:
      "SiliconPlan provides a guided, AI-powered platform that automates business plan creation, pitch deck design, and startup valuation. It combines text generation with built-in templates and a marketplace of certified consultants.",
  },
  {
    id: "k5",
    label: "3–5 Year Financial Projections",
    value:
      "- Year 1 Revenue: €180,000\n- Year 3 Revenue: €1.2M\n- Year 5 Revenue: €3.5M\n- EBITDA Margin Target: 28% by Year 5",
  },
  {
    id: "k6",
    label: "Main Risks and Mitigation",
    value:
      "- Risk: High competition in AI document tools.\n- Mitigation: Focus on niche — startup incubators and accelerators.\n- Risk: AI quality inconsistency.\n- Mitigation: Human consultant marketplace integration.",
  },
];

const AILibraryTabContent: FC<AILibraryTabContentProps> = ({ workspaceName }) => {
  const [activeSubTab, setActiveSubTab] = useState<AILibrarySubTab>("documents");
  const [documents, setDocuments] = useState<DocumentRow[]>(initialDocuments);
  const [knowledgeEntries, setKnowledgeEntries] =
    useState<KnowledgeEntry[]>(initialKnowledge);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalInitialTab, setModalInitialTab] = useState<"upload" | "notes">(
    "upload",
  );

  const handleRowsPerPageChange = (event: SelectChangeEvent<number>) => {
    const value = Number(event.target.value);
    setRowsPerPage(value);
  };

  const handleDeleteDocument = (id: string) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== id));
  };

  const handleDeleteKnowledge = (id: string) => {
    setKnowledgeEntries((prev) => prev.filter((item) => item.id !== id));
  };

  const openUploadModal = () => {
    setModalInitialTab("upload");
    setModalOpen(true);
  };

  const openNotesModal = () => {
    setModalInitialTab("notes");
    setModalOpen(true);
  };

  const renderStatus = (status: DocumentStatus) => {
    if (status === "processing") {
      return (
        <Chip
          icon={<AutorenewOutlinedIcon sx={{ fontSize: 16 }} />}
          label="Processing"
          size="small"
          sx={{
            borderRadius: 999,
            bgcolor: "#FFF7E0",
            color: "#B7791F",
            "& .MuiChip-icon": {
              color: "#B7791F",
            },
          }}
        />
      );
    }

    return (
      <Chip
        icon={<CheckCircleOutlineOutlinedIcon sx={{ fontSize: 16 }} />}
        label="Uploaded"
        size="small"
        sx={{
          borderRadius: 999,
          bgcolor: "#E6F6EA",
          color: "#15803D",
          "& .MuiChip-icon": {
            color: "#15803D",
          },
        }}
      />
    );
  };

  const renderTypeBadge = (type: string) => {
    let bg = "#F97373";
    const color = "#FFFFFF";

    if (type === "XLX") {
      bg = "#22C55E";
    } else if (type === "PPTX") {
      bg = "#F97316";
    } else if (type === "TXT") {
      bg = "#6B7280";
    }

    return (
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
          fontWeight: 700,
          bgcolor: bg,
          color,
        }}
      >
        {type}
      </Box>
    );
  };

  const renderDocumentsView = () => (
    <Box
      sx={{
        width: "100%",
        maxWidth: 980,
        borderRadius: 4,
        border: "1px solid #E1E6F5",
        bgcolor: "#F9FAFF",
        px: 6,
        pt: 4,
        pb: 5,
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 1.5,
        }}
      >
        <Box>
          <Typography sx={{ fontSize: 20, fontWeight: 600, mb: 0.5 }}>
            Documents library
          </Typography>
          <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
            All documents uploaded to your AI knowledge base
          </Typography>
        </Box>

        <Button
          disableRipple
          onClick={openUploadModal}
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
            fontSize: 14,
            px: 3,
            py: 0.9,
            color: theme.palette.grey[600],
            border: `1px solid ${theme.palette.grey[600]}`,
            boxShadow: "none",
            "&:hover": {
              boxShadow: "none",
              opacity: 0.96,
              backgroundImage: "linear-gradient(90deg, #4C6AD2 0%, #7B4FD6 100%)",
              color: theme.palette.background.default,
              borderColor: theme.palette.background.default,
            },
          }}
        >
          Add Document
        </Button>
      </Box>

      <Box
        sx={{
          mt: 3,
          borderRadius: 3,
          border: "1px solid #E1E6F5",
          overflow: "hidden",
          bgcolor: "#FFFFFF",
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "3fr 1.1fr 1.6fr 1.5fr 1fr",
            px: 3,
            py: 1.5,
            bgcolor: "#F5F7FF",
            borderBottom: "1px solid #E1E6F5",
            fontSize: 12,
            fontWeight: 600,
            color: "#6B7280",
          }}
        >
          <Box>Document name</Box>
          <Box>Type</Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
            }}
          >
            Uploaded
            <ArrowDropDownIcon sx={{ fontSize: 18 }} />
          </Box>
          <Box>Status</Box>
          <Box textAlign="right">Actions</Box>
        </Box>

        {documents.map((doc) => (
          <Box
            key={doc.id}
            sx={{
              display: "grid",
              gridTemplateColumns: "3fr 1.1fr 1.6fr 1.5fr 1fr",
              px: 3,
              py: 1.4,
              alignItems: "center",
              borderBottom: "1px solid #EDF0FB",
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              {renderTypeBadge(doc.type)}
              <Typography sx={{ fontSize: 14.5, fontWeight: 500 }}>
                {doc.name}
              </Typography>
            </Stack>

            <Typography sx={{ fontSize: 13.5, color: "text.secondary" }}>
              {doc.type}
            </Typography>

            <Typography sx={{ fontSize: 13.5, color: "text.secondary" }}>
              {doc.uploadedAt}
            </Typography>

            <Box>{renderStatus(doc.status)}</Box>

            <Box textAlign="right">
              <Button
                disableRipple
                onClick={() => handleDeleteDocument(doc.id)}
                sx={{
                  minWidth: 0,
                  borderRadius: 999,
                  border: "1px solid #FCA5A5",
                  color: "#DC2626",
                  textTransform: "none",
                  fontSize: 13,
                  fontWeight: 600,
                  px: 2.2,
                  py: 0.5,
                  bgcolor: "#FFF5F5",
                  "&:hover": {
                    bgcolor: "#FFE4E6",
                  },
                }}
              >
                Delete
              </Button>
            </Box>
          </Box>
        ))}

        <Box
          sx={{
            px: 3,
            py: 1.8,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 12.5,
            bgcolor: "#FFFFFF",
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Rows per page:
            </Typography>
            <Select
              value={rowsPerPage}
              onChange={handleRowsPerPageChange}
              size="small"
              sx={{
                minWidth: 72,
                fontSize: 13,
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#D3DBEF",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#C3CDE8",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#8A9FE4",
                },
              }}
            >
              <MenuItem value={5}>5</MenuItem>
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={25}>25</MenuItem>
            </Select>
          </Stack>

          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ color: "text.secondary" }}
          >
            <Typography variant="body2">1–5 of 13</Typography>
            <IconButton
              size="small"
              sx={{
                width: 30,
                height: 30,
                borderRadius: 999,
                border: "1px solid #4F4F4F",
                bgcolor: "#FFFFFF",
              }}
            >
              <ChevronLeftIcon
                sx={{ fontSize: 18, color: theme.palette.grey[800] }}
              />
            </IconButton>
            <IconButton
              size="small"
              sx={{
                width: 30,
                height: 30,
                borderRadius: 999,
                border: "1px solid #4E4E4E",
                bgcolor: "#FFFFFF",
              }}
            >
              <ChevronRightIcon
                sx={{ fontSize: 18, color: theme.palette.grey[800] }}
              />
            </IconButton>
          </Stack>
        </Box>
      </Box>
    </Box>
  );

  const renderKnowledgeCard = (entry: KnowledgeEntry) => (
    <Box
      key={entry.id}
      sx={{
        borderRadius: 3,
        border: "1px solid #E1E6F5",
        bgcolor: "#FFFFFF",
        px: 3,
        py: 2.4,
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 1.2,
        }}
      >
        <Typography
          sx={{
            fontSize: 12,
            fontWeight: 600,
            color: "#64748B",
          }}
        >
          {entry.label}
        </Typography>

        <Stack direction="row" spacing={0.6} alignItems="center">
          <IconButton
            size="small"
            sx={{
              width: 28,
              height: 28,
              borderRadius: 999,
              border: "1px solid #CBD5F1",
              bgcolor: "#F6F8FF",
              color: "#4C6AD2",
            }}
          >
            <AutoAwesomeOutlinedIcon sx={{ fontSize: 16 }} />
          </IconButton>

          <IconButton
            size="small"
            sx={{
              width: 28,
              height: 28,
              borderRadius: 999,
              border: "1px solid #E5E7EB",
              bgcolor: "#FFFFFF",
              color: "#4B5563",
            }}
          >
            <EditOutlinedIcon sx={{ fontSize: 16 }} />
          </IconButton>

          <IconButton
            size="small"
            onClick={() => handleDeleteKnowledge(entry.id)}
            sx={{
              width: 28,
              height: 28,
              borderRadius: 999,
              border: "1px solid #FCA5A5",
              bgcolor: "#FFF5F5",
              color: "#DC2626",
            }}
          >
            <CloseOutlinedIcon sx={{ fontSize: 15 }} />
          </IconButton>
        </Stack>
      </Box>

      <Typography
        sx={{
          fontSize: 13.5,
          whiteSpace: "pre-line",
          color: "#111827",
        }}
      >
        {entry.value}
      </Typography>
    </Box>
  );

  const renderKnowledgeView = () => (
    <Box
      sx={{
        width: "100%",
        maxWidth: 980,
        borderRadius: 4,
        border: "1px solid #E1E6F5",
        bgcolor: "#F9FAFF",
        px: 6,
        pt: 4,
        pb: 5,
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2.5,
        }}
      >
        <Box>
          <Typography sx={{ fontSize: 20, fontWeight: 600, mb: 0.5 }}>
            AI Knowledge
          </Typography>
          <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
            Manage and review structured information that your AI assistant uses
            to understand this business.
          </Typography>
        </Box>

        <Button
          disableRipple
          onClick={openNotesModal}
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
            fontSize: 14,
            px: 3,
            py: 0.9,
            color: theme.palette.grey[600],
            border: `1px solid ${theme.palette.grey[600]}`,
            whiteSpace: "nowrap",
            boxShadow: "none",
            "&:hover": {
              boxShadow: "none",
              opacity: 0.96,
              backgroundImage: "linear-gradient(90deg, #4C6AD2 0%, #7B4FD6 100%)",
              color: theme.palette.background.default,
              borderColor: theme.palette.background.default,
            },
          }}
        >
          Add Knowledge
        </Button>
      </Box>

      <Stack spacing={2.2}>
        {knowledgeEntries.map((entry) => renderKnowledgeCard(entry))}
      </Stack>
    </Box>
  );

  const disabledFooterButtons = false;

  return (
    <>
      <Box
        sx={{
          flex: 1,
          flexDirection: "column",
          display: "flex",
          alignItems: "center",
          gap: 2,
          mt: 4,
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: 980,
            mb: 1,
          }}
        >
          <Typography sx={{ fontSize: 22, fontWeight: 600, mb: 0.5 }}>
            AI Library
          </Typography>
          <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
            Manage documents and knowledge that your AI assistant uses for this
            workspace{workspaceName ? ` (${workspaceName})` : ""}.
          </Typography>
        </Box>

        <Box
          sx={{
            width: "100%",
            maxWidth: 980,
            display: "flex",
            justifyContent: "center",
            mt: 1,
          }}
        >
          <Box
            sx={{
              width: "100%",
              borderBottom: "1px solid #E1E6F5",
              display: "flex",
            }}
          >
            <Button
              disableRipple
              onClick={() => setActiveSubTab("documents")}
              sx={{
                flex: 1,
                justifyContent: "center",
                textTransform: "none",
                fontSize: 14,
                fontWeight: 600,
                pb: 1.4,
                borderRadius: 0,
                color:
                  activeSubTab === "documents"
                    ? "#111827"
                    : "rgba(55,65,81,0.8)",
                borderBottom:
                  activeSubTab === "documents"
                    ? "2px solid #4C6AD2"
                    : "2px solid transparent",
                "&:hover": {
                  bgcolor: "transparent",
                },
              }}
            >
              Documents Library
            </Button>

            <Button
              disableRipple
              onClick={() => setActiveSubTab("knowledge")}
              sx={{
                flex: 1,
                justifyContent: "center",
                textTransform: "none",
                fontSize: 14,
                fontWeight: 600,
                pb: 1.4,
                borderRadius: 0,
                color:
                  activeSubTab === "knowledge"
                    ? "#111827"
                    : "rgba(55,65,81,0.8)",
                borderBottom:
                  activeSubTab === "knowledge"
                    ? "2px solid #4C6AD2"
                    : "2px solid transparent",
                "&:hover": {
                  bgcolor: "transparent",
                },
              }}
            >
              AI Knowledge About Your Business
            </Button>
          </Box>
        </Box>

        {activeSubTab === "documents"
          ? renderDocumentsView()
          : renderKnowledgeView()}

        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            gap: 3,
            width: "100%",
            mt: 2,
          }}
        >
          <Button
            type="button"
            disabled={disabledFooterButtons}
            sx={{
              width: "50%",
              maxWidth: 480,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              fontSize: 15,
              border: "1px solid #F97373",
              color: "#DC2626",
              bgcolor: "#FFFFFF",
              py: 1.3,
              "&:hover": {
                bgcolor: "#FFF5F5",
              },
              "&.Mui-disabled": {
                borderColor: "#F3F4F6",
                color: "#9CA3AF",
              },
            }}
          >
            Cancel Changes
          </Button>

          <Button
            type="button"
            disabled={disabledFooterButtons}
            sx={{
              width: "50%",
              maxWidth: 480,
              borderRadius: 2,
              textTransform: "none",
              fontWeight: 600,
              fontSize: 15,
              py: 1.3,
              backgroundImage:
                "linear-gradient(90deg, #4C6AD2 0%, #7B4FD6 100%)",
              color: "#FFFFFF",
              boxShadow: "none",
              "&.Mui-disabled": {
                backgroundImage: "none",
                backgroundColor: "#E5E7EB",
                color: "#9CA3AF",
              },
              "&:hover": {
                boxShadow: "none",
                opacity: 0.96,
                backgroundImage:
                  "linear-gradient(90deg, #4C6AD2 0%, #7B4FD6 100%)",
              },
            }}
          >
            Save
          </Button>
        </Box>
      </Box>

      <AILibraryModal
        open={modalOpen}
        initialTab={modalInitialTab}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
};

export default AILibraryTabContent;
