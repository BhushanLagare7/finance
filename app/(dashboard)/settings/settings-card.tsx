"use client";

import { Loader2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetConnectedBank } from "@/features/plaid/api/use-get-connected-bank";
import { PlaidConnect } from "@/features/plaid/components/plaid-connect";
import { PlaidDisconnect } from "@/features/plaid/components/plaid-disconnect";
import { useGetSubscription } from "@/features/subscriptions/api/use-get-subscription";
import { SubscriptionCheckout } from "@/features/subscriptions/components/subscription-checkout";
import { cn } from "@/lib/utils";

export const SettingsCard = () => {
  const { data: connectedBank, isLoading: isLoadingConnectedBank } =
    useGetConnectedBank();
  const { data: subscription, isLoading: isLoadingSubscription } =
    useGetSubscription();

  if (isLoadingConnectedBank || isLoadingSubscription) {
    return (
      <Card className="border-none drop-shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl line-clamp-1">
            <Skeleton className="w-24 h-6" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-87.5 w-full flex items-center justify-center">
            <Loader2 className="animate-spin size-6 text-slate-300" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none drop-shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl line-clamp-1">Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <Separator />
        <div className="flex flex-col gap-y-2 items-center py-4 lg:flex-row">
          <p className="w-full text-sm font-medium lg:w-66">Bank account</p>
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
            {connectedBank ? <PlaidDisconnect /> : <PlaidConnect />}
          </div>
        </div>
        <Separator />
        <div className="flex flex-col gap-y-2 items-center py-4 lg:flex-row">
          <p className="w-full text-sm font-medium lg:w-66">Subscription</p>
          <div className="flex justify-between items-center w-full">
            <div
              className={cn(
                "text-sm truncate flex items-center",
                !subscription && "text-muted-foreground",
              )}
            >
              {subscription
                ? `Subscription ${subscription.status}`
                : "No subscription"}
            </div>
            <SubscriptionCheckout />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
