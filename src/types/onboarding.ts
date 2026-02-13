export type OnboardingStepId =
  | "workspace_name"
  | "business_name"
  | "operation_and_purpose"
  | "industry_selection"
  | "company_stage_and_ateco"
  | "problem_target"
  | "problem_details"
  | "solution_uniqueness"
  | "offering_and_channel"
  | "market_and_team_size"
  | "team_roles"
  | "financial_execution";

export type OnboardingStepDefinition = {
  id: OnboardingStepId;
  title: string;
  subtitle: string;
};

export type WorkspaceOnboardingData = {
  workspaceName: string;
  businessName: string;
  isOperating: "" | "yes" | "no";
  businessPlanPurpose: string;

  industryOption: string;
  industryCustom: string;
  companyStageOption: string;
  companyStageCustom: string;

  atecoCode: string;
  atecoDescription: string;

  problemShortOption: string;
  problemShortCustom: string;
  problemLong: string;
  solutionAndUniqueness: string;

  productOrService: string;
  salesChannel: string;
  targetMarket: string;
  teamSize: string;
  teamAndRoles: string;

  financialProjections: string;
  risksAndMitigation: string;
  successMetrics: string;
  growthPartnerships: string;
};

export const ONBOARDING_STEP_DEFINITIONS: OnboardingStepDefinition[] = [
  {
    id: "workspace_name",
    title: "Workspace Name",
    subtitle: "Set the business/workspace name used in planning",
  },
  {
    id: "business_name",
    title: "Business Name",
    subtitle: "Set the business name used across your plan",
  },
  {
    id: "operation_and_purpose",
    title: "Operation & Purpose",
    subtitle: "Define operating status and planning objective",
  },
  {
    id: "industry_selection",
    title: "Industry",
    subtitle: "Select your macro industry or provide a custom one",
  },
  {
    id: "company_stage_and_ateco",
    title: "Stage & ATECO",
    subtitle: "Set company maturity stage and optional ATECO details",
  },
  {
    id: "problem_target",
    title: "Problem Target",
    subtitle: "Identify who you serve and what broad issue you address",
  },
  {
    id: "problem_details",
    title: "Problem Details",
    subtitle: "Describe the problem context with practical detail",
  },
  {
    id: "solution_uniqueness",
    title: "Solution",
    subtitle: "Explain your solution and what makes it different",
  },
  {
    id: "offering_and_channel",
    title: "Offering & Channels",
    subtitle: "Describe product/service and how you sell it",
  },
  {
    id: "market_and_team_size",
    title: "Market & Team Size",
    subtitle: "Define target market and current team size",
  },
  {
    id: "team_roles",
    title: "Team Roles",
    subtitle: "Clarify team composition and responsibilities",
  },
  {
    id: "financial_execution",
    title: "Financial & Execution",
    subtitle: "Capture projections, risks, KPIs, and growth partnerships",
  },
];

export const INITIAL_ONBOARDING_DATA: WorkspaceOnboardingData = {
  workspaceName: "",
  businessName: "",
  isOperating: "",
  businessPlanPurpose: "",

  industryOption: "",
  industryCustom: "",
  companyStageOption: "",
  companyStageCustom: "",

  atecoCode: "",
  atecoDescription: "",

  problemShortOption: "",
  problemShortCustom: "",
  problemLong: "",
  solutionAndUniqueness: "",

  productOrService: "",
  salesChannel: "",
  targetMarket: "",
  teamSize: "",
  teamAndRoles: "",

  financialProjections: "",
  risksAndMitigation: "",
  successMetrics: "",
  growthPartnerships: "",
};
