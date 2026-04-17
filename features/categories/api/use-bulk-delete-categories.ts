import { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/hono";

type RequestType = InferRequestType<
  (typeof client.api.categories)["bulk-delete"]["$post"]
>["json"];
type ResponseType = InferResponseType<
  (typeof client.api.categories)["bulk-delete"]["$post"]
>;

export const useBulkDeleteCategories = () => {
  const queryClient = useQueryClient();
  return useMutation<ResponseType, Error, RequestType>({
    mutationFn: async (json) => {
      const response = await client.api.categories["bulk-delete"]["$post"]({
        json,
      });
      if (!response.ok) {
        throw new Error("Failed to delete categories");
      }

      return await response.json();
    },
    onSuccess: () => {
      toast.success("Categories Deleted");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      // TODO: Also invalidate summary
    },
    onError: () => {
      toast.error("Failed to delete");
    },
  });
};
