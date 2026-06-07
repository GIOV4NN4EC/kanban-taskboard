import MoreVertIcon from "@mui/icons-material/MoreVert";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CommentOutlinedIcon from "@mui/icons-material/CommentOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DriveFileMoveOutlinedIcon from "@mui/icons-material/DriveFileMoveOutlined";
import { useState } from "react";
import type { Task, TaskPriority, TaskStatus } from "../types";
import { PRIORITY_CHIP_COLOR, PRIORITY_LABELS, STATUS_LABELS } from "../theme/muiTheme";
import UserAvatar from "./UserAvatar";

interface TaskCardProps {
  task: Task;
  assigneeName: string | null;
  assigneePhoto?: string | null;
  otherColumns: { status: TaskStatus; label: string }[];
  onEdit: (task: Task) => void;
  onMove: (task: Task, status: TaskStatus) => void;
  onDelete: (taskId: string) => void;
  onComments: (task: Task) => void;
  formatDueDate: (iso: string) => string;
  isOverdue: boolean;
}

export default function TaskCard({
  task,
  assigneeName,
  assigneePhoto,
  otherColumns,
  onEdit,
  onMove,
  onDelete,
  onComments,
  formatDueDate,
  isOverdue,
}: TaskCardProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [moveAnchorEl, setMoveAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);

  const priorityColor = PRIORITY_CHIP_COLOR[task.priority as TaskPriority];

  return (
    <Card
      variant="outlined"
      sx={{
        mb: 1,
        borderLeft: isOverdue ? 3 : undefined,
        borderLeftColor: isOverdue ? "error.main" : undefined,
      }}
    >
      <CardActionArea onClick={() => onEdit(task)} aria-label={`Tarefa: ${task.title}`}>
        <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
            <Chip
              label={PRIORITY_LABELS[task.priority as TaskPriority]}
              color={priorityColor}
              size="small"
              sx={{ height: 22, fontSize: "0.7rem" }}
            />
            <IconButton
              size="small"
              aria-label="Ações da tarefa"
              onClick={(e) => {
                e.stopPropagation();
                setAnchorEl(e.currentTarget);
              }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Stack>

          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            {task.title}
          </Typography>

          {task.description && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                mb: 1,
              }}
            >
              {task.description}
            </Typography>
          )}

          <Stack direction="row" justifyContent="space-between" alignItems="center" pt={0.5}>
            {task.due_date ? (
              <Stack direction="row" alignItems="center" spacing={0.5}>
                {isOverdue && <Chip label="Atrasada" color="error" size="small" sx={{ height: 20, fontSize: "0.65rem" }} />}
                <Typography variant="caption" color={isOverdue ? "error.main" : "text.secondary"} fontWeight={isOverdue ? 600 : 400}>
                  {formatDueDate(task.due_date)}
                </Typography>
              </Stack>
            ) : (
              <Box />
            )}
            {assigneeName ? (
              <UserAvatar name={assigneeName} photoUrl={assigneePhoto} size="sm" />
            ) : (
              <Typography variant="caption" color="text.disabled">
                —
              </Typography>
            )}
          </Stack>
        </CardContent>
      </CardActionArea>

      <Menu anchorEl={anchorEl} open={menuOpen} onClose={() => { setAnchorEl(null); setMoveAnchorEl(null); }}>
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            onComments(task);
          }}
        >
          <ListItemIcon><CommentOutlinedIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Comentários</ListItemText>
        </MenuItem>
        <MenuItem onClick={(e) => setMoveAnchorEl(e.currentTarget)}>
          <ListItemIcon><DriveFileMoveOutlinedIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Mover para…</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            onDelete(task.id);
          }}
          sx={{ color: "error.main" }}
        >
          <ListItemIcon><DeleteOutlineIcon fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>Excluir</ListItemText>
        </MenuItem>
      </Menu>

      <Menu
        anchorEl={moveAnchorEl}
        open={Boolean(moveAnchorEl)}
        onClose={() => setMoveAnchorEl(null)}
        anchorOrigin={{ horizontal: "right", vertical: "top" }}
      >
        {otherColumns.map((col) => (
          <MenuItem
            key={col.status}
            onClick={() => {
              setAnchorEl(null);
              setMoveAnchorEl(null);
              onMove(task, col.status);
            }}
          >
            {col.label}
          </MenuItem>
        ))}
      </Menu>
    </Card>
  );
}

export { STATUS_LABELS };
