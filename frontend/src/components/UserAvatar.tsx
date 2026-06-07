import Avatar from "@mui/material/Avatar";

interface UserAvatarProps {
  name: string;
  photoUrl?: string | null;
  size?: "sm" | "md";
}

const SIZES = { sm: 28, md: 36 } as const;

export default function UserAvatar({ name, photoUrl, size = "sm" }: UserAvatarProps) {
  const px = SIZES[size];
  return (
    <Avatar
      src={photoUrl ?? undefined}
      alt={name}
      title={name}
      sx={{ width: px, height: px, fontSize: size === "sm" ? "0.75rem" : "0.9rem" }}
    >
      {name.charAt(0).toUpperCase() || "?"}
    </Avatar>
  );
}
