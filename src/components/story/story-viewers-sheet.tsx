import { Link } from "react-router-dom";
import { Eye } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { storiesApi } from "../../services/api-services";
import { UserAvatar } from "../shared/user-avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";
import { fromNow } from "../../lib/utils";

interface Props {
  storyId: string;
  open: boolean;
  onClose: () => void;
}

export const StoryViewersSheet = ({ storyId, open, onClose }: Props) => {
  const { data, isLoading } = useQuery({
    queryKey: ["story-viewers", storyId],
    queryFn: () => storiesApi.getViewers(storyId),
    enabled: open && !!storyId,
    staleTime: 10_000,
  });

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="bottom"
        className="h-[60vh] rounded-t-2xl px-0"
        onClick={(e) => e.stopPropagation()}
      >
        <SheetHeader className="px-4 pb-2 border-b">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Eye size={16} />
            Lượt xem
            {data && (
              <span className="text-muted-foreground font-normal text-sm">
                ({data.totalViews})
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="overflow-y-auto h-full py-2">
          {isLoading && (
            <div className="space-y-3 px-4 pt-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-muted" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-28 bg-muted rounded" />
                    <div className="h-2.5 w-16 bg-muted rounded" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && data?.viewers.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
              <Eye size={32} className="opacity-30" />
              <p className="text-sm">Chưa có ai xem story này</p>
            </div>
          )}

          {data?.viewers.map(({ user, viewedAt }) => (
            <Link
              key={user.id}
              to={`/profile/${user.username}`}
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors"
            >
              <UserAvatar user={user} size="md" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.username}</p>
                <p className="text-xs text-muted-foreground">
                  {fromNow(viewedAt)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};
