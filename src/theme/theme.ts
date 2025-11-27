import { createTheme, type Theme, type ThemeOptions } from "@mui/material/styles";

declare module "@mui/material/styles" {
  interface Palette {
    ctaGradient: string;
    heroGradientBg: string;
    heroFakeBorderGradient: string;
    titleGradient: string;
    headerGradient: string;
  }

  interface PaletteOptions {
    ctaGradient: string;
    heroGradientBg: string;
    heroFakeBorderGradient: string;
    titleGradient: string;
    headerGradient: string;
  }
}

const themeOptions: ThemeOptions = {
  palette: {
    mode: "dark",
    ctaGradient:
      "linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(255, 255, 255, 0.2) 100%), linear-gradient(273.13deg, #6547A5 -6.55%, #3F6DDD 106.12%)",
    heroGradientBg:
      "linear-gradient(180deg, rgba(211, 219, 239, 1) 0%, rgba(215, 211, 239, 0.5) 100%)",
    heroFakeBorderGradient:
      "linear-gradient(180deg, rgba(93, 77, 169, 0.8) 0%, rgba(37, 31, 67, 0) 100%)",
    titleGradient: "linear-gradient(273.13deg, #6547A5 -6.55%, #3F6DDD 106.12%)",
    headerGradient: "linear-gradient(273.13deg, rgba(101, 71, 165, 0.1) -6.55%, rgba(63, 109, 221, 0.1) 106.12%)",
    primary: { main: "rgba(30, 43, 66, 1)" },
    secondary: { main: "rgba(61, 83, 123, 1)" },
    background: { default: "#F9F9F9", paper: "#F9F9F9" },
    text: { primary: "#212121", secondary: "#3D537B", disabled: "#F5F5F5" },
    error: { main: "rgba(211, 47, 47, 1)" },
    warning: { main: "rgba(239, 108, 0, 1)" },
    info: { main: "rgba(2, 136, 209, 1)" },
    success: { main: "rgba(76, 175, 80, 1)" },
    tonalOffset: 0.2,
    contrastThreshold: 3,
  },
  typography: {
    fontFamily: "var(--font-sora)",
  },
};

const theme: Theme = createTheme(themeOptions);

export default theme;
