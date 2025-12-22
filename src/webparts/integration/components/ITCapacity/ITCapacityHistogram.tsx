import * as React from "react";
import {
  Drawer,
  Fab,
  CircularProgress,
  Box,
  Typography,
  Card,
  CardContent,
} from "@mui/material";
import BarChartIcon from "@mui/icons-material/BarChart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { ITCapacityHistogramData } from "./types";

interface Props {
  data: ITCapacityHistogramData[];
  loading: boolean;
  inline?: boolean; // If true, render without drawer/FAB
}

const DEFAULT_COLORS = [
  "#4f46e5", // indigo
  "#22c55e", // green
  "#ef4444", // red
  "#f59e0b", // amber
  "#3b82f6", // blue
  "#a855f7", // purple
  "#ec4899", // pink
  "#14b8a6", // teal
];

export default function ITCapacityHistogram({ data, loading, inline }: Props) {
  const [open, setOpen] = React.useState(false);

  const toggleDrawer = (state: boolean) => () => setOpen(state);

  const chartContent = (
    <>
      {!inline && (
        <Typography variant="h6" gutterBottom fontWeight={600}>
          IT Team Capacity Histogram
        </Typography>
      )}
      {!inline && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Total capacity by team (X-axis) vs Total capacity hours to date
          (Y-axis)
        </Typography>
      )}

      {loading ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: 400,
          }}
        >
          <CircularProgress />
        </Box>
      ) : data.length === 0 ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: 400,
          }}
        >
          <Typography color="text.secondary">
            No data available for histogram
          </Typography>
        </Box>
      ) : (
        <Card sx={{ width: "100%" }}>
          <CardContent sx={{ height: 500 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="team"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis
                  label={{
                    value: "Total Capacity Hours to Date",
                    angle: -90,
                    position: "insideLeft",
                  }}
                />
                <Tooltip
                  formatter={(value: number) => [
                    `${value.toLocaleString()} hours`,
                    "Capacity",
                  ]}
                />
                <Bar dataKey="totalCapacityHours" barSize={40}>
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </>
  );

  if (inline) {
    return <Box sx={{ p: inline ? 0 : 2 }}>{chartContent}</Box>;
  }

  return (
    <>
      <Fab
        color="primary"
        onClick={toggleDrawer(true)}
        sx={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          zIndex: 1200,
        }}
        aria-label="View Capacity Histogram"
      >
        <BarChartIcon />
      </Fab>

      <Drawer
        anchor="right"
        open={open}
        onClose={toggleDrawer(false)}
        PaperProps={{
          sx: { width: { xs: "90%", sm: 600 }, p: 2 },
        }}
      >
        <Box sx={{ p: 2 }}>{chartContent}</Box>
      </Drawer>
    </>
  );
}

