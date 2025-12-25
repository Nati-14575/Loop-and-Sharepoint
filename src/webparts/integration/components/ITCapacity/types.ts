export interface ITCapacityRow {
  team: string;
  manager: string;
  resource: string;
  month: string;
  capacity: number;
}

export interface ITCapacityData {
  team: string;
  annualCapacity: number; // 2026 Total Capacity
  resource: string;
  currentMonthCapacity: number; // Current Month Capacity (point in time)
  remainingTotalCapacity: number; // Remaining Total Capacity
  totalCurrentMonthCapacity: number;
  remainingCurrentMonthCapacity: number;
}

export interface ITCapacityHistogramData {
  team: string;
  totalCapacityHours: number; // Total capacity hours to date (cumulative from Jan 1 to current date)
}
