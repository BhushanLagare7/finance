import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/hono";

type RequestType = InferRequestType<
  (typeof client.api.transactions)[":id"]["$patch"]
>["json"];
type ResponseType = InferResponseType<
  (typeof client.api.transactions)[":id"]["$patch"]
>;

export const useEditTransaction = (id?: string) => {
  const queryClient = useQueryClient();
  return useMutation<ResponseType, Error, RequestType>({
    mutationFn: async (json) => {
      if (!id) {
        throw new Error("Transaction ID is required");
      }
      const response = await client.api.transactions[":id"]["$patch"]({
        param: { id },
        json,
      });
      if (!response.ok) {
        throw new Error("Failed to edit transaction");
      }

      return await response.json();
    },
    onSuccess: () => {
      toast.success("Transaction edited successfully");
      queryClient.invalidateQueries({ queryKey: ["transaction", { id }] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["summary"] });
    },
    onError: () => {
      toast.error("Failed to edit transaction");
    },
  });
};
