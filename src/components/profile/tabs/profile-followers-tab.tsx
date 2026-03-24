import { followersApi } from "../../../services/api-services";
import { UserListTab } from "./user-list-tab";

interface Props {
  userId: string;
}

export const ProfileFollowersTab = ({ userId }: Props) => (
  <UserListTab
    config={{
      queryKey: ["followers", userId],
      queryFn: (pageParam) => followersApi.getFollowers(userId, pageParam),
      emptyText: "Chưa có người theo dõi",
      getSubtext: (u) => `${u.followersCount} người theo dõi`,
    }}
  />
);
