import { useState } from "react";

import { format, parse } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { convertAmountToMilliunits } from "@/lib/utils";

import { ImportTable } from "./import-table";

const dateFormat = "yyyy-MM-dd HH:mm:ss";
const outputFormat = "yyyy-MM-dd";

const requiredOptions = ["amount", "date", "payee"];

interface SelectedColumnsState {
  [key: string]: string | null;
}

interface ImportCardProps {
  data: string[][];
  onCancel: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSubmit: (data: any) => void;
}

export const ImportCard = ({ data, onCancel, onSubmit }: ImportCardProps) => {
  const [selectedColumns, setSelectedColumns] = useState<SelectedColumnsState>(
    {},
  );

  const headers = data[0];
  const body = data.slice(1);

  const onTableHeadSelectChange = (
    columnIndex: number,
    value: string | null,
  ) => {
    setSelectedColumns((prev) => {
      const newSelectedColumns = { ...prev };

      // Clear any existing column with the same value
      for (const key in newSelectedColumns) {
        if (newSelectedColumns[key] === value) {
          newSelectedColumns[key] = null;
        }
      }

      // If the value is "skip", set it to null
      if (value === "skip") {
        value = null;
      }

      // Set the selected column value
      newSelectedColumns[`column_${columnIndex}`] = value;

      return newSelectedColumns;
    });
  };

  // Calculate the progress based on the number of selected columns
  const progress = Object.values(selectedColumns).filter(Boolean).length;

  const handleContinue = () => {
    const getColumnIndex = (column: string) => {
      return column.split("_")[1] as unknown as number;
    };

    // Map the data to the selected columns
    const mappedData = {
      headers: headers.map((_header, index) => {
        // Get the column index from the selectedColumns key
        const columnIndex = getColumnIndex(`column_${index}`);

        // Get the selected column value for this header
        return selectedColumns[`column_${columnIndex}`] ?? null;
      }),
      body: body
        .map((row) => {
          const transformedRow = row.map((cell, index) => {
            // Get the column index from the selectedColumns key
            const columnIndex = getColumnIndex(`column_${index}`);

            // Get the selected column value for this cell
            return selectedColumns[`column_${columnIndex}`] ? cell : null;
          });

          // If all cells are null, return an empty array to filter out this row
          return transformedRow.every((cell) => cell === null)
            ? []
            : transformedRow;
        })
        // Filter out rows that are all null (empty)
        .filter((row) => row.length > 0),
    };

    // Map the body data to an array of objects, using the selected columns
    const arrayOfData = mappedData.body.map((row) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return row.reduce((acc: any, cell, index) => {
        const header = mappedData.headers[index];
        if (header !== null) {
          acc[header] = cell;
        }

        return acc;
      }, {});
    });

    // Convert the amount field to milliunits (integer)
    const formattedData = arrayOfData.map((item) => ({
      ...item,
      amount: convertAmountToMilliunits(parseFloat(item.amount)),
      date: format(parse(item.date, dateFormat, new Date()), outputFormat),
    }));

    onSubmit(formattedData);
  };

  return (
    <div className="pb-10 mx-auto -mt-24 w-full max-w-screen-2xl">
      <Card className="border-none drop-shadow-sm">
        <CardHeader className="gap-y-2 lg:flex lg:flex-row lg:items-center lg:justify-between">
          <CardTitle className="text-xl line-clamp-1">
            Import Transactions
          </CardTitle>
          <div className="flex flex-col gap-x-2 gap-y-2 items-center lg:flex-row">
            <Button className="w-full lg:w-auto" size="sm" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              className="w-full lg:w-auto"
              disabled={progress < requiredOptions.length}
              size="sm"
              onClick={handleContinue}
            >
              Continue ({progress}/{requiredOptions.length})
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ImportTable
            body={body}
            headers={headers}
            selectedColumns={selectedColumns}
            onTableHeadSelectChange={onTableHeadSelectChange}
          />
        </CardContent>
      </Card>
    </div>
  );
};
