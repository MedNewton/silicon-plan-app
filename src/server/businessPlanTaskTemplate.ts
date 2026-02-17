// src/server/businessPlanTaskTemplate.ts
/**
 * Default Business Plan Task Template
 * Structure aligned with the client feedback document section 5.1.
 *
 * BPTS-002: full 6-chapter structure with requested subsections.
 * BPTS-004: section-specific AI prompts for core templates.
 */

type DefaultTaskTemplateChild = {
  title: string;
  instructions: string;
  aiPrompt: string;
};

type DefaultTaskTemplateNode = {
  title: string;
  instructions: string;
  aiPrompt: string;
  children: DefaultTaskTemplateChild[];
};

export const MIN_TEMPLATE_INSTRUCTION_LINES = 3;

const getMeaningfulInstructionLines = (instructions: string): string[] =>
  instructions
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

const assertInstructionQuality = (params: {
  taskPath: string;
  instructions: string;
}): void => {
  const { taskPath, instructions } = params;
  const lineCount = getMeaningfulInstructionLines(instructions).length;
  if (lineCount < MIN_TEMPLATE_INSTRUCTION_LINES) {
    throw new Error(
      `[BPTS-003] Task template "${taskPath}" has ${lineCount} instruction lines; minimum required is ${MIN_TEMPLATE_INSTRUCTION_LINES}.`
    );
  }
};

export const validateDefaultBusinessPlanTaskTemplateInstructions = (): {
  validatedTaskCount: number;
  minInstructionLines: number;
} => {
  let validatedTaskCount = 0;

  for (const h1Task of DEFAULT_BUSINESS_PLAN_TASK_TEMPLATE) {
    assertInstructionQuality({
      taskPath: h1Task.title,
      instructions: h1Task.instructions,
    });
    validatedTaskCount += 1;

    for (const h2Task of h1Task.children) {
      assertInstructionQuality({
        taskPath: `${h1Task.title} > ${h2Task.title}`,
        instructions: h2Task.instructions,
      });
      validatedTaskCount += 1;
    }
  }

  return {
    validatedTaskCount,
    minInstructionLines: MIN_TEMPLATE_INSTRUCTION_LINES,
  };
};

export const DEFAULT_BUSINESS_PLAN_TASK_TEMPLATE: DefaultTaskTemplateNode[] = [
  {
    title: "Business Fundamentals",
    instructions:
      "Define what the company is building, for whom, and why now.\nSet clear foundations that make the following chapters coherent.\nUse concrete context, not generic statements.",
    aiPrompt:
      "Draft the Business Fundamentals chapter using available workspace context. Cover: The Business Idea, The Problem to Solve, The Relevance of the Problem, Description of the Solution, The Team, Mission and Vision. Keep tone credible and investor-ready.",
    children: [
      {
        title: "The Business Idea",
        instructions:
          "Explain clearly what is being offered and who the target customer is.\nDescribe the sector and the concrete benefit delivered to the customer.\nIf innovation is claimed, state exactly what is new and why it matters.",
        aiPrompt:
          "Write the 'Business Idea' section explaining what the company offers, who it targets, which sector it operates in, and what benefits it generates. Use {company_description}, {product_type}, {industry_macro}, {market_geo}. Keep it clear and credible (250-350 words). If details are missing, formulate hypotheses and declare them.",
      },
      {
        title: "The Problem to Solve",
        instructions:
          "Describe the specific pain point and who experiences it.\nExplain why current alternatives are insufficient.\nQuantify impact where possible.",
        aiPrompt:
          "Generate 'The Problem to Solve' with a clear pain definition, affected customers, current workarounds, and why existing options fail. Use {problem_solved}, {target_market}, and available context.",
      },
      {
        title: "The Relevance of the Problem",
        instructions:
          "Explain why this problem is especially relevant now.\nMention timing drivers such as regulation, technology, or behavior shifts.\nConnect urgency to market opportunity.",
        aiPrompt:
          "Write 'The Relevance of the Problem' explaining why solving this issue is timely now. Include 2-3 concrete timing drivers and relate them to {industry_macro} and {market_geo}.",
      },
      {
        title: "Description of the Solution",
        instructions:
          "Describe how the solution works in practical terms.\nHighlight the key features and customer outcomes.\nClarify differentiation versus alternatives.",
        aiPrompt:
          "Generate 'Description of the Solution' with solution overview, operating logic, key features, customer outcomes, and differentiation. Use {unique_solution}, {product_type}, and {sales_channel}.",
      },
      {
        title: "The Team",
        instructions:
          "Present the team roles and relevant experience.\nShow why the team is credible for execution.\nIf gaps exist, state the hiring/partnering plan.",
        aiPrompt:
          "Write 'The Team' section with role-to-responsibility mapping, relevant background, execution strengths, and current capability gaps. Use {team_size} and any team context available.",
      },
      {
        title: "Mission and Vision",
        instructions:
          "Define mission (what and why) and vision (long-term direction).\nKeep mission actionable and vision aspirational but realistic.\nLink both statements to the problem and solution.",
        aiPrompt:
          "Generate 'Mission and Vision' with concise mission statement, vision statement, and a short impact paragraph. Ensure alignment with {company_description}, {problem_solved}, and {unique_solution}.",
      },
    ],
  },
  {
    title: "Market and Competitive Advantage",
    instructions:
      "Demonstrate market understanding with realistic sizing and segment logic.\nShow competition clearly and explain why this venture can win.\nSupport key claims with explicit assumptions.",
    aiPrompt:
      "Draft the Market and Competitive Advantage chapter. Cover: Market Needs, TAM SAM SOM Analysis, Market Segmentation, Competitor Analysis, Primary and Secondary Market Research, Problem-Solution Fit, Point of Difference.",
    children: [
      {
        title: "Market Needs",
        instructions:
          "Describe the broader market demand behind the opportunity.\nExplain unmet needs and changing customer expectations.\nConnect those needs to your specific solution.",
        aiPrompt:
          "Write 'Market Needs' by analyzing the demand context, unmet needs, and relevant trends. Use {industry_macro}, {problem_solved}, and {target_market}.",
      },
      {
        title: "TAM SAM SOM Analysis",
        instructions:
          "Show how big the market is and what share is realistically reachable.\nExplain assumptions and calculation method transparently.\nUse both strategic narrative and concrete numbers/table format.",
        aiPrompt:
          "Generate 'TAM SAM SOM Analysis'. If the user does not provide numbers, propose top-down and bottom-up methods and a table to fill in. If numbers are provided, ensure definitions and calculations are consistent. Use {industry_macro}, {target_market}, {market_geo}, and {ateco_code} when available.",
      },
      {
        title: "Market Segmentation",
        instructions:
          "Break the market into actionable customer segments.\nDefine the primary beachhead segment and why it comes first.\nExplain differences in needs, price sensitivity, and acquisition complexity.",
        aiPrompt:
          "Write 'Market Segmentation' with 2-4 concrete segments, prioritization rationale, and beachhead focus. Use {target_market}, {product_type}, and {sales_channel}.",
      },
      {
        title: "Competitor Analysis",
        instructions:
          "Identify direct and indirect competitors.\nCompare alternatives on customer-relevant dimensions.\nBe realistic about competitor strengths and define your response.",
        aiPrompt:
          "Generate 'Competitor Analysis' including competitor set, comparison matrix, and strategic positioning summary. Use {industry_macro}, {problem_solved}, and {unique_solution}.",
      },
      {
        title: "Primary and Secondary Market Research",
        instructions:
          "Summarize what has been validated through direct customer contact.\nAdd supporting evidence from reports and external sources.\nState what is validated versus what is still a hypothesis.",
        aiPrompt:
          "Write 'Primary and Secondary Market Research' with methods, key findings, validated assumptions, and open questions. If evidence is missing, provide a practical research plan template.",
      },
      {
        title: "Problem-Solution Fit",
        instructions:
          "Demonstrate that the solution addresses the stated problem effectively.\nReference traction, pilot, interviews, or tests where possible.\nIf pre-traction, define measurable validation milestones.",
        aiPrompt:
          "Generate 'Problem-Solution Fit' showing evidence of fit, current confidence level, and remaining validation steps. Use {problem_solved}, {unique_solution}, and available traction context.",
      },
      {
        title: "Point of Difference",
        instructions:
          "Clarify what creates sustainable competitive advantage.\nFocus on defensible elements, not generic feature claims.\nExplain risks to the advantage and mitigation actions.",
        aiPrompt:
          "Write 'Point of Difference' explaining key differentiators, defensibility over time, and threats to the moat. Use {unique_solution} and competitor context.",
      },
    ],
  },
  {
    title: "Business Model Canvas",
    instructions:
      "Describe how the business creates, delivers, and captures value.\nCover all nine canvas blocks with internal consistency.\nEnsure channels, economics, and operations align logically.",
    aiPrompt:
      "Draft the Business Model Canvas chapter using the nine blocks: Target Customer, Value Proposition, Channels, Customer Relationships, Key Activities, Key Resources, Key Partners, Revenue Streams, Cost Structure.",
    children: [
      {
        title: "Target Customer",
        instructions:
          "Define the ideal customer profile and practical buying context.\nInclude needs, triggers, and decision behavior.\nPrioritize who is targeted first.",
        aiPrompt:
          "Write 'Target Customer' with clear profiles/personas, core needs, buying triggers, and primary segment priority. Use {target_market} and {problem_solved}.",
      },
      {
        title: "Value Proposition",
        instructions:
          "State the concrete outcomes customers receive.\nLink value directly to customer pain and desired gains.\nKeep language customer-centric and measurable where possible.",
        aiPrompt:
          "Generate 'Value Proposition' with pain relievers, gain creators, and clear outcome-based differentiation. Use {unique_solution} and problem context.",
      },
      {
        title: "Channels",
        instructions:
          "Explain acquisition channels and delivery channels.\nShow why channel choices fit customer behavior.\nInclude channel priority and expected economics.",
        aiPrompt:
          "Write 'Channels' including acquisition approach, delivery flow, channel priorities, and rationale. Use {sales_channel}, {target_market}, and product context.",
      },
      {
        title: "Customer Relationships",
        instructions:
          "Describe interaction model across acquisition, onboarding, and retention.\nDefine support and engagement mechanisms.\nExplain impact on retention and lifetime value.",
        aiPrompt:
          "Generate 'Customer Relationships' covering lifecycle interactions, engagement model, retention approach, and support strategy.",
      },
      {
        title: "Key Activities",
        instructions:
          "List mission-critical activities that make the model work.\nPrioritize activities linked to value delivery and differentiation.\nKeep the list actionable and specific.",
        aiPrompt:
          "Write 'Key Activities' with categorized core activities and why each is essential for value delivery and execution.",
      },
      {
        title: "Key Resources",
        instructions:
          "Identify critical physical, intellectual, human, and financial resources.\nExplain current status and any major resource gaps.\nHighlight resources that create defensibility.",
        aiPrompt:
          "Generate 'Key Resources' with resource categories, current readiness, major gaps, and build/acquisition plan.",
      },
      {
        title: "Key Partners",
        instructions:
          "List strategic partners and their role in delivery or scale.\nExplain dependency level and value of each partnership.\nMention fallback options for high-risk dependencies.",
        aiPrompt:
          "Write 'Key Partners' covering partner types, value contribution, dependency risks, and alternatives.",
      },
      {
        title: "Revenue Streams",
        instructions:
          "Describe how revenue is generated and priced.\nSeparate primary versus secondary revenue streams.\nShow pricing logic versus value delivered.",
        aiPrompt:
          "Generate 'Revenue Streams' including monetization model(s), pricing logic, expected contribution split, and near-term evolution assumptions.",
      },
      {
        title: "Cost Structure",
        instructions:
          "Break down fixed and variable costs.\nIdentify dominant cost drivers and scaling behavior.\nRelate costs to the operating model and margin potential.",
        aiPrompt:
          "Write 'Cost Structure' with key cost categories, main cost drivers, scaling effects, and implications for unit economics.",
      },
    ],
  },
  {
    title: "Go-to-Market Strategy",
    instructions:
      "Translate strategy into concrete customer acquisition and growth execution.\nInclude clear goals, launch priorities, and tactical plan.\nMake scope realistic for current stage and resources.",
    aiPrompt:
      "Draft the Go-to-Market Strategy chapter. Cover: Marketing Objectives, Minimum Viable Product (MVP), Price Point, Customer Engagement, Promotion, Distribution.",
    children: [
      {
        title: "Marketing Objectives",
        instructions:
          "Define measurable objectives by awareness, acquisition, conversion, and retention.\nSet timelines and baseline assumptions.\nKeep targets realistic for the current stage.",
        aiPrompt:
          "Generate 'Marketing Objectives' with SMART targets, measurement method, timeline, and business alignment.",
      },
      {
        title: "Minimum Viable Product (MVP)",
        instructions:
          "Define what is in scope for the first testable release.\nExplain what is intentionally excluded and why.\nSpecify learning goals and success criteria.",
        aiPrompt:
          "Write 'Minimum Viable Product (MVP)' including scope, exclusions, target users, launch criteria, and iteration plan.",
      },
      {
        title: "Price Point",
        instructions:
          "Explain pricing model and willingness-to-pay logic.\nReference competitor pricing and value delivered.\nDescribe planned price evolution if relevant.",
        aiPrompt:
          "Generate 'Price Point' with pricing model rationale, benchmark context, and expected price evolution by stage.",
      },
      {
        title: "Customer Engagement",
        instructions:
          "Describe how users are onboarded, activated, and retained.\nDefine engagement loops and lifecycle touchpoints.\nLink engagement strategy to retention and referrals.",
        aiPrompt:
          "Write 'Customer Engagement' with onboarding flow, engagement levers, retention tactics, and lifecycle checkpoints.",
      },
      {
        title: "Promotion",
        instructions:
          "Define promotional tactics and campaign priorities.\nAssign channels to each funnel objective.\nInclude expected KPIs and budget discipline.",
        aiPrompt:
          "Generate 'Promotion' plan with campaign mix, channel-to-objective mapping, and core KPI framework.",
      },
      {
        title: "Distribution",
        instructions:
          "Explain how the product/service reaches customers operationally.\nInclude direct and partner-based distribution paths.\nDescribe rollout sequencing and constraints.",
        aiPrompt:
          "Write 'Distribution' covering delivery model, channel mix, rollout phases, and operational constraints/mitigation.",
      },
    ],
  },
  {
    title: "Metrics and Economic-Financial Analysis",
    instructions:
      "Define the metrics and financial logic that support business sustainability.\nInclude revenue, cost, unit economics, and valuation perspective.\nMake assumptions explicit and testable.",
    aiPrompt:
      "Draft the Metrics and Economic-Financial Analysis chapter. Cover: Revenue Estimate, Cost Estimate, Customer Acquisition Cost (COCA), Customer Lifetime Value (LTV), Economic-Financial Plan, Pre-money Valuation.",
    children: [
      {
        title: "Revenue Estimate",
        instructions:
          "Estimate near-term and medium-term revenue with stated assumptions.\nConnect projections to customer, pricing, and conversion logic.\nSeparate base case and conservative case if useful.",
        aiPrompt:
          "Generate 'Revenue Estimate' with assumptions, simple projection view, scenario notes, and sensitivity drivers.",
      },
      {
        title: "Cost Estimate",
        instructions:
          "Estimate operating costs with fixed and variable split.\nHighlight major cost assumptions and timing.\nConnect costs to planned growth and capacity.",
        aiPrompt:
          "Write 'Cost Estimate' including fixed/variable categories, key assumptions, expected trend over time, and cost pressure points.",
      },
      {
        title: "Customer Acquisition Cost (COCA)",
        instructions:
          "Explain COCA (CAC) as sales+marketing spend divided by new customers.\nUse available data or explicit assumptions when data is missing.\nInterpret sustainability and show improvement levers over time.",
        aiPrompt:
          "Calculate and explain COCA. If data is missing, provide formula, example, and a fill-in table (expense, period, new customers, COCA). Suggest 3 levers to reduce COCA over time.",
      },
      {
        title: "Customer Lifetime Value (LTV)",
        instructions:
          "Estimate customer value across the expected relationship duration.\nState retention/churn and margin assumptions clearly.\nRelate LTV to acquisition cost and model health.",
        aiPrompt:
          "Generate 'Customer Lifetime Value (LTV)' with formula, assumptions, example calculation, and interpretation. Include a short LTV/COCA health comment.",
      },
      {
        title: "Economic-Financial Plan",
        instructions:
          "Summarize expected economic and financial trajectory.\nCover key statements at an appropriate startup level of detail.\nHighlight break-even expectations and key risks.",
        aiPrompt:
          "Write 'Economic-Financial Plan' with high-level P&L logic, cash needs, break-even view, and major financial risks/mitigations.",
      },
      {
        title: "Pre-money Valuation",
        instructions:
          "Provide a reasoned pre-money valuation approach.\nState method used and core assumptions transparently.\nTie valuation logic to stage, traction, and comparable context.",
        aiPrompt:
          "Generate 'Pre-money Valuation' with valuation method options, selected approach rationale, assumption table, and caveats. Use {industry_macro}, {ateco_code}, and traction context when available.",
      },
    ],
  },
  {
    title: "Pitch",
    instructions:
      "Convert plan content into investor-facing narrative and ask.\nKeep messages concise, coherent, and evidence-backed.\nEnsure numbers and claims match previous chapters.",
    aiPrompt:
      "Draft the Pitch chapter. Cover: Pitch Deck (12 sections), Financial Highlights, Ask (funding or partnership). Keep narrative concise and investor-ready.",
    children: [
      {
        title: "Pitch Deck (12 sections)",
        instructions:
          "Prepare content that maps to the 12 required pitch sections.\nKeep a coherent storyline from problem to ask.\nAvoid requesting already-known data from workspace context.",
        aiPrompt:
          "Generate 'Pitch Deck (12 sections)' content outline covering: Problem, Solution, Product, TAM SAM SOM Market, Business Model, Traction, Competitors, Go-to-Market, Financial Forecast, Team, Ask, and closing narrative.",
      },
      {
        title: "Financial Highlights",
        instructions:
          "Summarize only the most decision-relevant financial points.\nFocus on growth, margin logic, and runway/funding implications.\nKeep it concise and board/investor readable.",
        aiPrompt:
          "Write 'Financial Highlights' with key metrics, growth view, unit economics snapshot, and short risk note.",
      },
      {
        title: "Ask (funding or partnership)",
        instructions:
          "State exactly what is being requested and why.\nExplain use of funds or partnership value clearly.\nDefine expected milestones tied to the ask.",
        aiPrompt:
          "Generate 'Ask (funding or partnership)' with amount/request scope, allocation plan, timeline, and milestone outcomes expected from the request.",
      },
    ],
  },
];
