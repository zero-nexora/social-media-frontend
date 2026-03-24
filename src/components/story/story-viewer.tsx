import { useState, useEffect, useCallback, useRef } from "react";
import { X, Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { storiesApi } from "../../services/api-services";
import { useAuth } from "../../hooks/use-auth";
import { UserAvatar } from "../shared/user-avatar";
import { StoryProgress } from "./story-progress";
import { fromNow } from "../../lib/utils";
import type { StoryGroup } from "../../types";

const STORY_DURATION = 5000;
const TICK = 100;

interface Props {
  open: boolean;
  onClose: () => void;
  groups: StoryGroup[];
  initialGroupIndex?: number;
}

export const StoryViewer = ({
  open,
  onClose,
  groups,
  initialGroupIndex = 0,
}: Props) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [groupIdx, setGroupIdx] = useState(initialGroupIndex);
  const [storyIdx, setStoryIdx] = useState(0);
  const [progress, setProgress] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const goNextRef = useRef<() => void>(() => {});

  const currentGroup = groups[groupIdx];
  const currentStory = currentGroup?.stories[storyIdx];

  const goNext = useCallback(() => {
    const group = groups[groupIdx];
    if (!group) {
      onClose();
      return;
    }
    if (storyIdx < group.stories.length - 1) {
      setStoryIdx((i) => i + 1);
    } else if (groupIdx < groups.length - 1) {
      setGroupIdx((g) => g + 1);
      setStoryIdx(0);
    } else {
      onClose();
    }
  }, [groupIdx, storyIdx, groups, onClose]);

  useEffect(() => {
    goNextRef.current = goNext;
  }, [goNext]);

  const goPrev = useCallback(() => {
    if (storyIdx > 0) {
      setStoryIdx((i) => i - 1);
    } else if (groupIdx > 0) {
      const prevGroup = groups[groupIdx - 1];
      setGroupIdx((g) => g - 1);
      setStoryIdx(prevGroup.stories.length - 1);
    }
  }, [groupIdx, storyIdx, groups]);

  const clearTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const startTimer = useCallback(() => {
    clearTimer();
    setProgress(0);
    intervalRef.current = setInterval(() => {
      setProgress((p) => {
        const next = p + (TICK / STORY_DURATION) * 100;
        if (next >= 100) {
          goNextRef.current();
          return 0;
        }
        return next;
      });
    }, TICK);
  }, []);

  useEffect(() => {
    if (!open) {
      clearTimer();
      return;
    }
    return clearTimer;
  }, [open, groupIdx, storyIdx, startTimer]);

  useEffect(() => () => clearTimer(), []);

  useEffect(() => {
    if (!open || !currentStory) return;
    const t = setTimeout(() => {
      storiesApi.recordView(currentStory.id).catch(() => null);
    }, 300);
    return () => clearTimeout(t);
  }, [open, currentStory?.id]);

  const deleteMutation = useMutation({
    mutationFn: () => storiesApi.delete(currentStory!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stories-feed"] });
      queryClient.invalidateQueries({ queryKey: ["my-stories"] });
      goNext();
    },
  });

  if (!open || !currentGroup || !currentStory) return null;

  const isOwn = user?.id === currentGroup.user.id;

  return (
    <div
      className="fixed inset-0 z-50 bg-foreground/50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm h-full max-h-[90vh] overflow-hidden rounded-xl bg-foreground/50"
        onClick={(e) => e.stopPropagation()}
      >
        <StoryProgress
          total={currentGroup.stories.length}
          current={storyIdx}
          progress={progress}
        />

        <div className="absolute top-6 left-0 right-0 z-10 flex items-center gap-2 px-3 py-2">
          <UserAvatar user={currentGroup.user} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-background text-sm font-medium leading-none">
              {currentGroup.user.username}
            </p>
            <p className="text-background/60 text-xs mt-0.5">
              {fromNow(currentStory.createdAt)}
            </p>
          </div>
          {isOwn && (
            <button
              className="text-background p-1.5 hover:bg-background/20 rounded-full transition-colors"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              title="Xoá story"
            >
              <Trash2 size={16} />
            </button>
          )}
          <button
            className="text-background p-1.5 hover:bg-background/20 rounded-full transition-colors"
            onClick={onClose}
            title="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        {currentStory.mediaType === "VIDEO" ? (
          <video
            key={currentStory.id}
            src={currentStory.mediaUrl}
            className="w-full h-full object-contain"
            autoPlay
            muted
            playsInline
          />
        ) : (
          <img
            key={currentStory.id}
            src={currentStory.mediaUrl}
            className="w-full h-full object-contain"
            alt="story"
          />
        )}

        {currentStory.caption && (
          <div className="absolute bottom-8 left-0 right-0 px-4 py-3 bg-linear-to-t from-foreground/70 to-transparent">
            <p className="text-background text-sm text-center drop-shadow">
              {currentStory.caption}
            </p>
          </div>
        )}

        <button
          className="absolute inset-y-0 left-0 w-1/2 focus:outline-none"
          onClick={(e) => {
            e.stopPropagation();
            goPrev();
          }}
          aria-label="Trước"
        />
        <button
          className="absolute inset-y-0 right-0 w-1/2 focus:outline-none"
          onClick={(e) => {
            e.stopPropagation();
            goNext();
          }}
          aria-label="Tiếp"
        />
      </div>
    </div>
  );
};
