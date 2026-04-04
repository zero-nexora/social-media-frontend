import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useNotificationStore } from "../stores/notification-store";
import { notificationsApi } from "../services/api-services";
import { getApiError } from "../lib/get-api-error";

export const useMarkAllReadMutation = () => {
  const qc = useQueryClient();
  const { markAllRead } = useNotificationStore();

  return useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => {
      markAllRead();
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (err: any) => toast.error(getApiError(err, "Thao tác thất bại")),
  });
};
