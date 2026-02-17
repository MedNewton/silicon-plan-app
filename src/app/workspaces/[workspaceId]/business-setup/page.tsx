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
import { useLanguage } from "@/components/i18n/LanguageProvider";

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

function withVars(
  template: string,
  vars: Record<string, string | number>,
): string {
  return Object.entries(vars).reduce((value, [key, replacement]) => {
    return value.replace(`{${key}}`, String(replacement));
  }, template);
}

function getOptionLabel(
  value: string,
  labels: Record<string, string>,
): string {
  return labels[value] ?? value;
}

export default function WorkspaceBusinessSetupPage() {
  const router = useRouter();
  const params = useParams();
  const { locale } = useLanguage();

  const copy =
    locale === "it"
      ? {
          setupBusiness: "Configura azienda",
          wizardDescription:
            "Onboarding in 12 passaggi per strutturare il contesto del workspace per pianificazione e generazione AI.",
          stepOf: "Passo {step} di {total}: {title}",
          workspaceLabel: "Workspace",
          workspaceNotSet: "Non ancora impostato",
          stepLabel: "PASSO {step} / {total}",
          draftRestored:
            "Bozza locale piu recente ripristinata per questo workspace.",
          draftSaved: "Bozza salvata automaticamente",
          back: "Indietro",
          createWorkspace: "Crea workspace",
          saving: "Salvataggio...",
          nextStep: "Passo successivo",
          yes: "Si",
          no: "No",
          select: "Seleziona",
          other: "Altro",
          workspaceName: "Nome workspace",
          workspaceNamePlaceholder: "Es. Silicon Growth Lab",
          businessName: "Nome azienda",
          businessNamePlaceholder: "Es. Silicon Plan LLC",
          isOperating: "Questa azienda e attualmente operativa?",
          businessPlanPurpose: "Perche stai creando questo business plan?",
          businessPlanPurposePlaceholder:
            "Scopo personalizzato (opzionale se una scelta predefinita e adatta)",
          selectIndustry: "Seleziona un settore",
          customIndustry: "Settore personalizzato",
          customIndustryPlaceholder: "Inserisci il tuo settore",
          companyStage: "Stadio aziendale",
          customCompanyStage: "Stadio aziendale personalizzato",
          customCompanyStagePlaceholder: "Inserisci lo stadio aziendale",
          atecoCode: "Codice ATECO (opzionale ma consigliato)",
          atecoHelp:
            "Cerca per codice o nome categoria. Ci aiuta a fornire benchmark di settore e multipli di valutazione accurati.",
          selectedAteco: "ATECO selezionato:",
          problemShort: "Quale problema risolvi e per chi?",
          customProblemTarget: "Target problema personalizzato",
          customProblemTargetPlaceholder:
            "Inserisci problema e segmento target",
          problemDetails: "Dettagli problema",
          problemDetailsPlaceholder:
            "Descrivi i principali pain point e le alternative attuali",
          solutionUniqueness: "Soluzione e unicita",
          solutionUniquenessPlaceholder:
            "Descrivi la soluzione e cosa la differenzia",
          productService: "Prodotto o servizio",
          productServicePlaceholder: "Descrivi cosa vendi",
          salesChannel: "Canale di vendita",
          salesChannelPlaceholder:
            "Canale di vendita personalizzato (opzionale se una scelta predefinita e adatta)",
          targetMarket: "Mercato target",
          targetMarketPlaceholder:
            "Descrivi clienti target e area geografica",
          teamSize: "Dimensione team",
          teamSizePlaceholder:
            "Dimensione team personalizzata (opzionale se una scelta predefinita e adatta)",
          teamRoles: "Ruoli e responsabilita del team",
          teamRolesPlaceholder: "Descrivi membri chiave e ruoli",
          financialProjections: "Proiezioni finanziarie",
          financialProjectionsPlaceholder:
            "Descrivi la prospettiva a 3-5 anni",
          risksMitigation: "Rischi e mitigazione",
          risksMitigationPlaceholder:
            "Descrivi rischi principali e azioni di mitigazione",
          successMetrics: "Metriche di successo",
          successMetricsPlaceholder: "Descrivi KPI e obiettivi",
          growthPartnerships: "Partnership di crescita",
          growthPartnershipsPlaceholder:
            "Descrivi partnership strategiche",
          errWorkspaceName: "Il nome workspace e obbligatorio.",
          errBusinessName: "Il nome azienda e obbligatorio.",
          errOperationStatus: "Seleziona lo stato operativo.",
          errPlanPurpose: "Seleziona o inserisci lo scopo del piano.",
          errIndustry: "La selezione del settore e obbligatoria.",
          errIndustryCustom: "Inserisci un settore personalizzato.",
          errCompanyStage: "Lo stadio aziendale e obbligatorio.",
          errCompanyStageCustom: "Inserisci uno stadio aziendale personalizzato.",
          errProblemTarget: "La selezione del target problema e obbligatoria.",
          errProblemTargetCustom: "Inserisci un target problema personalizzato.",
          errProblemLong: "La descrizione dettagliata del problema e obbligatoria.",
          errSolution: "I dettagli della soluzione sono obbligatori.",
          errProductService: "La descrizione prodotto/servizio e obbligatoria.",
          errSalesChannel: "Il canale di vendita e obbligatorio.",
          errTargetMarket: "Il mercato target e obbligatorio.",
          errTeamSize: "La dimensione del team e obbligatoria.",
          errTeamRoles: "I ruoli del team sono obbligatori.",
          errFinancial: "Le proiezioni finanziarie sono obbligatorie.",
          errRisk: "Il piano rischi e mitigazione e obbligatorio.",
          errSuccess: "Le metriche di successo sono obbligatorie.",
          errGrowth: "Le partnership di crescita sono obbligatorie.",
          aiFieldUpdated: "Campo aggiornato con AI.",
          aiFieldFailed: "Impossibile eseguire l'azione AI.",
          aiFieldError:
            "Si e verificato un errore durante l'azione AI.",
        }
      : {
          setupBusiness: "Setup Business",
          wizardDescription:
            "12-step onboarding to structure your workspace context for planning and AI generation.",
          stepOf: "Step {step} of {total}: {title}",
          workspaceLabel: "Workspace",
          workspaceNotSet: "Not set yet",
          stepLabel: "STEP {step} / {total}",
          draftRestored: "Restored your latest local draft for this workspace.",
          draftSaved: "Draft auto-saved",
          back: "Back",
          createWorkspace: "Create Workspace",
          saving: "Saving...",
          nextStep: "Next Step",
          yes: "Yes",
          no: "No",
          select: "Select",
          other: "Other",
          workspaceName: "Workspace name",
          workspaceNamePlaceholder: "Ex. Silicon Growth Lab",
          businessName: "Business name",
          businessNamePlaceholder: "Ex. Silicon Plan LLC",
          isOperating: "Is this company currently in operation?",
          businessPlanPurpose: "Why are you creating this business plan?",
          businessPlanPurposePlaceholder:
            "Custom purpose (optional if selected option fits)",
          selectIndustry: "Select an industry",
          customIndustry: "Custom industry",
          customIndustryPlaceholder: "Type your industry",
          companyStage: "Company stage",
          customCompanyStage: "Custom company stage",
          customCompanyStagePlaceholder: "Type your company stage",
          atecoCode: "ATECO code (optional but recommended)",
          atecoHelp:
            "Search by code or category name. This helps us provide accurate industry benchmarks and valuation multiples.",
          selectedAteco: "Selected ATECO:",
          problemShort: "What problem do you solve, and for whom?",
          customProblemTarget: "Custom problem target",
          customProblemTargetPlaceholder: "Type the problem and target segment",
          problemDetails: "Problem details",
          problemDetailsPlaceholder:
            "Describe the core pain points and current alternatives",
          solutionUniqueness: "Solution and uniqueness",
          solutionUniquenessPlaceholder:
            "Describe your solution and why it is differentiated",
          productService: "Product or service",
          productServicePlaceholder: "Describe what you sell",
          salesChannel: "Sales channel",
          salesChannelPlaceholder:
            "Custom sales channel (optional if selected option fits)",
          targetMarket: "Target market",
          targetMarketPlaceholder:
            "Describe your target customers and geography",
          teamSize: "Team size",
          teamSizePlaceholder:
            "Custom team size (optional if selected option fits)",
          teamRoles: "Team roles and responsibilities",
          teamRolesPlaceholder: "Describe core team members and their roles",
          financialProjections: "Financial projections",
          financialProjectionsPlaceholder: "Describe 3-5 year outlook",
          risksMitigation: "Risks and mitigation",
          risksMitigationPlaceholder: "Describe key risks and mitigation actions",
          successMetrics: "Success metrics",
          successMetricsPlaceholder: "Describe KPIs and goals",
          growthPartnerships: "Growth partnerships",
          growthPartnershipsPlaceholder: "Describe strategic partnerships",
          errWorkspaceName: "Workspace name is required.",
          errBusinessName: "Business name is required.",
          errOperationStatus: "Please select operation status.",
          errPlanPurpose: "Please select or provide the plan purpose.",
          errIndustry: "Industry selection is required.",
          errIndustryCustom: "Please provide a custom industry.",
          errCompanyStage: "Company stage is required.",
          errCompanyStageCustom: "Please provide a custom company stage.",
          errProblemTarget: "Problem target selection is required.",
          errProblemTargetCustom: "Please provide a custom problem target.",
          errProblemLong: "Detailed problem description is required.",
          errSolution: "Solution details are required.",
          errProductService: "Product/service description is required.",
          errSalesChannel: "Sales channel is required.",
          errTargetMarket: "Target market is required.",
          errTeamSize: "Team size is required.",
          errTeamRoles: "Team roles are required.",
          errFinancial: "Financial projections are required.",
          errRisk: "Risk and mitigation plan is required.",
          errSuccess: "Success metrics are required.",
          errGrowth: "Growth partnerships are required.",
          aiFieldUpdated: "Field updated with AI.",
          aiFieldFailed: "Failed to run AI action.",
          aiFieldError: "Something went wrong while running AI action.",
        };

  const localizedStepDefinitions = useMemo(() => {
    const itById: Record<string, { title: string; subtitle: string }> = {
      workspace_name: {
        title: "Nome workspace",
        subtitle: "Imposta il nome business/workspace usato nella pianificazione",
      },
      business_name: {
        title: "Nome azienda",
        subtitle: "Imposta il nome aziendale usato nel piano",
      },
      operation_and_purpose: {
        title: "Operativita e obiettivo",
        subtitle: "Definisci stato operativo e obiettivo di pianificazione",
      },
      industry_selection: {
        title: "Settore",
        subtitle: "Seleziona il macro-settore o inseriscine uno personalizzato",
      },
      company_stage_and_ateco: {
        title: "Stadio e ATECO",
        subtitle: "Imposta maturita aziendale e dettagli ATECO opzionali",
      },
      problem_target: {
        title: "Target problema",
        subtitle: "Identifica chi servi e quale problema affronti",
      },
      problem_details: {
        title: "Dettagli problema",
        subtitle: "Descrivi il contesto del problema con dettagli concreti",
      },
      solution_uniqueness: {
        title: "Soluzione",
        subtitle: "Spiega la soluzione e cosa la rende diversa",
      },
      offering_and_channel: {
        title: "Offerta e canali",
        subtitle: "Descrivi prodotto/servizio e canali di vendita",
      },
      market_and_team_size: {
        title: "Mercato e team",
        subtitle: "Definisci mercato target e dimensione del team",
      },
      team_roles: {
        title: "Ruoli team",
        subtitle: "Chiarisci composizione e responsabilita del team",
      },
      financial_execution: {
        title: "Finanza ed esecuzione",
        subtitle: "Raccogli proiezioni, rischi, KPI e partnership di crescita",
      },
    };

    if (locale !== "it") return ONBOARDING_STEP_DEFINITIONS;
    return ONBOARDING_STEP_DEFINITIONS.map((step) => ({
      ...step,
      title: itById[step.id]?.title ?? step.title,
      subtitle: itById[step.id]?.subtitle ?? step.subtitle,
    }));
  }, [locale]);

  const industryOptionLabels: Record<string, string> =
    locale === "it"
      ? {
          "Software / SaaS / IT": "Software / SaaS / IT",
          "IT Services / IT Consulting": "Servizi IT / Consulenza IT",
          "E-commerce / Retail": "E-commerce / Retail",
          "FinTech / Payments / InsurTech": "FinTech / Pagamenti / InsurTech",
          "Health / MedTech / Biotech": "Salute / MedTech / Biotech",
          "Education / EdTech": "Formazione / EdTech",
          "Media / Marketing / Advertising": "Media / Marketing / Advertising",
          "Tourism / Hospitality / Food service": "Turismo / Hospitality / Ristorazione",
          "Logistics / Transport / Mobility": "Logistica / Trasporti / Mobilita",
          "Manufacturing / Industry 4.0": "Produzione / Industria 4.0",
          "Agriculture / Food production": "Agricoltura / Produzione alimentare",
          "Energy / Utilities": "Energia / Utilities",
          "Construction / Real Estate": "Costruzioni / Real Estate",
          "Professional Services": "Servizi professionali",
          "Business Services / B2B": "Servizi alle imprese / B2B",
          Other: copy.other,
        }
      : {};

  const companyStageOptionLabels: Record<string, string> =
    locale === "it"
      ? {
          "Idea / Pre-seed": "Idea / Pre-seed",
          "Early Growth (Seed to Series A)": "Crescita iniziale (Seed - Serie A)",
          "Scale-up": "Scale-up",
          Established: "Consolidata",
          Other: copy.other,
        }
      : {};

  const problemShortOptionLabels: Record<string, string> =
    locale === "it"
      ? {
          "Founders who need structured business plans":
            "Founder che hanno bisogno di business plan strutturati",
          "Small businesses needing funding-ready docs":
            "Piccole imprese che necessitano documenti pronti per investitori",
          "Consultants serving SME clients":
            "Consulenti che supportano clienti PMI",
          Other: copy.other,
        }
      : {};

  const purposeOptionLabels: Record<string, string> =
    locale === "it"
      ? {
          "Create a complete business plan": "Creare un business plan completo",
          "Prepare for fundraising": "Prepararsi alla raccolta fondi",
          "Clarify business strategy": "Chiarire la strategia aziendale",
          "Improve internal planning": "Migliorare la pianificazione interna",
          Other: copy.other,
        }
      : {};

  const salesChannelOptionLabels: Record<string, string> =
    locale === "it"
      ? {
          "Direct sales": "Vendita diretta",
          "Online channels": "Canali online",
          "Partner network": "Rete partner",
          "Mixed channels": "Canali misti",
          Other: copy.other,
        }
      : {};

  const teamSizeOptionLabels: Record<string, string> =
    locale === "it"
      ? {
          "Solo founder": "Founder singolo",
          "2-5 people": "2-5 persone",
          "6-20 people": "6-20 persone",
          "21-50 people": "21-50 persone",
          "50+ people": "50+ persone",
          Other: copy.other,
        }
      : {};

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

  const totalSteps = localizedStepDefinitions.length;
  const lastStepIndex = totalSteps - 1;
  const isFinalStep = currentStep === lastStepIndex;
  const progress = ((currentStep + 1) / totalSteps) * 100;
  const isBusy = loading || saving || !workspaceId;
  const stepMeta =
    localizedStepDefinitions[currentStep] ?? localizedStepDefinitions[0];
  const canonicalStepMeta =
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

  const validateStep = (
    currentData: WorkspaceOnboardingData,
    stepIndex: number,
  ): FieldErrors => {
    const errors: FieldErrors = {};

    if (stepIndex === 0 && !currentData.workspaceName.trim()) {
      errors.workspaceName = copy.errWorkspaceName;
    }

    if (stepIndex === 1 && !currentData.businessName.trim()) {
      errors.businessName = copy.errBusinessName;
    }

    if (stepIndex === 2) {
      if (!currentData.isOperating) {
        errors.isOperating = copy.errOperationStatus;
      }
      if (!currentData.businessPlanPurpose.trim()) {
        errors.businessPlanPurpose = copy.errPlanPurpose;
      }
    }

    if (stepIndex === 3) {
      if (!currentData.industryOption) {
        errors.industryOption = copy.errIndustry;
      }
      if (
        currentData.industryOption === "Other" &&
        !currentData.industryCustom.trim()
      ) {
        errors.industryCustom = copy.errIndustryCustom;
      }
    }

    if (stepIndex === 4) {
      if (!currentData.companyStageOption) {
        errors.companyStageOption = copy.errCompanyStage;
      }
      if (
        currentData.companyStageOption === "Other" &&
        !currentData.companyStageCustom.trim()
      ) {
        errors.companyStageCustom = copy.errCompanyStageCustom;
      }
    }

    if (stepIndex === 5) {
      if (!currentData.problemShortOption) {
        errors.problemShortOption = copy.errProblemTarget;
      }
      if (
        currentData.problemShortOption === "Other" &&
        !currentData.problemShortCustom.trim()
      ) {
        errors.problemShortCustom = copy.errProblemTargetCustom;
      }
    }

    if (stepIndex === 6 && !currentData.problemLong.trim()) {
      errors.problemLong = copy.errProblemLong;
    }

    if (stepIndex === 7 && !currentData.solutionAndUniqueness.trim()) {
      errors.solutionAndUniqueness = copy.errSolution;
    }

    if (stepIndex === 8) {
      if (!currentData.productOrService.trim()) {
        errors.productOrService = copy.errProductService;
      }
      if (!currentData.salesChannel.trim()) {
        errors.salesChannel = copy.errSalesChannel;
      }
    }

    if (stepIndex === 9) {
      if (!currentData.targetMarket.trim()) {
        errors.targetMarket = copy.errTargetMarket;
      }
      if (!currentData.teamSize.trim()) {
        errors.teamSize = copy.errTeamSize;
      }
    }

    if (stepIndex === 10 && !currentData.teamAndRoles.trim()) {
      errors.teamAndRoles = copy.errTeamRoles;
    }

    if (stepIndex === 11) {
      if (!currentData.financialProjections.trim()) {
        errors.financialProjections = copy.errFinancial;
      }
      if (!currentData.risksAndMitigation.trim()) {
        errors.risksAndMitigation = copy.errRisk;
      }
      if (!currentData.successMetrics.trim()) {
        errors.successMetrics = copy.errSuccess;
      }
      if (!currentData.growthPartnerships.trim()) {
        errors.growthPartnerships = copy.errGrowth;
      }
    }

    return errors;
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
          onboardingStepId: canonicalStepMeta?.id ?? "",
          onboardingStepTitle: canonicalStepMeta?.title ?? "",
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
        toast.error(payload?.error ?? copy.aiFieldFailed);
        return;
      }

      updateField(field, payload.text);
      toast.success(copy.aiFieldUpdated);
    } catch (error) {
      console.error("Failed to run AI onboarding action", error);
      toast.error(copy.aiFieldError);
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
            {copy.workspaceName}
          </Typography>
          <TextField
            fullWidth
            placeholder={copy.workspaceNamePlaceholder}
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
            {copy.businessName}
          </Typography>
          <TextField
            fullWidth
            placeholder={copy.businessNamePlaceholder}
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
              {copy.isOperating}
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
                label={copy.yes}
              />
              <FormControlLabel
                value="no"
                control={<Radio size="small" />}
                label={copy.no}
              />
            </RadioGroup>
            {renderFieldError("isOperating")}
          </Box>

          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>
              {copy.businessPlanPurpose}
            </Typography>
            <Select
              fullWidth
              displayEmpty
              value={
                PURPOSE_OPTIONS.includes(data.businessPlanPurpose as never)
                  ? data.businessPlanPurpose
                  : data.businessPlanPurpose
                    ? "Other"
                    : ""
              }
              onChange={(event) => {
                const next = event.target.value;
                if (next === "Other") {
                  updateField("businessPlanPurpose", "");
                } else {
                  updateField("businessPlanPurpose", next);
                }
              }}
              sx={selectBaseSx}
              renderValue={(selected) =>
                selected
                  ? getOptionLabel(selected, purposeOptionLabels)
                  : copy.select
              }
            >
              <MenuItem disabled value="">
                <Typography color="text.secondary">{copy.select}</Typography>
              </MenuItem>
              {PURPOSE_OPTIONS.map((option) => (
                <MenuItem key={option} value={option}>
                  {getOptionLabel(option, purposeOptionLabels)}
                </MenuItem>
              ))}
              <MenuItem value="Other">{copy.other}</MenuItem>
            </Select>
            <TextField
              fullWidth
              sx={{ mt: 1.5 }}
              placeholder={copy.businessPlanPurposePlaceholder}
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
              {copy.selectIndustry}
            </Typography>
            <Select
              fullWidth
              displayEmpty
              value={data.industryOption}
              onChange={handleIndustryChange}
              sx={selectBaseSx}
              error={Boolean(fieldErrors.industryOption)}
              renderValue={(selected) =>
                selected
                  ? getOptionLabel(selected, industryOptionLabels)
                  : copy.select
              }
            >
              <MenuItem disabled value="">
                <Typography color="text.secondary">{copy.select}</Typography>
              </MenuItem>
              {INDUSTRY_OPTIONS.map((option) => (
                <MenuItem key={option} value={option}>
                  {getOptionLabel(option, industryOptionLabels)}
                </MenuItem>
              ))}
              <MenuItem value="Other">{copy.other}</MenuItem>
            </Select>
            {renderFieldError("industryOption")}
          </Box>

          {data.industryOption === "Other" ? (
            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>
                {copy.customIndustry}
              </Typography>
              <TextField
                fullWidth
                placeholder={copy.customIndustryPlaceholder}
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
              {copy.companyStage}
            </Typography>
            <Select
              fullWidth
              displayEmpty
              value={data.companyStageOption}
              onChange={handleCompanyStageChange}
              sx={selectBaseSx}
              error={Boolean(fieldErrors.companyStageOption)}
              renderValue={(selected) =>
                selected
                  ? getOptionLabel(selected, companyStageOptionLabels)
                  : copy.select
              }
            >
              <MenuItem disabled value="">
                <Typography color="text.secondary">{copy.select}</Typography>
              </MenuItem>
              {COMPANY_STAGE_OPTIONS.map((option) => (
                <MenuItem key={option} value={option}>
                  {getOptionLabel(option, companyStageOptionLabels)}
                </MenuItem>
              ))}
              <MenuItem value="Other">{copy.other}</MenuItem>
            </Select>
            {renderFieldError("companyStageOption")}
          </Box>

          {data.companyStageOption === "Other" ? (
            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>
                {copy.customCompanyStage}
              </Typography>
              <TextField
                fullWidth
                placeholder={copy.customCompanyStagePlaceholder}
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
              {copy.atecoCode}
            </Typography>
            <Typography sx={{ fontSize: 12, color: "text.secondary", mb: 1 }}>
              {copy.atecoHelp}
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
                  {copy.selectedAteco}
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
              {copy.problemShort}
            </Typography>
            <Select
              fullWidth
              displayEmpty
              value={data.problemShortOption}
              onChange={handleProblemShortChange}
              sx={selectBaseSx}
              error={Boolean(fieldErrors.problemShortOption)}
              renderValue={(selected) =>
                selected
                  ? getOptionLabel(selected, problemShortOptionLabels)
                  : copy.select
              }
            >
              <MenuItem disabled value="">
                <Typography color="text.secondary">{copy.select}</Typography>
              </MenuItem>
              {PROBLEM_SHORT_OPTIONS.map((option) => (
                <MenuItem key={option} value={option}>
                  {getOptionLabel(option, problemShortOptionLabels)}
                </MenuItem>
              ))}
              <MenuItem value="Other">{copy.other}</MenuItem>
            </Select>
            {renderFieldError("problemShortOption")}
          </Box>

          {data.problemShortOption === "Other" ? (
            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>
                {copy.customProblemTarget}
              </Typography>
              <TextField
                fullWidth
                placeholder={copy.customProblemTargetPlaceholder}
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
            {copy.problemDetails}
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={4}
            placeholder={copy.problemDetailsPlaceholder}
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
            {copy.solutionUniqueness}
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={4}
            placeholder={copy.solutionUniquenessPlaceholder}
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
              {copy.productService}
            </Typography>
            <TextField
              fullWidth
              multiline
              minRows={3}
              placeholder={copy.productServicePlaceholder}
              value={data.productOrService}
              onChange={(e) => updateField("productOrService", e.target.value)}
              error={Boolean(fieldErrors.productOrService)}
              helperText={fieldErrors.productOrService}
              InputProps={{ sx: multilineFieldSx }}
            />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>
              {copy.salesChannel}
            </Typography>
            <Select
              fullWidth
              displayEmpty
              value={
                SALES_CHANNEL_OPTIONS.includes(data.salesChannel as never)
                  ? data.salesChannel
                  : data.salesChannel
                    ? "Other"
                    : ""
              }
              onChange={(event) => {
                const next = event.target.value;
                if (next === "Other") {
                  updateField("salesChannel", "");
                } else {
                  updateField("salesChannel", next);
                }
              }}
              sx={selectBaseSx}
              renderValue={(selected) =>
                selected
                  ? getOptionLabel(selected, salesChannelOptionLabels)
                  : copy.select
              }
            >
              <MenuItem disabled value="">
                <Typography color="text.secondary">{copy.select}</Typography>
              </MenuItem>
              {SALES_CHANNEL_OPTIONS.map((option) => (
                <MenuItem key={option} value={option}>
                  {getOptionLabel(option, salesChannelOptionLabels)}
                </MenuItem>
              ))}
              <MenuItem value="Other">{copy.other}</MenuItem>
            </Select>
            <TextField
              fullWidth
              sx={{ mt: 1.5 }}
              placeholder={copy.salesChannelPlaceholder}
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
              {copy.targetMarket}
            </Typography>
            <TextField
              fullWidth
              multiline
              minRows={3}
              placeholder={copy.targetMarketPlaceholder}
              value={data.targetMarket}
              onChange={(e) => updateField("targetMarket", e.target.value)}
              error={Boolean(fieldErrors.targetMarket)}
              helperText={fieldErrors.targetMarket}
              InputProps={{ sx: multilineFieldSx }}
            />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>
              {copy.teamSize}
            </Typography>
            <Select
              fullWidth
              displayEmpty
              value={
                TEAM_SIZE_OPTIONS.includes(data.teamSize as never)
                  ? data.teamSize
                  : data.teamSize
                    ? "Other"
                    : ""
              }
              onChange={(event) => {
                const next = event.target.value;
                if (next === "Other") {
                  updateField("teamSize", "");
                } else {
                  updateField("teamSize", next);
                }
              }}
              sx={selectBaseSx}
              renderValue={(selected) =>
                selected
                  ? getOptionLabel(selected, teamSizeOptionLabels)
                  : copy.select
              }
            >
              <MenuItem disabled value="">
                <Typography color="text.secondary">{copy.select}</Typography>
              </MenuItem>
              {TEAM_SIZE_OPTIONS.map((option) => (
                <MenuItem key={option} value={option}>
                  {getOptionLabel(option, teamSizeOptionLabels)}
                </MenuItem>
              ))}
              <MenuItem value="Other">{copy.other}</MenuItem>
            </Select>
            <TextField
              fullWidth
              sx={{ mt: 1.5 }}
              placeholder={copy.teamSizePlaceholder}
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
            {copy.teamRoles}
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={4}
            placeholder={copy.teamRolesPlaceholder}
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
            {copy.financialProjections}
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={3}
            placeholder={copy.financialProjectionsPlaceholder}
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
            {copy.risksMitigation}
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={3}
            placeholder={copy.risksMitigationPlaceholder}
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
            {copy.successMetrics}
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={3}
            placeholder={copy.successMetricsPlaceholder}
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
            {copy.growthPartnerships}
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={3}
            placeholder={copy.growthPartnershipsPlaceholder}
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
              {copy.setupBusiness}
            </Typography>
            <Typography sx={{ fontSize: 14.5, color: "text.secondary", mb: 2.5 }}>
              {copy.wizardDescription}
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
              {withVars(copy.stepOf, {
                step: currentStep + 1,
                total: totalSteps,
                title: stepMeta?.title ?? "",
              })}
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
              {copy.workspaceLabel}: {workspaceName || copy.workspaceNotSet}
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
                {withVars(copy.stepLabel, {
                  step: currentStep + 1,
                  total: totalSteps,
                })}
              </Typography>
              <Typography sx={{ fontSize: 20, fontWeight: 700 }}>
                {stepMeta?.title}
              </Typography>
              <Typography sx={{ fontSize: 14, color: "text.secondary" }}>
                {stepMeta?.subtitle}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: "wrap", rowGap: 1 }}>
                {localizedStepDefinitions.map((step, index) => (
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
                  {copy.draftRestored}
                </Alert>
              ) : null}

              {lastDraftSavedAt ? (
                <Typography sx={{ mb: 2, fontSize: 12, color: "text.secondary" }}>
                  {copy.draftSaved}:{" "}
                  {new Date(lastDraftSavedAt).toLocaleString(
                    locale === "it" ? "it-IT" : "en-GB",
                  )}
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
                {copy.back}
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
                  {saving ? copy.saving : copy.createWorkspace}
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
                  {copy.nextStep}
                </Button>
              )}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
