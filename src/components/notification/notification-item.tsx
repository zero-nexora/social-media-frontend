import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { notificationsApi } from "../../services/api-services";
import { UserAvatar } from "../shared/user-avatar";
import { fromNow, getNotifText, getNotifTarget, cn } from "../../lib/utils";
import type { Notification } from "../../types";
import { useNotificationStore } from "../../stores/notification-store";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { useState } from "react";

interface Props {
  notification: Notification;
}

export const NotificationItem = ({ notification }: Props) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { markRead: storeMarkRead, decrementUnread } = useNotificationStore();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const markRead = useMutation({
    mutationFn: () => notificationsApi.markRead(notification.id),
    onSuccess: () => {
      storeMarkRead(notification.id);
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-preview"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => notificationsApi.delete(notification.id),
    onSuccess: () => {
      if (!notification.isRead) {
        decrementUnread();
      }

      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-preview"] });
    },
  });

  const handleClick = () => {
    if (!notification.isRead) {
      decrementUnread();
      markRead.mutate();
    }
    navigate(getNotifTarget(notification));
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
          setDeleteOpen(true);
        }}
      >
        <Trash2 size={13} />
      </button>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá thông báo?</AlertDialogTitle>
            <AlertDialogDescription>
              Thông báo này sẽ bị xoá vĩnh viễn và không thể khôi phục.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={(e) => e.stopPropagation()}>
              Huỷ
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate()}>
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
