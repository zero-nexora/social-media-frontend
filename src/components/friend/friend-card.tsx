import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, X, UserPlus, Clock } from "lucide-react";
import { friendshipsApi } from "../../services/api-services";
import { UserAvatar } from "../shared/user-avatar";
import { OnlineBadge } from "../shared/online-badge";
import { Button } from "../ui/button";
import { fromNow } from "../../lib/utils";
import type { Friendship, User, FriendSuggestion } from "../../types";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { useNotificationStore } from "../../stores/notification-store";
import { toast } from "sonner";

// ─── FriendRequestCard ────────────────────────────────────
export const FriendRequestCard = ({
  friendship,
}: {
  friendship: Friendship;
}) => {
  const queryClient = useQueryClient();
  const sender = friendship.sender!;
  const { decrementFriendRequest } = useNotificationStore();
  const [handled, setHandled] = useState(false);

  const accept = useMutation({
    mutationFn: () => friendshipsApi.accept(sender.id),
    onSuccess: () => {
      decrementFriendRequest();
      setHandled(true);
      queryClient.invalidateQueries({ queryKey: ["friendship-requests"] });
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
    onError: () => toast.error("Thao tác thất bại"),
  });

  const reject = useMutation({
    mutationFn: () => friendshipsApi.reject(sender.id),
    onSuccess: () => {
      decrementFriendRequest();
      setHandled(true);
      queryClient.invalidateQueries({ queryKey: ["friendship-requests"] });
    },
    onError: () => toast.error("Thao tác thất bại"),
  });

  if (handled) return null;

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors">
      <div className="relative shrink-0">
        <UserAvatar user={sender} size="lg" />
        <OnlineBadge userId={sender.id} className="absolute bottom-0 right-0" />
      </div>

      <div className="flex-1 min-w-0">
        <Link
          to={`/profile/${sender.username}`}
          className="font-semibold text-sm hover:underline"
        >
          {sender.username}
        </Link>
        {sender.friendsCount > 0 && (
          <p className="text-xs text-muted-foreground">
            {sender.friendsCount} bạn chung
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          {fromNow(friendship.updatedAt)}
        </p>
      </div>

      <div className="flex gap-2 shrink-0">
        <Button
          size="sm"
          onClick={() => accept.mutate()}
          disabled={accept.isPending}
        >
          <Check size={14} className="mr-1" /> Xác nhận
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => reject.mutate()}
          disabled={reject.isPending}
        >
          <X size={14} className="mr-1" /> Xoá
        </Button>
      </div>
    </div>
  );
};

// ─── FriendSuggestionCard ─────────────────────────────────
export const FriendSuggestionCard = ({
  suggestion,
  onDismiss,
}: {
  suggestion: FriendSuggestion;
  onDismiss: (userId: string) => void;
}) => {
  const queryClient = useQueryClient();
  const { user, mutualCount } = suggestion;

  const sendMutation = useMutation({
    mutationFn: () => friendshipsApi.sendRequest(user.id),
    onSuccess: () => {
      toast.info(`Đã gửi lời mời đến ${user.username}`);
      queryClient.invalidateQueries({ queryKey: ["friend-suggestions"] });
    },
    onError: () => toast.error("Gửi lời mời thất bại"),
  });

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border hover:bg-muted/30 transition-colors">
      <UserAvatar user={user} size="md" />

      <div className="flex-1 min-w-0">
        <Link
          to={`/profile/${user.username}`}
          className="font-semibold text-sm hover:underline"
        >
          {user.username}
        </Link>
        {mutualCount > 0 && (
          <p className="text-xs text-muted-foreground">
            {mutualCount} bạn chung
          </p>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant={sendMutation.isSuccess ? "secondary" : "default"}
          disabled={sendMutation.isSuccess || sendMutation.isPending}
          onClick={() => sendMutation.mutate()}
          className="h-8 px-2.5 text-xs"
        >
          {sendMutation.isSuccess ? (
            "Đã gửi"
          ) : (
            <>
              <UserPlus size={13} className="mr-1" />
              Thêm bạn
            </>
          )}
        </Button>
        <button
          onClick={() => onDismiss(user.id)}
          className="p-1.5 rounded-full hover:bg-muted text-muted-foreground"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
};

// ─── SentRequestCard — lời mời mình đã gửi, chờ đối phương ─
export const SentRequestCard = ({ friendship }: { friendship: Friendship }) => {
  const queryClient = useQueryClient();
  const receiver = friendship.receiver!;
  const [cancelled, setCancelled] = useState(false);

  const cancelMutation = useMutation({
    mutationFn: () => friendshipsApi.cancel(receiver.id),
    onSuccess: () => {
      setCancelled(true);
      toast.info(`Đã huỷ lời mời gửi đến ${receiver.username}`);
      queryClient.invalidateQueries({ queryKey: ["friendship-sent"] });
      queryClient.invalidateQueries({ queryKey: ["friend-suggestions"] });
      queryClient.invalidateQueries({
        queryKey: ["friend-suggestions-sidebar"],
      });
    },
    onError: () => toast.error("Huỷ lời mời thất bại"),
  });

  if (cancelled) return null;

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors">
      <div className="relative shrink-0">
        <UserAvatar user={receiver} size="lg" />
        <OnlineBadge
          userId={receiver.id}
          className="absolute bottom-0 right-0"
        />
      </div>

      <div className="flex-1 min-w-0">
        <Link
          to={`/profile/${receiver.username}`}
          className="font-semibold text-sm hover:underline"
        >
          {receiver.username}
        </Link>
        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
          <Clock size={10} />
          Đang chờ xác nhận · {fromNow(friendship.updatedAt)}
        </p>
      </div>

      <Button
        size="sm"
        variant="outline"
        onClick={() => cancelMutation.mutate()}
        disabled={cancelMutation.isPending}
        className="shrink-0"
      >
        {cancelMutation.isPending ? "Đang huỷ..." : "Huỷ lời mời"}
      </Button>
    </div>
  );
};

// ─── FriendCard ───────────────────────────────────────────
export const FriendCard = ({
  friend,
  onUnfriend,
}: {
  friend: User;
  onUnfriend?: (id: string) => void;
}) => {
  const [unfriendOpen, setUnfriendOpen] = useState(false);
  const [removed, setRemoved] = useState(false);

  if (removed) return null;

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border hover:bg-muted/30 transition-colors">
      <div className="relative shrink-0">
        <UserAvatar user={friend} size="md" />
        <OnlineBadge userId={friend.id} className="absolute bottom-0 right-0" />
      </div>

      <div className="flex-1 min-w-0">
        <Link
          to={`/profile/${friend.username}`}
          className="font-semibold text-sm hover:underline block truncate"
        >
          {friend.username}
        </Link>
        <p className="text-xs text-muted-foreground">
          {friend.friendsCount} bạn bè
        </p>
      </div>

      {onUnfriend && (
        <>
          <Button
            size="sm"
            variant="ghost"
            className="text-xs text-muted-foreground shrink-0"
            onClick={() => setUnfriendOpen(true)}
          >
            Huỷ kết bạn
          </Button>

          <AlertDialog open={unfriendOpen} onOpenChange={setUnfriendOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Huỷ kết bạn?</AlertDialogTitle>
                <AlertDialogDescription>
                  Bạn sẽ không còn là bạn bè nữa.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Huỷ</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive hover:bg-destructive/90"
                  onClick={() => {
                    setRemoved(true);
                    onUnfriend(friend.id);
                  }}
                >
                  Xác nhận
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
};
