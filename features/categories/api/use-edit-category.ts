import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/hono";

type RequestType = InferRequestType<
  (typeof client.api.categories)[":id"]["$patch"]
>["json"];
type ResponseType = InferResponseType<
  (typeof client.api.categories)[":id"]["$patch"]
>;

export const useEditCategory = (id?: string) => {
  const queryClient = useQueryClient();
  return useMutation<ResponseType, Error, RequestType>({
    mutationFn: async (json) => {
      if (!id) {
        throw new Error("Category ID is required");
      }
      const response = await client.api.categories[":id"]["$patch"]({
        param: { id },
        json,
      });
      if (!response.ok) {
        throw new Error("Failed to edit category");
      }

      return await response.json();
    },
    onSuccess: () => {
      toast.success("Category edited successfully");
      queryClient.invalidateQueries({ queryKey: ["category", { id }] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["summary"] });
    },
    onError: () => {
      toast.error("Failed to edit category");
    },
  });
};
