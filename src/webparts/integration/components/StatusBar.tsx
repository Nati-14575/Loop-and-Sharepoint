import * as React from "react";
import { Card, CardContent, CardHeader } from "@mui/material";
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

export interface StatusData {
    statusName: string;
    count: number;
}

interface StatusBarChartProps {
    data: StatusData[];
    colors?: string[];
    title?: string;
}

const DEFAULT_COLORS = [
    "#4f46e5", // indigo
    "#22c55e", // green
    "#ef4444", // red
    "#f59e0b", // amber
    "#3b82f6", // blue
    "#a855f7", // purple
];

const StatusBarChart: React.FC<StatusBarChartProps> = ({
    data,
    colors = DEFAULT_COLORS,
    title = "Status Overview",
}) => {
    const colorMap = data.reduce((acc: { [key: string]: string }, d, i) => {
        acc[d.statusName] = colors[i % colors.length];
        return acc;
    }, {});

    return (
        <Card sx={{ width: "100%", p: 2 }}>
            <CardHeader title={title} />

            {/* Legend */}
            <div
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "12px",
                    margin: "8px 24px",
                }}
            >
                {data.map((d, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span
                            style={{
                                height: "12px",
                                width: "12px",
                                borderRadius: "2px",
                                backgroundColor: colorMap[d.statusName],
                            }}
                        />
                        <span style={{ fontSize: "0.9rem" }}>{d.statusName}</span>
                    </div>
                ))}
            </div>

            <CardContent sx={{ height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 50, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="statusName" type="category" width={100} />
                        <Tooltip />
                        <Bar dataKey="count" barSize={20}>
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={colorMap[entry.statusName]}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
};

export default StatusBarChart;
