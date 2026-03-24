import { useEffect } from "react";
import { useSocketStore } from "../stores/socket-store";
import { usePresenceStore } from "../stores/presence-store";

export const usePresence = (userIds: string[]) => {
  const { socket } = useSocketStore();
  const { setMany, isOnline } = usePresenceStore();

  useEffect(() => {
    if (!socket || userIds.length === 0) return;

    socket.emit("presence:check", userIds, (onlineIds: string[]) => {
      setMany(onlineIds);
    });
  }, [socket, userIds.join(",")]); // eslint-disable-line

  return isOnline;
};
