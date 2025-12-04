"use client";

import type { FC } from "react";
import { Box, Grid, Stack, Typography } from "@mui/material";
import DesktopWindowsOutlinedIcon from "@mui/icons-material/DesktopWindowsOutlined";

import ManageSidebar from "@/components/workspaceManage/business-plan/ManageSidebar";

export type PitchDeckPageProps = Readonly<{
  workspaceId: string;
}>;

type DeckTemplate = {
  id: string;
  title: string;
  topTitle: string;
  description: string;
  gradient: string;
  textColor?: string;
};

const TEMPLATES: DeckTemplate[] = [
  {
    id: "concept-deck",
    title: "Concept Deck",
    topTitle: "Concept Deck",
    description: "For startups at the idea or early stage",
    gradient:
      "linear-gradient(135deg, #050816 0%, #151B3A 45%, #202C5C 70%, #020617 100%)",
    textColor: "#FFFFFF",
  },
  {
    id: "prototype-deck",
    title: "Prototype Deck",
    topTitle: "Prototype Deck",
    description: "For startups with a first prototype or MVP",
    gradient:
      "linear-gradient(135deg, #F5F7FB 0%, #E6EBF5 40%, #DADFEA 75%, #F7F8FC 100%)",
    textColor: "#3B4256",
  },
  {
    id: "growth-deck",
    title: "Growth Deck",
    topTitle: "Growth Deck",
    description: "For projects that already have users or sales.",
    gradient:
      "linear-gradient(135deg, #F5F7FB 0%, #F1F3F8 40%, #E7EBF3 70%, #FFFFFF 100%)",
    textColor: "#F97316", // orange-ish title like the mock
  },
  {
    id: "impact-deck",
    title: "Impact Deck",
    topTitle: "Impact Deck",
    description: "For startups with a social or global mission.",
    gradient:
      "linear-gradient(135deg, #0B1A4B 0%, #12337A 40%, #1C4BB0 70%, #2143A6 100%)",
    textColor: "#FFFFFF",
  },
  {
    id: "innovation-deck",
    title: "Innovation Deck",
    topTitle: "Innovation Deck",
    description:
      "For tech-oriented or AI/DeepTech startups with innovative products.",
    gradient:
      "linear-gradient(135deg, #1A0432 0%, #2B0655 40%, #3C0A76 70%, #1B0227 100%)",
    textColor: "#FFFFFF",
  },
  {
    id: "corporate-deck",
    title: "Corporate / Partnership Deck",
    topTitle: "Corporate Deck",
    description:
      "For mature startups seeking partnerships, grants, or collaborations.",
    gradient:
      "linear-gradient(135deg, #F7F1FF 0%, #F3F4FF 30%, #F0FAF4 60%, #FDF3EF 100%)",
    textColor: "#111827",
  },
];

const PitchDeckPage: FC<PitchDeckPageProps> = () => {
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
      {/* Sidebar with Pitch Deck active */}
      <ManageSidebar activeItem="pitch-deck" />

      {/* Main content */}
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
        {/* Header row: icon + ALL TEMPLATES */}
        <Box
          sx={{
            px: 4,
            py: 2.5,
            borderBottom: "1px solid #E5E7EB",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Stack
            direction="row"
            spacing={1.2}
            alignItems="center"
            sx={{ color: "#324C8A" }}
          >
            <DesktopWindowsOutlinedIcon sx={{ fontSize: 22 }} />
            <Typography
              sx={{
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: 2,
              }}
            >
              ALL TEMPLATES
            </Typography>
          </Stack>
        </Box>

        {/* Scrollable cards grid */}
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
          <Box
            sx={{
              maxWidth: 1120,
              mx: "auto",
            }}
          >
            <Grid container spacing={3}>
              {TEMPLATES.map((tpl) => (
                <Grid key={tpl.id} size={{ xs: 12, sm: 6, lg: 4 }}>
                  <Box
                    sx={{
                      borderRadius: 3,
                      border: "1px solid #E2E8F0",
                      bgcolor: "#FFFFFF",
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                      height: "100%",
                    }}
                  >
                    {/* Top gradient "hero" area */}
                    <Box
                      sx={{
                        px: 0,
                        pt: 0,
                        bgcolor: "#000000",
                      }}
                    >
                      <Box
                        sx={{
                          height: 150,
                          borderRadius: "10px 10px 0 0",
                          backgroundImage: tpl.gradient,
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
                            color: tpl.textColor ?? "#FFFFFF",
                            textAlign: "center",
                          }}
                        >
                          {tpl.topTitle}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Text content below image */}
                    <Box sx={{ px: 3, py: 2.5 }}>
                      <Typography
                        sx={{
                          fontSize: 15,
                          fontWeight: 600,
                          color: "#111827",
                          mb: 0.6,
                        }}
                      >
                        {tpl.title}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: 13,
                          color: "#4B5563",
                          lineHeight: 1.6,
                        }}
                      >
                        {tpl.description}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default PitchDeckPage;
