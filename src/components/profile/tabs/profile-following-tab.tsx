import { followersApi } from "../../../services/api-services";
import { UserListTab } from "./user-list-tab";

interface Props {
  userId: string;
}

export const ProfileFollowingTab = ({ userId }: Props) => (
  <UserListTab
    config={{
      queryKey: ["following", userId],
      queryFn: (pageParam) => followersApi.getFollowing(userId, pageParam),
      emptyText: "Chưa theo dõi ai",
      getSubtext: (u) => `${u.followersCount} người theo dõi`,
    }}
  />
);
