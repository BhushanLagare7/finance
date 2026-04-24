import { Button } from "@/components/ui/button";
import { useCheckoutSubscription } from "@/features/subscriptions/api/use-checkout-subscription";
import { useGetSubscription } from "@/features/subscriptions/api/use-get-subscription";

export const SubscriptionCheckout = () => {
  const checkoutSubscription = useCheckoutSubscription();
  const { data: subscription, isLoading: isLoadingSubscription } =
    useGetSubscription();

  return (
    <Button
      disabled={checkoutSubscription.isPending || isLoadingSubscription}
      size="sm"
      variant="ghost"
      onClick={() => checkoutSubscription.mutate()}
    >
      {subscription ? "Manage" : "Upgrade"}
    </Button>
  );
};
