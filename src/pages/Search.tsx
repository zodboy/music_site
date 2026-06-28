import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Search as SearchIcon, Music, Loader2, Plus } from "lucide-react";
import { api } from "@/lib/api";
import { useUserStore } from "@/store/user";
import { usePlayerStore } from "@/store/player";
import type { RemoteTrack, Provider } from "@/lib/types";
import { toast } from "sonner";

interface SearchResult {
  provider: Provider;
  list: RemoteTrack[];
}

const SOURCE_LABELS: Record<Provider, string> = {
  netease: "网易云",
  qq: "QQ音乐",
  kugou: "酷狗",
};

const SOURCE_COLORS: Record<Provider, string> = {
  netease: "#E8B339",
  qq: "#3B82F6",
  kugou: "#22c55e",
};

export default function Search() {
  const [params, setParams] = useSearchParams();
  const initialKw = params.get("kw") || "";
  const [kw, setKw] = useState(initialKw);
  const [sources, setSources] = useState<Record<Provider, boolean>>({
    netease: true,
    qq: true,
    kugou: true,
  });
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [addTarget, setAddTarget] = useState<number | "new" | null>(null);
  const [playlists, setPlaylists] = useState<
    Array<{ id: number; name: string }>
  >([]);
  const { user } = useUserStore();
  const { playTrack } = usePlayerStore();

  const doSearch = useCallback(
    async (keyword: string) => {
      if (!keyword.trim()) return;
      setLoading(true);
      setResults([]);
      try {
        const enabledSources = (Object.keys(sources) as Provider[]).filter(
          (s) => sources[s],
        );
        const r = await api.search(
          keyword,
          enabledSources.join(","),
        );
        // backend returns { bySource: { netease: [...], qq: [...], kugou: [...] }, total }
        const bySource = (r.data?.bySource || {}) as Record<Provider, RemoteTrack[]>;
        const arr: SearchResult[] = (Object.keys(bySource) as Provider[])
          .filter((p) => (sources as any)[p])
          .map((p) => ({
            provider: p,
            list: bySource[p] || [],
          }))
          .filter((x) => x.list.length > 0);
        setResults(arr);
      } catch (e: any) {
        toast.error(e.message || "搜索失败");
      } finally {
        setLoading(false);
      }
    },
    [sources],
  );

  useEffect(() => {
    if (initialKw) {
      setKw(initialKw);
      doSearch(initialKw);
    }
  }, [initialKw]);

  useEffect(() => {
    if (user) api.playlists().then((r) => setPlaylists(r.data || []));
  }, [user]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const k = kw.trim();
    if (!k) return;
    setParams({ kw: k });
    doSearch(k);
  };

  const toggleSource = (s: Provider) => {
    setSources((prev) => ({ ...prev, [s]: !prev[s] }));
  };

  const addToPlaylist = async (target: number | "new", track: RemoteTrack) => {
    if (!user) {
      toast.error("请先登录");
      return;
    }
    if (target === "new") {
      const name = window.prompt("请输入新歌单名称", `我的歌单 ${new Date().toLocaleDateString()}`);
      if (!name) return;
      try {
        const r = await api.createPlaylist(name);
        const newId = r.data?.id;
        if (!newId) throw new Error("创建失败");
        await api.addTrackToPlaylist(newId, track);
        toast.success("已添加到新歌单");
        api.playlists().then((r) => setPlaylists(r.data || []));
      } catch (e: any) {
        toast.error(e.message);
      }
      return;
    }
    try {
      await api.addTrackToPlaylist(target, track);
      toast.success("已添加到歌单");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const allResults = results.flatMap((r) => r.list);
  const playAll = () => {
    if (allResults.length === 0) return;
    playTrack(
      {
        provider: allResults[0].provider,
        providerId: allResults[0].providerId,
        name: allResults[0].name,
        artist: allResults[0].artist,
        album: allResults[0].album,
        cover: allResults[0].cover,
        durationMs: allResults[0].durationMs,
      },
      allResults.map((t) => ({
        provider: t.provider,
        providerId: t.providerId,
        name: t.name,
        artist: t.artist,
        album: t.album,
        cover: t.cover,
        durationMs: t.durationMs,
      })),
    );
  };

  return (
    <div className="container py-6">
      <form onSubmit={submit} className="space-y-3">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-fg-muted" />
          <input
            value={kw}
            onChange={(e) => setKw(e.target.value)}
            placeholder="搜索歌曲 / 歌手 / 专辑"
            className="w-full rounded-full border border-ink-border bg-ink-card py-3 pl-12 pr-4 text-base outline-none transition focus:border-gold focus:ring-1 focus:ring-gold"
            autoFocus
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(Object.keys(SOURCE_LABELS) as Provider[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => toggleSource(s)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs transition ${
                sources[s]
                  ? "bg-gold-soft text-gold ring-1 ring-gold"
                  : "bg-ink-card text-fg-muted ring-1 ring-ink-border"
              }`}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: SOURCE_COLORS[s] }}
              />
              {SOURCE_LABELS[s]}
            </button>
          ))}
          {allResults.length > 0 && (
            <button
              type="button"
              onClick={playAll}
              className="ml-auto rounded-full bg-gold px-4 py-1 text-xs font-medium text-ink-base transition hover:bg-gold-hover"
            >
              播放全部
            </button>
          )}
        </div>
      </form>

      <div className="mt-6">
        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-gold" />
          </div>
        )}

        {!loading && allResults.length === 0 && initialKw && (
          <div className="py-12 text-center text-sm text-fg-muted">
            暂无结果
          </div>
        )}

        {!loading && !initialKw && (
          <div className="py-12 text-center text-sm text-fg-muted">
            输入关键词开始搜索
          </div>
        )}

        {!loading &&
          results.map((r) => (
            <div key={r.provider} className="mb-6">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-fg-secondary">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: SOURCE_COLORS[r.provider] }}
                />
                {SOURCE_LABELS[r.provider]} · {r.list.length} 首
              </div>
              <div className="space-y-1">
                {r.list.map((t, i) => (
                  <div
                    key={`${t.provider}-${t.providerId}`}
                    className="group flex items-center gap-3 rounded-md px-2 py-2 transition hover:bg-ink-hover"
                  >
                    <span className="w-6 text-right text-xs text-fg-muted">
                      {i + 1}
                    </span>
                    <button
                      onClick={() =>
                        playTrack(
                          {
                            provider: t.provider,
                            providerId: t.providerId,
                            name: t.name,
                            artist: t.artist,
                            album: t.album,
                            cover: t.cover,
                            durationMs: t.durationMs,
                          },
                          allResults.map((x) => ({
                            provider: x.provider,
                            providerId: x.providerId,
                            name: x.name,
                            artist: x.artist,
                            album: x.album,
                            cover: x.cover,
                            durationMs: x.durationMs,
                          })),
                        )
                      }
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      <div className="relative shrink-0">
                        {t.cover ? (
                          <img
                            src={t.cover}
                            alt=""
                            className="h-10 w-10 rounded object-cover"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="grid h-10 w-10 place-items-center rounded bg-ink-card">
                            <Music className="h-4 w-4 text-fg-muted" />
                          </div>
                        )}
                        <div className="absolute inset-0 grid place-items-center bg-black/40 opacity-0 transition group-hover:opacity-100">
                          <svg
                            viewBox="0 0 24 24"
                            className="h-4 w-4 fill-white"
                          >
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm text-fg-primary">
                          {t.name}
                        </div>
                        <div className="truncate text-xs text-fg-secondary">
                          {t.artist}
                          {t.album ? ` · ${t.album}` : ""}
                        </div>
                      </div>
                    </button>

                    {user && (
                      <div className="relative">
                        <button
                          onClick={() =>
                            setAddTarget((prev) =>
                              prev === null ? -1 : null,
                            )
                          }
                          className="rounded p-1.5 text-fg-muted opacity-0 transition hover:text-gold group-hover:opacity-100"
                          title="加入歌单"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                        {addTarget === -1 && (
                          <div className="absolute right-0 top-full z-10 mt-1 w-48 rounded-md border border-ink-border bg-ink-card p-1 shadow-card-hover">
                            <button
                              onClick={() => {
                                addToPlaylist("new", t);
                                setAddTarget(null);
                              }}
                              className="block w-full rounded px-3 py-1.5 text-left text-xs text-fg-primary hover:bg-ink-hover"
                            >
                              + 新建歌单
                            </button>
                            {playlists.map((p) => (
                              <button
                                key={p.id}
                                onClick={() => {
                                  addToPlaylist(p.id, t);
                                  setAddTarget(null);
                                }}
                                className="block w-full truncate rounded px-3 py-1.5 text-left text-xs text-fg-primary hover:bg-ink-hover"
                              >
                                {p.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
