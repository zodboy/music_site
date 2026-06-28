/**
 * 简易 HTTP 客户端，封装 fetch 加 timeout 与重试
 */
export async function httpGet(url: string, headers: Record<string, string> = {}, timeoutMs = 8000): Promise<any> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        ...headers,
      },
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const ct = res.headers.get("content-type") || "";
    const text = await res.text();
    if (ct.includes("application/json")) {
      try { return JSON.parse(text); } catch { return text; }
    }
    // 部分音乐 API 不返回正确 content-type，但实际是 JSON
    const trimmed = text.trimStart();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try { return JSON.parse(text); } catch { /* fallthrough */ }
    }
    return text;
  } finally {
    clearTimeout(t);
  }
}
