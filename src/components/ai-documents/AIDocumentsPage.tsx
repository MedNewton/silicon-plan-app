// src/components/ai-documents/AIDocumentsPage.tsx
"use client";

import {
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  Box,
  Button,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import BookmarkBorderOutlinedIcon from "@mui/icons-material/BookmarkBorderOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import AddCircleOutlineRoundedIcon from "@mui/icons-material/AddCircleOutlineRounded";
import BusinessCenterOutlinedIcon from "@mui/icons-material/BusinessCenterOutlined";
import ShowChartOutlinedIcon from "@mui/icons-material/ShowChartOutlined";
import ChatBubbleOutlineOutlinedIcon from "@mui/icons-material/ChatBubbleOutlineOutlined";
import AppsOutlinedIcon from "@mui/icons-material/AppsOutlined";

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

type ListWorkspacesResponse = {
  workspaces: Workspace[];
};

export default function AIDocumentsPage() {
  const theme = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialTab: ActiveTab =
    searchParams.get("tab") === "my-workspaces" ? "myWorkspaces" : "create";

  const [activeTab, setActiveTab] = useState<ActiveTab>(initialTab);
  const [activeNav, setActiveNav] = useState<NavKey>("ai-documents");

  const [workspaceName, setWorkspaceName] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(false);

  const isCreateDisabled = workspaceName.trim().length === 0 || isSubmitting;

  // ------- Load workspaces for "My Workspaces" tab -------
  useEffect(() => {
    const loadWorkspaces = async () => {
      try {
        setLoadingWorkspaces(true);
        const res = await fetch("/api/workspaces");
        if (!res.ok) {
          throw new Error("Failed to load workspaces");
        }
        const data = (await res.json()) as ListWorkspacesResponse;
        setWorkspaces(data.workspaces ?? []);
      } catch (error) {
        console.error("Failed to load workspaces", error);
      } finally {
        setLoadingWorkspaces(false);
      }
    };

    void loadWorkspaces();
  }, []);

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

      // go to business-setup step for this workspace
      router.push(`/workspaces/${data.workspace.id}/business-setup`);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Small helper to format created_at
  const formatDate = (iso?: string | null) => {
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

    const workspacesCount = workspaces.length;

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
              borderColor: activeTab === "create" ? "#4C6AD2" : "transparent",
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
            {`My Workspaces (${workspacesCount})`}
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
          maxWidth: 600,
          width: "100%",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Box
          sx={{
            width: "100%",
            borderRadius: 5,
            border: "1px solid #E1E6F5",
            bgcolor: "#FBFCFF",
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
                Create Workspace
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  const renderMyWorkspacesSection = () => {
    if (loadingWorkspaces) {
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
            const createdAt =
              // adapt to whatever your Workspace type uses
              workspace.created_at ??
              null as string | null;

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
                {/* Left: icon + text */}
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
                    {/* Decorative building shape placeholder */}
                    <Box
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: 3,
                        bgcolor: "#FFFFFF",
                        boxShadow: "0 10px 25px rgba(15,23,42,0.12)",
                      }}
                    />
                  </Box>

                  <Box sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                  }}>
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

                {/* Right: icons + Edit button */}
                <Stack height="100%" alignItems="start">
                  <Button
                    variant="contained"
                    onClick={() =>
                      router.push(`/workspaces/${workspace.id}/business-setup`)
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
  };

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
          : renderMyWorkspacesSection()}
      </Box>
    </Box>
  );
}
