import * as React from "react";
import {
  CircularProgress,
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Avatar,
  List,
  IconButton,
  Collapse,
  Paper,
} from "@mui/material";
import {
  ExpandMore,
  ExpandLess,
  Assignment,
  Person,
  Schedule,
} from "@mui/icons-material";
import { SharePointService } from "../utils/SharePointService";
import { getSpfxCtx } from "../utils/spfxCtx";

type TaskListCellProps = {
  siteUrl: string;
  listTitle: string;
  title: string;
};

export const TaskListCell: React.FC<TaskListCellProps> = ({
  siteUrl,
  listTitle,
  title,
}) => {
  const [loading, setLoading] = React.useState(false);
  const [tasks, setTasks] = React.useState<any[]>([]);
  const [open, setOpen] = React.useState(false);
  const spService = new SharePointService(getSpfxCtx());

  const handleToggle = async () => {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (tasks.length === 0 && !loading) {
      setLoading(true);
      try {
        const items = await spService.getItemsByTitle(
          siteUrl,
          listTitle,
          title
        );
        setTasks(items);
      } catch (error) {
        console.error("Error fetching tasks:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `Today at ${date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } else if (diffDays === 1) {
      return `Yesterday at ${date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Box sx={{ width: "100%", maxWidth: 400 }}>
      <Paper
        elevation={open ? 3 : 0}
        sx={{
          p: 1,
          borderRadius: 2,
          border: open ? "none" : "1px solid",
          borderColor: "divider",
          backgroundColor: open ? "background.paper" : "transparent",
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            backgroundColor: "action.hover",
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: "pointer",
          }}
          onClick={handleToggle}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Assignment sx={{ fontSize: 18, color: "primary.main" }} />
            <Typography variant="body2" fontWeight="medium">
              View Tasks ({tasks.length})
            </Typography>
          </Box>
          <IconButton size="small">
            {open ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>

        <Collapse in={open}>
          <Box sx={{ mt: 2 }}>
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                <CircularProgress size={24} />
              </Box>
            ) : tasks.length > 0 ? (
              <List dense sx={{ py: 0 }}>
                {tasks.map((task) => (
                  <Card
                    key={task.Id}
                    variant="outlined"
                    sx={{
                      mb: 1,
                      borderRadius: 2,
                      "&:last-child": { mb: 0 },
                    }}
                  >
                    <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 2,
                        }}
                      >
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            bgcolor: "primary.main",
                            fontSize: "0.75rem",
                          }}
                        >
                          {getInitials(task.Author?.Title || "UU")}
                        </Avatar>

                        <Box sx={{ flex: 1 }}>
                          <Typography
                            variant="body2"
                            fontWeight="medium"
                            gutterBottom
                          >
                            {task.Title}
                          </Typography>

                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              flexWrap: "wrap",
                            }}
                          >
                            <Chip
                              icon={<Person sx={{ fontSize: 14 }} />}
                              label={task.Author?.Title || "Unknown"}
                              size="small"
                              variant="outlined"
                              sx={{ height: 24, fontSize: "0.7rem" }}
                            />

                            <Chip
                              icon={<Schedule sx={{ fontSize: 14 }} />}
                              label={formatDate(task.Created)}
                              size="small"
                              variant="outlined"
                              sx={{ height: 24, fontSize: "0.7rem" }}
                            />

                            {task.Status && (
                              <Chip
                                label={task.Status}
                                size="small"
                                color={
                                  task.Status.toLowerCase() === "completed"
                                    ? "success"
                                    : task.Status.toLowerCase() ===
                                      "in progress"
                                    ? "warning"
                                    : "default"
                                }
                                sx={{ height: 24, fontSize: "0.7rem" }}
                              />
                            )}
                          </Box>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </List>
            ) : (
              <Box
                sx={{
                  textAlign: "center",
                  py: 3,
                  color: "text.secondary",
                  border: "1px dashed",
                  borderColor: "divider",
                  borderRadius: 2,
                }}
              >
                <Assignment sx={{ fontSize: 32, mb: 1, opacity: 0.5 }} />
                <Typography variant="body2">No tasks found</Typography>
              </Box>
            )}
          </Box>
        </Collapse>
      </Paper>
    </Box>
  );
};
