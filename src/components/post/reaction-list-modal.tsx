import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { Link } from "react-router-dom";
import { reactionsApi } from "../../services/api-services";
import { REACTION_EMOJI, REACTION_LABEL } from "../../lib/utils";
import type { ReactionType, ReactionSummary, Reaction } from "../../types";
import { UserCardSkeleton } from "../shared/skeleton-card";
import { AvatarDefault } from "../shared/avatar-default";
import { useInfiniteScroll } from "../../hooks/use-infinite-scroll";

const ALL_TYPES: ReactionType[] = [
  "LIKE",
  "LOVE",
  "HAHA",
  "WOW",
  "SAD",
  "ANGRY",
];

interface Props {
  postId: string;
  open: boolean;
  onClose: () => void;
  summary: ReactionSummary;
  defaultTab: ReactionType | "ALL";
}

interface TabProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

const Tab = ({ label, active, onClick }: TabProps) => (
  <button
    onClick={onClick}
    className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
      active
        ? "border-primary text-primary"
        : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
    }`}
  >
    {label}
  </button>
);

interface ListProps {
  postId: string;
  type?: ReactionType;
}

const ReactionList = ({ postId, type }: ListProps) => {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: ["reactions", postId, type ?? "ALL"],
      queryFn: ({ pageParam }) =>
        reactionsApi.getByPost(
          postId,
          pageParam as string | undefined,
          20,
          type,
        ),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (last) => last.nextCursor ?? undefined,
    });

  const sentinelRef = useInfiniteScroll({
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  });

  const items = data?.pages.flatMap((p) => p.data) ?? [];

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 animate-pulse">
            <div className="w-9 h-9 rounded-full bg-muted" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 bg-muted rounded w-24" />
              <div className="h-2.5 bg-muted rounded w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
        Chưa có cảm xúc nào
      </div>
    );
  }

  return (
    <div className="overflow-y-auto max-h-100 p-2">
      {items.map((reaction: Reaction) => (
        <Link
          key={reaction.id}
          to={`/profile/${reaction.user?.username}`}
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <div className="relative shrink">
            {reaction.user?.avatar ? (
              <img
                src={reaction.user.avatar}
                alt={reaction.user.username}
                className="w-9 h-9 rounded-full object-cover"
              />
            ) : (
              <AvatarDefault />
            )}
            <span className="absolute -bottom-0.5 -right-0.5 text-xs leading-none">
              {REACTION_EMOJI[reaction.type]}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {reaction.user?.username}
            </p>
            <p className="text-xs text-muted-foreground">
              {REACTION_LABEL[reaction.type]}
            </p>
          </div>
        </Link>
      ))}

      <div ref={sentinelRef} />

      {isFetchingNextPage && <UserCardSkeleton />}
    </div>
  );
};

export const ReactionListModal = ({
  postId,
  open,
  onClose,
  summary,
  defaultTab,
}: Props) => {
  const [activeTab, setActiveTab] = useState<ReactionType | "ALL">(defaultTab);

  if (!open) return null;

  const activeTabs = ALL_TYPES.filter((t) => summary.byType[t] > 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="relative bg-card border rounded-xl shadow-xl w-full max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <h3 className="font-semibold text-sm">Cảm xúc</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex items-center px-2 border-b overflow-x-auto scrollbar-none">
          <Tab
            label={`Tất cả ${summary.total}`}
            active={activeTab === "ALL"}
            onClick={() => setActiveTab("ALL")}
          />
          {activeTabs.map((type) => (
            <Tab
              key={type}
              label={`${REACTION_EMOJI[type]} ${summary.byType[type]}`}
              active={activeTab === type}
              onClick={() => setActiveTab(type)}
            />
          ))}
        </div>

        <ReactionList
          postId={postId}
          type={activeTab === "ALL" ? undefined : activeTab}
        />
      </div>
    </div>
  );
};
