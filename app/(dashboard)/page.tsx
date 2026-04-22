import { Suspense } from "react";

import { DataCharts } from "@/components/data-charts";
import { DataGrid } from "@/components/data-grid";

const DashboardPage = () => {
  return (
    <div className="pb-10 mx-auto -mt-24 w-full max-w-screen-2xl">
      <Suspense fallback={null}>
        <DataGrid />
      </Suspense>
      <Suspense fallback={null}>
        <DataCharts />
      </Suspense>
    </div>
  );
};

export default DashboardPage;
