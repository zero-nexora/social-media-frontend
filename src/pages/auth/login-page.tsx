import { useState } from "react";
import {
  Link,
  useNavigate,
  useSearchParams,
  useLocation,
} from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { authApi } from "../../services/api-services";
import { useAuth } from "../../hooks/use-auth";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { AuthLayout } from "../../components/layout/auth/auth-layout";
import { AuthCard, AuthCardHeader } from "../../components/shared/auth-card";
import { StatusBanner } from "../../components/shared/status-banner";
import { FormField } from "../../components/shared/form-field";
import { PasswordInput } from "../../components/shared/password-input";

const schema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(1, "Nhập mật khẩu"),
});
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

  const from =
    (location.state as { from?: Location })?.from?.pathname ?? "/feed";

  const isVerifiedBanner = searchParams.get("verified") === "true";
  const isResetBanner = searchParams.get("reset") === "success";
  const isChangedBanner = searchParams.get("changed") === "true";

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      login(data.user, data.accessToken);
      navigate(from, { replace: true });
    },
    onError: (err: any) => {
      const msg: string = err?.response?.data?.error?.message ?? "";
      const status: number = err?.response?.status ?? 0;

      if (status === 403 && msg.includes("xác thực")) {
        setUnverifiedEmail(
          err?.config?.data
            ? ((JSON.parse(err.config.data) as { email?: string }).email ??
                null)
            : null,
        );
      } else if (status === 401) {
        setError("password", { message: "Email hoặc mật khẩu không đúng" });
      } else {
        toast.error(msg || "Đăng nhập thất bại");
      }
    },
  });

  const resendMutation = useMutation({
    mutationFn: () => authApi.resendVerify(unverifiedEmail!),
    onSuccess: () => toast.success("Đã gửi lại email xác thực"),
    onError: () => toast.error("Gửi email thất bại, thử lại sau"),
  });

  return (
    <AuthLayout>
      <AuthCard>
        <AuthCardHeader
          title="Chào mừng trở lại"
          subtitle="Đăng nhập để tiếp tục"
        />

        {(isVerifiedBanner || isResetBanner || isChangedBanner) && (
          <StatusBanner variant="success">
            {isVerifiedBanner && "Email đã xác thực thành công! Hãy đăng nhập."}
            {isResetBanner && "Đặt lại mật khẩu thành công!"}
            {isChangedBanner &&
              "Đổi mật khẩu thành công! Vui lòng đăng nhập lại."}
          </StatusBanner>
        )}

        {unverifiedEmail && (
          <StatusBanner variant="warning">
            <p>Tài khoản chưa xác thực email.</p>
            <button
              className="underline font-semibold hover:no-underline disabled:opacity-50"
              onClick={() => resendMutation.mutate()}
              disabled={resendMutation.isPending}
            >
              {resendMutation.isPending
                ? "Đang gửi..."
                : "Gửi lại email xác thực"}
            </button>
          </StatusBanner>
        )}

        <form
          onSubmit={handleSubmit((d) => loginMutation.mutate(d))}
          className="space-y-4"
        >
          <FormField error={errors.email?.message}>
            <Input
              type="email"
              placeholder="Email"
              autoComplete="email"
              {...register("email")}
            />
          </FormField>

          <FormField error={errors.password?.message}>
            <PasswordInput
              placeholder="Mật khẩu"
              autoComplete="current-password"
              {...register("password")}
            />
          </FormField>

          <div className="flex justify-end -mt-1">
            <Link
              to="/forgot-password"
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              Quên mật khẩu?
            </Link>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? "Đang đăng nhập..." : "Đăng nhập"}
          </Button>
        </form>

        <p className="text-sm text-center text-muted-foreground pt-2 border-t border-border/60">
          Chưa có tài khoản?{" "}
          <Link
            to="/register"
            className="text-primary font-semibold hover:underline"
          >
            Đăng ký
          </Link>
        </p>
      </AuthCard>
    </AuthLayout>
  );
}
