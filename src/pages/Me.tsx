import { useEffect, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import {
  Music,
  Plus,
  ListMusic,
  Heart,
  Clock,
  Trash2,
  X,
  Play,
  Loader2,
  User,
} from "lucide-react";
import { api } from "@/lib/api";
import { useUserStore } from "@/store/user";
import { usePlayerStore, trackToCurrent } from "@/store/player";
import type { Playlist, TrackInDB } from "@/lib/types";
import { toast } from "sonner";

type Tab = "playlists" | "favorites" | "history";

export default function Me() {
  const [params, setParams] = useSearchParams();
  const nav = useNavigate();
  const { user, logout } = useUserStore();
  const { playTrack } = usePlayerStore();

  const tab = (params.get("tab") as Tab) || "playlists";
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [favorites, setFavorites] = useState<
    Array<{ track: TrackInDB; createdAt: string }>
  >([]);
  const [recent, setRecent] = useState<
    Array<{ track: TrackInDB; progressMs: number; playedAt: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    Promise.all([api.playlists(), api.favorites(), api.history()])
      .then(([pl, fv, hi]) => {
        setPlaylists(pl.data || []);
        setFavorites(fv.data || []);
        setRecent(hi.data || []);
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (params.get("action") === "new") setShowCreate(true);
  }, [params]);

  const setTab = (t: Tab) => setParams({ tab: t });

  const createPlaylist = async () => {
    if (!newName.trim()) {
      toast.error("请输入歌单名称");
      return;
    }
    setCreating(true);
    try {
      const r = await api.createPlaylist(newName.trim(), newDesc.trim());
      toast.success("已创建");
      setShowCreate(false);
      setNewName("");
      setNewDesc("");
      const newId = r.data?.id;
      if (newId) nav(`/playlist/${newId}`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setCreating(false);
    }
  };

  const unfavorite = async (provider: string, providerId: string) => {
    try {
      await api.unfavorite(provider, providerId);
      setFavorites((prev) =>
        prev.filter(
          (f) =>
            f.track.provider !== provider || f.track.providerId !== providerId,
        ),
      );
      toast.success("已取消收藏");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const playFromList = (
    list: Array<{ track: TrackInDB }>,
    idx: number,
  ) => {
    const queue = list.map((x) => trackToCurrent(x.track));
    playTrack(queue[idx], queue);
  };

  if (!user) {
    return (
      <div className="container py-20 text-center">
        <div className="mx-auto max-w-sm space-y-3">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-ink-card">
            <User className="h-6 w-6 text-fg-muted" />
          </div>
          <h1 className="text-lg font-bold">未登录</h1>
          <p className="text-sm text-fg-secondary">
            登录后可同步歌单、收藏、播放历史
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Link
              to="/login"
              className="rounded-full border border-ink-border px-5 py-1.5 text-sm hover:border-gold"
            >
              登录
            </Link>
            <Link
              to="/register"
              className="rounded-full bg-gold px-5 py-1.5 text-sm font-medium text-ink-base hover:bg-gold-hover"
            >
              注册
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6">
      {/* Profile header */}
      <div className="flex items-center gap-4">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-gold to-gold-hover">
          <span className="font-display text-2xl font-bold text-ink-base">
            {user.username[0]?.toUpperCase()}
          </span>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="font-display text-xl font-bold">{user.username}</h1>
            {user.role === "admin" && (
              <span className="rounded-full bg-gold-soft px-2 py-0.5 text-[10px] text-gold">
                管理员
              </span>
            )}
          </div>
          <div className="mt-0.5 text-xs text-fg-muted">
            加入于 {new Date(user.createdAt).toLocaleDateString()}
          </div>
        </div>
        <button
          onClick={() => {
            logout();
            toast.success("已退出");
            nav("/");
          }}
          className="rounded-full border border-ink-border px-4 py-1.5 text-sm text-fg-secondary transition hover:border-red-500 hover:text-red-400"
        >
          退出登录
        </button>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex gap-1 border-b border-ink-border">
        {(
          [
            { id: "playlists", label: "我的歌单", icon: ListMusic },
            { id: "favorites", label: "收藏", icon: Heart },
            { id: "history", label: "最近播放", icon: Clock },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm transition ${
              tab === t.id
                ? "border-gold text-gold"
                : "border-transparent text-fg-secondary hover:text-fg-primary"
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-fg-muted">
          <Loader2 className="mx-auto h-5 w-5 animate-spin" />
        </div>
      ) : (
        <div className="mt-6">
          {tab === "playlists" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-fg-secondary">
                  共 {playlists.length} 个歌单
                </h3>
                <button
                  onClick={() => setShowCreate(true)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-gold px-3 py-1 text-xs font-medium text-ink-base transition hover:bg-gold-hover"
                >
                  <Plus className="h-3 w-3" /> 新建
                </button>
              </div>
              {playlists.length === 0 ? (
                <div className="rounded-lg border border-dashed border-ink-border p-12 text-center text-sm text-fg-muted">
                  还没有歌单，点击右上角新建一个吧
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
                  {playlists.map((p) => (
                    <Link
                      key={p.id}
                      to={`/playlist/${p.id}`}
                      className="group space-y-2"
                    >
                      <div className="relative aspect-square overflow-hidden rounded-lg bg-ink-card ring-1 ring-ink-border transition group-hover:ring-gold">
                        {p.cover ? (
                          <img
                            src={p.cover}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="grid h-full place-items-center">
                            <Music className="h-8 w-8 text-fg-muted" />
                          </div>
                        )}
                      </div>
                      <div className="truncate text-sm font-medium">
                        {p.name}
                      </div>
                      <div className="text-xs text-fg-secondary">
                        {p._count?.tracks ?? 0} 首
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "favorites" && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-fg-secondary">
                共 {favorites.length} 首收藏
              </h3>
              {favorites.length === 0 ? (
                <div className="rounded-lg border border-dashed border-ink-border p-12 text-center text-sm text-fg-muted">
                  暂无收藏
                </div>
              ) : (
                <div className="space-y-1">
                  {favorites.map((f, i) => (
                    <div
                      key={`${f.track.provider}-${f.track.providerId}`}
                      className="group flex items-center gap-3 rounded-md px-2 py-2 transition hover:bg-ink-hover"
                    >
                      <span className="w-6 text-right text-xs text-fg-muted">
                        {i + 1}
                      </span>
                      <button
                        onClick={() => playFromList(favorites, i)}
                        className="relative shrink-0"
                      >
                        {f.track.cover ? (
                          <img
                            src={f.track.cover}
                            alt=""
                            className="h-10 w-10 rounded object-cover"
                          />
                        ) : (
                          <div className="grid h-10 w-10 place-items-center rounded bg-ink-card">
                            <Music className="h-4 w-4 text-fg-muted" />
                          </div>
                        )}
                        <div className="absolute inset-0 grid place-items-center bg-black/40 opacity-0 transition group-hover:opacity-100">
                          <Play className="h-4 w-4 fill-white text-white" />
                        </div>
                      </button>
                      <button
                        onClick={() => playFromList(favorites, i)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <div className="truncate text-sm text-fg-primary">
                          {f.track.name}
                        </div>
                        <div className="truncate text-xs text-fg-secondary">
                          {f.track.artist}
                        </div>
                      </button>
                      <button
                        onClick={() =>
                          unfavorite(f.track.provider, f.track.providerId)
                        }
                        className="rounded p-1.5 text-fg-muted opacity-0 transition hover:text-red-400 group-hover:opacity-100"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "history" && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-fg-secondary">
                共 {recent.length} 首最近播放
              </h3>
              {recent.length === 0 ? (
                <div className="rounded-lg border border-dashed border-ink-border p-12 text-center text-sm text-fg-muted">
                  暂无播放历史
                </div>
              ) : (
                <div className="space-y-1">
                  {recent.map((r, i) => (
                    <div
                      key={`${r.track.provider}-${r.track.providerId}`}
                      className="group flex items-center gap-3 rounded-md px-2 py-2 transition hover:bg-ink-hover"
                    >
                      <span className="w-6 text-right text-xs text-fg-muted">
                        {i + 1}
                      </span>
                      <button
                        onClick={() => playFromList(recent, i)}
                        className="relative shrink-0"
                      >
                        {r.track.cover ? (
                          <img
                            src={r.track.cover}
                            alt=""
                            className="h-10 w-10 rounded object-cover"
                          />
                        ) : (
                          <div className="grid h-10 w-10 place-items-center rounded bg-ink-card">
                            <Music className="h-4 w-4 text-fg-muted" />
                          </div>
                        )}
                        <div className="absolute inset-0 grid place-items-center bg-black/40 opacity-0 transition group-hover:opacity-100">
                          <Play className="h-4 w-4 fill-white text-white" />
                        </div>
                      </button>
                      <button
                        onClick={() => playFromList(recent, i)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <div className="truncate text-sm text-fg-primary">
                          {r.track.name}
                        </div>
                        <div className="truncate text-xs text-fg-secondary">
                          {r.track.artist}
                          {r.progressMs > 0 && (
                            <span className="text-fg-muted">
                              {" "}
                              · 已播放 {Math.floor(r.progressMs / 60000)}:
                              {String(Math.floor((r.progressMs % 60000) / 1000)).padStart(2, "0")}
                            </span>
                          )}
                        </div>
                      </button>
                      <span className="text-xs text-fg-muted">
                        {new Date(r.playedAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Create playlist modal */}
      {showCreate && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-ink-base/80 backdrop-blur-sm"
          onClick={() => setShowCreate(false)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-ink-border bg-ink-card p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-4 font-display text-lg font-bold">新建歌单</h2>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-fg-secondary">
                  歌单名称
                </label>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="我的歌单"
                  className="w-full rounded-lg border border-ink-border bg-ink-base px-3 py-2 text-sm outline-none focus:border-gold"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && createPlaylist()}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-fg-secondary">
                  描述（可选）
                </label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={2}
                  className="w-full resize-none rounded-lg border border-ink-border bg-ink-base px-3 py-2 text-sm outline-none focus:border-gold"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowCreate(false)}
                className="rounded-full border border-ink-border px-4 py-1.5 text-sm text-fg-secondary hover:border-fg-secondary"
              >
                取消
              </button>
              <button
                onClick={createPlaylist}
                disabled={creating}
                className="inline-flex items-center gap-1.5 rounded-full bg-gold px-4 py-1.5 text-sm font-medium text-ink-base transition hover:bg-gold-hover disabled:opacity-50"
              >
                {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
