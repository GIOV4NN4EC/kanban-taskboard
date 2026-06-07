import Box from "@mui/material/Box";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";
import { Link as RouterLink } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import UserAvatar from "./UserAvatar";

interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface AppHeaderProps {
  title: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  subtitle?: ReactNode;
  primaryAction?: ReactNode;
  actions?: ReactNode;
  user?: { name: string; photoUrl?: string | null };
  showLogout?: boolean;
  onLogout?: () => void;
}

export default function AppHeader({
  title,
  breadcrumbs,
  subtitle,
  primaryAction,
  actions,
  user,
  showLogout,
  onLogout,
}: AppHeaderProps) {
  return (
    <Box
      component="header"
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 2,
        mb: 3,
        pb: 2,
        borderBottom: 1,
        borderColor: "divider",
      }}
    >
      <Box>
        <Link component={RouterLink} to="/" underline="hover" color="text.secondary" variant="overline" sx={{ fontWeight: 700, letterSpacing: 2 }}>
          TaskBoard
        </Link>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <Breadcrumbs aria-label="Navegação" sx={{ mt: 0.5 }}>
            {breadcrumbs.map((item, i) =>
              item.to ? (
                <Link key={i} component={RouterLink} to={item.to} underline="hover" color="inherit" variant="body2">
                  {item.label}
                </Link>
              ) : (
                <Typography key={i} color="text.primary" variant="body2">
                  {item.label}
                </Typography>
              )
            )}
          </Breadcrumbs>
        )}
        <Typography variant="h5" component="h1" sx={{ mt: 0.5, fontWeight: 600 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {subtitle}
          </Typography>
        )}
      </Box>

      <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap" useFlexGap sx={{ flexShrink: 0 }}>
        <ThemeToggle />
        {primaryAction}
        {actions}
        {user && (
          <Stack
            direction="row"
            alignItems="center"
            spacing={1.25}
            sx={{ pl: 1.5, borderLeft: 1, borderColor: "divider", minHeight: 40 }}
          >
            <UserAvatar name={user.name} photoUrl={user.photoUrl} size="md" />
            <Stack spacing={0} justifyContent="center">
              <Typography variant="body2" fontWeight={500} lineHeight={1.3}>
                {user.name}
              </Typography>
              <Link component={RouterLink} to="/profile" variant="caption" underline="hover" lineHeight={1.3}>
                Meu perfil
              </Link>
            </Stack>
          </Stack>
        )}
        {showLogout && onLogout && (
          <Button variant="outlined" size="small" onClick={onLogout} sx={{ alignSelf: "center" }}>
            Sair
          </Button>
        )}
      </Stack>
    </Box>
  );
}
