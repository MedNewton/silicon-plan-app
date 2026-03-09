// src/components/onboarding/AtecoSearchField.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Autocomplete,
  TextField,
  CircularProgress,
  Box,
  Typography,
  Chip,
} from "@mui/material";
import type { AtecoSearchResult } from "@/types/sectors";
import { useLanguage } from "@/components/i18n/LanguageProvider";

const ATECO_DESCRIPTIONS_IT: Record<string, string> = {
  "01": "Produzione vegetale e animale, caccia",
  "02": "Silvicoltura e utilizzo di aree forestali",
  "03": "Pesca e acquacoltura",
  "10": "Prodotti alimentari",
  "11": "Bevande",
  "12": "Prodotti del tabacco",
  "13": "Tessili",
  "14": "Abbigliamento",
  "15": "Pelletteria e prodotti correlati",
  "16": "Legno e prodotti in legno",
  "17": "Carta e prodotti in carta",
  "18": "Stampa e riproduzione",
  "19": "Coke e prodotti petroliferi raffinati",
  "20": "Prodotti chimici",
  "21": "Prodotti farmaceutici",
  "22": "Gomma e materie plastiche",
  "23": "Prodotti minerali non metallici",
  "24": "Metalli di base",
  "25": "Prodotti in metallo",
  "26": "Computer, prodotti elettronici e ottici",
  "27": "Apparecchiature elettriche",
  "28": "Macchinari e attrezzature",
  "29": "Autoveicoli, rimorchi",
  "30": "Altri mezzi di trasporto",
  "31": "Mobili",
  "32": "Altre attività manifatturiere",
  "33": "Riparazione e installazione di macchinari",
  "41": "Costruzione di edifici",
  "42": "Ingegneria civile",
  "43": "Lavori di costruzione specializzati",
  "46": "Commercio all'ingrosso",
  "47": "Commercio al dettaglio",
  "49": "Trasporto terrestre e mediante condotte",
  "50": "Trasporto marittimo",
  "51": "Trasporto aereo",
  "52": "Magazzinaggio e attività di supporto",
  "53": "Servizi postali e di corriere",
  "55": "Alloggio",
  "56": "Servizi di ristorazione",
  "61": "Telecomunicazioni",
  "62": "Programmazione e consulenza informatica",
  "63": "Attività dei servizi di informazione",
  "68": "Attività immobiliari",
  "77": "Attività di noleggio e leasing",
  "78": "Attività di ricerca e selezione del personale",
  "79": "Agenzie di viaggio e tour operator",
  "80": "Servizi di vigilanza e investigazione",
  "81": "Servizi per edifici e paesaggio",
  "82": "Supporto amministrativo e di ufficio",
  "86": "Attività sanitarie",
  "87": "Servizi di assistenza residenziale",
  "88": "Assistenza sociale non residenziale",
};

type AtecoSearchFieldProps = {
  value: string;
  onChange: (code: string, description: string) => void;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
};

export default function AtecoSearchField({
  value,
  onChange,
  disabled = false,
  error = false,
  helperText,
}: AtecoSearchFieldProps) {
  const { locale } = useLanguage();
  const [open, setOpen] = useState(false);
  const [allOptions, setAllOptions] = useState<AtecoSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const localizeOption = useCallback(
    (opt: AtecoSearchResult): AtecoSearchResult => {
      if (locale !== "it") return opt;
      const itDesc = ATECO_DESCRIPTIONS_IT[opt.code];
      if (!itDesc) return opt;
      return {
        ...opt,
        description: itDesc,
        displayLabel: `${opt.code} - ${itDesc}`,
      };
    },
    [locale],
  );

  // Load all ATECO codes on mount
  useEffect(() => {
    const loadAllCodes = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/sectors/ateco/search?q=`);

        if (!response.ok) {
          throw new Error("Failed to load ATECO codes");
        }

        const data = (await response.json()) as { results: AtecoSearchResult[] };
        setAllOptions(data.results.map(localizeOption));
      } catch (error) {
        console.error("Error loading ATECO codes:", error);
        setAllOptions([]);
      } finally {
        setLoading(false);
      }
    };

    void loadAllCodes();
  }, [localizeOption]);

  const searchAteco = useCallback(async (query: string) => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/sectors/ateco/search?q=${encodeURIComponent(query)}`
      );

      if (!response.ok) {
        throw new Error("Failed to search ATECO codes");
      }

      const data = (await response.json()) as { results: AtecoSearchResult[] };
      setAllOptions(data.results.map(localizeOption));
    } catch (error) {
      console.error("Error searching ATECO codes:", error);
    } finally {
      setLoading(false);
    }
  }, [localizeOption]);

  useEffect(() => {
    const query = inputValue.trim();
    if (!query) return;

    const timeoutId = window.setTimeout(() => {
      void searchAteco(query);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [inputValue, searchAteco]);

  // Also search Italian descriptions client-side when locale is Italian
  const filteredOptions =
    locale === "it" && inputValue.trim()
      ? allOptions.filter((opt) => {
          const q = inputValue.trim().toLowerCase();
          return (
            opt.code.includes(q) ||
            opt.description.toLowerCase().includes(q) ||
            opt.macroName.toLowerCase().includes(q)
          );
        })
      : allOptions;

  // Find the selected option based on the value prop
  const selectedOption = filteredOptions.find((opt) => opt.code === value) ?? null;

  const placeholderText =
    locale === "it"
      ? "Cerca per codice o categoria (es. '62' o 'ICT')"
      : "Search by code or category (e.g., '62' or 'ICT')";

  const noOptionsText = loading
    ? locale === "it"
      ? "Caricamento..."
      : "Loading..."
    : locale === "it"
      ? "Nessun codice ATECO trovato"
      : "No ATECO codes found";

  return (
    <Autocomplete
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      value={selectedOption}
      onChange={(_, newValue) => {
        if (newValue) {
          onChange(newValue.code, newValue.displayLabel);
        } else {
          onChange("", "");
        }
      }}
      inputValue={inputValue}
      onInputChange={(_, newInputValue, reason) => {
        // Don't clear input on blur or when selecting
        if (reason !== "reset") {
          setInputValue(newInputValue);
        }
      }}
      options={filteredOptions}
      loading={loading}
      disabled={disabled}
      getOptionLabel={(option) => option.displayLabel}
      isOptionEqualToValue={(option, value) => option.code === value.code}
      filterOptions={(x) => x} // Disable client-side filtering (we do server-side)
      noOptionsText={noOptionsText}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder={placeholderText}
          error={error}
          helperText={helperText}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
            sx: {
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
            },
          }}
        />
      )}
      renderOption={(props, option) => (
        <Box component="li" {...props} key={option.code}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
            <Chip
              label={option.code}
              size="small"
              sx={{
                bgcolor: "#EEF2FF",
                color: "#4C6AD2",
                fontWeight: 600,
                fontSize: 12,
              }}
            />
            <Typography sx={{ fontSize: 14, color: "#334155" }}>
              {option.description}
            </Typography>
          </Box>
        </Box>
      )}
      sx={{
        "& .MuiAutocomplete-popupIndicator": {
          color: "#8A9FE4",
        },
      }}
    />
  );
}
