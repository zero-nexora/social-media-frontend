import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { commentsApi } from "../services/api-services";
import { getApiError } from "../lib/get-api-error";

export const useCreateCommentMutation = ({
  postId,
  replyTo,
  onSuccess,
}: {
  postId: string;
  replyTo: { id: string; username: string } | null;
  onSuccess?: () => void;
}) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (text: string) =>
      replyTo
        ? commentsApi.createReply(replyTo.id, text)
        : commentsApi.create(postId, text),
    onSuccess: () => {
      if (replyTo) {
        qc.invalidateQueries({ queryKey: ["replies", replyTo.id] });
      }
      qc.invalidateQueries({ queryKey: ["comments", postId] });
      qc.invalidateQueries({ queryKey: ["post", postId] });
      onSuccess?.();
    },
    onError: (err) => toast.error(getApiError(err, "Gửi bình luận thất bại")),
  });
};

export const useUpdateCommentMutation = ({
  postId,
  commentId,
  onSuccess,
}: {
  postId: string;
  commentId: string;
  onSuccess?: () => void;
}) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (content: string) => commentsApi.update(commentId, content),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments", postId] });
      onSuccess?.();
    },
    onError: (err) => toast.error(getApiError(err, "Sửa bình luận thất bại")),
  });
};

export const useDeleteCommentMutation = ({
  postId,
  parentCommentId,
  onSuccess,
}: {
  postId: string;
  parentCommentId?: string; // truyền nếu đang xoá reply
  onSuccess?: () => void;
}) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (commentId: string) => commentsApi.delete(commentId),
    onSuccess: () => {
      if (parentCommentId) {
        qc.invalidateQueries({ queryKey: ["replies", parentCommentId] });
      }
      qc.invalidateQueries({ queryKey: ["comments", postId] });
      qc.invalidateQueries({ queryKey: ["post", postId] });
      onSuccess?.();
    },
    onError: (err) => toast.error(getApiError(err, "Xoá bình luận thất bại")),
  });
};
