import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/hono";

type RequestType = InferRequestType<
  (typeof client.api.accounts)[":id"]["$patch"]
>["json"];
type ResponseType = InferResponseType<
  (typeof client.api.accounts)[":id"]["$patch"]
>;

export const useEditAccount = (id?: string) => {
  const queryClient = useQueryClient();
  return useMutation<ResponseType, Error, RequestType>({
    mutationFn: async (json) => {
      if (!id) {
        throw new Error("Account ID is required");
      }
      const response = await client.api.accounts[":id"]["$patch"]({
        param: { id },
        json,
      });
      if (!response.ok) {
        throw new Error("Failed to edit account");
      }

      return await response.json();
    },
    onSuccess: () => {
      toast.success("Account edited successfully");
      queryClient.invalidateQueries({ queryKey: ["account", { id }] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["summary"] });
    },
    onError: () => {
      toast.error("Failed to edit account");
    },
  });
};
