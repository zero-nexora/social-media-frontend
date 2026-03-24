import { useState } from "react";
import { cn } from "../../lib/utils";
import { ImageLightbox } from "../shared/image-lightbox";

interface Props {
  urls: string[];
  className?: string;
}

type GridLayout = "single" | "two" | "three" | "four-plus";

function getLayout(count: number): GridLayout {
  if (count === 1) return "single";
  if (count === 2) return "two";
  if (count === 3) return "three";
  return "four-plus";
}

export const PostCardMedia = ({ urls, className }: Props) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  if (urls.length === 0) return null;

  const count = urls.length;
  const extra = count > 4 ? count - 4 : 0;
  const layout = getLayout(count);

  const openLightbox = (i: number) => {
    setLightboxIndex(i);
    setLightboxOpen(true);
  };

  return (
    <>
      {layout === "single" && (
        <div className={cn("rounded-xl overflow-hidden", className)}>
          <Thumb
            src={urls[0]}
            index={0}
            extra={0}
            openLightbox={openLightbox}
            className="w-full max-h-124"
          />
        </div>
      )}

      {layout === "two" && (
        <div
          className={cn(
            "grid grid-cols-2 gap-px rounded-xl overflow-hidden h-64",
            className,
          )}
        >
          {urls.slice(0, 2).map((u, i) => (
            <Thumb
              key={i}
              src={u}
              index={i}
              extra={0}
              openLightbox={openLightbox}
              className="h-full"
            />
          ))}
        </div>
      )}

      {layout === "three" && (
        <div
          className={cn(
            "grid grid-cols-2 gap-px rounded-xl overflow-hidden h-64",
            className,
          )}
        >
          <Thumb
            src={urls[0]}
            index={0}
            extra={0}
            openLightbox={openLightbox}
            className="row-span-2 h-64"
          />
          <Thumb
            src={urls[1]}
            index={1}
            extra={0}
            openLightbox={openLightbox}
            className="h-32"
          />
          <Thumb
            src={urls[2]}
            index={2}
            extra={0}
            openLightbox={openLightbox}
            className="h-32"
          />
        </div>
      )}

      {layout === "four-plus" && (
        <div
          className={cn(
            "grid grid-cols-2 gap-px rounded-xl overflow-hidden h-64",
            className,
          )}
        >
          {urls.slice(0, 4).map((u, i) => (
            <Thumb
              key={i}
              src={u}
              index={i}
              extra={extra}
              openLightbox={openLightbox}
              className="h-32"
            />
          ))}
        </div>
      )}

      <ImageLightbox
        key={`${lightboxOpen}-${lightboxIndex}`}
        images={urls}
        initialIndex={lightboxIndex}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
};

const Thumb = ({
  src,
  index,
  className: cls,
  extra,
  openLightbox,
}: {
  src: string;
  index: number;
  className?: string;
  extra: number;
  openLightbox: (index: number) => void;
}) => (
  <div
    className={cn(
      "relative overflow-hidden cursor-pointer bg-muted group",
      cls,
    )}
    onClick={() => openLightbox(index)}
  >
    <img
      src={src}
      alt=""
      loading="lazy"
      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-200"
    />
    {extra > 0 && index === 3 && (
      <div className="absolute inset-0 bg-foreground/55 flex items-center justify-center">
        <span className="text-background text-2xl font-bold">+{extra}</span>
      </div>
    )}
  </div>
);
