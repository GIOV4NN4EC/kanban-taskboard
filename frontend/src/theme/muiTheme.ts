import { createTheme, type Theme } from "@mui/material/styles";
import type { Theme as AppTheme } from "../contexts/ThemeContext";

const baseTheme = {
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none" as const,
          fontWeight: 600,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
        },
      },
    },
  },
};

export function createAppTheme(mode: AppTheme): Theme {
  return createTheme({
    ...baseTheme,
    palette: {
      mode,
      primary: {
        main: mode === "dark" ? "#7ab8dc" : "#305d7e",
        light: mode === "dark" ? "#9ccae6" : "#4a7a9e",
        dark: mode === "dark" ? "#5ba4cf" : "#264a66",
        contrastText: "#ffffff",
      },
      secondary: {
        main: mode === "dark" ? "#94a3b8" : "#64748b",
      },
      error: {
        main: mode === "dark" ? "#ef4444" : "#dc2626",
      },
      success: {
        main: mode === "dark" ? "#4ade80" : "#16a34a",
      },
      warning: {
        main: mode === "dark" ? "#fde047" : "#ca8a04",
      },
      background: {
        default: mode === "dark" ? "#0a1014" : "#eef2f6",
        paper: mode === "dark" ? "#2c343f" : "#ffffff",
      },
    },
  });
}

export const PRIORITY_CHIP_COLOR = {
  LOW: "success",
  MEDIUM: "warning",
  HIGH: "error",
} as const;

export const STATUS_LABELS = {
  TODO: "A fazer",
  DOING: "Em andamento",
  DONE: "Concluída",
} as const;

export const PRIORITY_LABELS = {
  LOW: "Baixa",
  MEDIUM: "Média",
  HIGH: "Alta",
} as const;

export const COLUMN_COLORS = {
  TODO: "#64748b",
  DOING: "#2563eb",
  DONE: "#16a34a",
} as const;
