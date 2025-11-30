"use client";

import {
  Box,
  Button,
  FormControlLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "react-toastify";

import type { WorkspaceBusinessProfile } from "@/types/workspaces";

type BusinessProfileResponse = {
  businessProfile: WorkspaceBusinessProfile | null;
};

export type BizFormState = {
  tagline: string;
  isOperating: string;
  industry: string;
  companyStage: string;
  problemShort: string;
  problemLong: string;
  solutionAndUniqueness: string;
  teamAndRoles: string;
  financialProjections: string;
  risksAndMitigation: string;
  successMetrics: string;
  growthPartnerships: string;
};

const emptyBizForm: BizFormState = {
  tagline: "",
  isOperating: "",
  industry: "",
  companyStage: "",
  problemShort: "",
  problemLong: "",
  solutionAndUniqueness: "",
  teamAndRoles: "",
  financialProjections: "",
  risksAndMitigation: "",
  successMetrics: "",
  growthPartnerships: "",
};

type BusinessActivitiesTabContentProps = {
  workspaceId: string;
};

const BusinessActivitiesTabContent = ({
  workspaceId,
}: BusinessActivitiesTabContentProps) => {
  const [bizLoading, setBizLoading] = useState<boolean>(true);
  const [bizSaving, setBizSaving] = useState<boolean>(false);
  const [biz, setBiz] = useState<BizFormState>(emptyBizForm);
  const [bizInitial, setBizInitial] = useState<BizFormState>(emptyBizForm);

  useEffect(() => {
    if (!workspaceId) return;

    let cancelled = false;

    const loadBusinessProfile = async () => {
      try {
        setBizLoading(true);

        const profileRes = await fetch(
          `/api/workspaces/${workspaceId}/business-profile`,
        );
        if (!profileRes.ok) {
          console.error("Failed to load business profile");
          return;
        }

        const json = (await profileRes.json()) as BusinessProfileResponse;
        const profile = json.businessProfile;

        if (cancelled) return;

        if (profile) {
          const mapped: BizFormState = {
            tagline: profile.tagline ?? "",
            isOperating:
              profile.is_operating === true
                ? "yes"
                : profile.is_operating === false
                ? "no"
                : "",
            industry: profile.industry ?? "",
            companyStage: profile.company_stage ?? "",
            problemShort: profile.problem_short ?? "",
            problemLong: profile.problem_long ?? "",
            solutionAndUniqueness: profile.solution_and_uniqueness ?? "",
            teamAndRoles: profile.team_and_roles ?? "",
            financialProjections: profile.financial_projections ?? "",
            risksAndMitigation: profile.risks_and_mitigation ?? "",
            successMetrics: profile.success_metrics ?? "",
            growthPartnerships: profile.growth_partnerships ?? "",
          };
          setBiz(mapped);
          setBizInitial(mapped);
        } else {
          setBiz(emptyBizForm);
          setBizInitial(emptyBizForm);
        }
      } catch (error) {
        console.error("Failed to load business profile", error);
      } finally {
        if (!cancelled) {
          setBizLoading(false);
        }
      }
    };

    void loadBusinessProfile();

    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

  const isBusinessDirty = useMemo(
    () => JSON.stringify(biz) !== JSON.stringify(bizInitial),
    [biz, bizInitial],
  );

  const isBusinessSaveDisabled = bizSaving || bizLoading || !isBusinessDirty;

  const updateBizField = <K extends keyof BizFormState>(
    key: K,
    value: BizFormState[K],
  ) => {
    setBiz((prev) => ({ ...prev, [key]: value }));
  };

  const handleIndustryChange = (event: SelectChangeEvent) => {
    updateBizField("industry", event.target.value);
  };

  const handleStageChange = (event: SelectChangeEvent) => {
    updateBizField("companyStage", event.target.value);
  };

  const handleProblemShortChange = (event: SelectChangeEvent) => {
    updateBizField("problemShort", event.target.value);
  };

  const handleBusinessSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isBusinessSaveDisabled || !workspaceId) return;

    try {
      setBizSaving(true);

      const payload = {
        workspaceId,
        tagline: biz.tagline || undefined,
        isOperating:
          biz.isOperating === ""
            ? undefined
            : biz.isOperating === "yes"
            ? true
            : false,
        industry: biz.industry || undefined,
        companyStage: biz.companyStage || undefined,
        problemShort: biz.problemShort || undefined,
        problemLong: biz.problemLong || undefined,
        solutionAndUniqueness: biz.solutionAndUniqueness || undefined,
        teamAndRoles: biz.teamAndRoles || undefined,
        financialProjections: biz.financialProjections || undefined,
        risksAndMitigation: biz.risksAndMitigation || undefined,
        successMetrics: biz.successMetrics || undefined,
        growthPartnerships: biz.growthPartnerships || undefined,
        rawFormData: {
          ...biz,
        },
      };

      const res = await fetch(
        `/api/workspaces/${workspaceId}/business-profile`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (!res.ok) {
        console.error("Failed to save business profile");
        toast.error("Failed to save business activities");
        return;
      }

      const json = (await res.json()) as BusinessProfileResponse;
      const profile = json.businessProfile;

      if (profile) {
        const mapped: BizFormState = {
          tagline: profile.tagline ?? "",
          isOperating:
            profile.is_operating === true
              ? "yes"
              : profile.is_operating === false
              ? "no"
              : "",
          industry: profile.industry ?? "",
          companyStage: profile.company_stage ?? "",
          problemShort: profile.problem_short ?? "",
          problemLong: profile.problem_long ?? "",
          solutionAndUniqueness: profile.solution_and_uniqueness ?? "",
          teamAndRoles: profile.team_and_roles ?? "",
          financialProjections: profile.financial_projections ?? "",
          risksAndMitigation: profile.risks_and_mitigation ?? "",
          successMetrics: profile.success_metrics ?? "",
          growthPartnerships: profile.growth_partnerships ?? "",
        };
        setBiz(mapped);
        setBizInitial(mapped);
      } else {
        setBizInitial(biz);
      }

      toast.success("Business activities saved");
    } catch (error) {
      console.error("Error while saving business profile", error);
      toast.error("Something went wrong while saving business activities");
    } finally {
      setBizSaving(false);
    }
  };

  const handleBusinessCancel = () => {
    setBiz(bizInitial);
  };

  const inputBaseSx = {
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
    fontSize: 14.5,
  };

  const multilineFieldSx = {
    ...inputBaseSx,
    alignItems: "flex-start",
    "& textarea": {
      fontSize: 14.5,
    },
  };

  const selectBaseSx = {
    ...inputBaseSx,
    "& .MuiSelect-select": {
      fontSize: 14.5,
      py: 1.3,
    },
  };

  const magicIconAdornment = (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        pr: 1.2,
        color: "#8A9FE4",
        cursor: "pointer",
      }}
    >
      <AutoAwesomeOutlinedIcon sx={{ fontSize: 20 }} />
    </Box>
  );

  const disabled = isBusinessSaveDisabled;

  return (
    <Box
      component="form"
      onSubmit={handleBusinessSubmit}
      sx={{
        flex: 1,
        flexDirection: "column",
        display: "flex",
        justifyContent: "center",
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
            mb: 3,
          }}
        >
          Business activities
        </Typography>

        <Box mb={3}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>
            Is this company currently in operation?
          </Typography>
          <RadioGroup
            row
            value={biz.isOperating}
            onChange={(_, value) => updateBizField("isOperating", value)}
          >
            <FormControlLabel
              value="yes"
              control={<Radio size="small" />}
              label="Yes"
            />
            <FormControlLabel
              value="no"
              control={<Radio size="small" />}
              label="No"
            />
          </RadioGroup>
        </Box>

        <Box mb={3}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>
            Select an industry in which your company is operated
          </Typography>
          <Select
            fullWidth
            displayEmpty
            value={biz.industry}
            onChange={handleIndustryChange}
            sx={selectBaseSx}
            renderValue={(selected) => (selected ? selected : "Select")}
          >
            <MenuItem disabled value="">
              <Typography color="text.secondary">Select</Typography>
            </MenuItem>
            <MenuItem value="Business Software / SaaS">
              Business Software / SaaS
            </MenuItem>
            <MenuItem value="E-commerce">E-commerce</MenuItem>
            <MenuItem value="FinTech">FinTech</MenuItem>
            <MenuItem value="Health & Wellness">Health &amp; Wellness</MenuItem>
            <MenuItem value="Other">Other</MenuItem>
          </Select>
        </Box>

        <Box mb={3}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>
            Company stage
          </Typography>
          <Select
            fullWidth
            displayEmpty
            value={biz.companyStage}
            onChange={handleStageChange}
            sx={selectBaseSx}
            renderValue={(selected) => (selected ? selected : "Select")}
          >
            <MenuItem disabled value="">
              <Typography color="text.secondary">Select</Typography>
            </MenuItem>
            <MenuItem value="Idea / Pre-seed">Idea / Pre-seed</MenuItem>
            <MenuItem value="Early Growth (Seed to Series A)">
              Early Growth (Seed to Series A)
            </MenuItem>
            <MenuItem value="Scale-up">Scale-up</MenuItem>
            <MenuItem value="Established">Established</MenuItem>
          </Select>
        </Box>

        <Box mb={3}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>
            What problem do you solve, and for whom
          </Typography>
          <Select
            fullWidth
            displayEmpty
            value={biz.problemShort}
            onChange={handleProblemShortChange}
            sx={selectBaseSx}
            renderValue={(selected) => (selected ? selected : "Select")}
          >
            <MenuItem disabled value="">
              <Typography color="text.secondary">Select</Typography>
            </MenuItem>
            <MenuItem value="Founders who need structured business plans">
              Founders who need structured business plans
            </MenuItem>
            <MenuItem value="Small businesses needing funding-ready docs">
              Small businesses needing funding-ready docs
            </MenuItem>
            <MenuItem value="Consultants serving SME clients">
              Consultants serving SME clients
            </MenuItem>
            <MenuItem value="Other">Other</MenuItem>
          </Select>
        </Box>

        <Box mb={3}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>
            What problem do you solve, and for whom
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={3}
            placeholder="Describe"
            value={biz.problemLong}
            onChange={(e) => updateBizField("problemLong", e.target.value)}
            InputProps={{
              sx: multilineFieldSx,
              endAdornment: magicIconAdornment,
            }}
          />
        </Box>

        <Box mb={3}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>
            What&apos;s your solution, and what makes it unique?
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={3}
            placeholder="Describe"
            value={biz.solutionAndUniqueness}
            onChange={(e) =>
              updateBizField("solutionAndUniqueness", e.target.value)
            }
            InputProps={{
              sx: multilineFieldSx,
              endAdornment: magicIconAdornment,
            }}
          />
        </Box>

        <Box mb={3}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>
            Who&apos;s on your team, and what are their roles?
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={3}
            placeholder="Describe"
            value={biz.teamAndRoles}
            onChange={(e) => updateBizField("teamAndRoles", e.target.value)}
            InputProps={{
              sx: multilineFieldSx,
              endAdornment: magicIconAdornment,
            }}
          />
        </Box>

        <Box mb={3}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>
            What are your 3–5 year financial projections?
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={3}
            placeholder="Describe"
            value={biz.financialProjections}
            onChange={(e) =>
              updateBizField("financialProjections", e.target.value)
            }
            InputProps={{
              sx: multilineFieldSx,
              endAdornment: magicIconAdornment,
            }}
          />
        </Box>

        <Box mb={3}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>
            What risks do you face, and how will you manage them?
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={3}
            placeholder="Describe"
            value={biz.risksAndMitigation}
            onChange={(e) =>
              updateBizField("risksAndMitigation", e.target.value)
            }
            InputProps={{
              sx: multilineFieldSx,
              endAdornment: magicIconAdornment,
            }}
          />
        </Box>

        <Box mb={3}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>
            How will you measure success?
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={3}
            placeholder="Describe"
            value={biz.successMetrics}
            onChange={(e) =>
              updateBizField("successMetrics", e.target.value)
            }
            InputProps={{
              sx: multilineFieldSx,
              endAdornment: magicIconAdornment,
            }}
          />
        </Box>

        <Box mb={1}>
          <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>
            What partnerships will help your business grow?
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={3}
            placeholder="Describe"
            value={biz.growthPartnerships}
            onChange={(e) =>
              updateBizField("growthPartnerships", e.target.value)
            }
            InputProps={{
              sx: multilineFieldSx,
              endAdornment: magicIconAdornment,
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
          onClick={handleBusinessCancel}
          disabled={bizLoading || bizSaving || !isBusinessDirty}
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

export default BusinessActivitiesTabContent;
