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
  const [open, setOpen] = useState(false);
  const [allOptions, setAllOptions] = useState<AtecoSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");

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
        setAllOptions(data.results);
      } catch (error) {
        console.error("Error loading ATECO codes:", error);
        setAllOptions([]);
      } finally {
        setLoading(false);
      }
    };

    void loadAllCodes();
  }, []);

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
      setAllOptions(data.results);
    } catch (error) {
      console.error("Error searching ATECO codes:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const query = inputValue.trim();
    if (!query) return;

    const timeoutId = window.setTimeout(() => {
      void searchAteco(query);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [inputValue, searchAteco]);

  // Find the selected option based on the value prop
  const selectedOption = allOptions.find((opt) => opt.code === value) ?? null;

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
      options={allOptions}
      loading={loading}
      disabled={disabled}
      getOptionLabel={(option) => option.displayLabel}
      isOptionEqualToValue={(option, value) => option.code === value.code}
      filterOptions={(x) => x} // Disable client-side filtering (we do server-side)
      noOptionsText={loading ? "Loading..." : "No ATECO codes found"}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder="Search by code or category (e.g., '62' or 'ICT')"
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
