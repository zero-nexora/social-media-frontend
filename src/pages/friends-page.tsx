import { useState } from "react";
import {
  useInfiniteQuery,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { Users, Search } from "lucide-react";
import { friendshipsApi } from "../services/api-services";
import { useInfiniteScroll } from "../hooks/use-infinite-scroll";
import { usePresence } from "../hooks/use-presence";
import {
  FriendRequestCard,
  FriendSuggestionCard,
  FriendCard,
} from "../components/friend/friend-card";
import { UserCardSkeleton } from "../components/shared/skeleton-card";
import { Input } from "../components/ui/input";
import { useAuth } from "../hooks/use-auth";
import type { User } from "../types";

export default function FriendsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [friendSearch, setFriendSearch] = useState("");

  // ─── Friend Requests ─────────────────────────────────
  const {
    data: requestData,
    fetchNextPage: fetchMoreRequests,
    hasNextPage: hasMoreRequests,
    isFetchingNextPage: fetchingRequests,
    isLoading: loadingRequests,
  } = useInfiniteQuery({
    queryKey: ["friendship-requests"],
    queryFn: ({ pageParam }) =>
      friendshipsApi.getRequests(pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

  const requestSentinelRef = useInfiniteScroll({
    fetchNextPage: fetchMoreRequests,
    hasNextPage: hasMoreRequests,
    isFetchingNextPage: fetchingRequests,
  });

  // ─── Suggestions ─────────────────────────────────────
  const { data: suggestions = [] } = useQuery({
    queryKey: ["friend-suggestions"],
    queryFn: () => friendshipsApi.getSuggestions(10),
  });

  // ─── All Friends ──────────────────────────────────────
  const {
    data: friendData,
    fetchNextPage: fetchMoreFriends,
    hasNextPage: hasMoreFriends,
    isFetchingNextPage: fetchingFriends,
    isLoading: loadingFriends,
  } = useInfiniteQuery({
    queryKey: ["friends", user?.id],
    queryFn: ({ pageParam }) =>
      friendshipsApi.getFriends(undefined, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

  const friendSentinelRef = useInfiniteScroll({
    fetchNextPage: fetchMoreFriends,
    hasNextPage: hasMoreFriends,
    isFetchingNextPage: fetchingFriends,
  });

  const unfriendMutation = useMutation({
    mutationFn: (userId: string) => friendshipsApi.unfriend(userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["friends"] }),
  });

  const requests = requestData?.pages.flatMap((p) => p.data) ?? [];
  const friends = (friendData?.pages.flatMap((p) => p.data) ?? []) as User[];
  const visibleSuggestions = suggestions.filter(
    (s) => !dismissed.has(s.user.id),
  );

  // ─── Online presence ──────────────────────────────────
  // Check which friends are online (batch call via socket)
  const friendIds = friends.map((f) => f.id);
  usePresence(friendIds);

  const filteredFriends = friendSearch
    ? friends.filter((f) =>
        f.username.toLowerCase().includes(friendSearch.toLowerCase()),
      )
    : friends;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* ─── Friend Requests ─────────────────────────── */}
      <section>
        <h2 className="font-bold text-lg mb-3">
          Lời mời kết bạn{" "}
          {requests.length > 0 && (
            <span className="text-muted-foreground font-normal">
              ({requests.length})
            </span>
          )}
        </h2>
        <div className="bg-card border rounded-xl overflow-hidden divide-y">
          {loadingRequests &&
            Array.from({ length: 3 }).map((_, i) => (
              <UserCardSkeleton key={i} />
            ))}

          {!loadingRequests && requests.length === 0 && (
            <div className="py-10 text-center">
              <Users
                size={36}
                className="mx-auto text-muted-foreground/40 mb-2"
              />
              <p className="text-sm text-muted-foreground">
                Không có lời mời kết bạn nào
              </p>
            </div>
          )}

          {requests.map((f) => (
            <FriendRequestCard key={f.id} friendship={f} />
          ))}
          {fetchingRequests && <UserCardSkeleton />}
          <div ref={requestSentinelRef} />
        </div>
      </section>

      {/* ─── Suggestions ─────────────────────────────── */}
      {visibleSuggestions.length > 0 && (
        <section>
          <h2 className="font-bold text-lg mb-3">
            Những người bạn có thể quen
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {visibleSuggestions.map((s) => (
              <FriendSuggestionCard
                key={s.user.id}
                suggestion={s}
                onDismiss={(id) =>
                  setDismissed((prev) => new Set(prev).add(id))
                }
              />
            ))}
          </div>
        </section>
      )}

      {/* ─── All Friends ─────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-lg">
            Bạn bè{" "}
            {friends.length > 0 && (
              <span className="text-muted-foreground font-normal">
                ({friends.length})
              </span>
            )}
          </h2>
        </div>

        {/* Local search */}
        <div className="relative mb-3">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Tìm kiếm bạn bè..."
            className="pl-9"
            value={friendSearch}
            onChange={(e) => setFriendSearch(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {loadingFriends &&
            Array.from({ length: 4 }).map((_, i) => (
              <UserCardSkeleton key={i} />
            ))}

          {!loadingFriends && filteredFriends.length === 0 && (
            <div className="col-span-2 py-10 text-center text-sm text-muted-foreground">
              {friendSearch ? "Không tìm thấy bạn bè nào" : "Chưa có bạn bè"}
            </div>
          )}

          {filteredFriends.map((f) => (
            <FriendCard
              key={f.id}
              friend={f}
              onUnfriend={(id) => unfriendMutation.mutate(id)}
            />
          ))}
        </div>

        {fetchingFriends && <UserCardSkeleton />}
        <div ref={friendSentinelRef} />
      </section>
    </div>
  );
}
