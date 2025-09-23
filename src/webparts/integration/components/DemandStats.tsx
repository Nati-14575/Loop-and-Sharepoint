import * as React from "react";
import { Box, Typography, Paper, CircularProgress } from "@mui/material";

import { SharePointService } from "../utils/SharePointService";

interface StatConfig {
  label: string;
  listTitle: string;
  column: string;
  startsWith: string;
}

// dynamic configs instead of hardcoding numbers
const statsConfig: StatConfig[] = [
  {
    label: "Protiviti Atlas requests",
    listTitle: "AtlasRequests",
    column: "Title",
    startsWith: "Atlas-",
  },
  {
    label: "ProGPT requests",
    listTitle: "ProGPTRequests",
    column: "Title",
    startsWith: "ProGPT-",
  },
  {
    label: "ProGPT and Protiviti Atlas",
    listTitle: "CombinedRequests",
    column: "Title",
    startsWith: "Combo-",
  },
];

export default function DemandStats({
  spService,
  siteUrl,
}: {
  spService: SharePointService;
  siteUrl: string;
}) {
  const [counts, setCounts] = React.useState<Record<string, number | null>>({});
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let active = true;

    const fetchCounts = async () => {
      try {
        const results: Record<string, number> = {};
        for (const cfg of statsConfig) {
          const count = await spService.getItemCountByStartsWith(
            siteUrl,
            cfg.listTitle,
            cfg.column,
            cfg.startsWith
          );
          results[cfg.label] = count;
        }
        if (active) {
          setCounts(results);
          setLoading(false);
        }
      } catch (err) {
        console.error("❌ Failed to fetch counts", err);
        setLoading(false);
      }
    };

    fetchCounts();

    return () => {
      active = false; // cleanup to prevent state updates if unmounted
    };
  }, [siteUrl, spService]);

  return (
    <Box sx={{ maxWidth: 1000, mx: "auto", p: 4 }}>
      {/* Title */}
      <Typography variant="h6" align="center" gutterBottom fontWeight={600}>
        Significant demand for ProGPT Agents and Protiviti Atlas solutions
      </Typography>

      {/* Subtitle */}
      <Typography
        variant="body2"
        align="center"
        color="text.secondary"
        sx={{ mb: 5 }}
      >
        These are counts of AI requests in the past four months (including the
        ProGPT Vision Agents).
      </Typography>

      {/* Stat Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "24px",
          justifyContent: "center",
          padding: "24px 0",
        }}
        className="stats-grid" // Add this for media queries
      >
        {statsConfig.map((stat, index) => (
          <div key={index}>
            <Paper
              elevation={2}
              sx={{
                p: 4,
                textAlign: "center",
                borderRadius: 3,
                height: "100%",
              }}
            >
              {loading ? (
                <CircularProgress size={32} />
              ) : (
                <>
                  <Typography
                    variant="h3"
                    component="div"
                    fontWeight="bold"
                    color="primary"
                  >
                    {counts[stat.label] ?? 0}+
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stat.label}
                  </Typography>
                </>
              )}
            </Paper>
          </div>
        ))}
      </div>
    </Box>
  );
}
