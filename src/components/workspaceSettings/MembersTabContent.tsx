// src/components/workspaceSettings/MembersTabContent.tsx
"use client";

import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import ReplayOutlinedIcon from "@mui/icons-material/ReplayOutlined";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import type { WorkspaceRole } from "@/types/workspaces";
import InviteMembersModal from "@/components/workspaceSettings/modals/inviteMembersModal";
import { useLanguage } from "@/components/i18n/LanguageProvider";

type MembersApiResponse = {
  currentUserRole: WorkspaceRole | null;
  members: {
    userId: string;
    name: string | null;
    email: string | null;
    role: WorkspaceRole;
    isOwner: boolean;
  }[];
  invites: {
    inviteId: string;
    email: string;
    role: WorkspaceRole;
    status: "pending" | "accepted" | "declined" | "expired" | "revoked";
    invitedByUserId: string;
    invitedByName: string | null;
    invitedByEmail: string | null;
    createdAt: string;
    expiresAt: string | null;
    acceptedAt: string | null;
    declinedAt: string | null;
    revokedAt: string | null;
    resendCount: number;
    lastSentAt: string | null;
  }[];
};

type MemberRow = {
  userId: string;
  name: string;
  email: string;
  role: WorkspaceRole;
  initials: string;
  isOwner: boolean;
};

type InviteRow = {
  inviteId: string;
  email: string;
  role: WorkspaceRole;
  status: "pending" | "accepted" | "declined" | "expired" | "revoked";
  invitedByLabel: string;
  createdAt: string | null;
  expiresAt: string | null;
  resendCount: number;
  lastSentAt: string | null;
};

type MembersTabContentProps = {
  workspaceId: string;
};

function getInitials(name: string | null, email: string | null): string {
  const trimmedName = (name ?? "").trim();
  if (trimmedName.length > 0) {
    const parts = trimmedName.split(/\s+/);
    const first = parts[0]?.[0] ?? "";
    const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
    const combined = `${first}${last}`.toUpperCase();
    if (combined.trim().length > 0) return combined;
  }

  const emailLocalPart = (email ?? "").split("@")[0] ?? "";
  if (emailLocalPart.length > 0) {
    return emailLocalPart.slice(0, 2).toUpperCase();
  }

  return "SP";
}

const MembersTabContent = ({ workspaceId }: MembersTabContentProps) => {
  const theme = useTheme();
  const { locale } = useLanguage();

  const copy =
    locale === "it"
      ? {
          title: "Membri",
          addMember: "Aggiungi membro",
          description: "Gestisci i membri del workspace e i loro permessi",
          loadingMembers: "Caricamento membri...",
          noMembers: "Nessun membro trovato per questo workspace.",
          invitationsTitle: "Inviti",
          invitationsDescription:
            "Monitora inviti pendenti e storici del workspace.",
          loadingInvites: "Caricamento inviti...",
          noInvites: "Nessun invito trovato per questo workspace.",
          invitedByPrefix: "Invitato da",
          sent: "Inviato",
          expires: "Scade",
          resent: "Reinviato",
          resend: "Reinvia",
          revoke: "Revoca",
          cancelChanges: "Annulla modifiche",
          save: "Salva",
          revokeDialogTitle: "Revoca invito",
          revokeDialogDescription:
            "Questo disabilitera immediatamente il link di invito per {email}. Potrai inviare un nuovo invito in seguito.",
          cancel: "Annulla",
          revokeConfirm: "Revoca invito",
          defaultMemberName: "Membro",
          workspaceTeammate: "Collaboratore workspace",
          confirmRemoveMember: "Rimuovere {name} da questo workspace?",
          confirmRemoveFallback: "questo membro",
          dateUnknown: "--",
          roleOwner: "Proprietario",
          roleAdmin: "Admin",
          roleEditor: "Editor",
          roleViewer: "Viewer",
          statusPending: "In attesa",
          statusAccepted: "Accettato",
          statusDeclined: "Rifiutato",
          statusRevoked: "Revocato",
          statusExpired: "Scaduto",
          toastRemoveFailed: "Impossibile rimuovere il membro.",
          toastRemoveSuccess: "Membro rimosso.",
          toastRemoveError:
            "Si e verificato un errore durante la rimozione del membro.",
          toastResendFailed: "Impossibile reinviare l'invito.",
          toastResendSuccess: "Invito reinviato.",
          toastResendError:
            "Si e verificato un errore durante il reinvio dell'invito.",
          toastRevokeFailed: "Impossibile revocare l'invito.",
          toastRevokeSuccess: "Invito revocato.",
          toastRevokeError:
            "Si e verificato un errore durante la revoca dell'invito.",
        }
      : {
          title: "Members",
          addMember: "Add Member",
          description: "Manage workspace members and their permissions",
          loadingMembers: "Loading members...",
          noMembers: "No members found for this workspace.",
          invitationsTitle: "Invitations",
          invitationsDescription:
            "Track pending and historical workspace invitations.",
          loadingInvites: "Loading invitations...",
          noInvites: "No invitations found for this workspace.",
          invitedByPrefix: "Invited by",
          sent: "Sent",
          expires: "Expires",
          resent: "Resent",
          resend: "Resend",
          revoke: "Revoke",
          cancelChanges: "Cancel Changes",
          save: "Save",
          revokeDialogTitle: "Revoke invitation",
          revokeDialogDescription:
            "This will immediately disable the invitation link for {email}. You can still send a new invite later.",
          cancel: "Cancel",
          revokeConfirm: "Revoke invitation",
          defaultMemberName: "Member",
          workspaceTeammate: "Workspace teammate",
          confirmRemoveMember: "Remove {name} from this workspace?",
          confirmRemoveFallback: "this member",
          dateUnknown: "--",
          roleOwner: "Owner",
          roleAdmin: "Admin",
          roleEditor: "Editor",
          roleViewer: "Viewer",
          statusPending: "Pending",
          statusAccepted: "Accepted",
          statusDeclined: "Declined",
          statusRevoked: "Revoked",
          statusExpired: "Expired",
          toastRemoveFailed: "Failed to remove member.",
          toastRemoveSuccess: "Member removed.",
          toastRemoveError: "Something went wrong while removing member.",
          toastResendFailed: "Failed to resend invitation.",
          toastResendSuccess: "Invitation resent.",
          toastResendError:
            "Something went wrong while resending invitation.",
          toastRevokeFailed: "Failed to revoke invitation.",
          toastRevokeSuccess: "Invitation revoked.",
          toastRevokeError:
            "Something went wrong while revoking invitation.",
        };

  const roleLabel = (role: WorkspaceRole): string => {
    if (role === "owner") return copy.roleOwner;
    if (role === "admin") return copy.roleAdmin;
    if (role === "editor") return copy.roleEditor;
    return copy.roleViewer;
  };

  const [members, setMembers] = useState<MemberRow[]>([]);
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [membersLoading, setMembersLoading] = useState<boolean>(false);
  const [currentUserRole, setCurrentUserRole] =
    useState<WorkspaceRole | null>(null);
  const [memberDeleteLoading, setMemberDeleteLoading] = useState<string | null>(
    null,
  );
  const [inviteActionLoadingId, setInviteActionLoadingId] = useState<
    string | null
  >(null);
  const [inviteActionType, setInviteActionType] = useState<
    "resend" | "revoke" | null
  >(null);
  const [inviteToRevoke, setInviteToRevoke] = useState<InviteRow | null>(null);

  const [inviteOpen, setInviteOpen] = useState(false);

  const loadMembers = useCallback(async (): Promise<void> => {
    if (!workspaceId) return;

    try {
      setMembersLoading(true);
      const res = await fetch(`/api/workspaces/${workspaceId}/members`);

      if (!res.ok) {
        console.error("Failed to load workspace members");
        return;
      }

      const json = (await res.json()) as MembersApiResponse;
      setCurrentUserRole(json.currentUserRole);

      const mappedMembers: MemberRow[] = json.members.map((m) => {
        const rawName = (m.name ?? "").trim();
        const email = (m.email ?? "").trim();
        const displayName =
          rawName.length > 0
            ? rawName
            : email.length > 0
              ? email
              : copy.defaultMemberName;

        return {
          userId: m.userId,
          name: displayName,
          email,
          role: m.role,
          initials: getInitials(rawName || null, email || null),
          isOwner: m.isOwner,
        };
      });

      const mappedInvites: InviteRow[] = json.invites.map((invite) => {
        const inviterName = (invite.invitedByName ?? "").trim();
        const inviterEmail = (invite.invitedByEmail ?? "").trim();

        return {
          inviteId: invite.inviteId,
          email: invite.email,
          role: invite.role,
          status: invite.status,
          invitedByLabel:
            inviterName || inviterEmail || copy.workspaceTeammate,
          createdAt: invite.createdAt,
          expiresAt: invite.expiresAt,
          resendCount: invite.resendCount,
          lastSentAt: invite.lastSentAt,
        };
      });

      setMembers(mappedMembers);
      setInvites(mappedInvites);
    } catch (error) {
      console.error("Failed to load workspace members", error);
    } finally {
      setMembersLoading(false);
    }
  }, [workspaceId, copy.defaultMemberName, copy.workspaceTeammate]);

  useEffect(() => {
    void loadMembers();
  }, [loadMembers]);

  const canCurrentUserDeleteMember = (member: MemberRow): boolean => {
    if (!currentUserRole) return false;
    if (member.isOwner) return false;

    if (currentUserRole === "owner") {
      return true;
    }

    if (currentUserRole === "admin") {
      return member.role === "editor" || member.role === "viewer";
    }

    return false;
  };

  const handleDeleteMember = async (member: MemberRow) => {
    if (!workspaceId) return;
    if (!canCurrentUserDeleteMember(member)) return;

    const confirmed = window.confirm(
      copy.confirmRemoveMember.replace(
        "{name}",
        member.name || copy.confirmRemoveFallback,
      ),
    );
    if (!confirmed) return;

    try {
      setMemberDeleteLoading(member.userId);

      const res = await fetch(`/api/workspaces/${workspaceId}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: member.userId }),
      });

      if (!res.ok) {
        let message = copy.toastRemoveFailed;
        try {
          const data = (await res.json()) as { error?: string };
          if (data.error) message = data.error;
        } catch {
          // ignore JSON parse errors
        }
        toast.error(message);
        return;
      }

      setMembers((prev) =>
        prev.filter((existing) => existing.userId !== member.userId),
      );
      toast.success(copy.toastRemoveSuccess);
    } catch (error) {
      console.error("Error removing member", error);
      toast.error(copy.toastRemoveError);
    } finally {
      setMemberDeleteLoading(null);
    }
  };

  const handleOpenInvite = () => {
    setInviteOpen(true);
  };

  const handleCloseInvite = () => {
    setInviteOpen(false);
  };

  const canManageInvites =
    currentUserRole === "owner" || currentUserRole === "admin";

  const formatDateLabel = (iso: string | null): string => {
    if (!iso) return copy.dateUnknown;
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return copy.dateUnknown;
    return date.toLocaleDateString(locale === "it" ? "it-IT" : "en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleResendInvite = async (invite: InviteRow): Promise<void> => {
    if (!workspaceId || !canManageInvites) return;

    try {
      setInviteActionLoadingId(invite.inviteId);
      setInviteActionType("resend");

      const res = await fetch(
        `/api/workspaces/${workspaceId}/members/invites/${invite.inviteId}/resend`,
        {
          method: "POST",
        },
      );

      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        toast.error(payload?.error ?? copy.toastResendFailed);
        return;
      }

      toast.success(copy.toastResendSuccess);
      await loadMembers();
    } catch (error) {
      console.error("Failed to resend invite", error);
      toast.error(copy.toastResendError);
    } finally {
      setInviteActionLoadingId(null);
      setInviteActionType(null);
    }
  };

  const handleRevokeInvite = async (invite: InviteRow): Promise<boolean> => {
    if (!workspaceId || !canManageInvites) return false;

    try {
      setInviteActionLoadingId(invite.inviteId);
      setInviteActionType("revoke");

      const res = await fetch(
        `/api/workspaces/${workspaceId}/members/invites/${invite.inviteId}/revoke`,
        {
          method: "POST",
        },
      );

      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        toast.error(payload?.error ?? copy.toastRevokeFailed);
        return false;
      }

      toast.success(copy.toastRevokeSuccess);
      await loadMembers();
      return true;
    } catch (error) {
      console.error("Failed to revoke invite", error);
      toast.error(copy.toastRevokeError);
      return false;
    } finally {
      setInviteActionLoadingId(null);
      setInviteActionType(null);
    }
  };

  const handleOpenRevokeDialog = (invite: InviteRow): void => {
    if (!canManageInvites || invite.status !== "pending") return;
    setInviteToRevoke(invite);
  };

  const handleCloseRevokeDialog = (): void => {
    const isRevokingCurrentInvite =
      inviteToRevoke != null &&
      inviteActionType === "revoke" &&
      inviteActionLoadingId === inviteToRevoke.inviteId;

    if (isRevokingCurrentInvite) return;
    setInviteToRevoke(null);
  };

  const handleConfirmRevokeDialog = async (): Promise<void> => {
    if (!inviteToRevoke) return;
    const success = await handleRevokeInvite(inviteToRevoke);
    if (success) {
      setInviteToRevoke(null);
    }
  };

  const hasMembers = useMemo(() => members.length > 0, [members]);
  const hasInvites = useMemo(() => invites.length > 0, [invites]);
  const disabled = true;

  const renderInviteStatus = (
    status: InviteRow["status"],
  ): {
    label: string;
    bg: string;
    color: string;
    border: string;
    dot: string;
  } => {
    if (status === "pending") {
      return {
        label: copy.statusPending,
        bg: "#FFF7ED",
        color: "#B45309",
        border: "#FDBA74",
        dot: "#EA580C",
      };
    }
    if (status === "accepted") {
      return {
        label: copy.statusAccepted,
        bg: "#ECFDF3",
        color: "#047857",
        border: "#A7F3D0",
        dot: "#059669",
      };
    }
    if (status === "declined") {
      return {
        label: copy.statusDeclined,
        bg: "#FEF2F2",
        color: "#B91C1C",
        border: "#FECACA",
        dot: "#DC2626",
      };
    }
    if (status === "revoked") {
      return {
        label: copy.statusRevoked,
        bg: "#F1F5F9",
        color: "#334155",
        border: "#CBD5E1",
        dot: "#64748B",
      };
    }
    return {
      label: copy.statusExpired,
      bg: "#F3F4F6",
      color: "#6B7280",
      border: "#D1D5DB",
      dot: "#9CA3AF",
    };
  };

  return (
    <>
      <Box
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
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 1,
            }}
          >
            <Typography
              sx={{
                fontSize: 20,
                fontWeight: 600,
              }}
            >
              {copy.title}
            </Typography>

            <Button
              disableRipple
              variant="outlined"
              sx={{
                borderRadius: 999,
                textTransform: "none",
                fontWeight: 600,
                fontSize: 14,
                px: 3,
                py: 0.7,
                borderColor: "#CBD5F1",
                color: "#4C6AD2",
                bgcolor: "#FFFFFF",
                "&:hover": {
                  borderColor: "#B7C3EE",
                  bgcolor: "#F8FAFF",
                },
              }}
              onClick={handleOpenInvite}
            >
              {copy.addMember}
            </Button>
          </Box>

          <Typography
            sx={{
              fontSize: 13,
              color: theme.palette.text.secondary,
              mb: 3,
            }}
          >
            {copy.description}
          </Typography>

          {membersLoading ? (
            <Typography
              sx={{ fontSize: 14, color: theme.palette.text.secondary }}
            >
              {copy.loadingMembers}
            </Typography>
          ) : !hasMembers ? (
            <Typography
              sx={{ fontSize: 14, color: theme.palette.text.secondary }}
            >
              {copy.noMembers}
            </Typography>
          ) : (
            <Stack spacing={2.2}>
              {members.map((member) => {
                const canDelete = canCurrentUserDeleteMember(member);
                const isDeleting = memberDeleteLoading === member.userId;

                return (
                  <Box
                    key={member.userId}
                    sx={{
                      borderRadius: 3,
                      border: "1px solid #E1E6F5",
                      bgcolor: "#FFFFFF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      px: 3,
                      py: 1.4,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                      }}
                    >
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: "50%",
                          overflow: "hidden",
                          bgcolor: "#E5E7EB",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 600,
                          fontSize: 16,
                          color: "#111827",
                        }}
                      >
                        {member.initials}
                      </Box>

                      <Box>
                        <Typography
                          sx={{
                            fontSize: 15,
                            fontWeight: 600,
                            mb: 0.2,
                          }}
                        >
                          {member.name}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: 13,
                            color: theme.palette.text.secondary,
                          }}
                        >
                          {member.email}
                        </Typography>
                      </Box>
                    </Box>

                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Box
                        sx={{
                          borderRadius: 999,
                          border: "1px solid #CBD5F1",
                          px: 2,
                          py: 0.6,
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#4C6AD2",
                          bgcolor: "#F6F8FF",
                        }}
                      >
                        {roleLabel(member.role)}
                      </Box>

                      {!member.isOwner && (
                        <IconButton
                          size="small"
                          disabled={!canDelete || isDeleting}
                          sx={{
                            borderRadius: 999,
                            border: "1px solid #CBD5F1",
                            color: canDelete ? "#4C6AD2" : "#9CA3AF",
                            bgcolor: canDelete ? "#F6F8FF" : "#F3F4F6",
                            "&:hover": {
                              bgcolor: canDelete ? "#EEF1FF" : "#F3F4F6",
                            },
                          }}
                          onClick={() => {
                            if (!canDelete || isDeleting) return;
                            void handleDeleteMember(member);
                          }}
                        >
                          <DeleteOutlineOutlinedIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      )}
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          )}

          <Box sx={{ mt: 4 }}>
            <Typography
              sx={{
                fontSize: 16,
                fontWeight: 600,
                mb: 1,
              }}
            >
              {copy.invitationsTitle}
            </Typography>
            <Typography
              sx={{
                fontSize: 13,
                color: theme.palette.text.secondary,
                mb: 2,
              }}
            >
              {copy.invitationsDescription}
            </Typography>

            {membersLoading ? (
              <Typography sx={{ fontSize: 14, color: theme.palette.text.secondary }}>
                {copy.loadingInvites}
              </Typography>
            ) : !hasInvites ? (
              <Typography sx={{ fontSize: 14, color: theme.palette.text.secondary }}>
                {copy.noInvites}
              </Typography>
            ) : (
              <Stack spacing={1.6}>
                {invites.map((invite) => {
                  const badge = renderInviteStatus(invite.status);
                  const loading = inviteActionLoadingId === invite.inviteId;
                  const canResend =
                    canManageInvites &&
                    (invite.status === "pending" ||
                      invite.status === "expired" ||
                      invite.status === "declined" ||
                      invite.status === "revoked");
                  const canRevoke = canManageInvites && invite.status === "pending";

                  return (
                    <Box
                      key={invite.inviteId}
                      sx={{
                        borderRadius: 2.5,
                        border: "1px solid #E2E8F0",
                        bgcolor: "#FFFFFF",
                        px: 2,
                        py: 1.6,
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 2,
                        alignItems: { xs: "flex-start", md: "center" },
                        flexDirection: { xs: "column", md: "row" },
                        boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
                      }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          sx={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: "#111827",
                            mb: 0.2,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {invite.email}
                        </Typography>
                        <Typography sx={{ fontSize: 12.5, color: "#6B7280" }}>
                          {roleLabel(invite.role)} • {copy.invitedByPrefix}{" "}
                          {invite.invitedByLabel}
                        </Typography>
                        <Typography sx={{ fontSize: 12, color: "#9CA3AF", mt: 0.35 }}>
                          {copy.sent}:{" "}
                          {formatDateLabel(invite.lastSentAt ?? invite.createdAt)} •{" "}
                          {copy.expires}: {formatDateLabel(invite.expiresAt)} •{" "}
                          {copy.resent}: {invite.resendCount}
                        </Typography>
                      </Box>

                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        sx={{ width: { xs: "100%", md: "auto" }, justifyContent: "flex-end" }}
                      >
                        <Box
                          sx={{
                            borderRadius: 999,
                            border: `1px solid ${badge.border}`,
                            px: 1.25,
                            py: 0.35,
                            fontSize: 12,
                            fontWeight: 600,
                            bgcolor: badge.bg,
                            color: badge.color,
                            textTransform: "none",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 0.7,
                          }}
                        >
                          <Box
                            sx={{
                              width: 7,
                              height: 7,
                              borderRadius: "50%",
                              bgcolor: badge.dot,
                            }}
                          />
                          {badge.label}
                        </Box>

                        <Typography
                          component="span"
                          sx={{
                            fontSize: 13,
                            lineHeight: 1,
                            color: "#CBD5E1",
                            fontWeight: 400,
                            px: 0.2,
                            userSelect: "none",
                          }}
                        >
                          |
                        </Typography>

                        <Button
                          disableRipple
                          size="small"
                          disabled={!canResend || loading}
                          startIcon={
                            loading && inviteActionType === "resend" ? (
                              <CircularProgress size={12} />
                            ) : (
                              <ReplayOutlinedIcon sx={{ fontSize: 15 }} />
                            )
                          }
                          onClick={() => {
                            void handleResendInvite(invite);
                          }}
                          sx={{
                            textTransform: "none",
                            minWidth: 88,
                            borderRadius: 999,
                            border: "1px solid #BFDBFE",
                            color: "#1D4ED8",
                            bgcolor: "#EFF6FF",
                            fontSize: 12,
                            fontWeight: 600,
                            px: 1.45,
                            py: 0.38,
                            "&:hover": {
                              borderColor: "#93C5FD",
                              bgcolor: "#DBEAFE",
                            },
                            "&.Mui-disabled": {
                              borderColor: "#E5E7EB",
                              color: "#9CA3AF",
                              bgcolor: "#F9FAFB",
                            },
                          }}
                        >
                          {copy.resend}
                        </Button>

                        <Button
                          disableRipple
                          size="small"
                          disabled={!canRevoke || loading}
                          startIcon={
                            loading && inviteActionType === "revoke" ? (
                              <CircularProgress size={12} />
                            ) : (
                              <BlockOutlinedIcon sx={{ fontSize: 15 }} />
                            )
                          }
                          onClick={() => {
                            handleOpenRevokeDialog(invite);
                          }}
                          sx={{
                            textTransform: "none",
                            minWidth: 88,
                            borderRadius: 999,
                            border: "1px solid #FECACA",
                            color: "#B91C1C",
                            bgcolor: "#FEF2F2",
                            fontSize: 12,
                            fontWeight: 600,
                            px: 1.45,
                            py: 0.38,
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
                          {copy.revoke}
                        </Button>
                      </Stack>
                    </Box>
                  );
                })}
              </Stack>
            )}
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
            disabled={disabled}
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
            {copy.cancelChanges}
          </Button>

          <Button
            type="button"
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
            {copy.save}
          </Button>
        </Box>
      </Box>

      <InviteMembersModal
        open={inviteOpen}
        workspaceId={workspaceId}
        onClose={handleCloseInvite}
        onInvited={() => {
          void loadMembers();
        }}
      />

      <Dialog
        open={inviteToRevoke != null}
        onClose={handleCloseRevokeDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            fontSize: 19,
            color: "#991B1B",
            pb: 1,
          }}
        >
          {copy.revokeDialogTitle}
        </DialogTitle>
        <DialogContent sx={{ pt: "8px !important" }}>
          <Typography
            sx={{
              fontSize: 14,
              color: "#374151",
              lineHeight: 1.55,
            }}
          >
            {copy.revokeDialogDescription.replace(
              "{email}",
              inviteToRevoke?.email ?? copy.confirmRemoveFallback,
            )}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1.2, gap: 1.2 }}>
          <Button
            type="button"
            onClick={handleCloseRevokeDialog}
            disabled={
              inviteToRevoke != null &&
              inviteActionType === "revoke" &&
              inviteActionLoadingId === inviteToRevoke.inviteId
            }
            sx={{
              textTransform: "none",
              fontWeight: 600,
              color: "#6B7280",
            }}
            >
            {copy.cancel}
          </Button>
          <Button
            type="button"
            onClick={() => {
              void handleConfirmRevokeDialog();
            }}
            disabled={
              inviteToRevoke == null ||
              (inviteActionType === "revoke" &&
                inviteActionLoadingId === inviteToRevoke.inviteId)
            }
            startIcon={
              inviteToRevoke != null &&
              inviteActionType === "revoke" &&
              inviteActionLoadingId === inviteToRevoke.inviteId ? (
                <CircularProgress size={14} color="inherit" />
              ) : (
                <BlockOutlinedIcon sx={{ fontSize: 16 }} />
              )
            }
            sx={{
              textTransform: "none",
              fontWeight: 700,
              borderRadius: 999,
              px: 2.1,
              py: 0.65,
              border: "1px solid #FCA5A5",
              color: "#B91C1C",
              bgcolor: "#FEF2F2",
              "&:hover": {
                borderColor: "#F87171",
                bgcolor: "#FEE2E2",
              },
              "&.Mui-disabled": {
                borderColor: "#E5E7EB",
                color: "#9CA3AF",
                bgcolor: "#F9FAFB",
              },
            }}
          >
            {copy.revokeConfirm}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default MembersTabContent;
