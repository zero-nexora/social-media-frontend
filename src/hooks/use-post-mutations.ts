// hooks/use-post-mutations.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { InfiniteData } from "@tanstack/react-query";
import { postsApi } from "../services/api-services";
import { getApiError } from "../lib/get-api-error";
import type { PaginatedResponse, Post, Privacy } from "../types";

export const useDeletePostMutation = ({
  postId,
  userId,
  onSuccess,
}: {
  postId: string;
  userId: string;
  onSuccess?: () => void;
}) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () => postsApi.delete(postId),
    onSuccess: () => {
      toast.success("Đã xoá bài viết");
      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: ["user-posts", userId] });
      onSuccess?.();
    },
    onError: (err) => toast.error(getApiError(err, "Xoá bài viết thất bại")),
  });
};

export const useUpdatePostMutation = ({
  post,
  onSuccess,
}: {
  post: Post;
  onSuccess?: () => void;
}) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: { html: string; plainText: string; privacy: Privacy }) =>
      postsApi.update(post.id, {
        content: data.plainText.trim() ? data.html : undefined,
        privacy: data.privacy,
      }),
    onSuccess: (updated) => {
      toast.success("Đã cập nhật bài viết");
      qc.setQueriesData<InfiniteData<PaginatedResponse<Post>>>(
        { queryKey: ["feed"] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              data: page.data.map((p) =>
                p.id === post.id ? { ...p, ...updated } : p,
              ),
            })),
          };
        },
      );
      qc.setQueryData<Post>(["post", post.id], (old) =>
        old ? { ...old, ...updated } : old,
      );
      qc.invalidateQueries({ queryKey: ["user-posts", post.userId] });
      onSuccess?.();
    },
    onError: (err) => toast.error(getApiError(err, "Cập nhật thất bại")),
  });
};

export const useCreatePostMutation = ({
  onSuccess,
}: {
  onSuccess?: () => void;
} = {}) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      html: string;
      plainText: string;
      privacy: Privacy;
      mediaUrls: string[];
    }) =>
      postsApi.create({
        content: data.plainText.trim() ? data.html : undefined,
        mediaUrls: data.mediaUrls,
        privacy: data.privacy,
      }),
    onSuccess: (post) => {
      toast.success("Đã đăng bài viết");
      qc.setQueriesData<InfiniteData<PaginatedResponse<Post>>>(
        { queryKey: ["feed"] },
        (old) => {
          if (!old?.pages) return old;
          return {
            ...old,
            pages: [
              {
                data: [post, ...(old.pages[0]?.data ?? [])],
                nextCursor: old.pages[0]?.nextCursor,
                hasMore: old.pages[0]?.hasMore,
              },
              ...old.pages.slice(1),
            ],
          };
        },
      );
      qc.invalidateQueries({ queryKey: ["feed"] });
      onSuccess?.();
    },
    onError: (err) => toast.error(getApiError(err, "Đăng bài thất bại")),
  });
};
