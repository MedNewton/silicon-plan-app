/** Italian translations for business plan task/chapter titles */
export const TASK_TITLE_IT: Record<string, string> = {
  "Executive Summary": "Sommario Esecutivo",
  "Business Overview": "Panoramica dell'Azienda",
  "Market Opportunity": "Opportunita di Mercato",
  "Financial Highlights": "Sintesi Finanziaria",
  "Business Fundamentals": "Fondamenti del Business",
  "The Business Idea": "L'Idea di Business",
  "The Problem to Solve": "Il Problema da Risolvere",
  "The Relevance of the Problem": "La Rilevanza del Problema",
  "Description of the Solution": "Descrizione della Soluzione",
  "The Team": "Il Team",
  "Mission and Vision": "Missione e Visione",
  "Market and Competitive Advantage": "Mercato e Vantaggio Competitivo",
  "Market Needs": "Bisogni del Mercato",
  "TAM SAM SOM Analysis": "Analisi TAM SAM SOM",
  "Market Segmentation": "Segmentazione del Mercato",
  "Competitor Analysis": "Analisi dei Concorrenti",
  "Primary and Secondary Market Research": "Ricerca di Mercato Primaria e Secondaria",
  "Problem-Solution Fit": "Problem-Solution Fit",
  "Point of Difference": "Punto di Differenziazione",
  "Business Model Canvas": "Business Model Canvas",
  "Target Customer": "Cliente Target",
  "Value Proposition": "Proposta di Valore",
  Channels: "Canali",
  "Customer Relationships": "Relazioni con i Clienti",
  "Key Activities": "Attivita Chiave",
  "Key Resources": "Risorse Chiave",
  "Key Partners": "Partner Chiave",
  "Revenue Streams": "Flussi di Ricavi",
  "Cost Structure": "Struttura dei Costi",
  "Go-to-Market Strategy": "Strategia Go-to-Market",
  "Marketing Objectives": "Obiettivi di Marketing",
  "Minimum Viable Product (MVP)": "Prodotto Minimo Funzionante (MVP)",
  "Price Point": "Punto di Prezzo",
  "Customer Engagement": "Coinvolgimento del Cliente",
  Promotion: "Promozione",
  Distribution: "Distribuzione",
  "Metrics and Economic-Financial Analysis": "Metriche e Analisi Economico-Finanziaria",
  "Revenue Estimate": "Stima dei Ricavi",
  "Cost Estimate": "Stima dei Costi",
  "Customer Acquisition Cost (COCA)": "Costo di Acquisizione Cliente (COCA)",
  "Customer Lifetime Value (LTV)": "Valore del Ciclo di Vita del Cliente (LTV)",
  "Economic-Financial Plan": "Piano Economico-Finanziario",
  "Pre-money Valuation": "Valutazione Pre-money",
  Pitch: "Pitch",
  "Pitch Deck (12 sections)": "Pitch Deck (12 sezioni)",
  "Ask (funding or partnership)": "Richiesta (finanziamento o partnership)",
};

/**
 * Translate a task/chapter title to the given locale.
 * Falls back to the original title if no translation exists.
 */
export const translateTaskTitle = (title: string, locale?: string): string => {
  if (locale === "it") {
    return TASK_TITLE_IT[title] ?? title;
  }
  return title;
};
