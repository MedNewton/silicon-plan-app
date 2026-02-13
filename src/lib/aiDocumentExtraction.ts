import * as XLSX from "xlsx";

const MAX_EXTRACTED_CHARS = 5000;

const TEXT_FILE_TYPES = new Set([
  "txt",
  "md",
  "json",
  "csv",
  "xml",
  "html",
]);

const SPREADSHEET_FILE_TYPES = new Set(["xls", "xlsx"]);

const truncate = (value: string, max: number): string =>
  value.length > max ? `${value.slice(0, max)}...` : value;

const normalizeCell = (value: unknown): string => {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return "";
};

const extractSpreadsheetText = (buffer: ArrayBuffer): {
  text: string;
  sheetNames: string[];
} => {
  const workbook = XLSX.read(buffer, {
    type: "array",
    cellDates: true,
    dense: true,
  });

  const selectedSheets = workbook.SheetNames.slice(0, 3);
  const parts: string[] = [];

  selectedSheets.forEach((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) return;

    const rows = XLSX.utils.sheet_to_json<Array<unknown>>(worksheet, {
      header: 1,
      defval: "",
      blankrows: false,
    });

    if (rows.length === 0) {
      parts.push(`Sheet: ${sheetName} (empty)`);
      return;
    }

    const rowLines = rows.slice(0, 40).map((row) =>
      row
        .slice(0, 15)
        .map((cell) => normalizeCell(cell))
        .filter((cell) => cell.length > 0)
        .join(" | "),
    );

    const cleanLines = rowLines.filter((line) => line.length > 0);
    if (cleanLines.length === 0) {
      parts.push(`Sheet: ${sheetName} (no textual data)`);
      return;
    }

    parts.push(`Sheet: ${sheetName}`);
    parts.push(...cleanLines);
  });

  return {
    text: truncate(parts.join("\n"), MAX_EXTRACTED_CHARS),
    sheetNames: selectedSheets,
  };
};

export const extractAiDocumentText = async (
  file: File,
  fileType: string | null,
): Promise<{
  extractedText: string | null;
  metadata: Record<string, unknown>;
}> => {
  const normalizedType = fileType?.toLowerCase() ?? "";

  if (TEXT_FILE_TYPES.has(normalizedType)) {
    const text = truncate((await file.text()).trim(), MAX_EXTRACTED_CHARS);

    return {
      extractedText: text || null,
      metadata: {
        extractionStatus: text ? "extracted" : "empty",
        extractionSource: "text",
      },
    };
  }

  if (SPREADSHEET_FILE_TYPES.has(normalizedType)) {
    const buffer = await file.arrayBuffer();
    const { text, sheetNames } = extractSpreadsheetText(buffer);

    return {
      extractedText: text || null,
      metadata: {
        extractionStatus: text ? "extracted" : "empty",
        extractionSource: "spreadsheet",
        sheetNames,
      },
    };
  }

  return {
    extractedText: null,
    metadata: {
      extractionStatus: "not_supported",
      extractionSource: "none",
    },
  };
};

export const isSupportedAiLibraryExtension = (ext: string): boolean => {
  const normalized = ext.toLowerCase();
  return [
    "pdf",
    "txt",
    "doc",
    "docx",
    "ppt",
    "pptx",
    "xls",
    "xlsx",
    "csv",
    "md",
    "json",
    "xml",
    "html",
  ].includes(normalized);
};
