// src/app/workspaces/join/JoinWorkspaceClient.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";

import type { WorkspaceRole } from "@/types/workspaces";
import { useLanguage } from "@/components/i18n/LanguageProvider";

type Props = {
  inviteId: string;
};

type InspectResponse = {
  workspaceId: string;
  workspaceName: string;
  inviterName: string | null;
  inviterEmail: string | null;
  role: WorkspaceRole;
  alreadyMember: boolean;
};

export default function JoinWorkspaceClient({ inviteId }: Props) {
  const theme = useTheme();
  const router = useRouter();
  const { locale } = useLanguage();

  const copy =
    locale === "it"
      ? {
          loadInviteFailed: "Impossibile caricare l'invito.",
          loadInviteError:
            "Si e verificato un errore durante il caricamento dell'invito.",
          joinWorkspaceFailed: "Impossibile entrare nel workspace.",
          joinWorkspaceError:
            "Si e verificato un errore durante l'ingresso nel workspace.",
          declineInviteFailed: "Impossibile rifiutare l'invito.",
          declineInviteError:
            "Si e verificato un errore durante il rifiuto dell'invito al workspace.",
          invitationIssue: "Problema con l'invito",
          invitationInvalid: "Questo invito risulta non valido o scaduto.",
          goToDashboard: "Vai alla dashboard",
          joinWorkspace: "Unisciti al workspace",
          invitedToJoin: "Sei stato invitato a unirti a",
          by: "da",
          joinAs: "Entrerai come:",
          inviteSentFrom: "Invito inviato da:",
          alreadyMember: "Sei gia membro di questo workspace.",
          cancel: "Annulla",
          decline: "Rifiuta",
          declining: "Rifiuto...",
          openWorkspace: "Apri workspace",
          joining: "Accesso...",
          joinWorkspaceAction: "Unisciti al workspace",
          roleLabels: {
            owner: "Proprietario",
            admin: "Admin",
            editor: "Editor",
            viewer: "Viewer",
          } as Record<WorkspaceRole, string>,
        }
      : {
          loadInviteFailed: "Failed to load invitation.",
          loadInviteError: "Something went wrong loading the invitation.",
          joinWorkspaceFailed: "Failed to join workspace.",
          joinWorkspaceError:
            "Something went wrong while joining the workspace.",
          declineInviteFailed: "Failed to decline invitation.",
          declineInviteError:
            "Something went wrong while declining the workspace invitation.",
          invitationIssue: "Invitation issue",
          invitationInvalid: "This invitation appears to be invalid or expired.",
          goToDashboard: "Go to dashboard",
          joinWorkspace: "Join workspace",
          invitedToJoin: "You've been invited to join",
          by: "by",
          joinAs: "You'll join as:",
          inviteSentFrom: "Invitation sent from:",
          alreadyMember: "You're already a member of this workspace.",
          cancel: "Cancel",
          decline: "Decline",
          declining: "Declining...",
          openWorkspace: "Open workspace",
          joining: "Joining...",
          joinWorkspaceAction: "Join workspace",
          roleLabels: {
            owner: "Owner",
            admin: "Admin",
            editor: "Editor",
            viewer: "Viewer",
          } as Record<WorkspaceRole, string>,
        };

  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<InspectResponse | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `/api/workspaces/invites/inspect?invite=${encodeURIComponent(
            inviteId,
          )}`,
        );

        if (!res.ok) {
          const json = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          setError(json.error ?? copy.loadInviteFailed);
          return;
        }

        const json = (await res.json()) as InspectResponse;
        setData(json);
      } catch (err) {
        console.error(err);
        setError(copy.loadInviteError);
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [copy.loadInviteError, copy.loadInviteFailed, inviteId]);

  const handleJoin = async () => {
    if (!data) return;
    if (data.alreadyMember) {
      router.push(`/`);
      return;
    }

    try {
      setJoining(true);
      setError(null);

      const res = await fetch("/api/workspaces/invites/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteId }),
      });

      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        setError(json.error ?? copy.joinWorkspaceFailed);
        setJoining(false);
        return;
      }

      await res.json();
      router.push(`/`);
    } catch (err) {
      console.error(err);
      setError(copy.joinWorkspaceError);
      setJoining(false);
    }
  };

  const handleDecline = async () => {
    if (!data) return;
    if (data.alreadyMember) {
      router.push("/");
      return;
    }

    try {
      setDeclining(true);
      setError(null);

      const res = await fetch("/api/workspaces/invites/decline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteId }),
      });

      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        setError(json.error ?? copy.declineInviteFailed);
        setDeclining(false);
        return;
      }

      router.push("/");
    } catch (err) {
      console.error(err);
      setError(copy.declineInviteError);
      setDeclining(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "#F7F8FC",
        }}
      >
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "#F7F8FC",
          px: 2,
        }}
      >
        <Box
          sx={{
            bgcolor: "#FFFFFF",
            borderRadius: 3,
            border: "1px solid #E1E6F5",
            px: 4,
            py: 3,
            maxWidth: 420,
            width: "100%",
          }}
        >
          <Typography
            sx={{ fontSize: 18, fontWeight: 600, mb: 1.5, color: "#111827" }}
          >
            {copy.invitationIssue}
          </Typography>
          <Typography
            sx={{ fontSize: 14, color: theme.palette.text.secondary, mb: 2.5 }}
          >
            {error ?? copy.invitationInvalid}
          </Typography>
          <Button
            variant="contained"
            onClick={() => router.push("/")}
            sx={{
              borderRadius: 999,
              textTransform: "none",
              fontWeight: 600,
              fontSize: 14,
              px: 3,
              py: 0.9,
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
            {copy.goToDashboard}
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#F7F8FC",
        px: 2,
      }}
    >
      <Box
        sx={{
          bgcolor: "#FFFFFF",
          borderRadius: 3,
          border: "1px solid #E1E6F5",
          px: 4,
          py: 3.5,
          maxWidth: 480,
          width: "100%",
        }}
      >
        <Typography
          sx={{
            fontSize: 22,
            fontWeight: 700,
            mb: 1,
            color: "#111827",
          }}
        >
          {copy.joinWorkspace}
        </Typography>

        <Typography
          sx={{
            fontSize: 14,
            color: theme.palette.text.secondary,
            mb: 3,
          }}
        >
          {copy.invitedToJoin}{" "}
          <strong>{data.workspaceName}</strong>
          {data.inviterName && (
            <>
              {" "}
              {copy.by} <strong>{data.inviterName}</strong>
            </>
          )}
          .
        </Typography>

        <Stack spacing={1.2} sx={{ mb: 3 }}>
          <Typography sx={{ fontSize: 14, color: "#4B5563" }}>
            {copy.joinAs}{" "}
            <strong style={{ textTransform: "capitalize" }}>
              {copy.roleLabels[data.role] ?? data.role}
            </strong>
          </Typography>
          {data.inviterEmail && (
            <Typography sx={{ fontSize: 13, color: "#6B7280" }}>
              {copy.inviteSentFrom} {data.inviterEmail}
            </Typography>
          )}
          {data.alreadyMember && (
            <Typography sx={{ fontSize: 13, color: "#059669" }}>
              {copy.alreadyMember}
            </Typography>
          )}
        </Stack>

        <Stack direction="row" spacing={1.5} justifyContent="flex-end">
          <Button
            variant="outlined"
            onClick={() => router.push("/")}
            disabled={joining || declining}
            sx={{
              borderRadius: 999,
              textTransform: "none",
              fontWeight: 600,
              fontSize: 14,
              px: 2.7,
              py: 0.9,
              borderColor: "#E5E7EB",
              color: "#4B5563",
              bgcolor: "#FFFFFF",
              "&:hover": {
                bgcolor: "#F9FAFB",
                borderColor: "#D1D5DB",
              },
            }}
          >
            {copy.cancel}
          </Button>

          {!data.alreadyMember && (
            <Button
              variant="outlined"
              disabled={joining || declining}
              onClick={handleDecline}
              sx={{
                borderRadius: 999,
                textTransform: "none",
                fontWeight: 600,
                fontSize: 14,
                px: 2.8,
                py: 0.9,
                borderColor: "#FECACA",
                color: "#B91C1C",
                bgcolor: "#FEF2F2",
                "&:hover": {
                  borderColor: "#FCA5A5",
                  bgcolor: "#FEE2E2",
                },
                "&.Mui-disabled": {
                  borderColor: "#E5E7EB",
                  color: "#9CA3AF",
                  bgcolor: "#F9FAFB",
                },
              }}
            >
              {declining ? copy.declining : copy.decline}
            </Button>
          )}

          <Button
            variant="contained"
            disabled={joining || declining}
            onClick={handleJoin}
            sx={{
              borderRadius: 999,
              textTransform: "none",
              fontWeight: 600,
              fontSize: 14,
              px: 3,
              py: 0.9,
              backgroundImage:
                "linear-gradient(90deg, #4C6AD2 0%, #7B4FD6 100%)",
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
            {data.alreadyMember
              ? copy.openWorkspace
              : joining
                ? copy.joining
                : copy.joinWorkspaceAction}
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
