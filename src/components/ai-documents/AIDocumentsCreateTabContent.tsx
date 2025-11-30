// src/components/ai-documents/AIDocumentCreateTabContent.tsx
"use client";

import { useState, type FormEvent, type ReactElement } from "react";
import { Box, Button, TextField, Typography, useTheme } from "@mui/material";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

import type { Workspace } from "@/types/workspaces";

type CreateWorkspaceResponse = {
  workspace: Workspace;
};

export type AIDocumentCreateTabContentProps = Readonly<object>;

export default function AIDocumentCreateTabContent(
  {}: AIDocumentCreateTabContentProps,
): ReactElement {
  const theme = useTheme();
  const router = useRouter();

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
        toast.error("Failed to create workspace");
        throw new Error("Failed to create workspace");
      }

      const data = (await response.json()) as CreateWorkspaceResponse;

      toast.success("Workspace created");
      router.push(`/workspaces/${data.workspace.id}/business-setup`);
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong while creating workspace");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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
}
