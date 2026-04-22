"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PlaidConnect } from "@/features/plaid/components/plaid-connect";
import { cn } from "@/lib/utils";

export const SettingsCard = () => {
  const connectedBank = null;

  return (
    <Card className="border-none drop-shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl line-clamp-1">Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <Separator />
        <div className="flex flex-col gap-y-2 items-center py-4 lg:flex-row">
          <p className="w-full text-sm font-medium lg:w-66">Bank Account</p>
          <div className="flex justify-between items-center w-full">
            <div
              className={cn(
                "text-sm truncate flex items-center",
                !connectedBank && "text-muted-foreground",
              )}
            >
              {connectedBank
                ? "Bank account connected"
                : "No bank account connected"}
            </div>
            <PlaidConnect />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
