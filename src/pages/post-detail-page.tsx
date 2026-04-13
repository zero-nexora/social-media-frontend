import { useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import type { InfiniteData } from "@tanstack/react-query";
import type {
  Comment,
  Post,
  PaginatedResponse,
  PostReactionPayload,
  PostUpdatedPayload,
  PostDeletedPayload,
  NewCommentPayload,
  NewReplyPayload,
  CommentUpdatedPayload,
  CommentDeletedPayload,
  CommentsCountPayload,
} from "../types";
import { useSocketStore } from "../stores/socket-store";
import { useAuthStore } from "../stores/auth-store";
import { postsApi } from "../services/api-services";
import { PostCardSkeleton } from "../components/shared/skeleton-card";
import { PostCard } from "../components/post/post-card";
import { CommentSection } from "../components/comment/comment-section";

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const commentInputRef = useRef<HTMLDivElement>(null);
  const { socket } = useSocketStore();
  const { user: me } = useAuthStore();
  const queryClient = useQueryClient();

  const {
    data: post,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["post", id],
    queryFn: () => postsApi.getById(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (!socket || !id) return;
    socket.emit("join_post", id);
    return () => {
      socket.emit("leave_post", id);
    };
  }, [socket, id]);

  const patchPost = (patch: Partial<Post>) => {
    queryClient.setQueryData<Post>(["post", id], (old) =>
      old ? { ...old, ...patch } : old,
    );

    queryClient.setQueriesData<InfiniteData<PaginatedResponse<Post>>>(
      { queryKey: ["feed"] },
      (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            data: page.data.map((p) => (p.id === id ? { ...p, ...patch } : p)),
          })),
        };
      },
    );

    queryClient.setQueriesData<InfiniteData<PaginatedResponse<Post>>>(
      { queryKey: ["user-posts", me?.id] },
      (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            data: page.data.map((p) => (p.id === id ? { ...p, ...patch } : p)),
          })),
        };
      },
    );
  };

  useEffect(() => {
    if (!socket || !id) return;

    const onReaction = (p: PostReactionPayload) => {
      queryClient.invalidateQueries({
        queryKey: ["reaction-summary", p.postId],
      });
      queryClient.invalidateQueries({ queryKey: ["reactions", p.postId] });
      if (p.userId === me?.id) return;
      patchPost({ likesCount: p.likesCount });
    };

    const onUpdated = (p: PostUpdatedPayload) => {
      patchPost({
        content: p.content ?? undefined,
        privacy: p.privacy as Post["privacy"],
        updatedAt: p.updatedAt,
      });
    };

    const onDeleted = (_p: PostDeletedPayload) => {
      queryClient.setQueriesData<InfiniteData<PaginatedResponse<Post>>>(
        { queryKey: ["feed"] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              data: page.data.filter((p) => p.id !== id),
            })),
          };
        },
      );
      queryClient.removeQueries({ queryKey: ["post", id] });
      navigate("/feed", { replace: true });
    };

    const onNewComment = ({ comment }: NewCommentPayload) => {
      queryClient.setQueriesData<InfiniteData<PaginatedResponse<Comment>>>(
        { queryKey: ["comments", id] },
        (old) => {
          if (!old) return old;
          const lastPage = old.pages[old.pages.length - 1];
          return {
            ...old,
            pages: [
              ...old.pages.slice(0, -1),
              { ...lastPage, data: [...lastPage.data, comment] },
            ],
          };
        },
      );

      queryClient.setQueriesData<InfiniteData<PaginatedResponse<Comment>>>(
        { queryKey: ["user-posts", me?.id] },
        (old) => {
          if (!old) return old;
          const lastPage = old.pages[old.pages.length - 1];
          return {
            ...old,
            pages: [
              ...old.pages.slice(0, -1),
              { ...lastPage, data: [...lastPage.data, comment] },
            ],
          };
        },
      );

      patchPost({ commentsCount: (post?.commentsCount ?? 0) + 1 });
    };

    const onNewReply = ({ commentId }: NewReplyPayload) => {
      queryClient.invalidateQueries({ queryKey: ["replies", commentId] });
      queryClient.invalidateQueries({ queryKey: ["comments", id] });
    };

    const onCommentUpdated = ({ parentId }: CommentUpdatedPayload) => {
      if (parentId) {
        queryClient.invalidateQueries({ queryKey: ["replies", parentId] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["comments", id] });
      }
    };

    const onCommentDeleted = ({
      parentId,
      decrementBy,
    }: CommentDeletedPayload) => {
      if (parentId) {
        queryClient.invalidateQueries({ queryKey: ["replies", parentId] });
        queryClient.invalidateQueries({ queryKey: ["comments", id] });
      } else {
        queryClient.invalidateQueries({ queryKey: ["comments", id] });
      }
      patchPost({
        commentsCount: Math.max(0, (post?.commentsCount ?? 0) - decrementBy),
      });
    };

    const onCommentsCount = ({ commentsCount }: CommentsCountPayload) => {
      patchPost({ commentsCount });
    };

    socket.on("post:reaction", onReaction);
    socket.on("post:updated", onUpdated);
    socket.on("post:deleted", onDeleted);
    socket.on("post:new_comment", onNewComment);
    socket.on("post:new_reply", onNewReply);
    socket.on("post:comment_updated", onCommentUpdated);
    socket.on("post:comment_deleted", onCommentDeleted);
    socket.on("post:comments_count", onCommentsCount);

    return () => {
      socket.off("post:reaction", onReaction);
      socket.off("post:updated", onUpdated);
      socket.off("post:deleted", onDeleted);
      socket.off("post:new_comment", onNewComment);
      socket.off("post:new_reply", onNewReply);
      socket.off("post:comment_updated", onCommentUpdated);
      socket.off("post:comment_deleted", onCommentDeleted);
      socket.off("post:comments_count", onCommentsCount);
    };
  }, [socket, id, post?.commentsCount, me?.id]); // eslint-disable-line

  const scrollToComments = () => {
    commentInputRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <PostCardSkeleton />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16 space-y-3">
        <p className="text-muted-foreground">
          Bài viết không tồn tại hoặc bạn không có quyền xem.
        </p>
        <Link to="/feed" className="text-primary hover:underline text-sm">
          Về trang chủ
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          to="/feed"
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <ChevronLeft size={16} /> Trang chủ
        </Link>
        <span>{">"}</span>
        <span className="text-foreground">Bài viết</span>
      </div>

      <PostCard post={post} variant="full" onCommentClick={scrollToComments} />

      <div
        ref={commentInputRef}
        className="bg-card border rounded-xl overflow-hidden"
      >
        <CommentSection postId={post.id} commentsCount={post.commentsCount} />
      </div>
    </div>
  );
}
