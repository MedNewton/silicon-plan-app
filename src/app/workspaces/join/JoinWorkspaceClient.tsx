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

  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
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
          setError(json.error ?? "Failed to load invitation.");
          return;
        }

        const json = (await res.json()) as InspectResponse;
        setData(json);
      } catch (err) {
        console.error(err);
        setError("Something went wrong loading the invitation.");
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [inviteId]);

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
        setError(json.error ?? "Failed to join workspace.");
        setJoining(false);
        return;
      }

      const json = (await res.json()) as { workspaceId: string };
      router.push(`/`);
    } catch (err) {
      console.error(err);
      setError("Something went wrong while joining the workspace.");
      setJoining(false);
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
            Invitation issue
          </Typography>
          <Typography
            sx={{ fontSize: 14, color: theme.palette.text.secondary, mb: 2.5 }}
          >
            {error ?? "This invitation appears to be invalid or expired."}
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
            Go to dashboard
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
          Join workspace
        </Typography>

        <Typography
          sx={{
            fontSize: 14,
            color: theme.palette.text.secondary,
            mb: 3,
          }}
        >
          You&apos;ve been invited to join{" "}
          <strong>{data.workspaceName}</strong>
          {data.inviterName && (
            <>
              {" "}
              by <strong>{data.inviterName}</strong>
            </>
          )}
          .
        </Typography>

        <Stack spacing={1.2} sx={{ mb: 3 }}>
          <Typography sx={{ fontSize: 14, color: "#4B5563" }}>
            You&apos;ll join as:{" "}
            <strong style={{ textTransform: "capitalize" }}>{data.role}</strong>
          </Typography>
          {data.inviterEmail && (
            <Typography sx={{ fontSize: 13, color: "#6B7280" }}>
              Invitation sent from: {data.inviterEmail}
            </Typography>
          )}
          {data.alreadyMember && (
            <Typography sx={{ fontSize: 13, color: "#059669" }}>
              You&apos;re already a member of this workspace.
            </Typography>
          )}
        </Stack>

        <Stack direction="row" spacing={1.5} justifyContent="flex-end">
          <Button
            variant="outlined"
            onClick={() => router.push("/")}
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
            Cancel
          </Button>

          <Button
            variant="contained"
            disabled={joining}
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
              ? "Open workspace"
              : joining
              ? "Joining…"
              : "Join workspace"}
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
