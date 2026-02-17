export const AI_TONE_OF_VOICE_VALUES = [
  "professional",
  "academic",
  "conversational",
  "technical",
] as const;

export type AiToneOfVoice = (typeof AI_TONE_OF_VOICE_VALUES)[number];

export type AiToneOption = Readonly<{
  value: AiToneOfVoice;
  label: string;
  description: string;
}>;

export const DEFAULT_AI_TONE_OF_VOICE: AiToneOfVoice = "professional";

export const AI_TONE_OPTIONS: ReadonlyArray<AiToneOption> = [
  {
    value: "professional",
    label: "Professional",
    description: "Clear, business-ready, and investor-friendly wording.",
  },
  {
    value: "academic",
    label: "Academic",
    description: "Formal, analytical style with structured reasoning.",
  },
  {
    value: "conversational",
    label: "Conversational",
    description: "Natural, approachable tone with plain language.",
  },
  {
    value: "technical",
    label: "Technical",
    description: "Precise, domain-specific language with concrete detail.",
  },
];

const AI_TONE_LABELS: Record<AiToneOfVoice, string> = {
  professional: "Professional",
  academic: "Academic",
  conversational: "Conversational",
  technical: "Technical",
};

const AI_TONE_INSTRUCTIONS: Record<AiToneOfVoice, string> = {
  professional:
    "Use a professional business tone: concise, credible, and investor-ready.",
  academic:
    "Use an academic tone: formal, analytical, and evidence-oriented.",
  conversational:
    "Use a conversational tone: natural, friendly, and easy to understand.",
  technical:
    "Use a technical tone: precise terminology, concrete detail, and implementation clarity.",
};

const AI_TONE_SET = new Set<string>(AI_TONE_OF_VOICE_VALUES);

export const normalizeAiToneOfVoice = (value: unknown): AiToneOfVoice => {
  if (typeof value !== "string") {
    return DEFAULT_AI_TONE_OF_VOICE;
  }

  const normalized = value.trim().toLowerCase();
  if (!AI_TONE_SET.has(normalized)) {
    return DEFAULT_AI_TONE_OF_VOICE;
  }

  return normalized as AiToneOfVoice;
};

export const readAiToneFromRawFormData = (
  rawFormData: Record<string, unknown> | null | undefined,
): AiToneOfVoice => {
  if (!rawFormData) {
    return DEFAULT_AI_TONE_OF_VOICE;
  }

  const preferredTone =
    typeof rawFormData.aiToneOfVoice === "string"
      ? rawFormData.aiToneOfVoice
      : typeof rawFormData.toneOfVoice === "string"
        ? rawFormData.toneOfVoice
        : "";

  return normalizeAiToneOfVoice(preferredTone);
};

export const hasStoredAiToneInRawFormData = (
  rawFormData: Record<string, unknown> | null | undefined,
): boolean => {
  if (!rawFormData) return false;
  return (
    typeof rawFormData.aiToneOfVoice === "string" ||
    typeof rawFormData.toneOfVoice === "string"
  );
};

export const getAiToneLabel = (tone: AiToneOfVoice): string =>
  AI_TONE_LABELS[tone] ?? AI_TONE_LABELS[DEFAULT_AI_TONE_OF_VOICE];

export const getAiToneInstruction = (tone: AiToneOfVoice): string => {
  const instruction =
    AI_TONE_INSTRUCTIONS[tone] ??
    AI_TONE_INSTRUCTIONS[DEFAULT_AI_TONE_OF_VOICE];

  return `Tone of voice requirement: ${instruction}`;
};
