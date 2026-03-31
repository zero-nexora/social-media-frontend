import { useRef, useState } from "react";
import { Camera } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { usersApi, followersApi } from "../../services/api-services";
import { usePresence } from "../../hooks/use-presence";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";
import { FriendshipButton } from "../friend/friendship-button";
import { OnlineBadge } from "../shared/online-badge";
import { cn } from "../../lib/utils";
import type { User, FriendshipStatus } from "../../types";
import { AvatarDefault } from "../shared/avatar-default";

interface Props {
  profile: User;
  isOwn: boolean;
  friendshipStatus: FriendshipStatus;
  isFollowing: boolean;
  onRefresh: () => void;
}

function StatItem({ count, label }: { count: number; label: string }) {
  return (
    <span>
      <span className="font-semibold text-foreground">{count}</span>{" "}
      <span>{label}</span>
    </span>
  );
}

export const ProfileInfo = ({
  profile,
  isOwn,
  friendshipStatus,
  isFollowing,
  onRefresh,
}: Props) => {
  const queryClient = useQueryClient();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editUsername, setEditUsername] = useState(profile.username);
  const [editBio, setEditBio] = useState(profile.bio ?? "");

  usePresence(isOwn ? [] : [profile.id]);

  const avatar = useMutation({
    mutationFn: (file: File) => usersApi.updateAvatar(file),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["profile", profile.username],
      });
      toast.success("Đã cập nhật ảnh đại diện");
    },
    onError: () => toast.error("Cập nhật thất bại"),
  });

  const edit = useMutation({
    mutationFn: () =>
      usersApi.updateMe({
        username: editUsername !== profile.username ? editUsername : undefined,
        bio: editBio !== (profile.bio ?? "") ? editBio : undefined,
      }),
    onSuccess: () => {
      setEditOpen(false);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Đã cập nhật thông tin");
      onRefresh();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message ?? "";
      toast.error(
        msg.includes("Username")
          ? "Username đã được sử dụng"
          : "Cập nhật thất bại",
      );
    },
  });

  const follow = useMutation({
    mutationFn: () =>
      isFollowing
        ? followersApi.unfollow(profile.id)
        : followersApi.follow(profile.id),
    onSuccess: () => {
      onRefresh();
      queryClient.invalidateQueries({ queryKey: ["following", profile.id] });
      queryClient.invalidateQueries({ queryKey: ["followers", profile.id] });
      toast.info(isFollowing ? "Đã bỏ theo dõi" : "Đã theo dõi");
    },
  });

  const openEdit = () => {
    setEditUsername(profile.username);
    setEditBio(profile.bio ?? "");
    setEditOpen(true);
  };

  return (
    <>
      <div className="bg-card border rounded-xl p-4 -mt-16 pt-0 relative">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          {/* Avatar */}
          <div className="relative -mt-10 sm:-mt-12 mb-2 w-fit">
            <div
              className={cn(
                "rounded-full border-4 border-background overflow-hidden",
                "w-24 h-24 sm:w-28 sm:h-28",
              )}
            >
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt={profile.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <AvatarDefault />
              )}
            </div>

            {!isOwn && (
              <OnlineBadge
                userId={profile.id}
                size="md"
                className="absolute bottom-1 right-1 border-2 border-background"
              />
            )}

            {isOwn && (
              <>
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={avatar.isPending}
                  className="absolute bottom-0 right-0 w-7 h-7 bg-muted border-2 border-background rounded-full flex items-center justify-center hover:bg-muted/70 transition-colors disabled:opacity-60 z-10"
                >
                  <Camera size={13} />
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) =>
                    e.target.files?.[0] && avatar.mutate(e.target.files[0])
                  }
                />
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pb-1">
            {isOwn ? (
              <Button size="sm" variant="outline" onClick={openEdit}>
                Chỉnh sửa trang cá nhân
              </Button>
            ) : (
              <>
                <FriendshipButton
                  profile={profile}
                  status={friendshipStatus}
                  onStatusChange={onRefresh}
                />
                <Button
                  size="sm"
                  variant={isFollowing ? "secondary" : "outline"}
                  onClick={() => follow.mutate()}
                  disabled={follow.isPending}
                >
                  {isFollowing ? "Đang theo dõi" : "Theo dõi"}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Name / bio / stats */}
        <div className="mt-2 space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold">{profile.username}</h1>
          </div>
          {profile.bio && (
            <p className="text-sm text-muted-foreground">{profile.bio}</p>
          )}
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground pt-1">
            <StatItem count={profile.friendsCount} label="Bạn bè" />
            <StatItem count={profile.followersCount} label="Người theo dõi" />
            <StatItem count={profile.followingCount} label="Đang theo dõi" />
          </div>
        </div>
      </div>

      {/* Edit sheet */}
      <Sheet open={editOpen} onOpenChange={setEditOpen}>
        <SheetContent side="right" className="w-full sm:max-w-sm">
          <SheetHeader>
            <SheetTitle>Chỉnh sửa trang cá nhân</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Username</label>
              <Input
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                maxLength={20}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Bio</label>
              <textarea
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                maxLength={200}
                rows={4}
                className="w-full border rounded-xl px-3 py-2 text-sm resize-none bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="Giới thiệu bản thân..."
              />
              <p className="text-xs text-muted-foreground text-right">
                {editBio.length}/200
              </p>
            </div>
            <Button
              className="w-full"
              onClick={() => edit.mutate()}
              disabled={edit.isPending}
            >
              {edit.isPending ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
