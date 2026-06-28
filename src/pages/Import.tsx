import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link2, Loader2, Sparkles, Check } from "lucide-react";
import { api } from "@/lib/api";
import { useUserStore } from "@/store/user";
import { toast } from "sonner";

interface ParseResult {
  provider: string;
  providerPlaylistId?: string;
  name: string;
  cover?: string;
  description?: string;
  creator?: string;
  trackCount?: number;
  tracks?: Array<{
    provider: string;
    providerId: string;
    name: string;
    artist: string;
    album: string;
    cover?: string;
    durationMs: number;
  }>;
}

export default function Import() {
  const { user } = useUserStore();
  const nav = useNavigate();
  const [input, setInput] = useState("");
  const [parseLoading, setParseLoading] = useState(false);
  const [parsed, setParsed] = useState<ParseResult | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [customName, setCustomName] = useState("");

  const doParse = async () => {
    const v = input.trim();
    if (!v) {
      toast.error("请输入歌单链接或 ID");
      return;
    }
    setParseLoading(true);
    setParsed(null);
    setImportProgress(0);
    try {
      const r = await api.parseImport(v);
      setParsed(r.data);
      setCustomName(r.data?.name || "");
    } catch (e: any) {
      toast.error(e.message || "解析失败");
    } finally {
      setParseLoading(false);
    }
  };

  const doImport = async () => {
    if (!user) {
      toast.error("请先登录");
      nav("/login");
      return;
    }
    if (!parsed) return;
    setImportLoading(true);
    setImportProgress(5);
    const tick = setInterval(() => {
      setImportProgress((p) => Math.min(90, p + 2));
    }, 300);
    try {
      const r = await api.runImport(
        input.trim(),
        customName.trim() || parsed.name,
        parsed.description,
        parsed.cover,
      );
      clearInterval(tick);
      setImportProgress(100);
      const newId = r.data?.playlistId;
      const trackCount = r.data?.trackCount ?? parsed.trackCount ?? 0;
      toast.success(`导入成功：${trackCount} 首`);
      setTimeout(() => {
        if (newId) nav(`/playlist/${newId}`);
        else nav("/me");
      }, 800);
    } catch (e: any) {
      clearInterval(tick);
      toast.error(e.message || "导入失败");
      setImportLoading(false);
    }
  };

  return (
    <div className="container max-w-3xl py-8">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold">
          <Sparkles className="h-6 w-6 text-gold" />
          导入歌单
        </h1>
        <p className="mt-1 text-sm text-fg-secondary">
          粘贴网易云 / QQ 音乐 歌单链接，或直接输入歌单 ID
        </p>
      </div>

      {!user && (
        <div className="mb-4 rounded-lg border border-gold/40 bg-gold-soft p-3 text-sm text-gold">
          请先<a className="underline" href="/login">登录</a>后再导入
        </div>
      )}

      <div className="rounded-xl border border-ink-border bg-ink-card p-4">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="https://music.163.com/#/playlist?id=12345678&#10;https://y.qq.com/n/ryqq/playlist/xxxxx&#10;或直接输入歌单 ID"
          rows={3}
          className="w-full resize-none rounded border border-ink-border bg-ink-base px-3 py-2 text-sm outline-none focus:border-gold"
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs text-fg-muted">
            支持：网易云 / QQ 音乐 / 酷狗
          </div>
          <button
            onClick={doParse}
            disabled={parseLoading || !input.trim()}
            className="inline-flex items-center gap-1.5 rounded-full bg-gold px-4 py-1.5 text-sm font-medium text-ink-base transition hover:bg-gold-hover disabled:opacity-50"
          >
            {parseLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Link2 className="h-4 w-4" />
            )}
            解析
          </button>
        </div>
      </div>

      {parsed && (
        <div className="mt-4 animate-slide-up rounded-xl border border-ink-border bg-ink-card p-4">
          <div className="flex gap-4">
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-ink-base">
              {parsed.cover ? (
                <img
                  src={parsed.cover}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="grid h-full place-items-center text-fg-muted">
                  <Sparkles className="h-8 w-8" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <input
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="歌单名称（可修改）"
                className="w-full rounded border border-transparent bg-transparent px-1 py-0.5 font-display text-lg font-bold outline-none focus:border-ink-border focus:bg-ink-base"
              />
              {parsed.creator && (
                <div className="text-xs text-fg-secondary">
                  原作者：{parsed.creator}
                </div>
              )}
              <div className="mt-1 text-xs text-fg-muted">
                {parsed.provider} · 共 {parsed.trackCount ?? parsed.tracks?.length ?? 0} 首
              </div>
              {parsed.description && (
                <p className="mt-2 line-clamp-2 text-xs text-fg-secondary">
                  {parsed.description}
                </p>
              )}
            </div>
          </div>

          {parsed.tracks && parsed.tracks.length > 0 && (
            <div className="mt-4 max-h-64 space-y-1 overflow-y-auto rounded-md bg-ink-base p-2">
              {parsed.tracks.slice(0, 30).map((t, i) => (
                <div
                  key={`${t.provider}-${t.providerId}`}
                  className="flex items-center gap-2 truncate px-1 py-1 text-xs"
                >
                  <span className="w-5 text-right text-fg-muted">{i + 1}</span>
                  <span className="truncate text-fg-primary">{t.name}</span>
                  <span className="text-fg-muted">— {t.artist}</span>
                </div>
              ))}
              {parsed.tracks.length > 30 && (
                <div className="px-1 py-1 text-center text-xs text-fg-muted">
                  ... 还有 {parsed.tracks.length - 30} 首未显示
                </div>
              )}
            </div>
          )}

          <div className="mt-4 flex items-center gap-3">
            {importLoading ? (
              <div className="flex-1">
                <div className="mb-1 flex justify-between text-xs text-fg-secondary">
                  <span>正在导入...</span>
                  <span>{importProgress}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-ink-border">
                  <div
                    className="h-full rounded-full bg-gold transition-all"
                    style={{ width: `${importProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <>
                <button
                  onClick={doImport}
                  disabled={!user}
                  className="inline-flex items-center gap-1.5 rounded-full bg-gold px-5 py-2 text-sm font-medium text-ink-base transition hover:bg-gold-hover disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                  确认导入 ({parsed.trackCount ?? parsed.tracks?.length ?? 0} 首)
                </button>
                <button
                  onClick={() => setParsed(null)}
                  className="rounded-full border border-ink-border px-4 py-2 text-sm text-fg-secondary hover:border-fg-secondary"
                >
                  取消
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <div className="mt-8 rounded-lg border border-dashed border-ink-border p-4 text-xs text-fg-muted">
        <div className="mb-2 font-medium text-fg-secondary">提示</div>
        <ul className="list-disc space-y-1 pl-5">
          <li>网易云链接支持 <code className="text-gold">music.163.com/#/playlist?id=xxx</code> 或纯数字 ID</li>
          <li>QQ 音乐链接支持 <code className="text-gold">y.qq.com/n/ryqq/playlist/xxx</code></li>
          <li>导入会保存歌曲列表到本地数据库，之后可在「我的歌单」中编辑</li>
          <li>部分歌曲因版权原因可能无法播放，会显示错误提示</li>
        </ul>
      </div>
    </div>
  );
}
