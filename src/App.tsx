import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "sonner";
import { queryClient } from "./lib/query-client";
import { useSocket } from "./hooks/use-socket";
import { useBootstrap } from "./hooks/use-bootstrap";

// ─── Layouts ──────────────────────────────────────────────
import { MainLayout } from "./components/layout/main-layout";

// ─── Route guards ─────────────────────────────────────────
import {
  ProtectedRoute,
  GuestRoute,
} from "./components/shared/protected-route";

// ─── Auth pages ───────────────────────────────────────────
import LoginPage from "./pages/auth/login-page";
import RegisterPage from "./pages/auth/register-page";
import VerifyEmailPage from "./pages/auth/verify-email-page";
import ForgotPasswordPage from "./pages/auth/forgot-password-page";

// ─── Main pages ───────────────────────────────────────────
import FeedPage from "./pages/feed-page";
import ProfilePage from "./pages/profile-page";
import FriendsPage from "./pages/friends-page";
import NotificationsPage from "./pages/notifications-page";
import PostDetailPage from "./pages/post-detail-page";
import SettingsPage from "./pages/settings-page";
import NotFoundPage from "./pages/not-found-page";

function AppBootstrap({ children }: { children: React.ReactNode }) {
  const { isReady } = useBootstrap();
  useSocket(); 

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppBootstrap>
          <Routes>
            {/* ─── Guest routes ──────────────────────────── */}
            <Route
              path="/login"
              element={
                <GuestRoute>
                  <LoginPage />
                </GuestRoute>
              }
            />
            <Route
              path="/register"
              element={
                <GuestRoute>
                  <RegisterPage />
                </GuestRoute>
              }
            />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route
              path="/forgot-password"
              element={
                <GuestRoute>
                  <ForgotPasswordPage />
                </GuestRoute>
              }
            />

            {/* ─── Protected routes (MainLayout) ─────────── */}
            <Route
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/feed" replace />} />
              <Route path="/feed" element={<FeedPage />} />
              <Route path="/profile/:username" element={<ProfilePage />} />
              <Route path="/friends" element={<FriendsPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/posts/:id" element={<PostDetailPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            {/* ─── 404 ───────────────────────────────────── */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AppBootstrap>
      </BrowserRouter>

      <Toaster position="top-right" richColors closeButton duration={3500} />
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
