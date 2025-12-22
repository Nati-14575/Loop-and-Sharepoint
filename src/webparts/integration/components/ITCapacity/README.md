# IT Capacity Dashboard

This folder contains the IT Team Capacity Dashboard feature, which displays capacity data from a SharePoint Excel file.

## Features

1. **Dynamic Capacity Table**: Displays IT team capacity by team, resource, and month with:
   - Annual team capacity (2026 Total Capacity)
   - Current month capacity (point in time)
   - Remaining total capacity (calculated based on remaining months)

2. **Capacity Histogram**: Interactive histogram showing:
   - X-axis: Total capacity by team
   - Y-axis: Total capacity hours to date
   - Accessible via floating action button (FAB) in bottom-right corner

## Components

- `ITCapacityDashboard.tsx` - Main dashboard component
- `ITCapacityTable.tsx` - Table component displaying capacity data
- `ITCapacityHistogram.tsx` - Histogram component with navigation drawer
- `ITCapacityService.ts` - Service for reading and parsing Excel files from SharePoint
- `types.ts` - TypeScript type definitions

## Configuration

The SharePoint file location is configured in `ITCapacityDashboard.tsx`:

```typescript
const SHAREPOINT_CONFIG = {
  libraryName: "Generative AI - AI Project Mgmt Docs",
  folderPath: "AI Project Management/All demand/05-2025 Demand planning",
  fileName: "2-2025 Capacity.xlsx",
  annualTeamCapacity: 208135, // Total hours for 2026 (Jan 1 - Dec 31)
};
```

## Usage

Import and use the dashboard component:

```typescript
import { ITCapacityDashboard } from "./components/ITCapacity";

// In your component:
<ITCapacityDashboard siteUrl={siteUrl} />
```

## Excel File Parsing

The service attempts to parse Excel files using:

1. **Microsoft Graph API** (if available) - Preferred method
2. **xlsx library** (if installed) - Alternative method

### Installing xlsx Library (Optional)

For full Excel parsing support, install the xlsx library:

```bash
npm install xlsx
npm install --save-dev @types/xlsx
```

Then uncomment the xlsx parsing code in `ITCapacityService.ts` (see the `parseExcelData` method).

## Capacity Calculations

- **Annual Capacity**: Sum of all capacity values for the year 2026
- **Current Month Capacity**: Capacity for the current month (computed at beginning of each month)
- **Remaining Total Capacity**: Calculated as `8 hours × remaining months`
  - January: 8 hours × 12 months = 96 hours
  - February: 8 hours × 11 months = 88 hours
  - March: 8 hours × 10 months = 80 hours
  - And so on...

## Excel File Format

The Excel file should contain the following columns:
- Team
- Manager
- Resource
- Month (date)
- Capacity (hours)

The service will automatically detect these columns by name (case-insensitive).

