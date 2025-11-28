// src/app/workspaces/[workspaceId]/settings/page.tsx
"use client";

import {
  Box,
  Button,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { useRouter, useParams } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
  type ChangeEvent,
} from "react";

import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import BookmarkBorderOutlinedIcon from "@mui/icons-material/BookmarkBorderOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import AddCircleOutlineRoundedIcon from "@mui/icons-material/AddCircleOutlineRounded";
import BusinessCenterOutlinedIcon from "@mui/icons-material/BusinessCenterOutlined";

import type { Workspace } from "@/types/workspaces";

type NavKey =
  | "ai-documents"
  | "consultants"
  | "bookings"
  | "session-history"
  | "learning"
  | "settings";

type TopTab = "create" | "myWorkspaces";

type SettingsTab = "general" | "business" | "members" | "library";

type GetWorkspaceResponse = {
  workspace: Workspace;
};

type ListWorkspacesResponse = {
  workspaces: Workspace[];
};

export default function WorkspaceSettingsPage() {
  const theme = useTheme();
  const router = useRouter();
  const params = useParams();

  const workspaceId =
    typeof params.workspaceId === "string"
      ? params.workspaceId
      : Array.isArray(params.workspaceId)
      ? params.workspaceId[0]
      : "";

  const [activeNav, setActiveNav] = useState<NavKey>("ai-documents");
  const [topTab, setTopTab] = useState<TopTab>("myWorkspaces");
  const [settingsTab, setSettingsTab] = useState<SettingsTab>("general");

  const [workspaceCount, setWorkspaceCount] = useState<number>(0);

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  const [workspaceName, setWorkspaceName] = useState<string>("");
  const [initialName, setInitialName] = useState<string>("");

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [initialImageUrl, setInitialImageUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isNameEmpty = workspaceName.trim().length === 0;

  const isDirty = useMemo(
    () =>
      workspaceName.trim() !== initialName.trim() ||
      imageUrl !== initialImageUrl,
    [workspaceName, initialName, imageUrl, initialImageUrl],
  );

  const isSaveDisabled = saving || loading || isNameEmpty || !isDirty;

  // -------- Load current workspace + count --------

  useEffect(() => {
    if (!workspaceId) return;

    const load = async () => {
      try {
        setLoading(true);

        const res = await fetch(`/api/workspaces/${workspaceId}`);
        if (res.ok) {
          const json = (await res.json()) as GetWorkspaceResponse;
          const ws = json.workspace;

          setWorkspaceName(ws.name ?? "");
          setInitialName(ws.name ?? "");
          setImageUrl(ws.image_url ?? null);
          setInitialImageUrl(ws.image_url ?? null);
        }

        const listRes = await fetch("/api/workspaces");
        if (listRes.ok) {
          const json = (await listRes.json()) as ListWorkspacesResponse;
          setWorkspaceCount(json.workspaces.length);
        }
      } catch (error) {
        console.error("Failed to load workspace settings", error);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [workspaceId]);

  const handleTopTabClick = (next: TopTab) => {
    setTopTab(next);
    if (next === "create") {
      router.push("/?tab=create");
    } else {
      router.push("/?tab=my-workspaces");
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSaveDisabled || !workspaceId) return;

    try {
      setSaving(true);

      const payload: { name?: string; imageUrl?: string | null } = {
        name: workspaceName.trim(),
        imageUrl,
      };

      const res = await fetch(`/api/workspaces/${workspaceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        console.error("Failed to update workspace");
        return;
      }

      const json = (await res.json()) as GetWorkspaceResponse;
      const ws = json.workspace;

      setInitialName(ws.name ?? "");
      setInitialImageUrl(ws.image_url ?? null);
      setWorkspaceName(ws.name ?? "");
      setImageUrl(ws.image_url ?? null);
    } catch (error) {
      console.error("Error while updating workspace", error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelChanges = () => {
    setWorkspaceName(initialName);
    setImageUrl(initialImageUrl);
  };

  const handleUploadClick = () => {
    if (fileInputRef.current && !loading && !saving) {
      fileInputRef.current.click();
    }
  };

  const handleImageInputChange = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file || !workspaceId) return;

    try {
      setSaving(true);

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/workspaces/${workspaceId}/image`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        console.error("Failed to upload workspace image");
        return;
      }

      const json = (await res.json()) as GetWorkspaceResponse;
      const ws = json.workspace;

      setImageUrl(ws.image_url ?? null);
      setInitialImageUrl(ws.image_url ?? null);
    } catch (error) {
      console.error("Error while uploading workspace image", error);
    } finally {
      setSaving(false);
      event.target.value = "";
    }
  };

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
            onClick={() => handleTopTabClick("create")}
            sx={{
              ...tabBaseStyles,
              color:
                topTab === "create"
                  ? theme.palette.text.secondary
                  : theme.palette.text.primary,
              borderColor: topTab === "create" ? "#4C6AD2" : "transparent",
            }}
          >
            <AddCircleOutlineRoundedIcon sx={{ fontSize: 20, mr: 0.5 }} />
            Create
          </Button>

          <Button
            disableRipple
            onClick={() => handleTopTabClick("myWorkspaces")}
            sx={{
              ...tabBaseStyles,
              color:
                topTab === "myWorkspaces"
                  ? theme.palette.text.secondary
                  : theme.palette.text.primary,
              borderColor:
                topTab === "myWorkspaces" ? "#4C6AD2" : "transparent",
            }}
          >
            <BusinessCenterOutlinedIcon sx={{ fontSize: 20, mr: 0.5 }} />
            {`My Workspaces (${workspaceCount})`}
          </Button>
        </Stack>
      </Box>
    );
  };

  const renderSecondarySidebar = () => {
    const itemStyles = {
      borderRadius: 2.5,
      border: "1px solid #E1E6F5",
      bgcolor: "#F9FAFF",
      px: 2.5,
      py: 1.7,
      fontSize: 14,
      fontWeight: 500,
      cursor: "pointer",
      textAlign: "left" as const,
      "&:hover": {
        bgcolor: "#F1F4FF",
      },
    };

    const activeStyles = {
      borderColor: "#4C6AD2",
      bgcolor: "#EEF1FF",
    };

    const makeItem = (key: SettingsTab, label: string) => {
      const isActive = settingsTab === key;
      return (
        <Box
          key={key}
          onClick={() => setSettingsTab(key)}
          sx={{
            ...itemStyles,
            ...(isActive ? activeStyles : {}),
          }}
        >
          {label}
        </Box>
      );
    };

    return (
      <Box
        sx={{
          width: 260,
          borderRight: "1px solid #E1E6F5",
          pr: 3,
          mr: 4,
          pt: 4,
        }}
      >
        <Typography
          sx={{
            fontSize: 18,
            fontWeight: 600,
            mb: 2.5,
          }}
        >
          Edit your workspace
        </Typography>

        <Typography
          sx={{
            fontSize: 13,
            color: theme.palette.text.secondary,
            mb: 1.5,
          }}
        >
          {workspaceName}
        </Typography>

        <Stack direction="column" gap={1.5}>
          {makeItem("general", "General")}
          {makeItem("business", "Business activities")}
          {makeItem("members", "Members")}
          {makeItem("library", "AI Library")}
        </Stack>
      </Box>
    );
  };

  const renderGeneralTab = () => {
    const disabled = isSaveDisabled;

    return (
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          flex: 1,
          flexDirection: "column",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 2,
        }}
      >
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
          <Typography
            sx={{
              fontSize: 20,
              fontWeight: 600,
              mb: 4,
            }}
          >
            General
          </Typography>

          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              mb: 5,
            }}
          >
            <Box
              sx={{
                width: 112,
                height: 112,
                borderRadius: 3,
                bgcolor: "#E4EBFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 2.5,
                overflow: "hidden",
              }}
            >
              {imageUrl ? (
                <Box
                  component="img"
                  src={imageUrl}
                  alt={workspaceName || "Workspace image"}
                  sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <Box
                  sx={{
                    width: 68,
                    height: 68,
                    borderRadius: 3,
                    background:
                      "linear-gradient(180deg, #6D87D9 0%, #32499D 100%)",
                  }}
                />
              )}
            </Box>

            <Typography
              sx={{
                fontSize: 16,
                fontWeight: 600,
                mb: 0.5,
              }}
            >
              Workspace image
            </Typography>

            <Button
              disableRipple
              variant="text"
              onClick={handleUploadClick}
              sx={{
                px: 0,
                minWidth: "auto",
                textTransform: "none",
                fontSize: 14,
                fontWeight: 500,
                color: "#4C6AD2",
              }}
            >
              Upload new
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleImageInputChange}
            />
          </Box>

          <Box
            sx={{
              maxWidth: 640,
              mx: "auto",
            }}
          >
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 600,
                mb: 1,
              }}
            >
              Workspace Name
            </Typography>

            <TextField
              fullWidth
              placeholder="Company Inc."
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
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
          </Box>
        </Box>

        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            gap: 3,
            width: "100%",
            maxWidth: 980,
          }}
        >
          <Button
            type="button"
            onClick={handleCancelChanges}
            disabled={loading || saving || !isDirty}
            sx={{
              width: "50%",
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
            type="submit"
            disabled={disabled}
            sx={{
              width: "50%",
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
    );
  };

  const renderSecondaryContent = () => {
    if (settingsTab === "general") return renderGeneralTab();

    const label =
      settingsTab === "business"
        ? "Business activities"
        : settingsTab === "members"
        ? "Members"
        : "AI Library";

    return (
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: theme.palette.text.secondary,
        }}
      >
        {label} settings coming next.
      </Box>
    );
  };

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

        <Box
          sx={{
            flex: 1,
            display: "flex",
            px: 6,
            pb: 5,
            bgcolor: "#FFFFFF",
          }}
        >
          {renderSecondarySidebar()}
          {renderSecondaryContent()}
        </Box>
      </Box>
    </Box>
  );
}
