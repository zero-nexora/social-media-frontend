import { useState, useCallback, useRef, useEffect } from "react";
import {
  Globe,
  Users,
  Lock,
  Image as ImageIcon,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { UserAvatar } from "../shared/user-avatar";
import { PostEditor } from "./post-editor";
import { MediaUploadZone } from "./media-upload-zone";
import { postsApi } from "../../services/api-services";
import { useCloudinaryUpload } from "../../hooks/use-cloudinary-upload";
import { useAuth } from "../../hooks/use-auth";
import type { Privacy } from "../../types";
import { useGenerateCaption } from "../../hooks/use-generate-caption";

const PRIVACY_OPTIONS: {
  value: Privacy;
  label: string;
  icon: React.ReactNode;
}[] = [
  { value: "PUBLIC", label: "Công khai", icon: <Globe size={13} /> },
  { value: "FRIENDS", label: "Bạn bè", icon: <Users size={13} /> },
  { value: "ONLY_ME", label: "Chỉ mình tôi", icon: <Lock size={13} /> },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialMediaOpen?: boolean;
}

export const CreatePostDialog = ({
  open,
  onClose,
  onSuccess,
  initialMediaOpen,
}: Props) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const upload = useCloudinaryUpload("posts");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorResetRef = useRef<(() => void) | null>(null);

  const [html, setHtml] = useState("");
  const [plainText, setPlainText] = useState("");
  const [privacy, setPrivacy] = useState<Privacy>("FRIENDS");
  const [isDragging, setIsDragging] = useState(false);

  const { generate, isGenerating } = useGenerateCaption();

  useEffect(() => {
    if (open && initialMediaOpen) {
      const t = setTimeout(() => fileInputRef.current?.click(), 150);
      return () => clearTimeout(t);
    }
  }, [open, initialMediaOpen]);

  const handleClose = useCallback(() => {
    setHtml("");
    setPlainText("");
    setPrivacy("FRIENDS");
    upload.reset();
    editorResetRef.current?.();
    onClose();
  }, [upload, onClose]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  const handleDragLeave = useCallback(() => setIsDragging(false), []);
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      upload.addFiles(Array.from(e.dataTransfer.files));
    },
    [upload],
  );

  const createMutation = useMutation({
    mutationFn: async () => {
      let mediaUrls: string[] = [];
      if (upload.hasFiles) mediaUrls = await upload.uploadAll();
      return postsApi.create({
        content: plainText.trim() ? html : undefined,
        mediaUrls,
        privacy,
      });
    },
    onSuccess: (post) => {
      toast.success("Đã đăng bài viết");
      queryClient.setQueriesData<any>({ queryKey: ["feed"] }, (old: any) => {
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
      });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      onSuccess?.();
      handleClose();
    },
    onError: (err: Error) => toast.error(err.message || "Đăng bài thất bại"),
  });

  const isWorking = createMutation.isPending || upload.isUploading;
  const canSubmit =
    (plainText.trim().length > 0 || upload.hasFiles) &&
    !isWorking &&
    !upload.hasError;

  const buttonLabel = () => {
    if (upload.isUploading) {
      const done = upload.items.filter((x) => x.status === "done").length;
      return `Đang tải ${done}/${upload.items.length}...`;
    }
    if (createMutation.isPending) return "Đang đăng...";
    return "Đăng";
  };

  const handleGenerateCaption = useCallback(async () => {
    const doneUrls = upload.items
      .filter((x) => x.status === "done" && x.url)
      .map((x) => x.url!);

    let urls = doneUrls;
    if (upload.items.some((x) => x.status === "idle")) {
      urls = await upload.uploadAll();
    }

    if (!urls.length) return;
    const caption = await generate(urls);
    if (caption) {
      setHtml(`<p>${caption}</p>`);
      setPlainText(caption);
      editorResetRef.current?.();
      setTimeout(() => {
        setHtml(`<p>${caption}</p>`);
        setPlainText(caption);
      }, 0);
    }
  }, [upload, generate]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-145 max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3 border-b">
          <DialogTitle className="text-center text-base font-semibold">
            Tạo bài viết
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {user && (
            <div className="flex items-center gap-3">
              <UserAvatar user={user} size="md" />
              <div>
                <p className="font-semibold text-sm">{user.username}</p>
                <Select
                  value={privacy}
                  onValueChange={(v) => setPrivacy(v as Privacy)}
                >
                  <SelectTrigger className="h-7 text-xs px-2 border rounded-full w-auto gap-1 mt-0.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIVACY_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        <span className="flex items-center gap-1.5">
                          {o.icon}
                          {o.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <PostEditor
            placeholder={
              user ? `Bạn đang nghĩ gì, ${user.username}?` : "Bạn đang nghĩ gì?"
            }
            onChange={(h, t) => {
              setHtml(h);
              setPlainText(t);
            }}
            onReset={(fn) => {
              editorResetRef.current = fn;
            }}
            autoFocus={open}
          />

          <MediaUploadZone
            items={upload.items}
            onAddFiles={upload.addFiles}
            onRemove={upload.removeFile}
            maxFiles={upload.MAX_FILES}
            isDragging={isDragging}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          />

          {upload.hasError && (
            <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/8 rounded-xl px-3 py-2.5 border border-destructive/15">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              <span>
                Một số file upload thất bại. Xoá và thử lại hoặc chọn file khác.
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t bg-card">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={upload.items.length >= upload.MAX_FILES}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-lg hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ImageIcon size={17} className="text-primary" />
            <span>Ảnh / Video</span>
            {upload.items.length > 0 && (
              <span className="text-xs text-primary font-medium">
                ({upload.items.length}/{upload.MAX_FILES})
              </span>
            )}
          </button>

          {upload.hasFiles && (
            <button
              type="button"
              onClick={handleGenerateCaption}
              disabled={isGenerating || isWorking}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-lg hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Sparkles size={15} className="text-purple-500" />
              <span>
                {isGenerating ? "Đang tạo caption..." : "Tạo caption AI"}
              </span>
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) upload.addFiles(Array.from(e.target.files));
              e.target.value = "";
            }}
          />

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              disabled={isWorking}
            >
              Huỷ
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!canSubmit}
              className="min-w-18"
            >
              {buttonLabel()}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
