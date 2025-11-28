// src/components/ai-documents/AIDocumentsPage.tsx
"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import {
  Box,
  Button,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import BookmarkBorderOutlinedIcon from "@mui/icons-material/BookmarkBorderOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import AddCircleOutlineRoundedIcon from "@mui/icons-material/AddCircleOutlineRounded";
import BusinessCenterOutlinedIcon from "@mui/icons-material/BusinessCenterOutlined";

import type { Workspace } from "@/types/workspaces";

type ActiveTab = "create" | "myWorkspaces";

type NavKey =
  | "ai-documents"
  | "consultants"
  | "bookings"
  | "session-history"
  | "learning"
  | "settings";

type CreateWorkspaceResponse = {
  workspace: Workspace;
};

export default function AIDocumentsPage() {
  const theme = useTheme();

  const [activeTab, setActiveTab] = useState<ActiveTab>("create");
  const [activeNav, setActiveNav] = useState<NavKey>("ai-documents");

  const [workspaceName, setWorkspaceName] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const isCreateDisabled = workspaceName.trim().length === 0 || isSubmitting;

  const handleCreateWorkspace = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isCreateDisabled) return;

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/workspaces", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: workspaceName.trim() }),
      });

      if (!response.ok) {
        throw new Error("Failed to create workspace");
      }

      const data = (await response.json()) as CreateWorkspaceResponse;
      // TODO: navigate to workspace details when that page exists
      console.log("Workspace created:", data.workspace);
      setWorkspaceName("");
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------- UI pieces ----------

  const renderSidebar = () => {
    const itemBaseStyles = {
      height: 64,
      px: 3,
      display: "flex",
      alignItems: "center",
      gap: 1.5,
      fontSize: 15,
      fontWeight: 500,
      cursor: "pointer",
      borderRadius: 0,
    } as const;

    const makeItem = (
      key: NavKey,
      label: string,
      icon: ReactNode,
    ): ReactNode => {
      const isActive = activeNav === key;
      return (
        <Box
          key={key}
          onClick={() => setActiveNav(key)}
          sx={{
            ...itemBaseStyles,
            color: isActive
              ? theme.palette.primary.main
              : theme.palette.text.secondary,
            borderLeft: isActive ? "3px solid #4C6AD2" : "3px solid transparent",
            bgcolor: isActive ? "rgba(76,106,210,0.06)" : "transparent",
            "&:hover": {
              bgcolor: isActive ? "rgba(76,106,210,0.08)" : "rgba(15,23,42,0.02)",
            },
          }}
        >
          <Box sx={{ mr: 1, display: "flex", alignItems: "center" }}>{icon}</Box>
          <Typography sx={{ fontSize: 15, fontWeight: 500 }}>{label}</Typography>
        </Box>
      );
    };

    return (
      <Box
        component="aside"
        sx={{
          width: 260,
          minHeight: "100vh",
          borderRight: "1px solid rgba(226,232,240,1)",
          bgcolor: "#FBFCFF",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Logo + brand */}
        <Box
          sx={{
            height: 72,
            px: 3,
            display: "flex",
            alignItems: "center",
            borderBottom: "1px solid rgba(226,232,240,1)",
          }}
        >
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              mr: 1.5,
              background:
                "radial-gradient(circle at 0% 0%, #8CC2FF 0%, #4C6AD2 45%, #7F54D9 100%)",
            }}
          />
          <Typography
            sx={{ fontWeight: 700, fontSize: 18, letterSpacing: 0.1 }}
          >
            Silicon Plan
          </Typography>
        </Box>

        {/* Nav items */}
        <Box sx={{ flex: 1, pt: 2 }}>
          {makeItem(
            "ai-documents",
            "AI Documents",
            <DescriptionOutlinedIcon sx={{ fontSize: 22 }} />,
          )}
          {makeItem(
            "consultants",
            "Consultants",
            <PersonOutlineOutlinedIcon sx={{ fontSize: 22 }} />,
          )}
          {makeItem(
            "bookings",
            "My Bookings",
            <BookmarkBorderOutlinedIcon sx={{ fontSize: 22 }} />,
          )}
          {makeItem(
            "session-history",
            "Session History",
            <HistoryOutlinedIcon sx={{ fontSize: 22 }} />,
          )}
          {makeItem(
            "learning",
            "Learning",
            <MenuBookOutlinedIcon sx={{ fontSize: 22 }} />,
          )}
        </Box>

        {/* Settings at the bottom */}
        <Box
          sx={{
            borderTop: "1px solid rgba(226,232,240,1)",
            py: 1.5,
            mb: 1,
          }}
        >
          <Box
            onClick={() => setActiveNav("settings")}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              px: 3,
              cursor: "pointer",
              color:
                activeNav === "settings"
                  ? theme.palette.primary.main
                  : theme.palette.text.secondary,
            }}
          >
            <SettingsOutlinedIcon sx={{ fontSize: 22 }} />
            <Typography sx={{ fontSize: 15, fontWeight: 500 }}>
              Settings
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  };

  const renderTopTabs = () => {
    const tabBaseStyles = {
      display: "inline-flex",
      alignItems: "center",
      gap: 1,
      textTransform: "uppercase" as const,
      letterSpacing: "0.08em",
      fontWeight: 600,
      fontSize: 13,
      px: 2,
      pb: 1.2,
      borderRadius: 0,
      borderBottomWidth: 2,
      borderBottomStyle: "solid",
      borderColor: "transparent",
      bgcolor: "transparent",
      boxShadow: "none",
      "&:hover": {
        bgcolor: "transparent",
      },
    };

    return (
      <Box
        sx={{
          width: "100%",
          borderBottom: "1px solid rgba(226,232,240,1)",
          display: "flex",
          justifyContent: "center",
          pt: 3,
          pb: 1,
          bgcolor: "#FFFFFF",
        }}
      >
        <Stack
          direction="row"
          spacing={6}
          alignItems="flex-end"
          justifyContent="center"
        >
          <Button
            disableRipple
            onClick={() => setActiveTab("create")}
            sx={{
              ...tabBaseStyles,
              color:
                activeTab === "create"
                  ? theme.palette.text.secondary
                  : theme.palette.text.primary,
              borderColor:
                activeTab === "create" ? "#4C6AD2" : "transparent",
            }}
          >
            <AddCircleOutlineRoundedIcon sx={{ fontSize: 20, mr: 0.5 }} />
            Create
          </Button>

          <Button
            disableRipple
            onClick={() => setActiveTab("myWorkspaces")}
            sx={{
              ...tabBaseStyles,
              color:
                activeTab === "myWorkspaces"
                  ? theme.palette.text.secondary
                  : theme.palette.text.primary,
              borderColor:
                activeTab === "myWorkspaces" ? "#4C6AD2" : "transparent",
            }}
          >
            <BusinessCenterOutlinedIcon sx={{ fontSize: 20, mr: 0.5 }} />
            My Workspaces (0)
          </Button>
        </Stack>
      </Box>
    );
  };

  const renderCreateWorkspaceCard = () => (
    <Box
      component="section"
      sx={{
        flex: 1,
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        pt: 9,
        pb: 6,
      }}
    >
      <Box
        sx={{
          maxWidth: 720,
          width: "100%",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Box
          sx={{
            width: "100%",
            borderRadius: 5,
            border: "1px solid #E1E6F5",          // softened border
            bgcolor: "#FBFCFF",                    // card background closer to mock
            p: 4,
            boxSizing: "border-box",
          }}
        >
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: 24,
              textAlign: "center",
              mb: 1.5,
            }}
          >
            Create Workspace
          </Typography>

          <Typography
            sx={{
              fontSize: 16,
              textAlign: "center",
              color: theme.palette.text.secondary,
            }}
          >
            A workspace is where you will plan your
            <br />
            business and manage your team.
            <br />
            Everything happens within the workspace
          </Typography>

          <Box
            component="form"
            onSubmit={handleCreateWorkspace}
            sx={{ mt: 5 }}
          >
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 600,
                mb: 1,
                color: theme.palette.text.primary,
              }}
            >
              Workspace Name
            </Typography>

            <TextField
              fullWidth
              placeholder="Company Inc."
              value={workspaceName}
              onChange={(event) => setWorkspaceName(event.target.value)}
              InputProps={{
                sx: {
                  borderRadius: 2.5,
                  bgcolor: "#FFFFFF",
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#D3DBEF",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#C3CDE8",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#8A9FE4",
                  },
                  fontSize: 15,
                },
              }}
            />

            <Typography
              sx={{
                mt: 1.5,
                fontSize: 13,
                textAlign: "center",
                color: theme.palette.text.secondary,
              }}
            >
              Choose a name after the business you are building.
            </Typography>

            <Box mt={4}>
              <Button
                type="submit"
                fullWidth
                disabled={isCreateDisabled}
                sx={{
                  borderRadius: 999,
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: 16,
                  py: 1.5,
                  backgroundImage:
                    "linear-gradient(90deg, #4C6AD2 0%, #7B4FD6 100%)", // button gradient
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
                Create Workspace
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  const renderMyWorkspacesPlaceholder = () => (
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
      My Workspaces will appear here once we implement the list view.
    </Box>
  );

  // ---------- Layout ----------

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        bgcolor: "#F7F8FC",
      }}
    >
      {renderSidebar()}

      <Box
        component="main"
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          bgcolor: "#FFFFFF",
        }}
      >
        {renderTopTabs()}

        {activeTab === "create"
          ? renderCreateWorkspaceCard()
          : renderMyWorkspacesPlaceholder()}
      </Box>
    </Box>
  );
}
