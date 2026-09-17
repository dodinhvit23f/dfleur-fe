import TrendingDownRoundedIcon from "@mui/icons-material/TrendingDownRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import { Box, Card, Chip, List, ListItem, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { defaultFinancialMetrics, defaultFinancialNotes } from "./mockData";

export interface FinancialMetric {
  label: string;
  value: number;
  trend?: { value: number; direction: "up" | "down" } | null;
}

export interface FinancialOverviewCardProps {
  metrics?: FinancialMetric[];
  notes?: string[];
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function LeafWatermark() {
  const theme = useTheme();
  return (
    <Box
      component="svg"
      viewBox="0 0 240 240"
      sx={{
        position: "absolute",
        top: -20,
        right: -20,
        width: 220,
        height: 220,
        pointerEvents: "none",
      }}
    >
      <path
        d="M240 0 C 200 40, 210 100, 160 130 C 120 154, 130 200, 100 240"
        fill="none"
        stroke={alpha(theme.palette.primary.main, 0.15)}
        strokeWidth={4}
      />
      <ellipse
        cx={190}
        cy={60}
        rx={30}
        ry={16}
        fill={alpha(theme.palette.secondary.main, 0.12)}
        transform="rotate(-30 190 60)"
      />
      <ellipse
        cx={140}
        cy={150}
        rx={26}
        ry={14}
        fill={alpha(theme.palette.primary.main, 0.1)}
        transform="rotate(-15 140 150)"
      />
    </Box>
  );
}

function TrendChip({
  trend,
}: {
  trend: NonNullable<FinancialMetric["trend"]>;
}) {
  const isUp = trend.direction === "up";
  return (
    <Chip
      size="small"
      icon={
        isUp ? (
          <TrendingUpRoundedIcon fontSize="small" />
        ) : (
          <TrendingDownRoundedIcon fontSize="small" />
        )
      }
      label={`${isUp ? "+" : "-"}${Math.abs(trend.value)}%`}
      color={isUp ? "success" : "error"}
      sx={{ fontWeight: 600, mt: 1 }}
    />
  );
}

export function FinancialOverviewCard({
  metrics = defaultFinancialMetrics,
  notes = defaultFinancialNotes,
}: FinancialOverviewCardProps) {
  return (
    <Card
      sx={{
        position: "relative",
        overflow: "hidden",
        p: { xs: 3, md: 4 },
      }}
    >
      <LeafWatermark />
      <Typography variant="h6" sx={{ mb: 3 }}>
        Financial Overview
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4, 1fr)" },
          gap: 3,
          position: "relative",
        }}
      >
        {metrics.map((metric) => (
          <Box key={metric.label}>
            <Typography variant="body2" color="text.secondary">
              {metric.label}
            </Typography>
            <Typography variant="h5" sx={{ mt: 0.5 }}>
              {currencyFormatter.format(metric.value)}
            </Typography>
            {metric.trend && <TrendChip trend={metric.trend} />}
          </Box>
        ))}
      </Box>

      <Box sx={{ mt: 4, position: "relative" }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          Trend Summary
        </Typography>
        <List sx={{ listStyleType: "disc", pl: 3, py: 0 }}>
          {notes.map((note) => (
            <ListItem key={note} sx={{ display: "list-item", p: 0, mb: 0.5 }}>
              <Typography variant="body2" color="text.secondary">
                {note}
              </Typography>
            </ListItem>
          ))}
        </List>
      </Box>
    </Card>
  );
}
