import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";
import ThemeToggle from "./ThemeToggle";

interface AuthLayoutProps {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

export default function AuthLayout({ title, children, footer }: AuthLayoutProps) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
        py: 4,
        position: "relative",
      }}
    >
      <Box sx={{ position: "absolute", top: 16, right: 16 }}>
        <ThemeToggle />
      </Box>

      <Typography
        variant="overline"
        sx={{ mb: 3, fontWeight: 700, letterSpacing: 4, fontSize: "1.1rem" }}
      >
        TaskBoard
      </Typography>

      <Card sx={{ width: "100%", maxWidth: 420 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>
            {title}
          </Typography>
          {children}
          {footer && (
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
              {footer}
            </Typography>
          )}
        </CardContent>
      </Card>

      <Typography variant="body2" color="text.disabled" sx={{ position: "absolute", bottom: 24, right: 24 }} aria-hidden>
        ✦
      </Typography>
    </Box>
  );
}
