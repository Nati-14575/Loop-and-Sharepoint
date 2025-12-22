import { SPHttpClient, SPHttpClientResponse } from "@microsoft/sp-http";
import {
  ITCapacityRow,
  ITCapacityData,
  ITCapacityHistogramData,
} from "./types";
import * as XLSX from "xlsx";

export class ITCapacityService {
  constructor(private ctx: any) {}

  /**
   * Get Excel file from SharePoint document library
   * @param siteUrl SharePoint site URL
   * @param libraryName Document library name (e.g., "Generative AI - AI Project Mgmt Docs")
   * @param folderPath Folder path (e.g., "AI Project Management/All demand/05-2025 Demand planning")
   * @param fileName File name (e.g., "2-2025 Capacity.xlsx")
   */
  async getExcelFile(siteUrl: string, filePath: string): Promise<ArrayBuffer> {
    // Construct the file server relative URL
    const serverRelativeUrl = `${filePath}`.replace(/\/+/g, "/");

    // Get file using SharePoint REST API
    const url = `${siteUrl}/_api/web/GetFileByServerRelativeUrl('${encodeURIComponent(
      serverRelativeUrl
    )}')/$value`;

    const res: SPHttpClientResponse = await this.ctx.spHttpClient.get(
      url,
      SPHttpClient.configurations.v1
    );

    if (!res.ok) {
      throw new Error(`Failed to fetch Excel file: ${res.status}`);
    }

    return res.arrayBuffer();
  }

  /**
   * Alternative: Get file by searching for it
   */
  async getExcelFileBySearch(
    siteUrl: string,
    libraryName: string,
    folderPath: string,
    fileName: string
  ): Promise<ArrayBuffer> {
    // Try to get the file using search/filter
    const folderPathEncoded = encodeURIComponent(
      `${libraryName}/${folderPath}`
    );
    const url = `${siteUrl}/_api/web/GetFolderByServerRelativeUrl('${folderPathEncoded}')/Files('${encodeURIComponent(
      fileName
    )}')/$value`;

    const res: SPHttpClientResponse = await this.ctx.spHttpClient.get(
      url,
      SPHttpClient.configurations.v1
    );

    if (!res.ok) {
      // Fallback: try alternative path construction
      const altUrl = `${siteUrl}/_api/web/lists/getbytitle('${encodeURIComponent(
        libraryName
      )}')/items?$filter=FileLeafRef eq '${encodeURIComponent(
        fileName
      )}'&$select=FileRef`;

      const altRes = await this.ctx.spHttpClient.get(
        altUrl,
        SPHttpClient.configurations.v1
      );

      if (!altRes.ok) {
        throw new Error(`Failed to fetch Excel file: ${altRes.status}`);
      }

      const json = await altRes.json();
      if (json.value && json.value.length > 0) {
        const fileRef = json.value[0].FileRef;
        const fileUrl = `${siteUrl}/_api/web/GetFileByServerRelativeUrl('${encodeURIComponent(
          fileRef
        )}')/$value`;

        const fileRes = await this.ctx.spHttpClient.get(
          fileUrl,
          SPHttpClient.configurations.v1
        );

        if (!fileRes.ok) {
          throw new Error(`Failed to fetch Excel file: ${fileRes.status}`);
        }

        return fileRes.arrayBuffer();
      }

      throw new Error("Excel file not found");
    }

    return res.arrayBuffer();
  }

  /**
   * Parse Excel file using SharePoint REST API or Microsoft Graph
   * Reads the Excel file and extracts capacity data
   *
   * Then uncomment the xlsx parsing code below.
   */
  async parseExcelData(arrayBuffer: ArrayBuffer): Promise<ITCapacityRow[]> {
    try {
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      const rows: any[] = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: "",
      });

      const headerRow = rows[0];

      const monthColumnMap: { [key: number]: string } = {};

      headerRow.forEach((cell: any, index: number) => {
        if (
          typeof cell === "string" &&
          [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
          ].indexOf(cell) != -1
        ) {
          monthColumnMap[index] = cell;
        }
      });

      const teamIndex = headerRow.indexOf("Sub-Team");
      const managerIndex = headerRow.indexOf("Manager");
      const resourceIndex = headerRow.indexOf("Resource");

      const result: ITCapacityRow[] = [];

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];

        const team = row[teamIndex]?.toString().trim();
        const manager = row[managerIndex]?.toString().trim();
        const resource = row[resourceIndex]?.toString().trim();

        if (!team || !resource) continue;

        for (const colIndex in monthColumnMap) {
          const month = monthColumnMap[colIndex];
          const capacity = Number(row[colIndex]);

          if (!isNaN(capacity) && capacity > 0) {
            result.push({
              team,
              manager,
              resource,
              month,
              capacity,
            });
          }
        }
      }

      return result;
    } catch (error) {
      console.error("Error parsing Excel data:", error);
      return [];
    }
  }

  /**
   * Parse a local Excel file (client-uploaded). Requires `xlsx` to be installed.
   */
  async parseLocalExcel(arrayBuffer: ArrayBuffer): Promise<ITCapacityRow[]> {
    try {
      // Lazy import to avoid bundling when not used
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const XLSX = await import("xlsx");
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      return (jsonData as any[])
        .map((row) => ({
          team: row.Team || row.team || "",
          manager: row.Manager || row.manager || "",
          resource: row.Resource || row.resource || "",
          month: row.Month || row.month || "",
          capacity: parseFloat(row.Capacity || row.capacity || "0"),
        }))
        .filter(
          (row: ITCapacityRow) => row.team && row.resource && row.capacity > 0
        );
    } catch (error) {
      console.warn(
        "Failed to parse local Excel. Ensure 'xlsx' is installed (npm install xlsx @types/xlsx).",
        error
      );
      return [];
    }
  }

  /**
   * Parse Excel range data from REST API response
   */
  private parseExcelRangeData(rangeData: any): ITCapacityRow[] {
    const rows: ITCapacityRow[] = [];
    const values = rangeData.values || [];

    if (values.length < 2) {
      return rows; // Need at least header + 1 data row
    }

    // Assume first row is headers
    const headers = values[0].map((h: any) =>
      String(h || "")
        .toLowerCase()
        .trim()
    );

    // Find column indices
    const teamIdx = headers.findIndex(
      (h: string) => h.indexOf("team") !== -1 || h.indexOf("team name") !== -1
    );
    const managerIdx = headers.findIndex(
      (h: string) => h.indexOf("manager") !== -1
    );
    const resourceIdx = headers.findIndex(
      (h: string) => h.indexOf("resource") !== -1 || h.indexOf("name") !== -1
    );
    const monthIdx = headers.findIndex(
      (h: string) => h.indexOf("month") !== -1 || h.indexOf("date") !== -1
    );
    const capacityIdx = headers.findIndex(
      (h: string) => h.indexOf("capacity") !== -1 || h.indexOf("hours") !== -1
    );

    // Parse data rows
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      if (!row || row.length === 0) continue;

      const team = teamIdx >= 0 ? String(row[teamIdx] || "").trim() : "";
      const manager =
        managerIdx >= 0 ? String(row[managerIdx] || "").trim() : "";
      const resource =
        resourceIdx >= 0 ? String(row[resourceIdx] || "").trim() : "";
      const month = monthIdx >= 0 ? String(row[monthIdx] || "").trim() : "";
      const capacity =
        capacityIdx >= 0 ? parseFloat(String(row[capacityIdx] || "0")) : 0;

      if (team && resource && capacity > 0) {
        rows.push({
          team,
          manager,
          resource,
          month,
          capacity,
        });
      }
    }

    return rows;
  }

  /**
   * Calculate capacity metrics from raw data
   * Based on requirements:
   * - Annual team capacity: Total from Jan 1, 2026 through Dec 31, 2026 (208,135 hours total)
   * - Current month capacity: Computed at beginning of each month, changes each month
   * - Remaining total capacity: 8 hours × remaining months (Jan = 8×12, Feb = 8×11, Mar = 8×10, etc.)
   */
  calculateCapacityData(
    rawData: ITCapacityRow[],
    year: number,
    currentDate: Date = new Date()
  ): ITCapacityData[] {
    const MONTHS = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const currentMonthIndex = currentDate.getMonth(); // 0-based

    // Group by team + resource
    const grouped: { [key: string]: ITCapacityRow[] } = {};

    rawData.forEach((row) => {
      const key = `${row.team}|${row.resource}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(row);
    });

    const results: ITCapacityData[] = [];

    for (const key in grouped) {
      const rows = grouped[key];
      const [team, resource] = key.split("|");

      // ---- Annual capacity (entire year)
      const annualCapacity = rows.reduce((sum, r) => sum + r.capacity, 0);

      // ---- Current month capacity
      const currentMonthName = MONTHS[currentMonthIndex];
      const currentMonthCapacity = rows
        .filter((r) => r.month === currentMonthName)
        .reduce((sum, r) => sum + r.capacity, 0);

      // ---- Remaining capacity (future months only)
      const remainingTotalCapacity = rows
        .filter((r) => MONTHS.indexOf(r.month) >= currentMonthIndex)
        .reduce((sum, r) => sum + r.capacity, 0);

      results.push({
        team,
        resource,
        annualCapacity,
        currentMonthCapacity,
        remainingTotalCapacity,
      });
    }

    return results;
  }

  /**
   * Calculate histogram data: Total capacity hours to date by team
   * This calculates cumulative capacity from Jan 1 to current date for each team
   */
  calculateHistogramData(
    rawData: ITCapacityRow[],
    currentDate: Date = new Date()
  ): ITCapacityHistogramData[] {
    const MONTHS = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const currentMonthIndex = currentDate.getMonth(); // 0-based

    // Group by team
    const teamTotals: { [team: string]: number } = {};

    rawData.forEach((row) => {
      const monthIndex = MONTHS.indexOf(row.month);

      // Only include months up to the current month (inclusive)
      if (monthIndex !== -1 && monthIndex <= currentMonthIndex) {
        if (!teamTotals[row.team]) {
          teamTotals[row.team] = 0;
        }
        teamTotals[row.team] += row.capacity;
      }
    });

    // Convert to output array
    const result: ITCapacityHistogramData[] = [];

    for (const team in teamTotals) {
      result.push({
        team,
        totalCapacityHours: teamTotals[team],
      });
    }

    return result;
  }

  extractSiteName(siteUrl: string): string {
    try {
      const url = new URL(siteUrl);
      const pathParts = url.pathname.split("/").filter((p) => p);
      if (pathParts.length > 1 && pathParts[0] === "sites") {
        return pathParts.slice(0, 2).join("/");
      }
      return "";
    } catch {
      return "";
    }
  }
}
