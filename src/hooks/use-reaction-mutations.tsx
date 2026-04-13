import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { InfiniteData } from "@tanstack/react-query";
import type { PaginatedResponse, Post, ReactionType } from "../types";
import { reactionsApi } from "../services/api-services";

export const useReactionMutation = (post: Post, userId?: string) => {
  const queryClient = useQueryClient();
  const [showPicker, setShowPicker] = useState(false);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const myReaction = post.reactions?.[0]?.type ?? null;

  const updatePostInCache = (
    newLikesCount: number,
    newReactionType: ReactionType | null,
  ) => {
    const updatePages = (
      old: InfiniteData<PaginatedResponse<Post>> | undefined,
    ) => {
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
                  reactions: newReactionType ? [{ type: newReactionType }] : [],
                }
              : p,
          ),
        })),
      };
    };

    queryClient.setQueriesData<InfiniteData<PaginatedResponse<Post>>>(
      { queryKey: ["feed"] },
      updatePages,
    );
    queryClient.setQueriesData<InfiniteData<PaginatedResponse<Post>>>(
      { queryKey: ["user-posts", userId] },
      updatePages,
    );
    queryClient.setQueryData<Post>(["post", post.id], (old) =>
      old
        ? {
            ...old,
            likesCount: newLikesCount,
            reactions: newReactionType ? [{ type: newReactionType }] : [],
          }
        : old,
    );
  };

  const mutation = useMutation({
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
      queryClient.invalidateQueries({
        queryKey: ["reaction-summary", post.id],
      });
      queryClient.invalidateQueries({ queryKey: ["reactions", post.id] });
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
    mutation.mutate(myReaction ?? "LIKE");
  };

  const handlePickerSelect = (type: ReactionType) => {
    setShowPicker(false);
    mutation.mutate(type);
  };

  return {
    myReaction,
    showPicker,
    isPending: mutation.isPending,
    handleMouseEnter,
    handleMouseLeave,
    handleLikeClick,
    handlePickerSelect,
    clearLeaveTimer: () => {
      if (leaveTimer.current) clearTimeout(leaveTimer.current);
    },
  };
};
