import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Play,
  Trash2,
  Music,
  Pencil,
  Check,
  X,
  Loader2,
} from "lucide-react";
import { api } from "@/lib/api";
import { useUserStore } from "@/store/user";
import { usePlayerStore, trackToCurrent } from "@/store/player";
import type { Playlist } from "@/lib/types";
import { toast } from "sonner";

export default function PlaylistDetail() {
  const { id } = useParams();
  const playlistId = Number(id);
  const nav = useNavigate();
  const { user } = useUserStore();
  const { playTrack } = usePlayerStore();

  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  useEffect(() => {
    if (!playlistId) return;
    setLoading(true);
    api
      .playlistDetail(playlistId)
      .then((r) => {
        setPlaylist(r.data);
        setEditName(r.data?.name || "");
        setEditDesc(r.data?.description || "");
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [playlistId]);

  const playAll = () => {
    if (!playlist?.tracks?.length) return;
    const queue = playlist.tracks
      .slice()
      .sort((a, b) => a.sort - b.sort)
      .map((t) => trackToCurrent(t.track));
    playTrack(queue[0], queue);
  };

  const playOne = (trackId: number) => {
    if (!playlist?.tracks?.length) return;
    const sorted = playlist.tracks.slice().sort((a, b) => a.sort - b.sort);
    const idx = sorted.findIndex((t) => t.trackId === trackId);
    if (idx < 0) return;
    const queue = sorted.map((t) => trackToCurrent(t.track));
    playTrack(queue[idx], queue);
  };

  const removeTrack = async (trackId: number) => {
    if (!playlist) return;
    try {
      await api.removeTrackFromPlaylist(playlist.id, trackId);
      setPlaylist({
        ...playlist,
        tracks: playlist.tracks?.filter((t) => t.trackId !== trackId),
      });
      toast.success("已移除");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const saveEdit = async () => {
    if (!playlist) return;
    try {
      await api.updatePlaylist(playlist.id, {
        name: editName.trim() || playlist.name,
        description: editDesc,
      });
      setPlaylist({
        ...playlist,
        name: editName.trim() || playlist.name,
        description: editDesc,
      });
      setEditing(false);
      toast.success("已保存");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const deletePlaylist = async () => {
    if (!playlist) return;
    if (!confirm(`确定删除歌单「${playlist.name}」？此操作不可撤销。`)) return;
    try {
      await api.deletePlaylist(playlist.id);
      toast.success("已删除");
      nav("/me");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  if (loading) {
    return (
      <div className="container py-20 text-center text-fg-secondary">
        加载中...
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="container py-20 text-center text-fg-secondary">
        歌单不存在
      </div>
    );
  }

  const sortedTracks = (playlist.tracks || []).slice().sort(
    (a, b) => a.sort - b.sort,
  );

  return (
    <div className="container py-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        <div className="h-40 w-40 shrink-0 overflow-hidden rounded-xl bg-ink-card ring-1 ring-ink-border md:h-48 md:w-48">
          {playlist.cover ? (
            <img
              src={playlist.cover}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="grid h-full place-items-center">
              <Music className="h-12 w-12 text-fg-muted" />
            </div>
          )}
        </div>
        <div className="flex-1 space-y-2">
          {playlist.source !== "local" && (
            <span className="inline-block rounded-full bg-gold-soft px-2 py-0.5 text-xs text-gold">
              来源：{playlist.source}
            </span>
          )}
          {editing ? (
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full max-w-md rounded border border-ink-border bg-ink-card px-2 py-1 text-xl font-bold outline-none focus:border-gold"
            />
          ) : (
            <h1 className="font-display text-2xl font-bold md:text-3xl">
              {playlist.name}
            </h1>
          )}
          {editing ? (
            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              rows={2}
              placeholder="歌单描述"
              className="w-full max-w-md rounded border border-ink-border bg-ink-card px-2 py-1 text-sm outline-none focus:border-gold"
            />
          ) : (
            playlist.description && (
              <p className="text-sm text-fg-secondary">
                {playlist.description}
              </p>
            )
          )}
          <div className="flex flex-wrap items-center gap-3 text-xs text-fg-muted">
            <span>{sortedTracks.length} 首</span>
            {user && playlist.userId === user.id && (
              <span>· 创建于 {new Date(playlist.createdAt).toLocaleDateString()}</span>
            )}
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              onClick={playAll}
              disabled={sortedTracks.length === 0}
              className="inline-flex items-center gap-1.5 rounded-full bg-gold px-4 py-1.5 text-sm font-medium text-ink-base transition hover:bg-gold-hover disabled:opacity-50"
            >
              <Play className="h-4 w-4" /> 播放全部
            </button>
            {user && playlist.userId === user.id && (
              <>
                {editing ? (
                  <>
                    <button
                      onClick={saveEdit}
                      className="inline-flex items-center gap-1.5 rounded-full border border-gold px-3 py-1.5 text-sm text-gold"
                    >
                      <Check className="h-4 w-4" /> 保存
                    </button>
                    <button
                      onClick={() => {
                        setEditing(false);
                        setEditName(playlist.name);
                        setEditDesc(playlist.description || "");
                      }}
                      className="inline-flex items-center gap-1.5 rounded-full border border-ink-border px-3 py-1.5 text-sm text-fg-secondary"
                    >
                      <X className="h-4 w-4" /> 取消
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setEditing(true)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-ink-border px-3 py-1.5 text-sm text-fg-secondary transition hover:border-gold hover:text-gold"
                  >
                    <Pencil className="h-4 w-4" /> 编辑
                  </button>
                )}
                <button
                  onClick={deletePlaylist}
                  className="inline-flex items-center gap-1.5 rounded-full border border-ink-border px-3 py-1.5 text-sm text-fg-secondary transition hover:border-red-500 hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" /> 删除
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-1">
        {sortedTracks.length === 0 ? (
          <div className="rounded-lg border border-dashed border-ink-border p-12 text-center text-sm text-fg-muted">
            歌单还是空的，去搜索添加歌曲吧
          </div>
        ) : (
          sortedTracks.map((item, i) => (
            <div
              key={item.id}
              className="group flex items-center gap-3 rounded-md px-2 py-2 transition hover:bg-ink-hover"
            >
              <span className="w-6 text-right text-xs text-fg-muted">
                {i + 1}
              </span>
              <button
                onClick={() => playOne(item.trackId)}
                className="relative shrink-0"
              >
                {item.track.cover ? (
                  <img
                    src={item.track.cover}
                    alt=""
                    className="h-10 w-10 rounded object-cover"
                  />
                ) : (
                  <div className="grid h-10 w-10 place-items-center rounded bg-ink-card">
                    <Music className="h-4 w-4 text-fg-muted" />
                  </div>
                )}
                <div className="absolute inset-0 grid place-items-center bg-black/40 opacity-0 transition group-hover:opacity-100">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </button>
              <button
                onClick={() => playOne(item.trackId)}
                className="min-w-0 flex-1 text-left"
              >
                <div className="truncate text-sm text-fg-primary">
                  {item.track.name}
                </div>
                <div className="truncate text-xs text-fg-secondary">
                  {item.track.artist}
                  {item.track.album ? ` · ${item.track.album}` : ""}
                </div>
              </button>
              <span className="text-xs text-fg-muted">
                {Math.floor(item.track.durationMs / 60000)}:
                {String(Math.floor((item.track.durationMs % 60000) / 1000)).padStart(2, "0")}
              </span>
              {user && playlist.userId === user.id && (
                <button
                  onClick={() => removeTrack(item.trackId)}
                  className="rounded p-1.5 text-fg-muted opacity-0 transition hover:text-red-400 group-hover:opacity-100"
                  title="移除"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
