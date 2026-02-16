"use client";

import {
  Alert,
  Box,
  Button,
  FormControlLabel,
  LinearProgress,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "react-toastify";

import type { Workspace, WorkspaceBusinessProfile } from "@/types/workspaces";
import {
  INITIAL_ONBOARDING_DATA,
  ONBOARDING_STEP_DEFINITIONS,
  type WorkspaceOnboardingData,
} from "@/types/onboarding";
import SettingsSidebar, {
  type NavKey,
} from "@/components/workspaceSettings/SettingsSidebar";
import SettingsTopTabs, {
  type TopTab,
} from "@/components/workspaceSettings/SettingsTopTabs";
import AiFieldActionButton, {
  type AiFieldAssistAction,
} from "@/components/workspaceSettings/AiFieldActionButton";
import AtecoSearchField from "@/components/onboarding/AtecoSearchField";
import { getOnboardingSectors } from "@/lib/sectorMapping";

type GetWorkspaceResponse = {
  workspace: Workspace;
};

type ListWorkspacesResponse = {
  workspaces: Workspace[];
};

type BusinessProfileResponse = {
  businessProfile: WorkspaceBusinessProfile | null;
  redirectTo?: string;
};

type FieldErrors = Partial<Record<keyof WorkspaceOnboardingData, string>>;

type DraftData = {
  form: Partial<WorkspaceOnboardingData>;
  currentStep: number;
  savedAt: string;
};

type AiAssistFieldKey =
  | "problemLong"
  | "solutionAndUniqueness"
  | "teamAndRoles"
  | "financialProjections"
  | "risksAndMitigation"
  | "successMetrics"
  | "growthPartnerships";

// Use 16 macro-level onboarding sectors that map to Damodaran industries
// These sectors are user-friendly and map to weighted Damodaran industries via CORE-008
const INDUSTRY_OPTIONS = getOnboardingSectors();

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

const PURPOSE_OPTIONS = [
  "Create a complete business plan",
  "Prepare for fundraising",
  "Clarify business strategy",
  "Improve internal planning",
] as const;

const SALES_CHANNEL_OPTIONS = [
  "Direct sales",
  "Online channels",
  "Partner network",
  "Mixed channels",
] as const;

const TEAM_SIZE_OPTIONS = [
  "Solo founder",
  "2-5 people",
  "6-20 people",
  "21-50 people",
  "50+ people",
] as const;

const DRAFT_STORAGE_PREFIX = "silicon-plan-onboarding-draft";

function clampStep(step: number): number {
  if (step < 0) return 0;
  if (step > ONBOARDING_STEP_DEFINITIONS.length - 1) {
    return ONBOARDING_STEP_DEFINITIONS.length - 1;
  }
  return step;
}

function pickSelectAndCustom(
  storedValue: string,
  allowedValues: readonly string[],
  rawOption: unknown,
  rawCustom: unknown,
): { selected: string; custom: string } {
  const optionFromRaw = typeof rawOption === "string" ? rawOption.trim() : "";
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
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function mapProfileToOnboardingData(
  profile: WorkspaceBusinessProfile,
  workspaceName: string,
): WorkspaceOnboardingData {
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

  const isOperatingFromRaw = asString(raw.isOperating);
  const rawBusinessName = asString(raw.businessName);
  const fallbackBusinessName = profile.tagline ?? asString(raw.tagline);

  return {
    workspaceName: asString(raw.workspaceName) || workspaceName,
    businessName:
      rawBusinessName.length > 0 ? rawBusinessName : fallbackBusinessName,
    isOperating:
      profile.is_operating === true
        ? "yes"
        : profile.is_operating === false
          ? "no"
          : isOperatingFromRaw === "yes" || isOperatingFromRaw === "no"
            ? isOperatingFromRaw
            : "",
    businessPlanPurpose: asString(raw.businessPlanPurpose),
    industryOption: industryMapped.selected,
    industryCustom: industryMapped.custom,
    companyStageOption: companyStageMapped.selected,
    companyStageCustom: companyStageMapped.custom,
    atecoCode: asString(raw.atecoCode),
    atecoDescription: asString(raw.atecoDescription),
    problemShortOption: problemShortMapped.selected,
    problemShortCustom: problemShortMapped.custom,
    problemLong: profile.problem_long ?? asString(raw.problemLong),
    solutionAndUniqueness:
      profile.solution_and_uniqueness ?? asString(raw.solutionAndUniqueness),
    productOrService: asString(raw.productOrService),
    salesChannel: asString(raw.salesChannel),
    targetMarket: asString(raw.targetMarket),
    teamSize: asString(raw.teamSize),
    teamAndRoles: profile.team_and_roles ?? asString(raw.teamAndRoles),
    financialProjections:
      profile.financial_projections ?? asString(raw.financialProjections),
    risksAndMitigation:
      profile.risks_and_mitigation ?? asString(raw.risksAndMitigation),
    successMetrics: profile.success_metrics ?? asString(raw.successMetrics),
    growthPartnerships:
      profile.growth_partnerships ?? asString(raw.growthPartnerships),
  };
}

function validateStep(
  data: WorkspaceOnboardingData,
  stepIndex: number,
): FieldErrors {
  const errors: FieldErrors = {};

  if (stepIndex === 0 && !data.workspaceName.trim()) {
    errors.workspaceName = "Workspace name is required.";
  }

  if (stepIndex === 1 && !data.businessName.trim()) {
    errors.businessName = "Business name is required.";
  }

  if (stepIndex === 2) {
    if (!data.isOperating) {
      errors.isOperating = "Please select operation status.";
    }
    if (!data.businessPlanPurpose.trim()) {
      errors.businessPlanPurpose = "Please select or provide the plan purpose.";
    }
  }

  if (stepIndex === 3) {
    if (!data.industryOption) {
      errors.industryOption = "Industry selection is required.";
    }
    if (data.industryOption === "Other" && !data.industryCustom.trim()) {
      errors.industryCustom = "Please provide a custom industry.";
    }
  }

  if (stepIndex === 4) {
    if (!data.companyStageOption) {
      errors.companyStageOption = "Company stage is required.";
    }
    if (data.companyStageOption === "Other" && !data.companyStageCustom.trim()) {
      errors.companyStageCustom = "Please provide a custom company stage.";
    }
  }

  if (stepIndex === 5) {
    if (!data.problemShortOption) {
      errors.problemShortOption = "Problem target selection is required.";
    }
    if (data.problemShortOption === "Other" && !data.problemShortCustom.trim()) {
      errors.problemShortCustom = "Please provide a custom problem target.";
    }
  }

  if (stepIndex === 6 && !data.problemLong.trim()) {
    errors.problemLong = "Detailed problem description is required.";
  }

  if (stepIndex === 7 && !data.solutionAndUniqueness.trim()) {
    errors.solutionAndUniqueness = "Solution details are required.";
  }

  if (stepIndex === 8) {
    if (!data.productOrService.trim()) {
      errors.productOrService = "Product/service description is required.";
    }
    if (!data.salesChannel.trim()) {
      errors.salesChannel = "Sales channel is required.";
    }
  }

  if (stepIndex === 9) {
    if (!data.targetMarket.trim()) {
      errors.targetMarket = "Target market is required.";
    }
    if (!data.teamSize.trim()) {
      errors.teamSize = "Team size is required.";
    }
  }

  if (stepIndex === 10 && !data.teamAndRoles.trim()) {
    errors.teamAndRoles = "Team roles are required.";
  }

  if (stepIndex === 11) {
    if (!data.financialProjections.trim()) {
      errors.financialProjections = "Financial projections are required.";
    }
    if (!data.risksAndMitigation.trim()) {
      errors.risksAndMitigation = "Risk and mitigation plan is required.";
    }
    if (!data.successMetrics.trim()) {
      errors.successMetrics = "Success metrics are required.";
    }
    if (!data.growthPartnerships.trim()) {
      errors.growthPartnerships = "Growth partnerships are required.";
    }
  }

  return errors;
}

function readDraft(storageKey: string): DraftData | null {
  if (!storageKey) return null;
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<DraftData>;
    if (!parsed || typeof parsed !== "object") return null;
    return {
      form: parsed.form && typeof parsed.form === "object" ? parsed.form : {},
      currentStep:
        typeof parsed.currentStep === "number" ? parsed.currentStep : 0,
      savedAt: typeof parsed.savedAt === "string" ? parsed.savedAt : "",
    };
  } catch {
    return null;
  }
}

export default function WorkspaceBusinessSetupPage() {
  const router = useRouter();
  const params = useParams();

  const workspaceId =
    typeof params.workspaceId === "string"
      ? params.workspaceId
      : Array.isArray(params.workspaceId)
        ? params.workspaceId[0]
        : "";

  const draftStorageKey = useMemo(
    () => (workspaceId ? `${DRAFT_STORAGE_PREFIX}:${workspaceId}` : ""),
    [workspaceId],
  );

  const [activeNav, setActiveNav] = useState<NavKey>("ai-documents");
  const [topTab, setTopTab] = useState<TopTab>("create");
  const [workspaceCount, setWorkspaceCount] = useState(0);
  const [workspaceName, setWorkspaceName] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<WorkspaceOnboardingData>(
    INITIAL_ONBOARDING_DATA,
  );
  const [currentStep, setCurrentStep] = useState(0);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [resumedFromDraft, setResumedFromDraft] = useState(false);
  const [lastDraftSavedAt, setLastDraftSavedAt] = useState<string | null>(null);
  const [aiBusyField, setAiBusyField] = useState<AiAssistFieldKey | null>(null);

  const totalSteps = ONBOARDING_STEP_DEFINITIONS.length;
  const lastStepIndex = totalSteps - 1;
  const isFinalStep = currentStep === lastStepIndex;
  const progress = ((currentStep + 1) / totalSteps) * 100;
  const isBusy = loading || saving || !workspaceId;
  const stepMeta =
    ONBOARDING_STEP_DEFINITIONS[currentStep] ?? ONBOARDING_STEP_DEFINITIONS[0];

  useEffect(() => {
    if (!workspaceId) return;

    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);

        let baseData = INITIAL_ONBOARDING_DATA;
        let workspaceNameFromApi = "";

        const [workspaceRes, profileRes, countRes] = await Promise.all([
          fetch(`/api/workspaces/${workspaceId}`),
          fetch(`/api/workspaces/${workspaceId}/business-profile`),
          fetch("/api/workspaces"),
        ]);

        if (workspaceRes.ok) {
          const workspaceJson =
            (await workspaceRes.json()) as GetWorkspaceResponse;
          workspaceNameFromApi = workspaceJson.workspace.name ?? "";
          setWorkspaceName(workspaceNameFromApi);
          baseData = {
            ...baseData,
            workspaceName: workspaceNameFromApi,
          };
        }

        if (profileRes.ok) {
          const profileJson = (await profileRes.json()) as BusinessProfileResponse;
          if (profileJson.businessProfile) {
            baseData = mapProfileToOnboardingData(
              profileJson.businessProfile,
              workspaceNameFromApi,
            );
          }
        }

        if (countRes.ok) {
          const countJson = (await countRes.json()) as ListWorkspacesResponse;
          setWorkspaceCount(countJson.workspaces.length);
        }

        const draft = readDraft(draftStorageKey);
        if (draft) {
          baseData = { ...baseData, ...draft.form };
        }
        const restoredStep = draft ? clampStep(draft.currentStep) : 0;

        if (cancelled) return;

        setData(baseData);
        setCurrentStep(restoredStep);
        setFieldErrors({});
        setResumedFromDraft(Boolean(draft));
        setLastDraftSavedAt(draft?.savedAt ?? null);
      } catch (error) {
        console.error("Failed to load business setup onboarding", error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [workspaceId, draftStorageKey]);

  useEffect(() => {
    if (!draftStorageKey || loading) return;
    try {
      const now = new Date().toISOString();
      const draft: DraftData = {
        form: data,
        currentStep,
        savedAt: now,
      };
      window.localStorage.setItem(draftStorageKey, JSON.stringify(draft));
      setLastDraftSavedAt(now);
    } catch {
      // ignore draft persistence failures
    }
  }, [data, currentStep, draftStorageKey, loading]);

  const clearFieldError = (field: keyof WorkspaceOnboardingData) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const updateField = <K extends keyof WorkspaceOnboardingData>(
    key: K,
    value: WorkspaceOnboardingData[K],
  ) => {
    setData((prev) => ({ ...prev, [key]: value }));
    if (key === "workspaceName" && typeof value === "string") {
      setWorkspaceName(value);
    }
    clearFieldError(key);
  };

  const handleIndustryChange = (event: SelectChangeEvent) => {
    const next = event.target.value;
    updateField("industryOption", next);
    if (next !== "Other") {
      updateField("industryCustom", "");
    }
  };

  const handleCompanyStageChange = (event: SelectChangeEvent) => {
    const next = event.target.value;
    updateField("companyStageOption", next);
    if (next !== "Other") {
      updateField("companyStageCustom", "");
    }
  };

  const handleProblemShortChange = (event: SelectChangeEvent) => {
    const next = event.target.value;
    updateField("problemShortOption", next);
    if (next !== "Other") {
      updateField("problemShortCustom", "");
    }
  };

  const validateCurrentStep = (): boolean => {
    const errors = validateStep(data, currentStep);
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleBack = () => {
    if (isBusy || currentStep === 0) return;
    setCurrentStep((prev) => prev - 1);
  };

  const handleNext = () => {
    if (isBusy || isFinalStep) return;
    if (!validateCurrentStep()) return;
    setCurrentStep((prev) => prev + 1);
  };

  const handleTopTabChange = (next: TopTab) => {
    setTopTab(next);
    if (next === "create") {
      router.push("/?tab=create");
      return;
    }
    router.push("/?tab=my-workspaces");
  };

  const renderFieldError = (field: keyof WorkspaceOnboardingData) => {
    const message = fieldErrors[field];
    if (!message) return null;
    return (
      <Typography sx={{ mt: 0.5, fontSize: 12, color: "#D32F2F" }}>
        {message}
      </Typography>
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isBusy || !workspaceId) return;

    if (!isFinalStep) {
      handleNext();
      return;
    }

    if (!validateCurrentStep()) {
      return;
    }

    try {
      setSaving(true);

      const normalizedIndustry =
        data.industryOption === "Other"
          ? data.industryCustom.trim() || "Other"
          : data.industryOption;
      const normalizedCompanyStage =
        data.companyStageOption === "Other"
          ? data.companyStageCustom.trim() || "Other"
          : data.companyStageOption;
      const normalizedProblemShort =
        data.problemShortOption === "Other"
          ? data.problemShortCustom.trim() || "Other"
          : data.problemShortOption;

      if (data.workspaceName.trim()) {
        const workspacePatch = await fetch(`/api/workspaces/${workspaceId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: data.workspaceName.trim() }),
        });
        if (!workspacePatch.ok) {
          throw new Error("Failed to update workspace name");
        }
      }

      const payload = {
        workspaceId,
        tagline: data.businessName || undefined,
        isOperating:
          data.isOperating === ""
            ? undefined
            : data.isOperating === "yes"
              ? true
              : false,
        industry: normalizedIndustry || undefined,
        companyStage: normalizedCompanyStage || undefined,
        problemShort: normalizedProblemShort || undefined,
        problemLong: data.problemLong || undefined,
        solutionAndUniqueness: data.solutionAndUniqueness || undefined,
        teamAndRoles: data.teamAndRoles || undefined,
        financialProjections: data.financialProjections || undefined,
        risksAndMitigation: data.risksAndMitigation || undefined,
        successMetrics: data.successMetrics || undefined,
        growthPartnerships: data.growthPartnerships || undefined,
        rawFormData: {
          ...data,
          industryOption: data.industryOption,
          industryCustom: data.industryCustom,
          companyStageOption: data.companyStageOption,
          companyStageCustom: data.companyStageCustom,
          problemShortOption: data.problemShortOption,
          problemShortCustom: data.problemShortCustom,
          onboardingStepIndex: currentStep,
          onboardingStepId: stepMeta?.id ?? "",
          onboardingStepTitle: stepMeta?.title ?? "",
          onboardingTotalSteps: totalSteps,
          draftSavedAt: new Date().toISOString(),
        },
      };

      const response = await fetch(
        `/api/workspaces/${workspaceId}/business-profile`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to save workspace business profile");
      }

      if (draftStorageKey) {
        try {
          window.localStorage.removeItem(draftStorageKey);
        } catch {
          // ignore localStorage failures
        }
      }

      const json = (await response.json()) as BusinessProfileResponse;
      router.push(json.redirectTo ?? "/?tab=my-workspaces");
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
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
            text: data[field],
          }),
        },
      );

      const payload = (await res.json().catch(() => null)) as
        | { text?: string; error?: string }
        | null;

      if (!res.ok || !payload?.text) {
        toast.error(payload?.error ?? "Failed to run AI action.");
        return;
      }

      updateField(field, payload.text);
      toast.success("Field updated with AI.");
    } catch (error) {
      console.error("Failed to run AI onboarding action", error);
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
      disabled={isBusy || saving}
      onAction={(action) => {
        void handleAiAssist(field, label, action);
      }}
    />
  );

  const renderStepContent = () => {
    if (currentStep === 0) {
      return (
        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>
            Workspace name
          </Typography>
          <TextField
            fullWidth
            placeholder="Ex. Silicon Growth Lab"
            value={data.workspaceName}
            onChange={(e) => updateField("workspaceName", e.target.value)}
            error={Boolean(fieldErrors.workspaceName)}
            helperText={fieldErrors.workspaceName}
            InputProps={{ sx: inputBaseSx }}
          />
        </Box>
      );
    }

    if (currentStep === 1) {
      return (
        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>
            Business name
          </Typography>
          <TextField
            fullWidth
            placeholder="Ex. Silicon Plan LLC"
            value={data.businessName}
            onChange={(e) => updateField("businessName", e.target.value)}
            error={Boolean(fieldErrors.businessName)}
            helperText={fieldErrors.businessName}
            InputProps={{ sx: inputBaseSx }}
          />
        </Box>
      );
    }

    if (currentStep === 2) {
      return (
        <Stack spacing={3}>
          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>
              Is this company currently in operation?
            </Typography>
            <RadioGroup
              row
              value={data.isOperating}
              onChange={(_, value) =>
                updateField("isOperating", value as "" | "yes" | "no")
              }
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
            {renderFieldError("isOperating")}
          </Box>

          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>
              Why are you creating this business plan?
            </Typography>
            <Select
              fullWidth
              displayEmpty
              value={PURPOSE_OPTIONS.includes(data.businessPlanPurpose as never) ? data.businessPlanPurpose : data.businessPlanPurpose ? "Other" : ""}
              onChange={(event) => {
                const next = event.target.value;
                if (next === "Other") {
                  updateField("businessPlanPurpose", "");
                } else {
                  updateField("businessPlanPurpose", next);
                }
              }}
              sx={selectBaseSx}
              renderValue={(selected) => (selected ? selected : "Select")}
            >
              <MenuItem disabled value="">
                <Typography color="text.secondary">Select</Typography>
              </MenuItem>
              {PURPOSE_OPTIONS.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
              <MenuItem value="Other">Other</MenuItem>
            </Select>
            <TextField
              fullWidth
              sx={{ mt: 1.5 }}
              placeholder="Custom purpose (optional if selected option fits)"
              value={data.businessPlanPurpose}
              onChange={(e) => updateField("businessPlanPurpose", e.target.value)}
              error={Boolean(fieldErrors.businessPlanPurpose)}
              helperText={fieldErrors.businessPlanPurpose}
              InputProps={{ sx: inputBaseSx }}
            />
          </Box>
        </Stack>
      );
    }

    if (currentStep === 3) {
      return (
        <Stack spacing={3}>
          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>
              Select an industry
            </Typography>
            <Select
              fullWidth
              displayEmpty
              value={data.industryOption}
              onChange={handleIndustryChange}
              sx={selectBaseSx}
              error={Boolean(fieldErrors.industryOption)}
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
            {renderFieldError("industryOption")}
          </Box>

          {data.industryOption === "Other" ? (
            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>
                Custom industry
              </Typography>
              <TextField
                fullWidth
                placeholder="Type your industry"
                value={data.industryCustom}
                onChange={(e) => updateField("industryCustom", e.target.value)}
                error={Boolean(fieldErrors.industryCustom)}
                helperText={fieldErrors.industryCustom}
                InputProps={{ sx: inputBaseSx }}
              />
            </Box>
          ) : null}
        </Stack>
      );
    }

    if (currentStep === 4) {
      return (
        <Stack spacing={3}>
          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>
              Company stage
            </Typography>
            <Select
              fullWidth
              displayEmpty
              value={data.companyStageOption}
              onChange={handleCompanyStageChange}
              sx={selectBaseSx}
              error={Boolean(fieldErrors.companyStageOption)}
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
            {renderFieldError("companyStageOption")}
          </Box>

          {data.companyStageOption === "Other" ? (
            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>
                Custom company stage
              </Typography>
              <TextField
                fullWidth
                placeholder="Type your company stage"
                value={data.companyStageCustom}
                onChange={(e) => updateField("companyStageCustom", e.target.value)}
                error={Boolean(fieldErrors.companyStageCustom)}
                helperText={fieldErrors.companyStageCustom}
                InputProps={{ sx: inputBaseSx }}
              />
            </Box>
          ) : null}

          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>
              ATECO code (optional but recommended)
            </Typography>
            <Typography sx={{ fontSize: 12, color: "text.secondary", mb: 1 }}>
              Search by code or category name. This helps us provide accurate industry benchmarks and valuation multiples.
            </Typography>
            <AtecoSearchField
              value={data.atecoCode}
              onChange={(code, description) => {
                updateField("atecoCode", code);
                updateField("atecoDescription", description);
              }}
              disabled={isBusy}
              error={Boolean(fieldErrors.atecoCode)}
              helperText={fieldErrors.atecoCode}
            />
            {data.atecoCode && data.atecoDescription ? (
              <Box
                sx={{
                  mt: 1.5,
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: "#F0F9FF",
                  border: "1px solid #BAE6FD",
                }}
              >
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: "#0369A1", mb: 0.5 }}>
                  Selected ATECO:
                </Typography>
                <Typography sx={{ fontSize: 13, color: "#075985" }}>
                  {data.atecoDescription}
                </Typography>
              </Box>
            ) : null}
          </Box>
        </Stack>
      );
    }

    if (currentStep === 5) {
      return (
        <Stack spacing={3}>
          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>
              What problem do you solve, and for whom?
            </Typography>
            <Select
              fullWidth
              displayEmpty
              value={data.problemShortOption}
              onChange={handleProblemShortChange}
              sx={selectBaseSx}
              error={Boolean(fieldErrors.problemShortOption)}
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
            {renderFieldError("problemShortOption")}
          </Box>

          {data.problemShortOption === "Other" ? (
            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>
                Custom problem target
              </Typography>
              <TextField
                fullWidth
                placeholder="Type the problem and target segment"
                value={data.problemShortCustom}
                onChange={(e) => updateField("problemShortCustom", e.target.value)}
                error={Boolean(fieldErrors.problemShortCustom)}
                helperText={fieldErrors.problemShortCustom}
                InputProps={{ sx: inputBaseSx }}
              />
            </Box>
          ) : null}
        </Stack>
      );
    }

    if (currentStep === 6) {
      return (
        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>
            Problem details
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={4}
            placeholder="Describe the core pain points and current alternatives"
            value={data.problemLong}
            onChange={(e) => updateField("problemLong", e.target.value)}
            error={Boolean(fieldErrors.problemLong)}
            helperText={fieldErrors.problemLong}
            InputProps={{
              sx: multilineFieldSx,
              endAdornment: renderAiAdornment(
                "problemLong",
                "Problem details",
              ),
            }}
          />
        </Box>
      );
    }

    if (currentStep === 7) {
      return (
        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>
            Solution and uniqueness
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={4}
            placeholder="Describe your solution and why it is differentiated"
            value={data.solutionAndUniqueness}
            onChange={(e) => updateField("solutionAndUniqueness", e.target.value)}
            error={Boolean(fieldErrors.solutionAndUniqueness)}
            helperText={fieldErrors.solutionAndUniqueness}
            InputProps={{
              sx: multilineFieldSx,
              endAdornment: renderAiAdornment(
                "solutionAndUniqueness",
                "Solution and uniqueness",
              ),
            }}
          />
        </Box>
      );
    }

    if (currentStep === 8) {
      return (
        <Stack spacing={3}>
          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>
              Product or service
            </Typography>
            <TextField
              fullWidth
              multiline
              minRows={3}
              placeholder="Describe what you sell"
              value={data.productOrService}
              onChange={(e) => updateField("productOrService", e.target.value)}
              error={Boolean(fieldErrors.productOrService)}
              helperText={fieldErrors.productOrService}
              InputProps={{ sx: multilineFieldSx }}
            />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>
              Sales channel
            </Typography>
            <Select
              fullWidth
              displayEmpty
              value={SALES_CHANNEL_OPTIONS.includes(data.salesChannel as never) ? data.salesChannel : data.salesChannel ? "Other" : ""}
              onChange={(event) => {
                const next = event.target.value;
                if (next === "Other") {
                  updateField("salesChannel", "");
                } else {
                  updateField("salesChannel", next);
                }
              }}
              sx={selectBaseSx}
              renderValue={(selected) => (selected ? selected : "Select")}
            >
              <MenuItem disabled value="">
                <Typography color="text.secondary">Select</Typography>
              </MenuItem>
              {SALES_CHANNEL_OPTIONS.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
              <MenuItem value="Other">Other</MenuItem>
            </Select>
            <TextField
              fullWidth
              sx={{ mt: 1.5 }}
              placeholder="Custom sales channel (optional if selected option fits)"
              value={data.salesChannel}
              onChange={(e) => updateField("salesChannel", e.target.value)}
              error={Boolean(fieldErrors.salesChannel)}
              helperText={fieldErrors.salesChannel}
              InputProps={{ sx: inputBaseSx }}
            />
          </Box>
        </Stack>
      );
    }

    if (currentStep === 9) {
      return (
        <Stack spacing={3}>
          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>
              Target market
            </Typography>
            <TextField
              fullWidth
              multiline
              minRows={3}
              placeholder="Describe your target customers and geography"
              value={data.targetMarket}
              onChange={(e) => updateField("targetMarket", e.target.value)}
              error={Boolean(fieldErrors.targetMarket)}
              helperText={fieldErrors.targetMarket}
              InputProps={{ sx: multilineFieldSx }}
            />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>
              Team size
            </Typography>
            <Select
              fullWidth
              displayEmpty
              value={TEAM_SIZE_OPTIONS.includes(data.teamSize as never) ? data.teamSize : data.teamSize ? "Other" : ""}
              onChange={(event) => {
                const next = event.target.value;
                if (next === "Other") {
                  updateField("teamSize", "");
                } else {
                  updateField("teamSize", next);
                }
              }}
              sx={selectBaseSx}
              renderValue={(selected) => (selected ? selected : "Select")}
            >
              <MenuItem disabled value="">
                <Typography color="text.secondary">Select</Typography>
              </MenuItem>
              {TEAM_SIZE_OPTIONS.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
              <MenuItem value="Other">Other</MenuItem>
            </Select>
            <TextField
              fullWidth
              sx={{ mt: 1.5 }}
              placeholder="Custom team size (optional if selected option fits)"
              value={data.teamSize}
              onChange={(e) => updateField("teamSize", e.target.value)}
              error={Boolean(fieldErrors.teamSize)}
              helperText={fieldErrors.teamSize}
              InputProps={{ sx: inputBaseSx }}
            />
          </Box>
        </Stack>
      );
    }

    if (currentStep === 10) {
      return (
        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>
            Team roles and responsibilities
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={4}
            placeholder="Describe core team members and their roles"
            value={data.teamAndRoles}
            onChange={(e) => updateField("teamAndRoles", e.target.value)}
            error={Boolean(fieldErrors.teamAndRoles)}
            helperText={fieldErrors.teamAndRoles}
            InputProps={{
              sx: multilineFieldSx,
              endAdornment: renderAiAdornment(
                "teamAndRoles",
                "Team roles and responsibilities",
              ),
            }}
          />
        </Box>
      );
    }

    return (
      <Stack spacing={3}>
        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>
            Financial projections
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={3}
            placeholder="Describe 3-5 year outlook"
            value={data.financialProjections}
            onChange={(e) => updateField("financialProjections", e.target.value)}
            error={Boolean(fieldErrors.financialProjections)}
            helperText={fieldErrors.financialProjections}
            InputProps={{
              sx: multilineFieldSx,
              endAdornment: renderAiAdornment(
                "financialProjections",
                "Financial projections",
              ),
            }}
          />
        </Box>
        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>
            Risks and mitigation
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={3}
            placeholder="Describe key risks and mitigation actions"
            value={data.risksAndMitigation}
            onChange={(e) => updateField("risksAndMitigation", e.target.value)}
            error={Boolean(fieldErrors.risksAndMitigation)}
            helperText={fieldErrors.risksAndMitigation}
            InputProps={{
              sx: multilineFieldSx,
              endAdornment: renderAiAdornment(
                "risksAndMitigation",
                "Risks and mitigation",
              ),
            }}
          />
        </Box>
        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>
            Success metrics
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={3}
            placeholder="Describe KPIs and goals"
            value={data.successMetrics}
            onChange={(e) => updateField("successMetrics", e.target.value)}
            error={Boolean(fieldErrors.successMetrics)}
            helperText={fieldErrors.successMetrics}
            InputProps={{
              sx: multilineFieldSx,
              endAdornment: renderAiAdornment(
                "successMetrics",
                "Success metrics",
              ),
            }}
          />
        </Box>
        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>
            Growth partnerships
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={3}
            placeholder="Describe strategic partnerships"
            value={data.growthPartnerships}
            onChange={(e) => updateField("growthPartnerships", e.target.value)}
            error={Boolean(fieldErrors.growthPartnerships)}
            helperText={fieldErrors.growthPartnerships}
            InputProps={{
              sx: multilineFieldSx,
              endAdornment: renderAiAdornment(
                "growthPartnerships",
                "Growth partnerships",
              ),
            }}
          />
        </Box>
      </Stack>
    );
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        bgcolor: "#F7F8FC",
      }}
    >
      <SettingsSidebar activeNav={activeNav} onNavChange={setActiveNav} />

      <Box
        component="main"
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          bgcolor: "#FFFFFF",
          minWidth: 0,
        }}
      >
        <SettingsTopTabs
          workspaceCount={workspaceCount}
          topTab={topTab}
          onTabChange={handleTopTabChange}
        />

        <Box
          sx={{
            flex: 1,
            display: "flex",
            px: { xs: 2, md: 6 },
            pb: 5,
            pt: 3,
            gap: 3,
            bgcolor: "#FFFFFF",
            flexDirection: { xs: "column", lg: "row" },
          }}
        >
          <Box
            sx={{
              flex: { xs: "0 0 auto", lg: "0 0 34%" },
              borderRadius: 4,
              border: "1px solid #E2E8F0",
              bgcolor: "#F8FAFF",
              p: 3,
              alignSelf: "flex-start",
            }}
          >
            <Typography sx={{ fontSize: 24, fontWeight: 700, mb: 1.2 }}>
              Setup Business
            </Typography>
            <Typography sx={{ fontSize: 14.5, color: "text.secondary", mb: 2.5 }}>
              12-step onboarding to structure your workspace context for planning
              and AI generation.
            </Typography>
            <Box
              sx={{
                p: 2,
                borderRadius: 3,
                bgcolor: "rgba(76,106,210,0.08)",
                fontSize: 13.5,
                color: "#1E3A8A",
              }}
            >
              Step {currentStep + 1} of {totalSteps}: {stepMeta?.title}
              <br />
              {stepMeta?.subtitle}
            </Box>
            <Box sx={{ mt: 2 }}>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                  height: 8,
                  borderRadius: 999,
                  bgcolor: "rgba(76,106,210,0.16)",
                  "& .MuiLinearProgress-bar": {
                    borderRadius: 999,
                    backgroundImage:
                      "linear-gradient(90deg, #4C6AD2 0%, #7B4FD6 100%)",
                  },
                }}
              />
            </Box>
            <Typography sx={{ mt: 2, fontSize: 12.5, color: "text.secondary" }}>
              Workspace: {workspaceName || "Not set yet"}
            </Typography>
          </Box>

          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
              flex: 1,
              borderRadius: 4,
              border: "1px solid #E2E8F0",
              bgcolor: "#F9FAFF",
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Box
              sx={{
                px: 3,
                pt: 2.5,
                pb: 2,
                borderBottom: "1px solid #E2E8F0",
                bgcolor: "#F3F6FF",
              }}
            >
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: "#4C6AD2" }}>
                STEP {currentStep + 1} / {totalSteps}
              </Typography>
              <Typography sx={{ fontSize: 20, fontWeight: 700 }}>
                {stepMeta?.title}
              </Typography>
              <Typography sx={{ fontSize: 14, color: "text.secondary" }}>
                {stepMeta?.subtitle}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: "wrap", rowGap: 1 }}>
                {ONBOARDING_STEP_DEFINITIONS.map((step, index) => (
                  <Box
                    key={step.id}
                    sx={{
                      px: 1.1,
                      py: 0.45,
                      borderRadius: 999,
                      fontSize: 11.5,
                      fontWeight: 600,
                      color:
                        index === currentStep
                          ? "#FFFFFF"
                          : index < currentStep
                            ? "#334155"
                            : "#64748B",
                      bgcolor:
                        index === currentStep
                          ? "#4C6AD2"
                          : index < currentStep
                            ? "#E2E8F0"
                            : "#EEF2FF",
                    }}
                  >
                    {index + 1}
                  </Box>
                ))}
              </Stack>
            </Box>

            <Box
              sx={{
                flex: 1,
                px: 3,
                pt: 2.5,
                pb: 3,
                overflowY: "auto",
              }}
            >
              {resumedFromDraft ? (
                <Alert
                  severity="info"
                  sx={{ mb: 2, borderRadius: 2, bgcolor: "#EEF4FF", color: "#1E3A8A" }}
                >
                  Restored your latest local draft for this workspace.
                </Alert>
              ) : null}

              {lastDraftSavedAt ? (
                <Typography sx={{ mb: 2, fontSize: 12, color: "text.secondary" }}>
                  Draft auto-saved: {new Date(lastDraftSavedAt).toLocaleString()}
                </Typography>
              ) : null}

              {renderStepContent()}
            </Box>

            <Box
              sx={{
                px: 3,
                py: 2.2,
                borderTop: "1px solid #E2E8F0",
                bgcolor: "#F3F6FF",
                display: "flex",
                gap: 2,
              }}
            >
              <Button
                type="button"
                disabled={isBusy || currentStep === 0}
                onClick={handleBack}
                sx={{
                  flex: 1,
                  borderRadius: 999,
                  textTransform: "none",
                  fontWeight: 600,
                  border: "1px solid #CBD5E1",
                  bgcolor: "#FFFFFF",
                  color: "#334155",
                }}
              >
                Back
              </Button>
              {isFinalStep ? (
                <Button
                  type="submit"
                  disabled={isBusy}
                  sx={{
                    flex: 1,
                    borderRadius: 999,
                    textTransform: "none",
                    fontWeight: 600,
                    color: "#FFFFFF",
                    backgroundImage:
                      "linear-gradient(90deg, #4C6AD2 0%, #7B4FD6 100%)",
                    "&.Mui-disabled": {
                      backgroundImage: "none",
                      backgroundColor: "#E5E7EB",
                      color: "#9CA3AF",
                    },
                  }}
                >
                  {saving ? "Saving..." : "Create Workspace"}
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={isBusy}
                  sx={{
                    flex: 1,
                    borderRadius: 999,
                    textTransform: "none",
                    fontWeight: 600,
                    color: "#FFFFFF",
                    backgroundImage:
                      "linear-gradient(90deg, #4C6AD2 0%, #7B4FD6 100%)",
                    "&.Mui-disabled": {
                      backgroundImage: "none",
                      backgroundColor: "#E5E7EB",
                      color: "#9CA3AF",
                    },
                  }}
                >
                  Next Step
                </Button>
              )}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
