"use client";

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import { useState, type FormEvent } from "react";
import { toast } from "react-toastify";

import type { WorkspaceRole } from "@/types/workspaces";

type InviteMembersModalProps = {
  open: boolean;
  workspaceId: string;
  onClose: () => void;
};

const InviteMembersModal = ({
  open,
  workspaceId,
  onClose,
}: InviteMembersModalProps) => {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<WorkspaceRole>("viewer");
  const [inviteSubmitting, setInviteSubmitting] = useState(false);

  const handleInviteRoleChange = (event: SelectChangeEvent<WorkspaceRole>) => {
    setInviteRole(event.target.value as WorkspaceRole);
  };

  const resetState = () => {
    setInviteEmail("");
    setInviteRole("viewer");
  };

  const handleCloseInvite = () => {
    if (inviteSubmitting) return;
    resetState();
    onClose();
  };

  const handleInviteSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!workspaceId) return;

    if (!inviteEmail.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    try {
      setInviteSubmitting(true);

      const res = await fetch(
        `/api/workspaces/${workspaceId}/members/invite`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: inviteEmail.trim(),
            role: inviteRole,
          }),
        },
      );

      if (!res.ok) {
        let message = "Failed to send invite";
        try {
          const data = (await res.json()) as { error?: string };
          if (data.error) message = data.error;
        } catch {
          // ignore
        }
        toast.error(message);
        return;
      }

      toast.success("Invitation sent");
      handleCloseInvite();
    } catch (error) {
      console.error("Error sending invite", error);
      toast.error("Something went wrong while sending invite");
    } finally {
      setInviteSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleCloseInvite}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 3,
          p: 1,
        },
      }}
    >
      <DialogTitle
        sx={{
          fontSize: 20,
          fontWeight: 600,
          pb: 0.5,
        }}
      >
        Invite member
      </DialogTitle>

      <DialogContent
        sx={{
          pt: 1,
        }}
      >
        <Typography
          sx={{
            fontSize: 13,
            color: "text.secondary",
            mb: 2.5,
          }}
        >
          Send an email invite to add someone to this workspace.
        </Typography>

        <Box
          component="form"
          onSubmit={handleInviteSubmit}
          sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}
        >
          <Box>
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 600,
                mb: 0.7,
              }}
            >
              Email address
            </Typography>
            <TextField
              fullWidth
              type="email"
              placeholder="teammate@company.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              autoFocus
              InputProps={{
                sx: {
                  borderRadius: 2,
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
                  fontSize: 14.5,
                },
              }}
            />
          </Box>

          <Box>
            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 600,
                mb: 0.7,
              }}
            >
              Role
            </Typography>

            <Select
              fullWidth
              value={inviteRole}
              onChange={handleInviteRoleChange}
              sx={{
                borderRadius: 2,
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
                "& .MuiSelect-select": {
                  fontSize: 14.5,
                  py: 1.1,
                },
              }}
            >
              <MenuItem value="viewer">Viewer</MenuItem>
              <MenuItem value="editor">Editor</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>

            <Typography
              sx={{
                mt: 1,
                fontSize: 12,
                color: "text.secondary",
              }}
            >
              Admins can manage members and settings. Editors can modify
              content. Viewers can only view.
            </Typography>
          </Box>

          <DialogActions
            sx={{
              mt: 1,
              px: 0,
              pt: 1.5,
              pb: 0,
              display: "flex",
              justifyContent: "flex-end",
              gap: 1.5,
            }}
          >
            <Button
              type="button"
              onClick={handleCloseInvite}
              disabled={inviteSubmitting}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                fontSize: 14,
                px: 2.5,
                py: 0.9,
                border: "1px solid #E5E7EB",
                color: "#4B5563",
                bgcolor: "#FFFFFF",
                "&:hover": {
                  bgcolor: "#F9FAFB",
                },
              }}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={inviteSubmitting || !inviteEmail.trim()}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
                fontSize: 14,
                px: 3,
                py: 0.9,
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
              Send invite
            </Button>
          </DialogActions>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default InviteMembersModal;
