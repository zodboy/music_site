import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Music, Loader2 } from "lucide-react";
import { useUserStore } from "@/store/user";
import { toast } from "sonner";

export default function Login() {
  const nav = useNavigate();
  const { login } = useUserStore();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      toast.error("请输入用户名和密码");
      return;
    }
    setLoading(true);
    try {
      await login(username.trim(), password);
      toast.success("登录成功");
      nav("/");
    } catch (e: any) {
      toast.error(e.message || "登录失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container flex min-h-[60vh] items-center justify-center py-8">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-gold to-gold-hover shadow-glow">
            <Music className="h-6 w-6 text-ink-base" />
          </div>
          <h1 className="font-display text-xl font-bold">登录</h1>
          <p className="mt-1 text-xs text-fg-secondary">
            继续你的音乐之旅
          </p>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-fg-secondary">
              用户名
            </label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-lg border border-ink-border bg-ink-card px-3 py-2 text-sm outline-none focus:border-gold"
              autoComplete="username"
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-fg-secondary">
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-ink-border bg-ink-card px-3 py-2 text-sm outline-none focus:border-gold"
              autoComplete="current-password"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gold py-2.5 text-sm font-medium text-ink-base transition hover:bg-gold-hover disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            登录
          </button>
        </form>
        <div className="mt-4 text-center text-xs text-fg-secondary">
          还没有账号？{" "}
          <Link to="/register" className="text-gold hover:underline">
            立即注册
          </Link>
        </div>
      </div>
    </div>
  );
}
