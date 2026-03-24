import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { postsApi } from "../../../services/api-services";
import { useInfiniteScroll } from "../../../hooks/use-infinite-scroll";
import { ImageLightbox } from "../../shared/image-lightbox";

interface Props {
  userId: string;
}

function PhotoSkeleton() {
  return <div className="aspect-square rounded-lg bg-muted animate-pulse" />;
}

function PhotoThumb({ url, onClick }: { url: string; onClick: () => void }) {
  return (
    <div
      className="aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer"
      onClick={onClick}
    >
      <img
        src={url}
        alt=""
        loading="lazy"
        className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
      />
    </div>
  );
}

export const ProfilePhotosTab = ({ userId }: Props) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: ["user-posts", userId],
      queryFn: ({ pageParam }) =>
        postsApi.getUserPosts(userId, pageParam as string | undefined),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (l) => l.nextCursor ?? undefined,
      enabled: !!userId,
    });

  const sentinelRef = useInfiniteScroll({
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  });

  const allUrls =
    data?.pages.flatMap((p) => p.data).flatMap((post) => post.mediaUrls) ?? [];

  if (!isLoading && allUrls.length === 0) {
    return (
      <p className="text-center py-12 text-sm text-muted-foreground">
        Chưa có ảnh nào
      </p>
    );
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-1">
        {allUrls.map((url, i) => (
          <PhotoThumb
            key={i}
            url={url}
            onClick={() => {
              setLightboxIndex(i);
              setLightboxOpen(true);
            }}
          />
        ))}

        {(isLoading || isFetchingNextPage) &&
          Array.from({ length: 6 }).map((_, i) => (
            <PhotoSkeleton key={`sk-${i}`} />
          ))}
      </div>

      <div ref={sentinelRef} />

      <ImageLightbox
        images={allUrls}
        initialIndex={lightboxIndex}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
};
