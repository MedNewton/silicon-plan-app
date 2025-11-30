// src/components/workspaceSettings/MembersTabContent.tsx
"use client";

import {
  Box,
  Button,
  IconButton,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import { useEffect, useMemo, useState } from "react";
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
};

type MemberRow = {
  userId: string;
  name: string;
  email: string;
  role: "Owner" | "Admin" | "Editor" | "Viewer";
  initials: string;
  isOwner: boolean;
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
  const [membersLoading, setMembersLoading] = useState<boolean>(false);
  const [currentUserRole, setCurrentUserRole] =
    useState<WorkspaceRole | null>(null);
  const [memberDeleteLoading, setMemberDeleteLoading] = useState<string | null>(
    null,
  );

  const [inviteOpen, setInviteOpen] = useState(false);

  useEffect(() => {
    if (!workspaceId) return;

    let cancelled = false;

    const loadMembers = async () => {
      try {
        setMembersLoading(true);
        const res = await fetch(`/api/workspaces/${workspaceId}/members`);

        if (!res.ok) {
          console.error("Failed to load workspace members");
          return;
        }

        const json = (await res.json()) as MembersApiResponse;

        if (cancelled) return;

        setCurrentUserRole(json.currentUserRole);

        const mapped: MemberRow[] = json.members.map((m) => {
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

        setMembers(mapped);
      } catch (error) {
        console.error("Failed to load workspace members", error);
      } finally {
        if (!cancelled) {
          setMembersLoading(false);
        }
      }
    };

    void loadMembers();

    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

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

  const hasMembers = useMemo(() => members.length > 0, [members]);
  const disabled = true;

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
      />
    </>
  );
};

export default MembersTabContent;
