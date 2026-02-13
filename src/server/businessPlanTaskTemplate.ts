type DefaultTaskTemplateNode = {
  title: string;
  instructions: string;
  aiPrompt: string;
  children: Array<{
    title: string;
    instructions: string;
    aiPrompt: string;
  }>;
};

export const DEFAULT_BUSINESS_PLAN_TASK_TEMPLATE: DefaultTaskTemplateNode[] = [
  {
    title: "Business Fundamentals",
    instructions:
      "Define who you are and what you do.\nClarify the core problem and your unique solution.\nSet the foundation for all sections that follow.",
    aiPrompt:
      "Draft a concise Business Fundamentals chapter that introduces the company, problem, and solution in a credible investor-ready style.",
    children: [
      {
        title: "Company Snapshot",
        instructions:
          "Describe legal/business identity, mission, and current stage.\nState what has been built so far and key milestones.\nKeep it specific and factual.",
        aiPrompt:
          "Generate a Company Snapshot with mission, stage, and traction signals using available workspace context.",
      },
      {
        title: "Problem and Opportunity",
        instructions:
          "Explain the customer pain and why it matters now.\nQuantify impact where possible.\nShow why current alternatives are insufficient.",
        aiPrompt:
          "Write a Problem and Opportunity section that defines pain points, urgency, and market gap.",
      },
      {
        title: "Solution and Value Proposition",
        instructions:
          "Describe your offering and what makes it distinct.\nExplain customer outcomes and benefits.\nLink directly to the stated problem.",
        aiPrompt:
          "Create a Solution and Value Proposition section with clear differentiation and customer value.",
      },
    ],
  },
  {
    title: "Market & Competitive Advantage",
    instructions:
      "Map market size, target segments, and competitive landscape.\nShow the strategic advantage that can be defended.\nUse realistic assumptions and avoid inflated claims.",
    aiPrompt:
      "Produce a Market & Competitive Advantage chapter covering market scope, target customers, and positioning.",
    children: [
      {
        title: "Target Market and Segmentation",
        instructions:
          "Define ideal customers, segments, and geography.\nPrioritize early adopter segment first.\nInclude brief sizing assumptions.",
        aiPrompt:
          "Draft target market segmentation with primary customer profile and geographic focus.",
      },
      {
        title: "Competitive Landscape",
        instructions:
          "List direct and indirect alternatives.\nCompare by key dimensions customers care about.\nIdentify gaps where your offer wins.",
        aiPrompt:
          "Write a competitive landscape analysis with clear comparison and differentiation points.",
      },
      {
        title: "Defensible Advantage",
        instructions:
          "Describe moats: data, distribution, product, brand, or partnerships.\nExplain why advantage can compound over time.\nBe explicit about risks and dependencies.",
        aiPrompt:
          "Generate a defensible advantage section that explains durable differentiation and execution risks.",
      },
    ],
  },
  {
    title: "Business Model Canvas",
    instructions:
      "Summarize how the business creates, delivers, and captures value.\nAlign channel, revenue, and cost logic.\nKeep it consistent with market and product assumptions.",
    aiPrompt:
      "Create a Business Model Canvas chapter that explains value creation and economic logic.",
    children: [
      {
        title: "Customer, Channels, and Relationships",
        instructions:
          "Define customer segments and acquisition channels.\nExplain onboarding and retention mechanics.\nLink channels to customer behavior.",
        aiPrompt:
          "Draft customer, channels, and relationships with practical go-to-market mechanics.",
      },
      {
        title: "Revenue Streams",
        instructions:
          "Explain monetization model and pricing logic.\nInclude primary and secondary revenue streams.\nState expected payment and contract dynamics.",
        aiPrompt:
          "Generate a Revenue Streams section with pricing model, expected ARPU, and monetization rationale.",
      },
      {
        title: "Cost Structure and Key Resources",
        instructions:
          "Identify major cost drivers and required resources.\nMention key partners and operational dependencies.\nShow how scale impacts costs.",
        aiPrompt:
          "Write cost structure and key resources with realistic cost drivers and partner dependencies.",
      },
    ],
  },
  {
    title: "Go-to-Market",
    instructions:
      "Define how the product reaches customers and scales.\nSet near-term execution plan with measurable milestones.\nClarify sales and marketing responsibilities.",
    aiPrompt:
      "Draft a Go-to-Market chapter with channel strategy, launch plan, and execution priorities.",
    children: [
      {
        title: "Acquisition Strategy",
        instructions:
          "Specify top acquisition channels and hypotheses.\nInclude messaging angle and conversion assumptions.\nPrioritize channels by expected efficiency.",
        aiPrompt:
          "Generate an acquisition strategy section with prioritized channels and expected conversion logic.",
      },
      {
        title: "Sales Process and Partnerships",
        instructions:
          "Describe funnel stages and sales cycle.\nIdentify partnerships that accelerate distribution.\nExplain ownership across team roles.",
        aiPrompt:
          "Write sales process and partnership strategy, including funnel stages and role ownership.",
      },
      {
        title: "Execution Roadmap",
        instructions:
          "Define 90-day and 12-month milestones.\nInclude deliverables, owners, and success criteria.\nKeep roadmap realistic and sequenced.",
        aiPrompt:
          "Create a practical execution roadmap with milestones, owners, and measurable outcomes.",
      },
    ],
  },
  {
    title: "Metrics & Economic-Financial Analysis",
    instructions:
      "State measurable KPIs and core financial assumptions.\nConnect unit economics to growth expectations.\nHighlight risks and mitigation actions.",
    aiPrompt:
      "Produce a Metrics & Economic-Financial Analysis chapter with KPIs, unit economics, and financial assumptions.",
    children: [
      {
        title: "Core KPIs",
        instructions:
          "Select KPIs for acquisition, activation, retention, and revenue.\nDefine target ranges and review cadence.\nFocus on actionable indicators.",
        aiPrompt:
          "Draft the KPI framework with definitions, targets, and reporting cadence.",
      },
      {
        title: "Unit Economics and Forecast",
        instructions:
          "Outline revenue, costs, and contribution margin assumptions.\nProvide a 3-year directional forecast narrative.\nState major sensitivity drivers.",
        aiPrompt:
          "Write unit economics and forecast narrative with assumptions, margins, and sensitivity factors.",
      },
      {
        title: "Risks and Mitigation",
        instructions:
          "List key strategic, operational, and financial risks.\nPair each risk with mitigation actions.\nPrioritize by impact and likelihood.",
        aiPrompt:
          "Generate a risks and mitigation section with prioritized risk matrix and mitigation plan.",
      },
    ],
  },
  {
    title: "Pitch",
    instructions:
      "Convert plan insights into investor-facing narrative.\nEnsure clarity, brevity, and a coherent story arc.\nKeep claims aligned with evidence from previous sections.",
    aiPrompt:
      "Create a Pitch chapter that summarizes the startup story for investor communication.",
    children: [
      {
        title: "Narrative and Positioning",
        instructions:
          "Define the one-line positioning statement.\nSummarize problem, solution, and why now.\nKeep tone persuasive but realistic.",
        aiPrompt:
          "Draft pitch narrative and positioning with a strong, concise investor storyline.",
      },
      {
        title: "Traction, Team, and Ask",
        instructions:
          "Highlight traction and execution credibility.\nIntroduce team strengths tied to strategy.\nState funding ask and intended use of funds.",
        aiPrompt:
          "Generate traction, team, and funding ask content aligned with available workspace information.",
      },
      {
        title: "Pitch Readiness Checklist",
        instructions:
          "List what must be validated before presenting.\nInclude data quality, consistency, and assumptions checks.\nEnsure all key questions are pre-answered.",
        aiPrompt:
          "Create a concise pitch readiness checklist covering narrative coherence and data-backed credibility.",
      },
    ],
  },
];
