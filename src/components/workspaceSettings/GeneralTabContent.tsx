"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Box, Button, TextField, Typography } from "@mui/material";
import { toast } from "react-toastify";

import type { Workspace } from "@/types/workspaces";

type GetWorkspaceResponse = {
  workspace: Workspace;
};

type GeneralTabContentProps = {
  workspaceId: string;
  onWorkspaceNameChange?: (name: string) => void;
};

const GeneralTabContent = ({
  workspaceId,
  onWorkspaceNameChange,
}: GeneralTabContentProps) => {
  const [workspaceLoading, setWorkspaceLoading] = useState<boolean>(true);
  const [workspaceSaving, setWorkspaceSaving] = useState<boolean>(false);

  const [workspaceName, setWorkspaceName] = useState<string>("");
  const [initialName, setInitialName] = useState<string>("");

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [initialImageUrl, setInitialImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!workspaceId) return;

    let cancelled = false;

    const loadWorkspace = async () => {
      try {
        setWorkspaceLoading(true);

        const res = await fetch(`/api/workspaces/${workspaceId}`);
        if (!res.ok) {
          console.error("Failed to load workspace");
          return;
        }

        const json = (await res.json()) as GetWorkspaceResponse;
        const ws = json.workspace;

        const name = ws.name ?? "";
        const img = ws.image_url ?? null;

        if (cancelled) return;

        setWorkspaceName(name);
        setInitialName(name);
        setImageUrl(img);
        setInitialImageUrl(img);

        if (onWorkspaceNameChange) {
          onWorkspaceNameChange(name);
        }
      } catch (error) {
        console.error("Failed to load workspace in GeneralTabContent", error);
      } finally {
        if (!cancelled) {
          setWorkspaceLoading(false);
        }
      }
    };

    void loadWorkspace();

    return () => {
      cancelled = true;
    };
  }, [workspaceId, onWorkspaceNameChange]);

  const isNameEmpty = workspaceName.trim().length === 0;

  const isGeneralDirty = useMemo(
    () =>
      workspaceName.trim() !== initialName.trim() ||
      imageUrl !== initialImageUrl,
    [workspaceName, initialName, imageUrl, initialImageUrl],
  );

  const isGeneralSaveDisabled =
    workspaceSaving || workspaceLoading || isNameEmpty || !isGeneralDirty;

  const handleGeneralSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isGeneralSaveDisabled || !workspaceId) return;

    try {
      setWorkspaceSaving(true);

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
        toast.error("Failed to update workspace");
        return;
      }

      const json = (await res.json()) as GetWorkspaceResponse;
      const ws = json.workspace;

      const nextName = ws.name ?? "";
      const nextImage = ws.image_url ?? null;

      setInitialName(nextName);
      setInitialImageUrl(nextImage);
      setWorkspaceName(nextName);
      setImageUrl(nextImage);

      if (onWorkspaceNameChange) {
        onWorkspaceNameChange(nextName);
      }

      toast.success("Workspace details updated");
    } catch (error) {
      console.error("Error while updating workspace", error);
      toast.error("Something went wrong while updating workspace");
    } finally {
      setWorkspaceSaving(false);
    }
  };

  const handleGeneralCancel = () => {
    setWorkspaceName(initialName);
    setImageUrl(initialImageUrl);
  };

  const handleImageChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (!workspaceId) return;
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/image`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        console.error("Failed to upload workspace image");
        toast.error("Failed to upload workspace image");
        return;
      }

      const json = (await res.json()) as GetWorkspaceResponse;
      const ws = json.workspace;
      const nextImage = ws.image_url ?? null;

      setImageUrl(nextImage);
      setInitialImageUrl(nextImage);

      toast.success("Workspace image updated");
    } catch (error) {
      console.error("Error uploading workspace image", error);
      toast.error("Something went wrong while uploading image");
    } finally {
      event.target.value = "";
    }
  };

  const disabled = isGeneralSaveDisabled;

  return (
    <Box
      component="form"
      onSubmit={handleGeneralSubmit}
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
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt={workspaceName || "Workspace image"}
                style={{
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
            component="label"
            variant="text"
            sx={{
              px: 0,
              minWidth: "auto",
              textTransform: "none",
              fontSize: 14,
              fontWeight: 500,
              color: "#4C6AD2",
              cursor: "pointer",
            }}
          >
            Upload new
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={handleImageChange}
            />
          </Button>
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
        }}
      >
        <Button
          type="button"
          onClick={handleGeneralCancel}
          disabled={workspaceLoading || workspaceSaving || !isGeneralDirty}
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

export default GeneralTabContent;
