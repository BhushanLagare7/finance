import Image from "next/image";

import { CheckCircle2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useCheckoutSubscription } from "@/features/subscriptions/api/use-checkout-subscription";
import { useSubscriptionModal } from "@/features/subscriptions/hooks/use-subscription-modal";

export const SubscriptionModal = () => {
  const checkout = useCheckoutSubscription();
  const { isOpen, onClose } = useSubscriptionModal();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader className="flex items-center space-y-4">
          <Image alt="Logo" height={36} src="/logo.svg" width={36} />
          <DialogTitle className="text-center">
            Upgrade to a paid plan
          </DialogTitle>
          <DialogDescription className="text-center">
            Upgrade to a paid plan to get access to all features.
          </DialogDescription>
        </DialogHeader>
        <Separator />
        <ul className="space-y-2">
          <li className="flex items-center">
            <CheckCircle2Icon className="mr-2 text-white size-5 fill-blue-500" />
            <p className="text-sm text-muted-foreground">
              Bank account syncing
            </p>
          </li>
          <li className="flex items-center">
            <CheckCircle2Icon className="mr-2 text-white size-5 fill-blue-500" />
            <p className="text-sm text-muted-foreground">Upload CSV files</p>
          </li>
          <li className="flex items-center">
            <CheckCircle2Icon className="mr-2 text-white size-5 fill-blue-500" />
            <p className="text-sm text-muted-foreground">
              Different chart types
            </p>
          </li>
        </ul>
        <DialogFooter className="gap-y-2 pt-2 mt-4">
          <Button
            className="w-full"
            disabled={checkout.isPending}
            onClick={() => checkout.mutate()}
          >
            Upgrade
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
