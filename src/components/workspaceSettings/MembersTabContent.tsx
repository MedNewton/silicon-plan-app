// src/components/workspaceSettings/MembersTabContent.tsx
"use client";

import {
  Box,
  Button,
  CircularProgress,
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
  role: "Owner" | "Admin" | "Editor" | "Viewer";
  initials: string;
  isOwner: boolean;
};

type InviteRow = {
  inviteId: string;
  email: string;
  role: "Admin" | "Editor" | "Viewer";
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
          rawName.length > 0 ? rawName : email.length > 0 ? email : "Member";

        const roleLabel: MemberRow["role"] =
          m.role === "owner"
            ? "Owner"
            : m.role === "admin"
              ? "Admin"
              : m.role === "editor"
                ? "Editor"
                : "Viewer";

        return {
          userId: m.userId,
          name: displayName,
          email,
          role: roleLabel,
          initials: getInitials(rawName || null, email || null),
          isOwner: m.isOwner,
        };
      });

      const mappedInvites: InviteRow[] = json.invites.map((invite) => {
        const roleLabel: InviteRow["role"] =
          invite.role === "admin"
            ? "Admin"
            : invite.role === "editor"
              ? "Editor"
              : "Viewer";

        const inviterName = (invite.invitedByName ?? "").trim();
        const inviterEmail = (invite.invitedByEmail ?? "").trim();

        return {
          inviteId: invite.inviteId,
          email: invite.email,
          role: roleLabel,
          status: invite.status,
          invitedByLabel:
            inviterName || inviterEmail || "Workspace teammate",
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
  }, [workspaceId]);

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
      return member.role === "Editor" || member.role === "Viewer";
    }

    return false;
  };

  const handleDeleteMember = async (member: MemberRow) => {
    if (!workspaceId) return;
    if (!canCurrentUserDeleteMember(member)) return;

    const confirmed = window.confirm(
      `Remove ${member.name || "this member"} from this workspace?`,
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
        let message = "Failed to remove member";
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
      toast.success("Member removed");
    } catch (error) {
      console.error("Error removing member", error);
      toast.error("Something went wrong while removing member");
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
    if (!iso) return "—";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("en-GB", {
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
        toast.error(payload?.error ?? "Failed to resend invitation.");
        return;
      }

      toast.success("Invitation resent.");
      await loadMembers();
    } catch (error) {
      console.error("Failed to resend invite", error);
      toast.error("Something went wrong while resending invitation.");
    } finally {
      setInviteActionLoadingId(null);
      setInviteActionType(null);
    }
  };

  const handleRevokeInvite = async (invite: InviteRow): Promise<void> => {
    if (!workspaceId || !canManageInvites) return;

    const confirmed = window.confirm(
      `Revoke invitation for ${invite.email}?`,
    );
    if (!confirmed) return;

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
        toast.error(payload?.error ?? "Failed to revoke invitation.");
        return;
      }

      toast.success("Invitation revoked.");
      await loadMembers();
    } catch (error) {
      console.error("Failed to revoke invite", error);
      toast.error("Something went wrong while revoking invitation.");
    } finally {
      setInviteActionLoadingId(null);
      setInviteActionType(null);
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
        label: "Pending",
        bg: "#FFF7ED",
        color: "#B45309",
        border: "#FDBA74",
        dot: "#EA580C",
      };
    }
    if (status === "accepted") {
      return {
        label: "Accepted",
        bg: "#ECFDF3",
        color: "#047857",
        border: "#A7F3D0",
        dot: "#059669",
      };
    }
    if (status === "declined") {
      return {
        label: "Declined",
        bg: "#FEF2F2",
        color: "#B91C1C",
        border: "#FECACA",
        dot: "#DC2626",
      };
    }
    if (status === "revoked") {
      return {
        label: "Revoked",
        bg: "#F1F5F9",
        color: "#334155",
        border: "#CBD5E1",
        dot: "#64748B",
      };
    }
    return {
      label: "Expired",
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
              Members
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
              Add Member
            </Button>
          </Box>

          <Typography
            sx={{
              fontSize: 13,
              color: theme.palette.text.secondary,
              mb: 3,
            }}
          >
            Manage workspace members and their permissions
          </Typography>

          {membersLoading ? (
            <Typography
              sx={{ fontSize: 14, color: theme.palette.text.secondary }}
            >
              Loading members…
            </Typography>
          ) : !hasMembers ? (
            <Typography
              sx={{ fontSize: 14, color: theme.palette.text.secondary }}
            >
              No members found for this workspace.
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
                        {member.role}
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
              Invitations
            </Typography>
            <Typography
              sx={{
                fontSize: 13,
                color: theme.palette.text.secondary,
                mb: 2,
              }}
            >
              Track pending and historical workspace invitations.
            </Typography>

            {membersLoading ? (
              <Typography sx={{ fontSize: 14, color: theme.palette.text.secondary }}>
                Loading invitations…
              </Typography>
            ) : !hasInvites ? (
              <Typography sx={{ fontSize: 14, color: theme.palette.text.secondary }}>
                No invitations found for this workspace.
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
                          {invite.role} • Invited by {invite.invitedByLabel}
                        </Typography>
                        <Typography sx={{ fontSize: 12, color: "#9CA3AF", mt: 0.35 }}>
                          Sent: {formatDateLabel(invite.lastSentAt ?? invite.createdAt)} •
                          Expires: {formatDateLabel(invite.expiresAt)} • Resent: {invite.resendCount}
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
                          Resend
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
                            void handleRevokeInvite(invite);
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
                          Revoke
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
            Cancel Changes
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
            Save
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
    </>
  );
};

export default MembersTabContent;
