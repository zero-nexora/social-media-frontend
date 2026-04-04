import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { friendshipsApi } from "../services/api-services";
import { getApiError } from "../lib/get-api-error";
import { useNotificationStore } from "../stores/notification-store";

export const useUnfriendMutation = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => friendshipsApi.unfriend(userId),
    onError: (err: any) => {
      toast.error(getApiError(err, "Huỷ kết bạn thất bại"));
      qc.invalidateQueries({ queryKey: ["friends"] });
    },
  });
};

export const useSendRequestMutation = ({
  profile,
  onSuccess,
}: {
  profile: { id: string; username: string };
  onSuccess?: () => void;
}) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () => friendshipsApi.sendRequest(profile.id),
    onSuccess: () => {
      toast.info(`Đã gửi lời mời đến ${profile.username}`);
      qc.invalidateQueries({ queryKey: ["friend-suggestions"] });
      qc.invalidateQueries({ queryKey: ["friend-suggestions-sidebar"] });
      qc.invalidateQueries({ queryKey: ["friendship-sent"] });
      onSuccess?.();
    },
    onError: (err) => toast.error(getApiError(err, "Thao tác thất bại")),
  });
};

export const useCancelRequestMutation = ({
  profile,
  onSuccess,
}: {
  profile: { id: string; username: string };
  onSuccess?: () => void;
}) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () => friendshipsApi.cancel(profile.id),
    onSuccess: () => {
      toast.info(`Đã huỷ lời mời gửi đến ${profile.username}`);
      qc.invalidateQueries({ queryKey: ["friendship-sent"] });
      onSuccess?.();
      qc.invalidateQueries({ queryKey: ["friend-suggestions"] });
      qc.invalidateQueries({ queryKey: ["friend-suggestions-sidebar"] });
    },
    onError: (err) => toast.error(getApiError(err, "Thao tác thất bại")),
  });
};

export const useAcceptRequestMutation = ({
  senderId,
  onSuccess,
}: {
  senderId: string;
  onSuccess?: () => void;
}) => {
  const qc = useQueryClient();
  const { decrementFriendRequest } = useNotificationStore();

  return useMutation({
    mutationFn: () => friendshipsApi.accept(senderId),
    onSuccess: () => {
      decrementFriendRequest();
      toast.success("Đã chấp nhận lời mời");
      qc.invalidateQueries({ queryKey: ["friendship-requests"] });
      qc.invalidateQueries({ queryKey: ["friends"] });
      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: ["stories-feed"] });
      onSuccess?.();
    },
    onError: (err) => toast.error(getApiError(err, "Thao tác thất bại")),
  });
};

export const useRejectRequestMutation = ({
  senderId,
  onSuccess,
}: {
  senderId: string;
  onSuccess?: () => void;
}) => {
  const qc = useQueryClient();
  const { decrementFriendRequest } = useNotificationStore();

  return useMutation({
    mutationFn: () => friendshipsApi.reject(senderId),
    onSuccess: () => {
      decrementFriendRequest();
      toast.info("Đã từ chối lời mời");
      qc.invalidateQueries({ queryKey: ["friendship-requests"] });
      qc.invalidateQueries({ queryKey: ["friend-suggestions"] });
      qc.invalidateQueries({ queryKey: ["friend-suggestions-sidebar"] });
      onSuccess?.();
    },
    onError: (err) => toast.error(getApiError(err, "Thao tác thất bại")),
  });
};

export const useBlockMutation = ({
  profileId,
  onSuccess,
}: {
  profileId: string;
  onSuccess?: () => void;
}) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () => friendshipsApi.block(profileId),
    onSuccess: () => {
      toast.info("Đã chặn người dùng");
      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: ["friends"] });
      qc.invalidateQueries({ queryKey: ["friend-suggestions"] });
      qc.invalidateQueries({ queryKey: ["friend-suggestions-sidebar"] });
      onSuccess?.();
    },
    onError: (err) => toast.error(getApiError(err, "Thao tác thất bại")),
  });
};

export const useUnblockMutation = ({
  profileId,
  onSuccess,
}: {
  profileId: string;
  onSuccess?: () => void;
}) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () => friendshipsApi.unblock(profileId),
    onSuccess: () => {
      toast.info("Đã huỷ chặn người dùng");
      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: ["friends"] });
      qc.invalidateQueries({ queryKey: ["friend-suggestions"] });
      qc.invalidateQueries({ queryKey: ["friend-suggestions-sidebar"] });
      onSuccess?.();
    },
    onError: (err) => toast.error(getApiError(err, "Thao tác thất bại")),
  });
};
