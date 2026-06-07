import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider as MuiProvider } from "@mui/material/styles";
import { useMemo, type ReactNode } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { createAppTheme } from "./muiTheme";

export default function MuiThemeBridge({ children }: { children: ReactNode }) {
  const { theme } = useTheme();
  const muiTheme = useMemo(() => createAppTheme(theme), [theme]);

  return (
    <MuiProvider theme={muiTheme}>
      <CssBaseline />
      {children}
    </MuiProvider>
  );
}
