// src/components/workspaceManage/business-plan/ManageActionArea.tsx
"use client";

import type { FC, ReactNode } from "react";
import { useState } from "react";
import {
  Box,
  Button,
  FormControl,
  MenuItem,
  Select,
  Stack,
  Typography,
  type SelectChangeEvent,
} from "@mui/material";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";

import ViewHeadlineOutlinedIcon from "@mui/icons-material/ViewHeadlineOutlined";
import SubjectOutlinedIcon from "@mui/icons-material/SubjectOutlined";
import NotesOutlinedIcon from "@mui/icons-material/NotesOutlined";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import GridOnOutlinedIcon from "@mui/icons-material/GridOnOutlined";
import FormatListBulletedOutlinedIcon from "@mui/icons-material/FormatListBulletedOutlined";
import TableChartOutlinedIcon from "@mui/icons-material/TableChartOutlined";
import TimelineOutlinedIcon from "@mui/icons-material/TimelineOutlined";
import CodeOutlinedIcon from "@mui/icons-material/CodeOutlined";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import ViewDayOutlinedIcon from "@mui/icons-material/ViewDayOutlined";
import CropSquareOutlinedIcon from "@mui/icons-material/CropSquareOutlined";

import type { ManageTopTab } from "./ManageTopTabs";

type RightPlanTab = "sections" | "finance" | "charts";

export type ManageActionAreaProps = Readonly<{
  activeTopTab: ManageTopTab;
}>;

type SectionTool = {
  id: string;
  label: string;
  icon: ReactNode;
};

const sectionTools: SectionTool[] = [
  {
    id: "section-title",
    label: "Section Title",
    icon: <ViewHeadlineOutlinedIcon />,
  },
  {
    id: "subsection",
    label: "Subsection",
    icon: <SubjectOutlinedIcon />,
  },
  { id: "text", label: "Text", icon: <NotesOutlinedIcon /> },
  { id: "image", label: "Image", icon: <ImageOutlinedIcon /> },
  { id: "table", label: "Table", icon: <GridOnOutlinedIcon /> },
  {
    id: "list-items",
    label: "List Items",
    icon: <FormatListBulletedOutlinedIcon />,
  },
  {
    id: "comparison-table",
    label: "Comparision Table",
    icon: <TableChartOutlinedIcon />,
  },
  { id: "timeline", label: "Timeline", icon: <TimelineOutlinedIcon /> },
  { id: "embed", label: "Embed", icon: <CodeOutlinedIcon /> },
  {
    id: "import-excel",
    label: "Import Excel",
    icon: <InsertDriveFileOutlinedIcon />,
  },
  { id: "page-break", label: "Page Break", icon: <ViewDayOutlinedIcon /> },
  {
    id: "empty-space",
    label: "Empty Space",
    icon: <CropSquareOutlinedIcon />,
  },
];

const ManageActionArea: FC<ManageActionAreaProps> = ({ activeTopTab }) => {
  const [rightTab, setRightTab] = useState<RightPlanTab>("sections");
  const [paperSize, setPaperSize] = useState("A4");
  const [headingColor, setHeadingColor] = useState("Blue");
  const [fontFamily, setFontFamily] = useState("Roboto");
  const [fontSize, setFontSize] = useState("15");

  // ---------------- DOWNLOAD TAB ----------------
  if (activeTopTab === "download") {
    return (
      <Box
        sx={{
          width: 320,
          borderLeft: "1px solid #E5E7EB",
          bgcolor: "#F9FAFB",
          display: "flex",
          flexDirection: "column",
          height: "100%", // use 100% of parent, parent is clamped to 100vh
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            px: 3,
            py: 2,
            bgcolor: "#4F46E5",
            color: "#FFFFFF",
          }}
        >
          <Typography
            sx={{ fontSize: 16, fontWeight: 600, letterSpacing: 0.2 }}
          >
            Export Settings
          </Typography>
        </Box>

        {/* Scrollable settings content */}
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            px: 3,
            pt: 3,
            pb: 4,
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            "&::-webkit-scrollbar": { display: "none" },
          }}
        >
          <Stack spacing={2.5}>
            <Box>
              <Typography
                sx={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#4B5563",
                  mb: 0.7,
                }}
              >
                Paper Size
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={paperSize}
                  onChange={(e: SelectChangeEvent<string>) =>
                    setPaperSize(e.target.value)
                  }
                  sx={{
                    borderRadius: 2,
                    bgcolor: "#FFFFFF",
                  }}
                >
                  <MenuItem value="A4">A4</MenuItem>
                  <MenuItem value="Letter">Letter</MenuItem>
                  <MenuItem value="A3">A3</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box>
              <Typography
                sx={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#4B5563",
                  mb: 0.7,
                }}
              >
                Plan Heading Color
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={headingColor}
                  onChange={(e: SelectChangeEvent<string>) =>
                    setHeadingColor(e.target.value)
                  }
                  sx={{
                    borderRadius: 2,
                    bgcolor: "#FFFFFF",
                  }}
                >
                  <MenuItem value="Blue">Blue</MenuItem>
                  <MenuItem value="Navy">Navy</MenuItem>
                  <MenuItem value="Black">Black</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box>
              <Typography
                sx={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#4B5563",
                  mb: 0.7,
                }}
              >
                Font Family
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={fontFamily}
                  onChange={(e: SelectChangeEvent<string>) =>
                    setFontFamily(e.target.value)
                  }
                  sx={{
                    borderRadius: 2,
                    bgcolor: "#FFFFFF",
                  }}
                >
                  <MenuItem value="Roboto">Roboto</MenuItem>
                  <MenuItem value="Inter">Inter</MenuItem>
                  <MenuItem value="Open Sans">Open Sans</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box>
              <Typography
                sx={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#4B5563",
                  mb: 0.7,
                }}
              >
                Font Size
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={fontSize}
                  onChange={(e: SelectChangeEvent<string>) =>
                    setFontSize(e.target.value)
                  }
                  sx={{
                    borderRadius: 2,
                    bgcolor: "#FFFFFF",
                  }}
                >
                  <MenuItem value="13">13 px</MenuItem>
                  <MenuItem value="15">15 px</MenuItem>
                  <MenuItem value="17">17 px</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Stack>
        </Box>

        <Box
          sx={{
            px: 3,
            py: 2.5,
            borderTop: "1px solid #E5E7EB",
          }}
        >
          <Button
            fullWidth
            variant="contained"
            startIcon={<DownloadOutlinedIcon />}
            sx={{
              textTransform: "none",
              fontSize: 15,
              fontWeight: 600,
              borderRadius: 999,
              py: 1.1,
              backgroundImage:
                "linear-gradient(90deg, #4C6AD2 0%, #7B4FD6 100%)",
              boxShadow: "none",
              "&:hover": {
                boxShadow: "none",
                opacity: 0.96,
                backgroundImage:
                  "linear-gradient(90deg, #4C6AD2 0%, #7B4FD6 100%)",
              },
            }}
          >
            Download
          </Button>
        </Box>
      </Box>
    );
  }

  // ---------------- PLAN TAB (Sections / Finance / Charts) ----------------

  return (
    <Box
      sx={{
        width: 320,
        borderLeft: "1px solid #E5E7EB",
        bgcolor: "#F9FAFB",
        display: "flex",
        flexDirection: "column",
        height: "100%", // take full height of parent, which is 100vh
        overflow: "hidden",
      }}
    >
      {/* Right-side tabs: Sections / Finance / Charts */}
      <Box
        sx={{
          display: "flex",
          borderBottom: "1px solid #E5E7EB",
          bgcolor: "#FFFFFF",
          height: 52,
        }}
      >
        {(["sections", "finance", "charts"] as RightPlanTab[]).map((tab) => {
          const isActive = rightTab === tab;
          const label =
            tab === "sections"
              ? "Sections"
              : tab === "finance"
              ? "Finance"
              : "Charts";
          return (
            <Button
              key={tab}
              disableRipple
              onClick={() => setRightTab(tab)}
              sx={{
                flex: 1,
                textTransform: "none",
                fontSize: 14,
                fontWeight: 600,
                borderRadius: 0,
                height: "100%",
                color: isActive ? "#FFFFFF" : "#4B5563",
                bgcolor: isActive ? "#4C6AD2" : "#FFFFFF",
                borderBottom: isActive ? "none" : "1px solid #E5E7EB",
                "&:hover": {
                  bgcolor: isActive ? "#4C6AD2" : "#F9FAFB",
                },
              }}
            >
              {label}
            </Button>
          );
        })}
      </Box>

      {/* Tools grid (same content for all rightTab for now) */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          px: 2.5,
          py: 3,
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            columnGap: 2,
            rowGap: 2.5,
          }}
        >
          {sectionTools.map((tool) => (
            <Box
              key={tool.id}
              sx={{
                borderRadius: 3,
                border: "1px solid #D3DDF5",
                bgcolor: "#F9FBFF",
                px: 1.5,
                py: 2,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 1,
                cursor: "default",
              }}
            >
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  border: "1px solid #C3D4FF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#4C6AD2",
                }}
              >
                {tool.icon}
              </Box>
              <Typography
                sx={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#111827",
                  textAlign: "center",
                }}
              >
                {tool.label}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default ManageActionArea;
