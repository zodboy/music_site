import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Repeat,
  Repeat1,
  ChevronUp,
  ChevronDown,
  Loader2,
  X,
} from "lucide-react";
import { usePlayerStore, getAudioEl } from "@/store/player";

function fmt(sec: number): string {
  if (!sec || !isFinite(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function PlayerBar() {
  const {
    current,
    playing,
    loadingUrl,
    error,
    volume,
    muted,
    loop,
    toggle,
    next,
    prev,
    seekTo,
    setVolume,
    toggleMute,
    cycleLoop,
    stop,
  } = usePlayerStore();
  const lyric = usePlayerStore((s) => s.lyric);
  const lyricTrans = usePlayerStore((s) => s.lyricTrans);

  const [audioCur, setAudioCur] = useState(0);
  const [audioDur, setAudioDur] = useState(0);
  const [dragging, setDragging] = useState<number | null>(null);
  const [lyricOpen, setLyricOpen] = useState(false);

  useEffect(() => {
    const a = getAudioEl();
    if (!a) return;
    const onTime = () => setAudioCur(a.currentTime);
    const onDur = () => setAudioDur(a.duration);
    const onPlay = () => usePlayerStore.setState({ playing: true });
    const onPause = () => usePlayerStore.setState({ playing: false });
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("durationchange", onDur);
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("durationchange", onDur);
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
    };
  }, []);

  if (!current) return null;

  const durSec = audioDur || current.durationMs / 1000;
  const curSec = dragging ?? audioCur;
  const pct = durSec ? Math.min(100, (curSec / durSec) * 100) : 0;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-ink-border bg-ink-card/95 backdrop-blur-md">
        <div className="container py-3">
          <div className="flex items-center gap-4">
            {/* Track info */}
            <div className="flex min-w-0 flex-1 items-center gap-3">
              {current.cover ? (
                <img
                  src={current.cover}
                  alt=""
                  className="h-12 w-12 rounded object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <div className="grid h-12 w-12 place-items-center rounded bg-gradient-to-br from-gold to-gold-hover">
                  <Play className="h-5 w-5 text-ink-base" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-fg-primary">
                  {current.name}
                </div>
                <div className="truncate text-xs text-fg-secondary">
                  {current.artist}
                  {current.album ? ` · ${current.album}` : ""}
                </div>
              </div>
              <button
                onClick={() => setLyricOpen(true)}
                className="hidden rounded-md p-2 text-fg-secondary transition hover:bg-ink-hover hover:text-fg-primary md:block"
                title="歌词"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
              <button
                onClick={stop}
                className="rounded-md p-2 text-fg-secondary transition hover:bg-ink-hover hover:text-red-400"
                title="停止"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={prev}
                className="rounded-full p-2 text-fg-secondary transition hover:text-fg-primary"
                title="上一首"
              >
                <SkipBack className="h-4 w-4" />
              </button>
              <button
                onClick={toggle}
                disabled={loadingUrl}
                className="grid h-10 w-10 place-items-center rounded-full bg-gold text-ink-base transition hover:bg-gold-hover disabled:opacity-50"
              >
                {loadingUrl ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : playing ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5 translate-x-0.5" />
                )}
              </button>
              <button
                onClick={next}
                className="rounded-full p-2 text-fg-secondary transition hover:text-fg-primary"
                title="下一首"
              >
                <SkipForward className="h-4 w-4" />
              </button>
              <button
                onClick={cycleLoop}
                className={`rounded-full p-2 transition ${
                  loop === "off"
                    ? "text-fg-muted hover:text-fg-primary"
                    : "text-gold"
                }`}
                title={`循环: ${loop}`}
              >
                {loop === "one" ? (
                  <Repeat1 className="h-4 w-4" />
                ) : (
                  <Repeat className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Progress */}
            <div className="hidden flex-1 items-center gap-2 md:flex">
              <span className="w-10 text-right text-xs tabular-nums text-fg-muted">
                {fmt(curSec)}
              </span>
              <div
                className="group relative h-1 flex-1 cursor-pointer rounded-full bg-ink-border"
                onPointerDown={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const sec = (x / rect.width) * durSec;
                  setDragging(sec);
                  (e.currentTarget as HTMLElement).setPointerCapture(
                    e.pointerId,
                  );
                }}
                onPointerMove={(e) => {
                  if (dragging === null) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const sec = Math.max(
                    0,
                    Math.min(durSec, (x / rect.width) * durSec),
                  );
                  setDragging(sec);
                }}
                onPointerUp={(e) => {
                  if (dragging !== null) {
                    seekTo(dragging);
                    setDragging(null);
                  }
                  (e.currentTarget as HTMLElement).releasePointerCapture(
                    e.pointerId,
                  );
                }}
              >
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-gold"
                  style={{ width: `${pct}%` }}
                />
                <div
                  className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold opacity-0 transition group-hover:opacity-100"
                  style={{ left: `${pct}%` }}
                />
              </div>
              <span className="w-10 text-xs tabular-nums text-fg-muted">
                {fmt(durSec)}
              </span>
            </div>

            {/* Volume */}
            <div className="hidden items-center gap-2 md:flex">
              <button
                onClick={toggleMute}
                className="rounded p-1.5 text-fg-secondary hover:text-fg-primary"
              >
                {muted || volume === 0 ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={muted ? 0 : volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-20"
              />
            </div>
          </div>

          {error && (
            <div className="mt-1 text-xs text-red-400">播放错误：{error}</div>
          )}

          {/* Mobile progress */}
          <div className="mt-2 flex items-center gap-2 md:hidden">
            <span className="text-[10px] tabular-nums text-fg-muted">
              {fmt(curSec)}
            </span>
            <div
              className="relative h-1 flex-1 cursor-pointer rounded-full bg-ink-border"
              onPointerDown={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const sec = (x / rect.width) * durSec;
                setDragging(sec);
                (e.currentTarget as HTMLElement).setPointerCapture(
                  e.pointerId,
                );
              }}
              onPointerMove={(e) => {
                if (dragging === null) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const sec = Math.max(
                  0,
                  Math.min(durSec, (x / rect.width) * durSec),
                );
                setDragging(sec);
              }}
              onPointerUp={(e) => {
                if (dragging !== null) {
                  seekTo(dragging);
                  setDragging(null);
                }
                (e.currentTarget as HTMLElement).releasePointerCapture(
                  e.pointerId,
                );
              }}
            >
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gold"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[10px] tabular-nums text-fg-muted">
              {fmt(durSec)}
            </span>
          </div>
        </div>
      </div>

      {lyricOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 flex flex-col bg-ink-base/95 backdrop-blur-md md:bottom-20 md:left-0 md:right-0 md:top-auto md:h-[60vh]">
            <div className="flex items-center justify-between border-b border-ink-border px-4 py-3">
              <div className="text-sm font-medium text-fg-primary">歌词</div>
              <button
                onClick={() => setLyricOpen(false)}
                className="rounded p-1.5 text-fg-secondary hover:text-fg-primary"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {lyric ? (
                <pre className="whitespace-pre-wrap text-center text-sm leading-relaxed text-fg-secondary">
                  {lyric}
                </pre>
              ) : (
                <p className="text-center text-sm text-fg-muted">
                  暂无歌词
                </p>
              )}
              {lyricTrans && (
                <pre className="mt-4 whitespace-pre-wrap text-center text-xs leading-relaxed text-fg-muted">
                  {lyricTrans}
                </pre>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
