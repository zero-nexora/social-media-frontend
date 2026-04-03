import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useAuthStore } from "../stores/auth-store";
import { useSocketStore } from "../stores/socket-store";
import { useNotificationStore } from "../stores/notification-store";
import { usePresenceStore } from "../stores/presence-store";
import { useQueryClient } from "@tanstack/react-query";
import type {
  Notification,
  SocketFriendRequestPayload,
  SocketFriendAcceptedPayload,
  SocketFriendRequestCancelledPayload,
  SocketFriendUnfriendedPayload,
  SocketStoryNewPayload,
  SocketStoryDeletedPayload,
} from "../types";

export const useSocket = () => {
  const { user, accessToken } = useAuthStore();
  const { connect, disconnect, socket } = useSocketStore();
  const {
    addNotification,
    incrementUnread,
    incrementFriendRequest,
    decrementFriendRequest,
  } = useNotificationStore();
  const { setOnline, setOffline, clear: clearPresence } = usePresenceStore();
  const queryClient = useQueryClient();
  const location = useLocation();

  useEffect(() => {
    if (!user || !accessToken) return;

    connect(user.id, accessToken);

    return () => {
      disconnect();
      clearPresence();
    };
  }, [user?.id, accessToken]); // eslint-disable-line

  useEffect(() => {
    if (!socket) return;

    const handleDisconnect = (_reason: string) => {
      clearPresence();
    };

    const handleConnectError = () => {
      clearPresence();
    };

    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);

    return () => {
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
    };
  }, [socket]); // eslint-disable-line

  useEffect(() => {
    if (!socket) return;

    // ── Notifications ─────────────────────────────────────
    const onNewNotification = (notif: Notification) => {
      addNotification(notif);
      incrementUnread();
      if (location.pathname !== "/notifications" && notif.type !== "NEW_POST") {
        toast(notif.fromUser.username, {
          description: getNotifDesc(notif.type, notif.fromUser.username),
        });
      }
    };

    // ── Friend events ─────────────────────────────────────
    const onFriendRequest = (payload: SocketFriendRequestPayload) => {
      incrementFriendRequest();
      queryClient.invalidateQueries({ queryKey: ["friendship-requests"] });
      queryClient.invalidateQueries({ queryKey: ["friend-suggestions"] });
      queryClient.invalidateQueries({
        queryKey: ["friend-suggestions-sidebar"],
      });
      queryClient.invalidateQueries({
        queryKey: ["profile", payload.sender.username],
      });
    };

    const onFriendAccepted = (payload: SocketFriendAcceptedPayload) => {
      queryClient.invalidateQueries({ queryKey: ["friendship-sent"] });
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      queryClient.invalidateQueries({ queryKey: ["profile", user?.username] });
      queryClient.invalidateQueries({
        queryKey: ["profile", payload.accepter.username],
      });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["friends", user?.id] });
      queryClient.invalidateQueries({
        queryKey: ["friends", payload.accepter.id],
      });
    };

    const onFriendRequestCancelled = (
      payload: SocketFriendRequestCancelledPayload,
    ) => {
      decrementFriendRequest();
      queryClient.invalidateQueries({ queryKey: ["friendship-requests"] });
      queryClient.invalidateQueries({
        queryKey: ["profile", payload.sender.username],
      });
    };

    const onFriendUnfriended = (_payload: SocketFriendUnfriendedPayload) => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      queryClient.invalidateQueries({ queryKey: ["friends", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["profile", user?.username] });
      queryClient.invalidateQueries({ queryKey: ["stories-feed"] });
    };

    const onStoryNew = (payload: SocketStoryNewPayload) => {
      queryClient.invalidateQueries({ queryKey: ["stories-feed"] });
      toast(`${payload.user.username} vừa đăng một story mới`);
    };

    const onStoryDeleted = (_payload: SocketStoryDeletedPayload) => {
      queryClient.invalidateQueries({ queryKey: ["stories-feed"] });
    };

    // ── Presence — another user came online ───────────────
    const onUserOnline = ({ userId }: { userId: string }) => {
      setOnline(userId);
    };

    // ── Presence — another user's last tab closed ─────────
    const onUserOffline = ({ userId }: { userId: string }) => {
      setOffline(userId);
    };

    socket.on("new_notification", onNewNotification);
    socket.on("story:new", onStoryNew);
    socket.on("story:deleted", onStoryDeleted);
    socket.on("friend_request", onFriendRequest);
    socket.on("friend_request_cancelled", onFriendRequestCancelled);
    socket.on("friend_unfriended", onFriendUnfriended);
    socket.on("friend_accepted", onFriendAccepted);
    socket.on("user:online", onUserOnline);
    socket.on("user:offline", onUserOffline);

    return () => {
      socket.off("new_notification", onNewNotification);
      socket.off("story:new", onStoryNew);
      socket.off("story:deleted", onStoryDeleted);
      socket.off("friend_request", onFriendRequest);
      socket.off("friend_request_cancelled", onFriendRequestCancelled);
      socket.off("friend_accepted", onFriendAccepted);
      socket.off("friend_unfriended", onFriendUnfriended);
      socket.off("user:online", onUserOnline);
      socket.off("user:offline", onUserOffline);
    };
  }, [socket, location.pathname]); // eslint-disable-line
};

// ─── Helpers ──────────────────────────────────────────────
const getNotifDesc = (type: string, username: string): string => {
  const map: Record<string, string> = {
    FRIEND_REQUEST: `${username} đã gửi lời mời kết bạn`,
    FRIEND_ACCEPTED: `${username} đã chấp nhận lời mời kết bạn`,
    POST_REACT: `${username} đã react bài viết của bạn`,
    POST_COMMENT: `${username} đã bình luận bài viết của bạn`,
    COMMENT_REPLY: `${username} đã trả lời bình luận của bạn`,
    NEW_FOLLOWER: `${username} đã theo dõi bạn`,
    NEW_POST: `${username} vừa đăng bài viết mới`,
  };
  return map[type] ?? "Có hoạt động mới";
};
