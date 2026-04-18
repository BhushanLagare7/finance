/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCSVReader } from "react-papaparse";

import { UploadIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

interface UploadButtonProps {
  onUpload: (results: any) => void;
}

export const UploadButton = ({ onUpload }: UploadButtonProps) => {
  const { CSVReader } = useCSVReader();

  // TODO: Add a paywall

  return (
    <CSVReader onUploadAccepted={onUpload}>
      {({ getRootProps }: any) => {
        return (
          <Button className="w-full lg:w-auto" size="sm" {...getRootProps()}>
            <UploadIcon className="mr-2 size-4" />
            Import
          </Button>
        );
      }}
    </CSVReader>
  );
};
