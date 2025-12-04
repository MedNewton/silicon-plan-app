// src/components/ai-documents/AIDocumentMyWorkspacesTabContent.tsx
"use client";

import {
  Box,
  Button,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import type { ReactElement } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import ShowChartOutlinedIcon from "@mui/icons-material/ShowChartOutlined";
import ChatBubbleOutlineOutlinedIcon from "@mui/icons-material/ChatBubbleOutlineOutlined";
import AppsOutlinedIcon from "@mui/icons-material/AppsOutlined";

import type { Workspace } from "@/types/workspaces";

export type AIDocumentMyWorkspacesTabContentProps = Readonly<{
  workspaces: Workspace[];
  loading: boolean;
}>;

function formatDate(iso?: string | null): string {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

export default function AIDocumentMyWorkspacesTabContent({
  workspaces,
  loading,
}: AIDocumentMyWorkspacesTabContentProps): ReactElement {
  const theme = useTheme();
  const router = useRouter();

  if (loading) {
    return (
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: theme.palette.text.secondary,
          fontSize: 14,
        }}
      >
        Loading workspaces…
      </Box>
    );
  }

  if (workspaces.length === 0) {
    return (
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: theme.palette.text.secondary,
          fontSize: 14,
        }}
      >
        You don&apos;t have any workspaces yet. Create one to get started.
      </Box>
    );
  }

  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        justifyContent: "center",
        pt: 6,
        pb: 6,
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 900,
        }}
      >
        {workspaces.map((workspace, index) => {
          const createdAt = workspace.created_at ?? (null as string | null);
          const dateLabel = createdAt ? formatDate(createdAt) : "";

          const isFirst = index % 2 === 0;

          const iconBg = isFirst
            ? "linear-gradient(180deg, #E4ECFF 0%, #BFCBEB 100%)"
            : "linear-gradient(180deg, #E7E2FF 0%, #CBBEF5 100%)";

          return (
            <Box
              key={workspace.id}
              sx={{
                borderRadius: 5,
                border: "1px solid #E1E6F5",
                bgcolor: "#FBFCFF",
                display: "flex",
                alignItems: "stretch",
                justifyContent: "space-between",
                px: 5,
                py: 4,
                mb: 4,
              }}
            >
              <Stack direction="row" spacing={3} alignItems="center">
                <Box
                  sx={{
                    width: 120,
                    height: 120,
                    borderRadius: 4,
                    background: iconBg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {workspace.image_url ? (
                    <Image
                      src={workspace.image_url}
                      alt={workspace.name}
                      width={56}
                      height={56}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: 3,
                        bgcolor: "#FFFFFF",
                        boxShadow: "0 10px 25px rgba(15,23,42,0.12)",
                      }}
                    />
                  )}
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 20,
                      fontWeight: 700,
                      mb: 0.5,
                    }}
                  >
                    {workspace.name}
                  </Typography>
                  {dateLabel && (
                    <Typography
                      sx={{
                        fontSize: 14,
                        color: theme.palette.text.secondary,
                      }}
                    >
                      Created | {dateLabel}
                    </Typography>
                  )}
                  <Stack direction="row" spacing={1.5}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        border: "1px solid #CBD5F1",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#4C6AD2",
                        bgcolor: "#F6F8FF",
                      }}
                    >
                      <DescriptionOutlinedIcon sx={{ fontSize: 22 }} />
                    </Box>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        border: "1px solid #CBD5F1",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#4C6AD2",
                        bgcolor: "#F6F8FF",
                      }}
                    >
                      <ShowChartOutlinedIcon sx={{ fontSize: 22 }} />
                    </Box>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        border: "1px solid #CBD5F1",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#4C6AD2",
                        bgcolor: "#F6F8FF",
                      }}
                    >
                      <ChatBubbleOutlineOutlinedIcon sx={{ fontSize: 22 }} />
                    </Box>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        border: "1px solid #CBD5F1",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#4C6AD2",
                        bgcolor: "#F6F8FF",
                      }}
                    >
                      <AppsOutlinedIcon sx={{ fontSize: 22 }} />
                    </Box>
                  </Stack>
                </Box>
              </Stack>

              <Stack height="100%" alignItems="start" gap={1}>
                <Button
                fullWidth
                  variant="contained"
                  onClick={() =>
                    router.push(`/workspaces/${workspace.id}/manage/business-plan`)
                  }
                  sx={{
                    textTransform: "none",
                    borderRadius: 999,
                    px: 3,
                    py: 1,
                    fontSize: 14,
                    fontWeight: 600,
                    bgcolor: "#334E96",
                    boxShadow: "none",
                    "&:hover": {
                      bgcolor: "#2C437F",
                      boxShadow: "none",
                    },
                  }}
                >
                  Manage Workspace
                </Button>
                <Button
                fullWidth
                  variant="contained"
                  onClick={() =>
                    router.push(`/workspaces/${workspace.id}/settings`)
                  }
                  sx={{
                    textTransform: "none",
                    borderRadius: 999,
                    px: 3,
                    py: 1,
                    fontSize: 14,
                    fontWeight: 600,
                    bgcolor: "#334E96",
                    boxShadow: "none",
                    "&:hover": {
                      bgcolor: "#2C437F",
                      boxShadow: "none",
                    },
                  }}
                >
                  Edit Workspace
                </Button>
              </Stack>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
