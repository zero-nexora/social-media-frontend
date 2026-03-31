import { useRef } from "react";
import { Camera } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { usersApi } from "../../services/api-services";
import { BannerDefault } from "../shared/banner-default";

interface Props {
  coverPhoto: string | null;
  isOwn: boolean;
  username: string;
}

export const ProfileCover = ({ coverPhoto, isOwn, username }: Props) => {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);

  const cover = useMutation({
    mutationFn: (file: File) => usersApi.updateCover(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", username] });
      toast.success("Đã cập nhật ảnh bìa");
    },
    onError: () => toast.error("Cập nhật thất bại"),
  });

  return (
    <div className="relative h-48 sm:h-56 rounded-xl overflow-hidden bg-muted">
      {coverPhoto ? (
        <img
          src={coverPhoto}
          alt="cover"
          className="w-full h-full object-cover"
        />
      ) : (
        <BannerDefault />
      )}

      {isOwn && (
        <>
          <button
            onClick={() => inputRef.current?.click()}
            disabled={cover.isPending}
            className="absolute top-3 right-3 flex items-center gap-1.5 bg-foreground/50 hover:bg-foreground/70 disabled:opacity-60 text-background text-xs px-3 py-1.5 rounded-full transition-colors backdrop-blur-sm"
          >
            <Camera size={13} />
            {cover.isPending ? "Đang tải..." : "Cập nhật ảnh bìa"}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) =>
              e.target.files?.[0] && cover.mutate(e.target.files[0])
            }
          />
        </>
      )}
    </div>
  );
};
