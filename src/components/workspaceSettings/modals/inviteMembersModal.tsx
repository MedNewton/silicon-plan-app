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
import { useLanguage } from "@/components/i18n/LanguageProvider";

type InviteMembersModalProps = {
  open: boolean;
  workspaceId: string;
  onClose: () => void;
  onInvited?: () => void;
};

const InviteMembersModal = ({
  open,
  workspaceId,
  onClose,
  onInvited,
}: InviteMembersModalProps) => {
  const { locale } = useLanguage();
  const copy =
    locale === "it"
      ? {
          title: "Invita membro",
          subtitle:
            "Invia un invito email per aggiungere una persona a questo workspace.",
          emailLabel: "Indirizzo email",
          emailPlaceholder: "collega@azienda.com",
          roleLabel: "Ruolo",
          roleViewer: "Viewer",
          roleEditor: "Editor",
          roleAdmin: "Admin",
          roleHelp:
            "Gli admin possono gestire membri e impostazioni. Gli editor possono modificare i contenuti. I viewer possono solo visualizzare.",
          cancel: "Annulla",
          sendInvite: "Invia invito",
          toastEmailRequired: "Inserisci un indirizzo email.",
          toastInviteFailed: "Impossibile inviare l'invito.",
          toastInviteSuccess: "Invito inviato.",
          toastInviteError:
            "Si e verificato un errore durante l'invio dell'invito.",
        }
      : {
          title: "Invite member",
          subtitle: "Send an email invite to add someone to this workspace.",
          emailLabel: "Email address",
          emailPlaceholder: "teammate@company.com",
          roleLabel: "Role",
          roleViewer: "Viewer",
          roleEditor: "Editor",
          roleAdmin: "Admin",
          roleHelp:
            "Admins can manage members and settings. Editors can modify content. Viewers can only view.",
          cancel: "Cancel",
          sendInvite: "Send invite",
          toastEmailRequired: "Please enter an email address.",
          toastInviteFailed: "Failed to send invite.",
          toastInviteSuccess: "Invitation sent.",
          toastInviteError: "Something went wrong while sending invite.",
        };

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
      toast.error(copy.toastEmailRequired);
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
        let message = copy.toastInviteFailed;
        try {
          const data = (await res.json()) as { error?: string };
          if (data.error) message = data.error;
        } catch {
          // ignore
        }
        toast.error(message);
        return;
      }

      toast.success(copy.toastInviteSuccess);
      if (onInvited) onInvited();
      handleCloseInvite();
    } catch (error) {
      console.error("Error sending invite", error);
      toast.error(copy.toastInviteError);
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
        {copy.title}
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
          {copy.subtitle}
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
              {copy.emailLabel}
            </Typography>
            <TextField
              fullWidth
              type="email"
              placeholder={copy.emailPlaceholder}
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
              {copy.roleLabel}
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
              <MenuItem value="viewer">{copy.roleViewer}</MenuItem>
              <MenuItem value="editor">{copy.roleEditor}</MenuItem>
              <MenuItem value="admin">{copy.roleAdmin}</MenuItem>
            </Select>

            <Typography
              sx={{
                mt: 1,
                fontSize: 12,
                color: "text.secondary",
              }}
            >
              {copy.roleHelp}
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
              {copy.cancel}
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
              {copy.sendInvite}
            </Button>
          </DialogActions>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default InviteMembersModal;
