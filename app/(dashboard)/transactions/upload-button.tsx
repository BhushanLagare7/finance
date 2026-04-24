/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCSVReader } from "react-papaparse";

import { UploadIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { usePaywall } from "@/features/subscriptions/hooks/use-paywall";

interface UploadButtonProps {
  onUpload: (results: any) => void;
}

export const UploadButton = ({ onUpload }: UploadButtonProps) => {
  const { CSVReader } = useCSVReader();
  const { shouldBlock, triggerPaywall } = usePaywall();

  if (shouldBlock) {
    return (
      <Button className="w-full lg:w-auto" size="sm" onClick={triggerPaywall}>
        <UploadIcon className="mr-2 size-4" />
        Import
      </Button>
    );
  }

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
