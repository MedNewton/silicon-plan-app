// src/components/ai-documents/AIDocumentCreateTabContent.tsx
"use client";

import { useState, type FormEvent, type ReactElement } from "react";
import { Box, Button, TextField, Typography, useTheme } from "@mui/material";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

import type { Workspace } from "@/types/workspaces";
import { useLanguage } from "@/components/i18n/LanguageProvider";

type CreateWorkspaceResponse = {
  workspace: Workspace;
};

export type AIDocumentCreateTabContentProps = Readonly<object>;

export default function AIDocumentCreateTabContent(
  {}: AIDocumentCreateTabContentProps,
): ReactElement {
  const theme = useTheme();
  const router = useRouter();
  const { locale } = useLanguage();

  const copy =
    locale === "it"
      ? {
          title: "Crea workspace",
          subtitleLine1: "Un workspace e lo spazio in cui pianifichi",
          subtitleLine2: "la tua attivita e gestisci il tuo team.",
          subtitleLine3: "Tutto avviene nel workspace.",
          workspaceNameLabel: "Nome workspace",
          workspaceNamePlaceholder: "Azienda Srl",
          workspaceNameHint:
            "Scegli un nome che rappresenti il business che stai costruendo.",
          cta: "Crea workspace",
          toastCreateFailed: "Impossibile creare il workspace.",
          toastCreateSuccess: "Workspace creato.",
          toastCreateError:
            "Si e verificato un errore durante la creazione del workspace.",
        }
      : {
          title: "Create Workspace",
          subtitleLine1: "A workspace is where you will plan your",
          subtitleLine2: "business and manage your team.",
          subtitleLine3: "Everything happens within the workspace.",
          workspaceNameLabel: "Workspace Name",
          workspaceNamePlaceholder: "Company Inc.",
          workspaceNameHint:
            "Choose a name after the business you are building.",
          cta: "Create Workspace",
          toastCreateFailed: "Failed to create workspace.",
          toastCreateSuccess: "Workspace created.",
          toastCreateError:
            "Something went wrong while creating workspace.",
        };

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
        toast.error(copy.toastCreateFailed);
        throw new Error("Failed to create workspace");
      }

      const data = (await response.json()) as CreateWorkspaceResponse;

      toast.success(copy.toastCreateSuccess);
      router.push(`/workspaces/${data.workspace.id}/business-setup`);
    } catch (error) {
      console.error(error);
      toast.error(copy.toastCreateError);
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
            {copy.title}
          </Typography>

          <Typography
            sx={{
              fontSize: 16,
              textAlign: "center",
              color: theme.palette.text.secondary,
            }}
          >
            {copy.subtitleLine1}
            <br />
            {copy.subtitleLine2}
            <br />
            {copy.subtitleLine3}
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
              {copy.workspaceNameLabel}
            </Typography>

            <TextField
              fullWidth
              placeholder={copy.workspaceNamePlaceholder}
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
              {copy.workspaceNameHint}
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
                {copy.cta}
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
