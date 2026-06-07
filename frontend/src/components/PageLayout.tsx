import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import type { ReactNode } from "react";

export default function PageLayout({ children }: { children: ReactNode }) {
  return (
    <Box sx={{ minHeight: "100vh", py: 3 }}>
      <Container maxWidth="lg">{children}</Container>
    </Box>
  );
}
