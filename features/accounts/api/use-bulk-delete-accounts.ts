import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/hono";

type RequestType = InferRequestType<
  (typeof client.api.accounts)["bulk-delete"]["$post"]
>["json"];
type ResponseType = InferResponseType<
  (typeof client.api.accounts)["bulk-delete"]["$post"]
>;

export const useBulkDeleteAccounts = () => {
  const queryClient = useQueryClient();
  return useMutation<ResponseType, Error, RequestType>({
    mutationFn: async (json) => {
      const response = await client.api.accounts["bulk-delete"]["$post"]({
        json,
      });
      if (!response.ok) {
        throw new Error("Failed to delete accounts");
      }

      return await response.json();
    },
    onSuccess: () => {
      toast.success("Accounts Deleted");
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      // TODO: Also invalidate summary
    },
    onError: () => {
      toast.error("Failed to delete");
    },
  });
};
