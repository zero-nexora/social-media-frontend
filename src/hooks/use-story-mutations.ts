import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { storiesApi } from "../services/api-services";
import { getApiError } from "../lib/get-api-error";

export const useCreateStoryMutation = ({
  onSuccess,
}: { onSuccess?: () => void } = {}) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ file, caption }: { file: File; caption?: string }) =>
      storiesApi.create(file, caption),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stories-feed"] });
      toast.success("Đã đăng story");
      onSuccess?.();
    },
    onError: (err) => toast.error(getApiError(err, "Đăng story thất bại")),
  });
};

export const useDeleteStoryMutation = ({
  userId,
  onSuccess,
}: {
  userId?: string;
  onSuccess?: () => void;
}) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (storyId: string) => storiesApi.delete(storyId),
    onSuccess: () => {
      toast.success("Đã xoá story");
      qc.invalidateQueries({ queryKey: ["stories-feed"] });
      if (userId) qc.invalidateQueries({ queryKey: ["my-stories", userId] });
      onSuccess?.();
    },
    onError: (err) => toast.error(getApiError(err, "Xoá story thất bại")),
  });
};
