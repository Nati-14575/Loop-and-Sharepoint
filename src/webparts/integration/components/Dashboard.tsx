import * as React from "react";
import { Drawer, Fab, CircularProgress } from "@mui/material";
import BarChartIcon from "@mui/icons-material/BarChart";
import StatusBarChart from "./StatusBar";
import { SharePointService } from "../utils/SharePointService";
import { getSpfxCtx } from "../utils/spfxCtx";



const choiceOptions = ["col"];
const choiceField = "";
const listName = "";

const Dashboard: React.FC = () => {
    const [open, setOpen] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [chartData, setChartData] = React.useState<
        { statusName: string; count: number }[]
    >([]);
    const sharePointService = new SharePointService(getSpfxCtx());
    const toggleDrawer = (state: boolean) => () => setOpen(state);

    const loadChartData = async () => {
        setLoading(true);
        try {

            const counts = await sharePointService.fetchChoiceCounts(
                "",
                listName,
                choiceField,
                choiceOptions
            );
            setChartData(counts);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };


    React.useEffect(() => {
        if (open) loadChartData();
    }, [open, loadChartData]);

    return (
        <>
            <Fab
                color="primary"
                onClick={toggleDrawer(true)}
                sx={{
                    position: "fixed",
                    top: "50%",
                    right: "24px",
                    transform: "translateY(-50%)",
                    zIndex: 1200,
                }}
            >
                <BarChartIcon />
            </Fab>

            <Drawer
                anchor="right"
                open={open}
                onClose={toggleDrawer(false)}
                PaperProps={{
                    sx: { width: { xs: "90%", sm: 420 }, p: 2 },
                }}
            >
                {loading ? (
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            height: "100%",
                        }}
                    >
                        <CircularProgress />
                    </div>
                ) : (
                    <StatusBarChart data={chartData} title={`${choiceField} Summary`} />
                )}
            </Drawer>
        </>
    );
};

export default Dashboard;
