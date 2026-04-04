import { Link } from "react-router-dom";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInfiniteScroll } from "../../../hooks/use-infinite-scroll";
import { UserAvatar } from "../../shared/user-avatar";
import { UserCardSkeleton } from "../../shared/skeleton-card";
import type { User } from "../../../types";

interface UserListConfig {
  queryKey: string[];
  queryFn: (
    pageParam: string | undefined,
  ) => Promise<{ data: User[]; nextCursor?: string | null }>;
  emptyText: string;
  getSubtext: (user: User) => string;
}

interface Props {
  config: UserListConfig;
}

function UserListItem({ user, subtext }: { user: User; subtext: string }) {
  return (
    <Link
      to={`/profile/${user.id}`}
      className="flex items-center gap-3 p-3 bg-card border rounded-xl hover:bg-muted/40 transition-colors"
    >
      <UserAvatar user={user} size="md" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{user.username}</p>
        <p className="text-xs text-muted-foreground">{subtext}</p>
      </div>
    </Link>
  );
}

export function UserListTab({ config }: Props) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: config.queryKey,
      queryFn: ({ pageParam }) =>
        config.queryFn(pageParam as string | undefined),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (l) => l.nextCursor ?? undefined,
    });

  const sentinelRef = useInfiniteScroll({
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  });
  const users = (data?.pages.flatMap((p) => p.data) ?? []) as User[];

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {users.map((u) => (
          <UserListItem key={u.id} user={u} subtext={config.getSubtext(u)} />
        ))}
        {isLoading &&
          Array.from({ length: 4 }).map((_, i) => (
            <UserCardSkeleton key={`sk-${i}`} />
          ))}
      </div>
      {!isLoading && users.length === 0 && (
        <p className="text-center py-12 text-sm text-muted-foreground">
          {config.emptyText}
        </p>
      )}
      {isFetchingNextPage && <UserCardSkeleton />}
      <div ref={sentinelRef} />
    </div>
  );
}
