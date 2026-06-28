import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { createPortal } from "react-dom";
import { Music, Search, Plus, User, LogOut, Menu, X, ListMusic, Clock } from "lucide-react";
import { useUserStore } from "@/store/user";
import { toast } from "sonner";

const NAV = [
  { to: "/", label: "首页", icon: Music },
  { to: "/search", label: "搜索", icon: Search },
  { to: "/import", label: "导入歌单", icon: Plus },
  { to: "/me", label: "我的", icon: User },
];

export default function Header() {
  const { user, logout } = useUserStore();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const nav = useNavigate();
  const loc = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [loc.pathname]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const kw = q.trim();
    if (!kw) return;
    nav(`/search?kw=${encodeURIComponent(kw)}`);
  };

  const onLogout = () => {
    logout();
    toast.success("已退出登录");
    nav("/");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-ink-border bg-ink-base/80 backdrop-blur-md">
      <div className="container flex h-16 items-center gap-4">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-gold to-gold-hover shadow-glow">
            <Music className="h-5 w-5 text-ink-base" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight">
            音<span className="text-gold">域</span>
          </span>
        </Link>

        <nav className="hidden flex-1 items-center gap-1 md:flex">
          {NAV.map((n) => {
            const active = loc.pathname === n.to;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-gold-soft text-gold"
                    : "text-fg-secondary hover:bg-ink-hover hover:text-fg-primary"
                }`}
              >
                <n.icon className="h-4 w-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>

        <form onSubmit={submit} className="hidden flex-1 md:block md:max-w-xs">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="搜索歌曲 / 歌手 / 专辑"
              className="w-full rounded-full border border-ink-border bg-ink-card py-2 pl-10 pr-3 text-sm outline-none transition focus:border-gold focus:ring-1 focus:ring-gold"
            />
          </div>
        </form>

        <div className="ml-auto hidden items-center gap-2 md:flex">
          {user ? (
            <div className="flex items-center gap-2">
              <Link
                to="/me"
                className="flex items-center gap-2 rounded-full bg-ink-card px-3 py-1.5 text-sm ring-1 ring-ink-border transition hover:ring-gold"
              >
                <div className="grid h-6 w-6 place-items-center rounded-full bg-gold-soft text-gold">
                  <User className="h-3.5 w-3.5" />
                </div>
                <span className="max-w-[120px] truncate">{user.username}</span>
              </Link>
              <button
                onClick={onLogout}
                className="rounded-full p-2 text-fg-secondary transition hover:bg-ink-hover hover:text-fg-primary"
                title="退出"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-full px-4 py-1.5 text-sm text-fg-secondary transition hover:text-fg-primary"
              >
                登录
              </Link>
              <Link
                to="/register"
                className="rounded-full bg-gold px-4 py-1.5 text-sm font-medium text-ink-base transition hover:bg-gold-hover"
              >
                注册
              </Link>
            </>
          )}
        </div>

        <button
          onClick={() => setOpen((v) => !v)}
          className="ml-auto rounded-md p-2 text-fg-secondary md:hidden"
          aria-label="菜单"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-50 bg-ink-base/95 backdrop-blur-sm md:hidden"
            onClick={() => setOpen(false)}
          >
            <div className="pt-20" onClick={(e) => e.stopPropagation()}>
              <div className="container space-y-4">
                <form onSubmit={submit}>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted" />
                    <input
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="搜索歌曲 / 歌手 / 专辑"
                      className="w-full rounded-full border border-ink-border bg-ink-card py-2.5 pl-10 pr-3 text-sm outline-none focus:border-gold"
                      autoFocus
                    />
                  </div>
                </form>
                <nav className="space-y-1">
                  {NAV.map((n) => {
                    const active = loc.pathname === n.to;
                    return (
                      <Link
                        key={n.to}
                        to={n.to}
                        className={`flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium ${
                          active
                            ? "bg-gold-soft text-gold"
                            : "text-fg-primary hover:bg-ink-hover"
                        }`}
                      >
                        <n.icon className="h-5 w-5" />
                        {n.label}
                      </Link>
                    );
                  })}
                </nav>
                <div className="border-t border-ink-border pt-4">
                  {user ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 px-4 py-2">
                        <div className="grid h-9 w-9 place-items-center rounded-full bg-gold-soft text-gold">
                          <User className="h-4 w-4" />
                        </div>
                        <div className="flex-1 truncate text-sm">
                          {user.username}
                        </div>
                      </div>
                      <button
                        onClick={onLogout}
                        className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-base text-red-400 hover:bg-ink-hover"
                      >
                        <LogOut className="h-5 w-5" />
                        退出登录
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 px-4">
                      <Link
                        to="/login"
                        className="rounded-lg border border-ink-border px-4 py-2 text-center text-sm"
                      >
                        登录
                      </Link>
                      <Link
                        to="/register"
                        className="rounded-lg bg-gold px-4 py-2 text-center text-sm font-medium text-ink-base"
                      >
                        注册
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </header>
  );
}
