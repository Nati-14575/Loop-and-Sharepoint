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
} from "@mui/material";
import { ITCapacityData } from "./types";

interface Props {
  data: ITCapacityData[];
  loading: boolean;
  error: string | null;
}

export default function ITCapacityTable({ data, loading, error }: Props) {
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

  return (
    <TableContainer component={Paper} sx={{ mt: 2 }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
        <Typography variant="h6" fontWeight={600}>
          IT Team Capacity Overview
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Dynamic point-in-time capacity data from SharePoint
        </Typography>
      </Box>
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
              <strong>2026 Total Capacity</strong>
            </TableCell>
            <TableCell align="right">
              <strong>Current Month Capacity</strong>
              <Typography variant="caption" display="block" color="text.secondary">
                (point in time data point)
              </Typography>
            </TableCell>
            <TableCell align="right">
              <strong>Remaining Total Capacity</strong>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row, index) => (
            <TableRow key={index} hover>
              <TableCell>{row.team}</TableCell>
              <TableCell>{row.resource}</TableCell>
              <TableCell align="right">
                {row.annualCapacity.toLocaleString()} hours
              </TableCell>
              <TableCell align="right">
                {row.currentMonthCapacity.toLocaleString()} hours
              </TableCell>
              <TableCell align="right">
                {row.remainingTotalCapacity.toLocaleString()} hours
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

