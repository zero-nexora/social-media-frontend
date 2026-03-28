import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";
import { usersApi, authApi } from "../services/api-services";
import { useAuth } from "../hooks/use-auth";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import {
  getPasswordStrength,
} from "../lib/utils";
import { PasswordStrengthBar } from "../components/shared/password-strength-bar";

// ─── Constants ────────────────────────────────────────
const TABS = [
  { value: "account", label: "Tài khoản" },
  { value: "security", label: "Bảo mật" },
  { value: "danger", label: "Nguy hiểm" },
] as const;

// ─── Schema ───────────────────────────────────────────
const pwSchema = z
  .object({
    currentPassword: z.string().min(1, "Nhập mật khẩu hiện tại"),
    newPassword: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Không khớp",
    path: ["confirmPassword"],
  });

type PwForm = z.infer<typeof pwSchema>;

// ─── Sub-components ───────────────────────────────────
function PasswordInput({
  show,
  onToggle,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="relative">
      <Input type={show ? "text" : "password"} {...props} />
      <button
        type="button"
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        onClick={onToggle}
      >
        {show ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────
export default function SettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [username, setUsername] = useState(user?.username ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
    reset,
  } = useForm<PwForm>({ resolver: zodResolver(pwSchema) });

  const newPw = watch("newPassword", "");
  const pwStrength = newPw ? getPasswordStrength(newPw) : null;
  const isDirty = username !== user?.username || bio !== (user?.bio ?? "");

  // ─── Mutations ────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: () =>
      usersApi.updateMe({
        username: username !== user?.username ? username : undefined,
        bio: bio !== user?.bio ? bio : undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["me"] });
      toast.success("Đã lưu thay đổi");
    },
    onError: (err: any) => {
      if (err?.response?.data?.error?.message?.includes("Username"))
        toast.error("Username đã tồn tại");
      else toast.error("Cập nhật thất bại");
    },
  });

  const resendMutation = useMutation({
    mutationFn: () => authApi.resendVerify(user?.email ?? ""),
    onSuccess: () => {
      toast.success("Đã gửi email xác thực");
      setResendCooldown(60);
      const t = setInterval(
        () =>
          setResendCooldown((c) => {
            if (c <= 1) {
              clearInterval(t);
              return 0;
            }
            return c - 1;
          }),
        1000,
      );
    },
  });

  const changePwMutation = useMutation({
    mutationFn: (d: PwForm) =>
      authApi.changePassword({
        currentPassword: d.currentPassword,
        newPassword: d.newPassword,
      }),
    onSuccess: async () => {
      toast.success("Đổi mật khẩu thành công");
      reset();
      setTimeout(async () => {
        await logout();
        navigate("/login?changed=true");
      }, 1500);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message ?? "";
      if (msg.includes("hiện tại"))
        setError("currentPassword", { message: msg });
      else toast.error(msg || "Đổi mật khẩu thất bại");
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: usersApi.deactivate,
    onSuccess: async () => {
      await logout();
      navigate("/login");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: usersApi.deleteAccount,
    onSuccess: async () => {
      await logout();
      navigate("/login");
    },
  });

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Cài đặt</h1>

      <Tabs defaultValue="account">
        <TabsList className="w-full rounded-none h-auto p-0 bg-transparent border-b mb-6">
          {TABS.map(({ value, label }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="flex-1 rounded-none py-3 text-xs data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none data-[state=active]:bg-transparent"
            >
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ─── Account ─────────────────────────────── */}
        <TabsContent value="account" className="space-y-6">
          <div className="bg-card border rounded-xl p-5 space-y-4">
            <h3 className="font-semibold">Thông tin cơ bản</h3>
            <div className="space-y-1">
              <label className="text-sm font-medium">Username</label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={200}
                rows={3}
                className="w-full border rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="Giới thiệu bản thân..."
              />
              <p className="text-xs text-muted-foreground text-right">
                {bio.length}/200
              </p>
            </div>
            <Button
              disabled={!isDirty || updateMutation.isPending}
              onClick={() => updateMutation.mutate()}
            >
              {updateMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </div>

          <div className="bg-card border rounded-xl p-5 space-y-3">
            <h3 className="font-semibold">Email</h3>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                {user?.email}
              </span>
              {user?.isVerified ? (
                <span className="flex items-center gap-1 text-xs text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
                  <CheckCircle2 size={11} /> Đã xác thực
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted border border-border px-2 py-0.5 rounded-full">
                  <AlertCircle size={11} /> Chưa xác thực
                </span>
              )}
            </div>
            {!user?.isVerified && (
              <Button
                size="sm"
                variant="outline"
                disabled={resendCooldown > 0 || resendMutation.isPending}
                onClick={() => resendMutation.mutate()}
              >
                {resendCooldown > 0
                  ? `Gửi lại sau ${resendCooldown}s`
                  : "Gửi lại email xác thực"}
              </Button>
            )}
          </div>
        </TabsContent>

        {/* ─── Security ────────────────────────────── */}
        <TabsContent value="security">
          <div className="bg-card border rounded-xl p-5 space-y-4">
            <h3 className="font-semibold">Đổi mật khẩu</h3>
            <form
              onSubmit={handleSubmit((d) => changePwMutation.mutate(d))}
              className="space-y-3"
            >
              <div className="space-y-1">
                <label className="text-sm font-medium">Mật khẩu hiện tại</label>
                <PasswordInput
                  show={showCurrent}
                  onToggle={() => setShowCurrent((v) => !v)}
                  {...register("currentPassword")}
                />
                {errors.currentPassword && (
                  <p className="text-xs text-destructive">
                    {errors.currentPassword.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Mật khẩu mới</label>
                <PasswordInput
                  show={showNew}
                  onToggle={() => setShowNew((v) => !v)}
                  {...register("newPassword")}
                />
                {newPw && pwStrength && (
                  <PasswordStrengthBar password={newPw} />
                  // <div className="space-y-0.5">
                  //   <div className="h-1 rounded-full bg-muted overflow-hidden">
                  //     <div
                  //       className={`h-full rounded-full ${PASSWORD_STRENGTH_COLOR[pwStrength]} transition-all`}
                  //       style={{
                  //         width:
                  //           pwStrength === "weak"
                  //             ? "33%"
                  //             : pwStrength === "medium"
                  //               ? "66%"
                  //               : "100%",
                  //       }}
                  //     />
                  //   </div>
                  //   <p className="text-xs text-muted-foreground">
                  //     {PASSWORD_STRENGTH_LABEL[pwStrength]}
                  //   </p>
                  // </div>
                )}
                {errors.newPassword && (
                  <p className="text-xs text-destructive">
                    Mật khẩu cần ít nhất 8 ký tự, 1 chữ hoa, 1 số
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">
                  Xác nhận mật khẩu mới
                </label>
                <Input type="password" {...register("confirmPassword")} />
                {errors.confirmPassword && (
                  <p className="text-xs text-destructive">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <Button type="submit" disabled={changePwMutation.isPending}>
                {changePwMutation.isPending ? "Đang đổi..." : "Đổi mật khẩu"}
              </Button>
            </form>
          </div>
        </TabsContent>

        {/* ─── Danger ──────────────────────────────── */}
        <TabsContent value="danger" className="space-y-4">
          <div className="bg-card border rounded-xl p-5 space-y-3">
            <h3 className="font-semibold text-foreground">
              Vô hiệu hoá tài khoản
            </h3>
            <p className="text-sm text-muted-foreground">
              Tài khoản sẽ bị vô hiệu hoá. Bạn có thể kích hoạt lại bằng cách
              đăng nhập.
            </p>
            <Button variant="outline" onClick={() => setDeactivateOpen(true)}>
              Vô hiệu hoá tài khoản
            </Button>
          </div>

          <div className="bg-card border border-destructive/30 rounded-xl p-5 space-y-3">
            <h3 className="font-semibold text-destructive">Xoá tài khoản</h3>
            <p className="text-sm text-muted-foreground">
              Hành động này <strong>không thể hoàn tác</strong>. Tất cả dữ liệu
              sẽ bị xoá vĩnh viễn.
            </p>
            <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
              Xoá tài khoản vĩnh viễn
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* ─── Dialogs ─────────────────────────────────── */}
      <AlertDialog open={deactivateOpen} onOpenChange={setDeactivateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Vô hiệu hoá tài khoản?</AlertDialogTitle>
            <AlertDialogDescription>
              Tài khoản sẽ bị tạm ẩn. Bạn có thể đăng nhập lại để kích hoạt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction onClick={() => deactivateMutation.mutate()}>
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá tài khoản vĩnh viễn?</AlertDialogTitle>
            <AlertDialogDescription>
              Nhập <strong>XOATAIKHOAN</strong> để xác nhận. Hành động này không
              thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder="XOATAIKHOAN"
            className="my-2"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              disabled={
                deleteConfirm !== "XOATAIKHOAN" || deleteMutation.isPending
              }
              onClick={() => deleteMutation.mutate()}
            >
              Xoá vĩnh viễn
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
