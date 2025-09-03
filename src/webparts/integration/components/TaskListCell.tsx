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
import { ADO_CONFIG } from "../utils/config";

type TaskListCellProps = {
  project: string;
  featureId?: number; // Optional: if you want to filter by parent feature
  title: string;
};

export const TaskListCell: React.FC<TaskListCellProps> = ({
  project,
  featureId,
  title,
}) => {
  const [loading, setLoading] = React.useState(false);
  const [tasks, setTasks] = React.useState<any[]>([]);
  const [open, setOpen] = React.useState(false);

  const fetchAzureTasks = async (): Promise<any[]> => {
    const { org, pat } = ADO_CONFIG;

    const base = `https://dev.azure.com/${encodeURIComponent(
      org
    )}/${encodeURIComponent(project)}/_apis`;

    const auth = "Basic " + btoa(":" + pat);

    // Build WIQL query to find tasks
    let wiqlQuery = `
      Select [System.Id], [System.Title], [System.State], [System.CreatedDate], [System.CreatedBy]
      From WorkItems
      Where [System.TeamProject] = '${project.replace(/'/g, "''")}'
        And [System.WorkItemType] = 'Task'
        And [System.State] <> 'Removed'
    `;

    // If filtering by title
    if (title) {
      wiqlQuery += ` And [System.Title] Contains '${title.replace(
        /'/g,
        "''"
      )}'`;
    }

    // If filtering by parent feature
    if (featureId) {
      wiqlQuery += ` And [System.Parent] = ${featureId}`;
    }

    wiqlQuery += ` Order By [System.CreatedDate] Desc`;

    try {
      // First, get work item IDs using WIQL
      const wiqlRes = await fetch(`${base}/wit/wiql?api-version=7.0`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: auth,
        },
        body: JSON.stringify({ query: wiqlQuery }),
      });

      if (!wiqlRes.ok) throw new Error(`WIQL failed: ${wiqlRes.status}`);
      const wiqlData = await wiqlRes.json();

      const ids: number[] = (wiqlData.workItems || [])
        .map((w: any) => w.id)
        .slice(0, 50); // Limit to 50 tasks

      if (!ids.length) return [];

      // Then, get detailed work item information
      const fields = [
        "System.Id",
        "System.Title",
        "System.State",
        "System.CreatedDate",
        "System.CreatedBy",
        "System.AssignedTo",
      ];

      const workRes = await fetch(
        `${base}/wit/workitems?ids=${ids.join(",")}&fields=${encodeURIComponent(
          fields.join(",")
        )}&api-version=7.0`,
        {
          headers: {
            Authorization: auth,
            "Content-Type": "application/json",
          },
        }
      );

      if (!workRes.ok)
        throw new Error(`Work items fetch failed: ${workRes.status}`);
      const workData = await workRes.json();

      return workData.value || [];
    } catch (error) {
      console.error("Error fetching Azure tasks:", error);
      throw error;
    }
  };

  const handleToggle = async () => {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (tasks.length === 0 && !loading) {
      setLoading(true);
      try {
        const azureTasks = await fetchAzureTasks();
        setTasks(azureTasks);
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
    if (!name) return "UU";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getDisplayName = (identity: any) => {
    if (!identity) return "Unknown";
    return identity.displayName || "Unknown";
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
                    key={task.id}
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
                          {getInitials(
                            getDisplayName(task.fields["System.CreatedBy"])
                          )}
                        </Avatar>

                        <Box sx={{ flex: 1 }}>
                          <Typography
                            variant="body2"
                            fontWeight="medium"
                            gutterBottom
                          >
                            {task.fields["System.Title"]}
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
                              label={getDisplayName(
                                task.fields["System.CreatedBy"]
                              )}
                              size="small"
                              variant="outlined"
                              sx={{ height: 24, fontSize: "0.7rem" }}
                            />

                            <Chip
                              icon={<Schedule sx={{ fontSize: 14 }} />}
                              label={formatDate(
                                task.fields["System.CreatedDate"]
                              )}
                              size="small"
                              variant="outlined"
                              sx={{ height: 24, fontSize: "0.7rem" }}
                            />

                            {task.fields["System.State"] && (
                              <Chip
                                label={task.fields["System.State"]}
                                size="small"
                                color={
                                  task.fields["System.State"].toLowerCase() ===
                                  "completed"
                                    ? "success"
                                    : task.fields[
                                        "System.State"
                                      ].toLowerCase() === "in progress"
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
