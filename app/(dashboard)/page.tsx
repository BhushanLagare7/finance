import { DataCharts } from "@/components/data-charts";
import { DataGrid } from "@/components/data-grid";

const DashboardPage = () => {
  return (
    <div className="pb-10 mx-auto -mt-24 w-full max-w-screen-2xl">
      <DataGrid />
      <DataCharts />
    </div>
  );
};

export default DashboardPage;
