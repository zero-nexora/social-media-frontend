import { useMutation, useQueryClient } from "@tanstack/react-query";
import { followersApi } from "../services/api-services";
import { toast } from "sonner";
import { getApiError } from "../lib/get-api-error";
import { useAuth } from "./use-auth";

export const useFollowMutation = ({
  profileId,
  isFollowing,
  onSuccess,
}: {
  profileId: string;
  isFollowing: boolean;
  onSuccess?: () => void;
}) => {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: () =>
      isFollowing
        ? followersApi.unfollow(profileId)
        : followersApi.follow(profileId),
    onSuccess: () => {
      toast.info(isFollowing ? "Đã bỏ theo dõi" : "Đã theo dõi");
      qc.invalidateQueries({ queryKey: ["feed", user?.id] });
      onSuccess?.();
    },
    onError: (err) => toast.error(getApiError(err, "Thao tác thất bại")),
  });
};
