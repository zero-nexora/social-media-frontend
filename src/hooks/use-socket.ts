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
} from "../types";

export const useSocket = () => {
  const { user, accessToken } = useAuthStore();
  const { connect, disconnect, socket } = useSocketStore();
  const { addNotification, incrementUnread, incrementFriendRequest } =
    useNotificationStore();
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
      if (location.pathname !== "/notifications") {
        toast(notif.fromUser.username, {
          description: getNotifDesc(notif.type, notif.fromUser.username),
        });
      }
    };

    // ── Friend events ─────────────────────────────────────
    const onFriendRequest = (_payload: SocketFriendRequestPayload) => {
      incrementFriendRequest();
      // if (location.pathname !== "/friends") {
      //   toast.info(`${payload.sender.username} đã gửi lời mời kết bạn`);
      // }
      queryClient.invalidateQueries({ queryKey: ["friendship-requests"] });
    };

    const onFriendAccepted = (_payload: SocketFriendAcceptedPayload) => {
      // toast.success(
      //   `${payload.accepter.username} đã chấp nhận lời mời kết bạn`,
      // );
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      queryClient.invalidateQueries({ queryKey: ["friend-suggestions"] });
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
    socket.on("friend_request", onFriendRequest);
    socket.on("friend_accepted", onFriendAccepted);
    socket.on("user:online", onUserOnline);
    socket.on("user:offline", onUserOffline);

    return () => {
      socket.off("new_notification", onNewNotification);
      socket.off("friend_request", onFriendRequest);
      socket.off("friend_accepted", onFriendAccepted);
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
  };
  return map[type] ?? "Có hoạt động mới";
};
