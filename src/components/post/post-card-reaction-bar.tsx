import { useState, useRef } from "react";
import { MessageCircle, ThumbsUp } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import type { InfiniteData } from "@tanstack/react-query";
import { reactionsApi } from "../../services/api-services";
import { ReactionPicker } from "./reaction-picker";
import {
  REACTION_EMOJI,
  REACTION_LABEL,
  REACTION_COLOR,
  cn,
} from "../../lib/utils";
import type { Post, ReactionType, PaginatedResponse } from "../../types";
import { useAuth } from "../../hooks/use-auth";

interface Props {
  post: Post;
  inDetail?: boolean;
  onCommentClick?: () => void;
}

export const PostCardReactionBar = ({
  post,
  inDetail = false,
  onCommentClick,
}: Props) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showPicker, setShowPicker] = useState(false);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const myReaction = post.reactions?.[0]?.type ?? null;

  const updatePostInCache = (
    newLikesCount: number,
    newReactionType: ReactionType | null,
  ) => {
    queryClient.setQueriesData<InfiniteData<PaginatedResponse<Post>>>(
      { queryKey: ["feed"] },
      (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            data: page.data.map((p) =>
              p.id === post.id
                ? {
                    ...p,
                    likesCount: newLikesCount,
                    reactions: newReactionType
                      ? [{ type: newReactionType }]
                      : [],
                  }
                : p,
            ),
          })),
        };
      },
    );

    queryClient.setQueriesData<InfiniteData<PaginatedResponse<Post>>>(
      { queryKey: ["user-posts", user!.id] },
      (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            data: page.data.map((p) =>
              p.id === post.id
                ? {
                    ...p,
                    likesCount: newLikesCount,
                    reactions: newReactionType
                      ? [{ type: newReactionType }]
                      : [],
                  }
                : p,
            ),
          })),
        };
      },
    );

    queryClient.setQueryData<Post>(["post", post.id], (old) => {
      if (!old) return old;
      return {
        ...old,
        likesCount: newLikesCount,
        reactions: newReactionType ? [{ type: newReactionType }] : [],
      };
    });
  };

  const reactionMutation = useMutation({
    mutationFn: (type: ReactionType) => reactionsApi.toggle(post.id, type),
    onMutate: (type) => {
      let newLikesCount = post.likesCount;
      let newReactionType: ReactionType | null;

      if (!myReaction) {
        newLikesCount += 1;
        newReactionType = type;
      } else if (myReaction === type) {
        newLikesCount = Math.max(0, newLikesCount - 1);
        newReactionType = null;
      } else {
        newReactionType = type;
      }

      updatePostInCache(newLikesCount, newReactionType);
      return { prevMyReaction: myReaction, prevLikesCount: post.likesCount };
    },
    onSuccess: (data) => {
      updatePostInCache(
        data.post?.likesCount ?? post.likesCount,
        data.reaction?.type ?? null,
      );
    },
    onError: (_err, _type, context) => {
      if (context)
        updatePostInCache(context.prevLikesCount, context.prevMyReaction);
    },
  });

  const handleMouseEnter = () => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    hoverTimer.current = setTimeout(() => setShowPicker(true), 500);
  };

  const handleMouseLeave = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    leaveTimer.current = setTimeout(() => setShowPicker(false), 300);
  };

  const handleLikeClick = () => {
    if (showPicker) return;
    reactionMutation.mutate("LIKE");
  };

  const handlePickerSelect = (type: ReactionType) => {
    setShowPicker(false);
    reactionMutation.mutate(type);
  };

  const handleCommentClick = () => {
    if (inDetail) onCommentClick?.();
    else navigate(`/posts/${post.id}`);
  };

  return (
    <div className="space-y-1">
      {(post.likesCount > 0 || post.commentsCount > 0) && (
        <div className="flex items-center justify-between text-xs text-muted-foreground px-0.5">
          <div className="flex items-center gap-1">
            {myReaction && (
              <span className="text-sm">{REACTION_EMOJI[myReaction]}</span>
            )}
            {post.likesCount > 0 && <span>{post.likesCount} lượt cảm xúc</span>}
          </div>
          {post.commentsCount > 0 && (
            <button onClick={handleCommentClick} className="hover:underline">
              {post.commentsCount} bình luận
            </button>
          )}
        </div>
      )}

      <div className="h-px bg-border" />

      <div className="flex">
        <div
          className="relative flex-1"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {showPicker && (
            <div
              className="absolute bottom-full left-0 mb-2 z-20"
              onMouseEnter={() => {
                if (leaveTimer.current) clearTimeout(leaveTimer.current);
              }}
              onMouseLeave={handleMouseLeave}
            >
              <ReactionPicker onSelect={handlePickerSelect} />
            </div>
          )}

          <button
            onClick={handleLikeClick}
            disabled={reactionMutation.isPending}
            className={cn(
              "flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg",
              "text-sm font-medium transition-colors hover:bg-muted",
              myReaction ? REACTION_COLOR[myReaction] : "text-muted-foreground",
            )}
          >
            {myReaction ? (
              <span className="text-base leading-none">
                {REACTION_EMOJI[myReaction]}
              </span>
            ) : (
              <ThumbsUp size={15} />
            )}
            <span>{myReaction ? REACTION_LABEL[myReaction] : "Thích"}</span>
          </button>
        </div>

        <button
          onClick={handleCommentClick}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
        >
          <MessageCircle size={15} />
          <span>Bình luận</span>
        </button>
      </div>
    </div>
  );
};
