import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "../../hooks/use-auth";
import api from "../../services/api";

export default function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, setAccessToken } = useAuth();

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      navigate("/login?error=google", { replace: true });
      return;
    }

    setAccessToken(token);

    api
      .get<{ user: any }>("/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        login(res.data.user, token);
        navigate("/feed", { replace: true });
      })
      .catch(() => navigate("/login?error=google", { replace: true }));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-primary" />
    </div>
  );
}
