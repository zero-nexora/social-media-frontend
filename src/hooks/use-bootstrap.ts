import { useEffect, useState } from "react";
import axios from "axios";
import { useAuthStore } from "../stores/auth-store";
import { useNotificationStore } from "../stores/notification-store";
import { useSocketStore } from "../stores/socket-store";
import type { RefreshResponse, User } from "../types";

const BASE_URL = import.meta.env.VITE_API_URL as string;

export const useBootstrap = () => {
  const [isReady, setIsReady] = useState(false);
  const { setAuth } = useAuthStore();
  const { setUnreadCount, setFriendRequestCount } = useNotificationStore();
  const { connect } = useSocketStore();

  useEffect(() => {
    const restore = async () => {
      try {
        const refreshRes = await axios.post<RefreshResponse>(
          `${BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const accessToken = refreshRes.data.accessToken;

        const meRes = await axios.get<{ user: User }>(
          `${BASE_URL}/users/me`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
            withCredentials: true,
          }
        );

        const user = meRes.data.user;

        setAuth(user, accessToken);
        connect(user.id, accessToken);

        try {
          const [countRes, requestRes] = await Promise.all([
            axios.get<{ count: number }>(
              `${BASE_URL}/notifications/unread-count`,
              { headers: { Authorization: `Bearer ${accessToken}` }, withCredentials: true }
            ),
            axios.get<{ data: unknown[]; hasMore: boolean; nextCursor: string | null }>(
              `${BASE_URL}/friendships/requests?limit=1`,
              { headers: { Authorization: `Bearer ${accessToken}` }, withCredentials: true }
            ),
          ]);

          setUnreadCount(countRes.data.count);

          const requestCount = requestRes.data.hasMore
            ? 99 // clamp at 99+ badge
            : requestRes.data.data.length;
          setFriendRequestCount(requestCount);
        } catch {
          // Non-critical — badges just start at 0
        }
      } catch {
        // No valid session — store stays empty.
        // ProtectedRoute will redirect to /login automatically.
      } finally {
        setIsReady(true);
      }
    };

    restore();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { isReady };
};