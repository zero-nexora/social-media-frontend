import { useState } from "react";
import { X, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { friendshipsApi } from "../../services/api-services";
import { usePresence } from "../../hooks/use-presence";
import { UserAvatar } from "../shared/user-avatar";
import { OnlineBadge } from "../shared/online-badge";
import { Button } from "../ui/button";
import type { FriendSuggestion } from "../../types";
import { toast } from "sonner";

export const RightSidebar = () => {
  const queryClient = useQueryClient();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [sent, setSent] = useState<Set<string>>(new Set());

  const { data: suggestions = [] } = useQuery({
    queryKey: ["friend-suggestions-sidebar"],
    queryFn: () => friendshipsApi.getSuggestions(5),
  });

  const sendRequestMutation = useMutation({
    mutationFn: (userId: string) => friendshipsApi.sendRequest(userId),
    onSuccess: (_, userId) => {
      toast.success("Đã gửi lời mời");
      setSent((prev) => new Set(prev).add(userId));
      queryClient.invalidateQueries({
        queryKey: ["friend-suggestions-sidebar"],
      });
    },
  });

  const visible = (suggestions as FriendSuggestion[]).filter(
    (s) => !dismissed.has(s.user.id),
  );

  usePresence(visible.map((s) => s.user.id));

  if (visible.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
        Có thể bạn quen
      </h3>

      {visible.map((s) => (
        <div key={s.user.id} className="flex items-center gap-2.5 group px-1">
          <div className="relative shrink-0">
            <UserAvatar user={s.user} size="sm" />
            <OnlineBadge
              userId={s.user.id}
              size="sm"
              className="absolute -bottom-0.5 -right-0.5"
            />
          </div>

          <div className="flex-1 min-w-0">
            <Link
              to={`/profile/${s.user.username}`}
              className="text-sm font-medium truncate block hover:underline"
            >
              {s.user.username}
            </Link>
            {s.mutualCount > 0 && (
              <p className="text-xs text-muted-foreground">
                {s.mutualCount} bạn chung
              </p>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant={sent.has(s.user.id) ? "secondary" : "default"}
              className="h-7 px-2 text-xs"
              disabled={sent.has(s.user.id) || sendRequestMutation.isPending}
              onClick={() => sendRequestMutation.mutate(s.user.id)}
            >
              {sent.has(s.user.id) ? "Đã gửi" : <UserPlus size={13} />}
            </Button>

            <button
              onClick={() =>
                setDismissed((prev) => new Set(prev).add(s.user.id))
              }
              className="p-1 rounded-lg hover:bg-muted text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={13} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
