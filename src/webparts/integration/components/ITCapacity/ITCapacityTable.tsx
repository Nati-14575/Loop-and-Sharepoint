import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Alert,
  TextField,
  MenuItem,
} from "@mui/material";
import { ITCapacityData } from "./types";

interface Props {
  data: ITCapacityData[];
  loading: boolean;
  error: string | null;
}

export default function ITCapacityTable({ data, loading, error }: Props) {
  const [search, setSearch] = React.useState("");
  const [teamFilter, setTeamFilter] = React.useState("");

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 200,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  if (data.length === 0) {
    return (
      <Alert severity="info" sx={{ m: 2 }}>
        No capacity data available. Please ensure the Excel file is accessible.
      </Alert>
    );
  }

  // ---- Unique teams for dropdown
  const teams = data.reduce<string[]>((acc, item) => {
    if (acc.indexOf(item.team)) {
      acc.push(item.team);
    }

    return acc;
  }, []);

  // ---- Apply filters
  const filteredData = data.filter((row) => {
    const matchesSearch =
      row.team.toLowerCase().indexOf(search.toLowerCase()) != -1 ||
      row.resource.toLowerCase().indexOf(search.toLowerCase()) != -1;

    const matchesTeam = teamFilter ? row.team === teamFilter : true;

    return matchesSearch && matchesTeam;
  });

  return (
    <TableContainer component={Paper} sx={{ mt: 2 }}>
      {/* ---------- HEADER ---------- */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
        <Typography variant="h6" fontWeight={600}>
          IT Team Capacity Overview
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Dynamic point-in-time capacity data from SharePoint
        </Typography>

        {/* ---------- FILTERS ---------- */}
        <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
          <TextField
            size="small"
            label="Search team or resource"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: 240 }}
          />

          <TextField
            size="small"
            select
            label="Filter by team"
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="">All Teams</MenuItem>
            {teams.map((team) => (
              <MenuItem key={team} value={team}>
                {team}
              </MenuItem>
            ))}
          </TextField>
        </Box>
      </Box>

      {/* ---------- TABLE ---------- */}
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>
              <strong>Team</strong>
            </TableCell>
            <TableCell>
              <strong>Resource</strong>
            </TableCell>
            <TableCell align="right">
              <strong>2026 Total Capacity (changes per month)</strong>
            </TableCell>
            <TableCell align="right">
              <strong>Current Month Total Capacity</strong>
            </TableCell>
            <TableCell align="right">
              <strong>Current Month Capacity (changes per day)</strong>
              <Typography
                variant="caption"
                display="block"
                color="text.secondary"
              >
                (point in time)
              </Typography>
            </TableCell>
            <TableCell align="right">
              <strong>
                Remaining Total Capacity for current month (point in time)
              </strong>
            </TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {filteredData.map((row, index) => (
            <TableRow key={index} hover>
              <TableCell>{row.team}</TableCell>
              <TableCell>{row.resource}</TableCell>
              <TableCell align="right">
                {row.annualCapacity.toLocaleString()} hours
              </TableCell>
              <TableCell align="right">
                {row.totalCurrentMonthCapacity.toLocaleString()} hours
              </TableCell>
              <TableCell align="right">
                {row.currentMonthCapacity.toLocaleString()} hours
              </TableCell>
              <TableCell align="right">
                {row.remainingCurrentMonthCapacity.toLocaleString()} hours
              </TableCell>
            </TableRow>
          ))}

          {filteredData.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} align="center">
                <Typography variant="body2" color="text.secondary">
                  No results match your filter
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
