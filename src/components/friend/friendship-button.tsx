import { useState } from "react";
import {
  UserPlus,
  UserCheck,
  UserMinus,
  Clock,
  Users,
  Ban,
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { friendshipsApi } from "../../services/api-services";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
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
import type { FriendshipStatus } from "../../types";

interface Props {
  targetId: string;
  status: FriendshipStatus;
  onStatusChange: () => void;
}

function useFriendAction(
  fn: () => Promise<unknown>,
  onStatusChange: () => void,
  successMsg?: string,
) {
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      onStatusChange();
      if (successMsg) toast.success(successMsg);
    },
  });
}

export const FriendshipButton = ({
  targetId,
  status,
  onStatusChange,
}: Props) => {
  const [unfriendOpen, setUnfriendOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const [unBlockOpen, setUnblockOpen] = useState(false);

  const send = useFriendAction(
    () => friendshipsApi.sendRequest(targetId),
    onStatusChange,
    "Đã gửi lời mời",
  );
  const cancel = useFriendAction(
    () => friendshipsApi.cancel(targetId),
    onStatusChange,
  );
  const accept = useFriendAction(
    () => friendshipsApi.accept(targetId),
    onStatusChange,
    "Đã chấp nhận lời mời",
  );
  const reject = useFriendAction(
    () => friendshipsApi.reject(targetId),
    onStatusChange,
  );
  const unfriend = useMutation({
    mutationFn: () => friendshipsApi.unfriend(targetId),
    onSuccess: () => {
      onStatusChange();
      setUnfriendOpen(false);
      toast.info("Đã huỷ kết bạn");
    },
  });
  const block = useFriendAction(
    () => friendshipsApi.block(targetId),
    onStatusChange,
  );
  const unblock = useFriendAction(
    () => friendshipsApi.unblock(targetId),
    onStatusChange,
  );

  if (status === "none") {
    return (
      <Button size="sm" onClick={() => send.mutate()} disabled={send.isPending}>
        <UserPlus size={14} className="mr-1.5" /> Thêm bạn
      </Button>
    );
  }

  if (status === "pending_sent") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="secondary">
            <Clock size={14} className="mr-1.5" /> Đã gửi lời mời
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => cancel.mutate()}>
            Huỷ lời mời
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (status === "pending_received") {
    return (
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => accept.mutate()}
          disabled={accept.isPending}
        >
          <UserCheck size={14} className="mr-1.5" /> Xác nhận
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => reject.mutate()}
          disabled={reject.isPending}
        >
          Xoá
        </Button>
      </div>
    );
  }

  if (status === "accepted") {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="secondary">
              <Users size={14} className="mr-1.5" /> Bạn bè
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setUnfriendOpen(true)}
            >
              <UserMinus size={13} className="mr-2" /> Huỷ kết bạn
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setBlockOpen(true)}
            >
              <Ban size={13} className="mr-2" /> Chặn
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <AlertDialog open={unfriendOpen} onOpenChange={setUnfriendOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Huỷ kết bạn?</AlertDialogTitle>
              <AlertDialogDescription>
                Bạn sẽ không còn là bạn bè nữa.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Huỷ</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive hover:bg-destructive/90"
                onClick={() => unfriend.mutate()}
              >
                Xác nhận
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={blockOpen} onOpenChange={setBlockOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Chặn người dùng?</AlertDialogTitle>
              <AlertDialogDescription>
                Bạn sẽ không còn nhận tin từ họ nữa.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Huỷ</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive hover:bg-destructive/90"
                onClick={() => block.mutate()}
              >
                Xác nhận
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={unBlockOpen} onOpenChange={setUnblockOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Huỷ chặn người dùng?</AlertDialogTitle>
              <AlertDialogDescription>
                Bạn sẽ bắt đầu nhận tin từ họ nữa.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Huỷ</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive hover:bg-destructive/90"
                onClick={() => unblock.mutate()}
              >
                Xác nhận
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  if (status === "blocked") {
    return (
      <Button
        size="sm"
        variant="outline"
        className="border-destructive text-destructive hover:bg-destructive/10"
        onClick={() => setUnblockOpen(true)}
      >
        <Ban size={14} className="mr-1.5" /> Đã chặn
      </Button>
    );
  }

  return null;
};
