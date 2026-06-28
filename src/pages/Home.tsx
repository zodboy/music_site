import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Play,
  ListMusic,
  Clock,
  Plus,
  Heart,
  Music,
  Sparkles,
} from "lucide-react";
import { api } from "@/lib/api";
import { useUserStore } from "@/store/user";
import { usePlayerStore, trackToCurrent } from "@/store/player";
import type { Playlist, TrackInDB, PlaylistTrackItem } from "@/lib/types";
import { toast } from "sonner";

export default function Home() {
  const { user } = useUserStore();
  const nav = useNavigate();
  const { playTrack } = usePlayerStore();

  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [recent, setRecent] = useState<
    Array<{ track: TrackInDB; progressMs: number; playedAt: string }>
  >([]);
  const [favorites, setFavorites] = useState<
    Array<{ track: TrackInDB; createdAt: string }>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    Promise.all([api.playlists(), api.history(), api.favorites()])
      .then(([pl, his, fv]) => {
        setPlaylists(pl.data || []);
        setRecent(his.data || []);
        setFavorites(fv.data || []);
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) {
    return (
      <div className="container py-20 text-center">
        <div className="mx-auto max-w-md space-y-4">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-gold to-gold-hover shadow-glow">
            <Music className="h-8 w-8 text-ink-base" />
          </div>
          <h1 className="font-display text-3xl font-bold">
            欢迎来到<span className="text-gold">音域</span>
          </h1>
          <p className="text-sm text-fg-secondary">
            聚合网易云 / QQ 音乐 / 酷狗三大平台，支持从网易云复制链接导入歌单，自建歌单，跨源检索
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Link
              to="/login"
              className="rounded-full border border-ink-border px-6 py-2 text-sm transition hover:border-gold"
            >
              登录
            </Link>
            <Link
              to="/register"
              className="rounded-full bg-gold px-6 py-2 text-sm font-medium text-ink-base transition hover:bg-gold-hover"
            >
              立即注册
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container py-20 text-center text-fg-secondary">
        加载中...
      </div>
    );
  }

  const playRecent = (i: number) => {
    const queue = recent.map((r) => trackToCurrent(r.track));
    playTrack(queue[i], queue);
  };

  return (
    <div className="container space-y-10 py-8">
      <section>
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-xl font-bold">
            <ListMusic className="h-5 w-5 text-gold" />
            我的歌单
          </h2>
          <button
            onClick={() => nav("/me")}
            className="text-sm text-fg-secondary hover:text-gold"
          >
            全部
          </button>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
          <button
            onClick={() => nav("/me?action=new")}
            className="group flex aspect-square flex-col items-center justify-center rounded-lg border border-dashed border-ink-border text-fg-secondary transition hover:border-gold hover:text-gold"
          >
            <Plus className="h-8 w-8" />
            <span className="mt-2 text-sm">新建歌单</span>
          </button>
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
                    alt={p.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full place-items-center">
                    <Music className="h-8 w-8 text-fg-muted" />
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-base to-transparent p-2">
                  <div className="truncate text-sm font-medium text-fg-primary">
                    {p.name}
                  </div>
                </div>
              </div>
              <div className="text-xs text-fg-secondary">
                {p._count?.tracks ?? 0} 首
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-xl font-bold">
            <Clock className="h-5 w-5 text-gold" />
            最近播放
          </h2>
          <Link to="/me?tab=history" className="text-sm text-fg-secondary hover:text-gold">
            全部
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed border-ink-border p-8 text-center text-sm text-fg-muted">
            暂无播放历史
          </div>
        ) : (
          <div className="mt-4 space-y-1">
            {recent.slice(0, 8).map((r, i) => (
              <button
                key={`${r.track.provider}-${r.track.providerId}`}
                onClick={() => playRecent(i)}
                className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition hover:bg-ink-hover"
              >
                <span className="w-5 text-right text-xs text-fg-muted">
                  {i + 1}
                </span>
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
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm text-fg-primary">
                    {r.track.name}
                  </div>
                  <div className="truncate text-xs text-fg-secondary">
                    {r.track.artist}
                  </div>
                </div>
                <Play className="h-4 w-4 shrink-0 text-gold" />
              </button>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="flex items-center gap-2 font-display text-xl font-bold">
          <Heart className="h-5 w-5 text-gold" />
          我的收藏
        </h2>
        {favorites.length === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed border-ink-border p-8 text-center text-sm text-fg-muted">
            暂无收藏
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
            {favorites.slice(0, 12).map((f) => (
              <button
                key={`${f.track.provider}-${f.track.providerId}`}
                onClick={() =>
                  playTrack(trackToCurrent(f.track), favorites.map((x) => trackToCurrent(x.track)))
                }
                className="group space-y-2 text-left"
              >
                <div className="aspect-square overflow-hidden rounded-lg bg-ink-card ring-1 ring-ink-border transition group-hover:ring-gold">
                  {f.track.cover ? (
                    <img
                      src={f.track.cover}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full place-items-center">
                      <Music className="h-6 w-6 text-fg-muted" />
                    </div>
                  )}
                </div>
                <div className="truncate text-xs font-medium text-fg-primary">
                  {f.track.name}
                </div>
                <div className="truncate text-[10px] text-fg-secondary">
                  {f.track.artist}
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      <section>
        <Link
          to="/import"
          className="flex items-center justify-between rounded-xl border border-ink-border bg-ink-card p-5 transition hover:border-gold"
        >
          <div className="flex items-center gap-3">
            <Sparkles className="h-6 w-6 text-gold" />
            <div>
              <div className="font-medium">从网易云 / QQ 音乐 导入歌单</div>
              <div className="text-xs text-fg-secondary">
                直接粘贴歌单链接即可一键导入
              </div>
            </div>
          </div>
          <Plus className="h-5 w-5 text-gold" />
        </Link>
      </section>
    </div>
  );
}
