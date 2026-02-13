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
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "react-toastify";

import type { WorkspaceBusinessProfile } from "@/types/workspaces";
import AiFieldActionButton, {
  type AiFieldAssistAction,
} from "@/components/workspaceSettings/AiFieldActionButton";

type BusinessProfileResponse = {
  businessProfile: WorkspaceBusinessProfile | null;
};

const INDUSTRY_OPTIONS = [
  "Business Software / SaaS",
  "E-commerce",
  "FinTech",
  "Health & Wellness",
] as const;

const COMPANY_STAGE_OPTIONS = [
  "Idea / Pre-seed",
  "Early Growth (Seed to Series A)",
  "Scale-up",
  "Established",
] as const;

const PROBLEM_SHORT_OPTIONS = [
  "Founders who need structured business plans",
  "Small businesses needing funding-ready docs",
  "Consultants serving SME clients",
] as const;

const pickSelectAndCustom = (
  storedValue: string,
  allowedValues: readonly string[],
  rawOption: unknown,
  rawCustom: unknown,
): { selected: string; custom: string } => {
  const optionFromRaw =
    typeof rawOption === "string" ? rawOption.trim() : "";
  const customFromRaw = typeof rawCustom === "string" ? rawCustom : "";

  if (optionFromRaw) {
    if (optionFromRaw === "Other") {
      return {
        selected: "Other",
        custom: customFromRaw || storedValue,
      };
    }
    if (allowedValues.includes(optionFromRaw)) {
      return {
        selected: optionFromRaw,
        custom: customFromRaw,
      };
    }
  }

  if (!storedValue) return { selected: "", custom: "" };
  if (allowedValues.includes(storedValue)) {
    return { selected: storedValue, custom: "" };
  }

  return {
    selected: "Other",
    custom: storedValue,
  };
};

export type BizFormState = {
  tagline: string;
  isOperating: string;
  industry: string;
  industryOther: string;
  companyStage: string;
  companyStageOther: string;
  problemShort: string;
  problemShortOther: string;
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
  industryOther: "",
  companyStage: "",
  companyStageOther: "",
  problemShort: "",
  problemShortOther: "",
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

type AiAssistFieldKey =
  | "problemLong"
  | "solutionAndUniqueness"
  | "teamAndRoles"
  | "financialProjections"
  | "risksAndMitigation"
  | "successMetrics"
  | "growthPartnerships";

const BusinessActivitiesTabContent = ({
  workspaceId,
}: BusinessActivitiesTabContentProps) => {
  const [bizLoading, setBizLoading] = useState<boolean>(true);
  const [bizSaving, setBizSaving] = useState<boolean>(false);
  const [biz, setBiz] = useState<BizFormState>(emptyBizForm);
  const [bizInitial, setBizInitial] = useState<BizFormState>(emptyBizForm);
  const [aiBusyField, setAiBusyField] = useState<AiAssistFieldKey | null>(null);

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
          const raw = profile.raw_form_data ?? {};
          const industryMapped = pickSelectAndCustom(
            profile.industry ?? "",
            INDUSTRY_OPTIONS,
            raw.industryOption,
            raw.industryCustom,
          );
          const companyStageMapped = pickSelectAndCustom(
            profile.company_stage ?? "",
            COMPANY_STAGE_OPTIONS,
            raw.companyStageOption,
            raw.companyStageCustom,
          );
          const problemShortMapped = pickSelectAndCustom(
            profile.problem_short ?? "",
            PROBLEM_SHORT_OPTIONS,
            raw.problemShortOption,
            raw.problemShortCustom,
          );

          const mapped: BizFormState = {
            tagline: profile.tagline ?? "",
            isOperating:
              profile.is_operating === true
                ? "yes"
                : profile.is_operating === false
                ? "no"
                : "",
            industry: industryMapped.selected,
            industryOther: industryMapped.custom,
            companyStage: companyStageMapped.selected,
            companyStageOther: companyStageMapped.custom,
            problemShort: problemShortMapped.selected,
            problemShortOther: problemShortMapped.custom,
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
    const next = event.target.value;
    updateBizField("industry", next);
    if (next !== "Other") {
      updateBizField("industryOther", "");
    }
  };

  const handleStageChange = (event: SelectChangeEvent) => {
    const next = event.target.value;
    updateBizField("companyStage", next);
    if (next !== "Other") {
      updateBizField("companyStageOther", "");
    }
  };

  const handleProblemShortChange = (event: SelectChangeEvent) => {
    const next = event.target.value;
    updateBizField("problemShort", next);
    if (next !== "Other") {
      updateBizField("problemShortOther", "");
    }
  };

  const handleBusinessSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isBusinessSaveDisabled || !workspaceId) return;

    try {
      setBizSaving(true);

      const normalizedIndustry =
        biz.industry === "Other"
          ? biz.industryOther.trim() || "Other"
          : biz.industry;
      const normalizedCompanyStage =
        biz.companyStage === "Other"
          ? biz.companyStageOther.trim() || "Other"
          : biz.companyStage;
      const normalizedProblemShort =
        biz.problemShort === "Other"
          ? biz.problemShortOther.trim() || "Other"
          : biz.problemShort;

      const payload = {
        workspaceId,
        tagline: biz.tagline || undefined,
        isOperating:
          biz.isOperating === ""
            ? undefined
            : biz.isOperating === "yes"
            ? true
            : false,
        industry: normalizedIndustry || undefined,
        companyStage: normalizedCompanyStage || undefined,
        problemShort: normalizedProblemShort || undefined,
        problemLong: biz.problemLong || undefined,
        solutionAndUniqueness: biz.solutionAndUniqueness || undefined,
        teamAndRoles: biz.teamAndRoles || undefined,
        financialProjections: biz.financialProjections || undefined,
        risksAndMitigation: biz.risksAndMitigation || undefined,
        successMetrics: biz.successMetrics || undefined,
        growthPartnerships: biz.growthPartnerships || undefined,
        rawFormData: {
          ...biz,
          industryOption: biz.industry,
          industryCustom: biz.industryOther,
          companyStageOption: biz.companyStage,
          companyStageCustom: biz.companyStageOther,
          problemShortOption: biz.problemShort,
          problemShortCustom: biz.problemShortOther,
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
        const raw = profile.raw_form_data ?? {};
        const industryMapped = pickSelectAndCustom(
          profile.industry ?? "",
          INDUSTRY_OPTIONS,
          raw.industryOption,
          raw.industryCustom,
        );
        const companyStageMapped = pickSelectAndCustom(
          profile.company_stage ?? "",
          COMPANY_STAGE_OPTIONS,
          raw.companyStageOption,
          raw.companyStageCustom,
        );
        const problemShortMapped = pickSelectAndCustom(
          profile.problem_short ?? "",
          PROBLEM_SHORT_OPTIONS,
          raw.problemShortOption,
          raw.problemShortCustom,
        );

        const mapped: BizFormState = {
          tagline: profile.tagline ?? "",
          isOperating:
            profile.is_operating === true
              ? "yes"
              : profile.is_operating === false
              ? "no"
              : "",
          industry: industryMapped.selected,
          industryOther: industryMapped.custom,
          companyStage: companyStageMapped.selected,
          companyStageOther: companyStageMapped.custom,
          problemShort: problemShortMapped.selected,
          problemShortOther: problemShortMapped.custom,
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

  const handleAiAssist = async (
    field: AiAssistFieldKey,
    fieldLabel: string,
    action: AiFieldAssistAction,
  ): Promise<void> => {
    if (!workspaceId || aiBusyField) return;

    try {
      setAiBusyField(field);

      const res = await fetch(
        `/api/workspaces/${workspaceId}/business-profile/ai-assist`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            fieldLabel,
            text: biz[field],
          }),
        },
      );

      const data = (await res.json().catch(() => null)) as
        | { text?: string; error?: string }
        | null;

      if (!res.ok || !data?.text) {
        toast.error(data?.error ?? "Failed to run AI action.");
        return;
      }

      updateBizField(field, data.text);
      toast.success("Field updated with AI.");
    } catch (error) {
      console.error("Failed to run AI business action", error);
      toast.error("Something went wrong while running AI action.");
    } finally {
      setAiBusyField(null);
    }
  };

  const renderAiAdornment = (
    field: AiAssistFieldKey,
    label: string,
  ) => (
    <AiFieldActionButton
      loading={aiBusyField === field}
      disabled={bizLoading || bizSaving}
      onAction={(action) => {
        void handleAiAssist(field, label, action);
      }}
    />
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
            {INDUSTRY_OPTIONS.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
            <MenuItem value="Other">Other</MenuItem>
          </Select>
        </Box>
        {biz.industry === "Other" && (
          <Box mb={3}>
            <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>
              Custom industry
            </Typography>
            <TextField
              fullWidth
              placeholder="Type your industry"
              value={biz.industryOther}
              onChange={(e) => updateBizField("industryOther", e.target.value)}
              InputProps={{ sx: inputBaseSx }}
            />
          </Box>
        )}

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
            {COMPANY_STAGE_OPTIONS.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
            <MenuItem value="Other">Other</MenuItem>
          </Select>
        </Box>
        {biz.companyStage === "Other" && (
          <Box mb={3}>
            <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>
              Custom company stage
            </Typography>
            <TextField
              fullWidth
              placeholder="Type your company stage"
              value={biz.companyStageOther}
              onChange={(e) =>
                updateBizField("companyStageOther", e.target.value)
              }
              InputProps={{ sx: inputBaseSx }}
            />
          </Box>
        )}

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
            {PROBLEM_SHORT_OPTIONS.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
            <MenuItem value="Other">Other</MenuItem>
          </Select>
        </Box>
        {biz.problemShort === "Other" && (
          <Box mb={3}>
            <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>
              Custom problem solved
            </Typography>
            <TextField
              fullWidth
              placeholder="Type the problem and target"
              value={biz.problemShortOther}
              onChange={(e) =>
                updateBizField("problemShortOther", e.target.value)
              }
              InputProps={{ sx: inputBaseSx }}
            />
          </Box>
        )}

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
              endAdornment: renderAiAdornment(
                "problemLong",
                "Problem details",
              ),
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
              endAdornment: renderAiAdornment(
                "solutionAndUniqueness",
                "Solution and uniqueness",
              ),
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
              endAdornment: renderAiAdornment(
                "teamAndRoles",
                "Team roles and responsibilities",
              ),
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
              endAdornment: renderAiAdornment(
                "financialProjections",
                "Financial projections",
              ),
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
              endAdornment: renderAiAdornment(
                "risksAndMitigation",
                "Risks and mitigation",
              ),
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
              endAdornment: renderAiAdornment(
                "successMetrics",
                "Success metrics",
              ),
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
              endAdornment: renderAiAdornment(
                "growthPartnerships",
                "Growth partnerships",
              ),
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
