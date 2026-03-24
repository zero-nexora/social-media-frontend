import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { notificationsApi } from "../../services/api-services";
import { UserAvatar } from "../shared/user-avatar";
import { fromNow, getNotifText, getNotifTarget, cn } from "../../lib/utils";
import type { Notification } from "../../types";

interface Props {
  notification: Notification;
  onRead?: (id: string) => void;
}

export const NotificationItem = ({ notification, onRead }: Props) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const readMutation = useMutation({
    mutationFn: () => notificationsApi.markRead(notification.id),
    onSuccess: () => {
      onRead?.(notification.id);
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => notificationsApi.delete(notification.id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const handleClick = () => {
    if (!notification.isRead) readMutation.mutate();
    const target = getNotifTarget(
      notification.type,
      notification.targetId,
      notification.fromUser.username,
    );
    navigate(target);
  };

  return (
    <div
      className={cn(
        "relative flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors group",
        "hover:bg-muted/60",
        !notification.isRead && "bg-primary/5",
      )}
      onClick={handleClick}
    >
      <UserAvatar
        user={notification.fromUser}
        size="md"
        className="shrink-0 mt-0.5"
      />

      <div className="flex-1 min-w-0">
        <p className="text-sm leading-snug">
          <span className="font-semibold">
            {notification.fromUser.username}
          </span>{" "}
          {getNotifText(
            notification.type,
            notification.fromUser.username,
          ).replace(notification.fromUser.username, "")}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {fromNow(notification.createdAt)}
        </p>
      </div>

      {!notification.isRead && (
        <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
      )}

      <button
        className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground"
        onClick={(e) => {
          e.stopPropagation();
          deleteMutation.mutate();
        }}
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
};
