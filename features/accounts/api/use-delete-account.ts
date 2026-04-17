import { InferResponseType } from "hono";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/hono";

type ResponseType = InferResponseType<
  (typeof client.api.accounts)[":id"]["$delete"]
>;

export const useDeleteAccount = (id?: string) => {
  const queryClient = useQueryClient();
  return useMutation<ResponseType, Error>({
    mutationFn: async () => {
      if (!id) {
        throw new Error("Account ID is required for deletion");
      }
      const response = await client.api.accounts[":id"]["$delete"]({
        param: { id },
      });
      if (!response.ok) {
        throw new Error("Failed to delete account");
      }

      return await response.json();
    },
    onSuccess: () => {
      toast.success("Account deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["account", { id }] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      // TODO: Invalidate summary and transactions
    },
    onError: () => {
      toast.error("Failed to delete account");
    },
  });
};
