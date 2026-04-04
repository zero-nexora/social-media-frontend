import { useMutation, useQueryClient } from "@tanstack/react-query";
import { followersApi } from "../services/api-services";
import { toast } from "sonner";
import { getApiError } from "../lib/get-api-error";

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

  return useMutation({
    mutationFn: () =>
      isFollowing
        ? followersApi.unfollow(profileId)
        : followersApi.follow(profileId),
    onSuccess: () => {
      toast.info(isFollowing ? "Đã bỏ theo dõi" : "Đã theo dõi");
      if (isFollowing) {
        qc.invalidateQueries({ queryKey: ["following", profileId] });
      } else {
        qc.invalidateQueries({ queryKey: ["followers", profileId] });
      }
      onSuccess?.();
    },
    onError: (err) => toast.error(getApiError(err, "Thao tác thất bại")),
  });
};
