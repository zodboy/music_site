import { create } from "zustand";
import type { TrackInDB, RemoteTrack } from "@/lib/types";
import { api } from "@/lib/api";

export interface CurrentTrack {
  provider: string;
  providerId: string;
  name: string;
  artist: string;
  album: string;
  cover?: string | null;
  durationMs: number;
  // local track id (when from playlist/favorite/history)
  trackId?: number;
}

interface PlayerState {
  current: CurrentTrack | null;
  queue: CurrentTrack[];
  index: number;
  playing: boolean;
  loop: "off" | "one" | "list";
  volume: number;
  muted: boolean;
  lyric: string | null;
  lyricTrans: string | null;
  loadingUrl: boolean;
  audioUrl: string | null;
  error: string | null;

  playTrack: (t: CurrentTrack, queue?: CurrentTrack[]) => Promise<void>;
  toggle: () => void;
  next: () => Promise<void>;
  prev: () => Promise<void>;
  seekTo: (sec: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  cycleLoop: () => void;
  setPlaying: (p: boolean) => void;
  clearLyric: () => void;
  stop: () => void;
}

let audioEl: HTMLAudioElement | null = null;
const getAudio = (): HTMLAudioElement => {
  if (!audioEl) {
    audioEl = new Audio();
    audioEl.preload = "metadata";
    audioEl.crossOrigin = "anonymous";
    if (typeof window !== "undefined") {
      (window as any).__audioIns = audioEl;
    }
  }
  return audioEl;
};

export function getAudioEl(): HTMLAudioElement | null {
  return audioEl ?? ((window as any).__audioIns as HTMLAudioElement | null);
}

let reportTimer: number | null = null;

export const usePlayerStore = create<PlayerState>((set, get) => ({
  current: null,
  queue: [],
  index: -1,
  playing: false,
  loop: "off",
  volume: 0.8,
  muted: false,
  lyric: null,
  lyricTrans: null,
  loadingUrl: false,
  audioUrl: null,
  error: null,

  playTrack: async (t, queue) => {
    const state = get();
    const newQueue = queue && queue.length > 0 ? queue : [t];
    const idx = newQueue.findIndex(
      (x) => x.provider === t.provider && x.providerId === t.providerId,
    );
    const index = idx >= 0 ? idx : 0;
    set({
      current: t,
      queue: newQueue,
      index,
      playing: false,
      loadingUrl: true,
      error: null,
      lyric: null,
      lyricTrans: null,
      audioUrl: null,
    });

    const audio = getAudio();
    audio.volume = state.muted ? 0 : state.volume;

    try {
      const r = await api.trackUrl(t.provider, t.providerId);
      const url = r?.data?.url as string | undefined;
      if (!url) throw new Error("未获取到播放链接（可能版权限制或需要登录源站）");
      audio.src = url;
      audio.currentTime = 0;
      await audio.play();
      set({ playing: true, loadingUrl: false, audioUrl: url });

      // side-effect: report history
      if (reportTimer) window.clearTimeout(reportTimer);
      reportTimer = window.setTimeout(() => {
        const remote: RemoteTrack = {
          provider: t.provider as RemoteTrack["provider"],
          providerId: t.providerId,
          name: t.name,
          artist: t.artist,
          album: t.album,
          cover: t.cover ?? undefined,
          durationMs: t.durationMs,
        };
        api.reportHistory(remote).catch(() => {});
      }, 3000);

      // side-effect: fetch lyric
      api
        .trackLyric(t.provider, t.providerId)
        .then((res) => {
          const d = res?.data || {};
          if (d.lyric) set({ lyric: d.lyric, lyricTrans: d.trans || null });
        })
        .catch(() => {});
    } catch (e: any) {
      set({
        loadingUrl: false,
        playing: false,
        error: e?.message || "播放失败",
      });
    }
  },

  toggle: () => {
    const { current, playing } = get();
    if (!current) return;
    const audio = getAudio();
    if (playing) {
      audio.pause();
      set({ playing: false });
    } else {
      audio.play().then(() => set({ playing: true })).catch(() => {});
    }
  },

  next: async () => {
    const { queue, index, loop, current } = get();
    if (queue.length === 0 || !current) return;
    let nextIdx = index + 1;
    if (nextIdx >= queue.length) {
      if (loop === "list") nextIdx = 0;
      else {
        const audio = getAudio();
        audio.pause();
        set({ playing: false });
        return;
      }
    }
    await get().playTrack(queue[nextIdx], queue);
  },

  prev: async () => {
    const { queue, index, current } = get();
    if (queue.length === 0 || !current) return;
    let prevIdx = index - 1;
    if (prevIdx < 0) prevIdx = 0;
    await get().playTrack(queue[prevIdx], queue);
  },

  seekTo: (sec) => {
    const audio = getAudio();
    if (audio.duration) audio.currentTime = sec;
  },

  setVolume: (v) => {
    const audio = getAudio();
    audio.volume = v;
    audio.muted = false;
    set({ volume: v, muted: false });
  },

  toggleMute: () => {
    const audio = getAudio();
    const muted = !audio.muted;
    audio.muted = muted;
    set({ muted });
  },

  cycleLoop: () => {
    const order: PlayerState["loop"][] = ["off", "one", "list"];
    const cur = get().loop;
    const next = order[(order.indexOf(cur) + 1) % order.length];
    set({ loop: next });
  },

  setPlaying: (p) => set({ playing: p }),

  clearLyric: () => set({ lyric: null, lyricTrans: null }),

  stop: () => {
    const audio = getAudio();
    audio.pause();
    audio.src = "";
    set({
      current: null,
      queue: [],
      index: -1,
      playing: false,
      lyric: null,
      lyricTrans: null,
      audioUrl: null,
    });
  },
}));

// Wire up audio element events (run once)
if (typeof window !== "undefined") {
  const audio = getAudio();
  audio.addEventListener("ended", () => {
    const st = usePlayerStore.getState();
    if (st.loop === "one") {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    } else {
      st.next();
    }
  });
  audio.addEventListener("error", () => {
    usePlayerStore.setState({
      error: "音频加载失败",
      playing: false,
      loadingUrl: false,
    });
  });
}

export function trackToCurrent(t: TrackInDB): CurrentTrack {
  return {
    provider: t.provider,
    providerId: t.providerId,
    name: t.name,
    artist: t.artist,
    album: t.album,
    cover: t.cover,
    durationMs: t.durationMs,
    trackId: t.id,
  };
}
