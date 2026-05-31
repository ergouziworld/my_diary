"use client";

import { useRouter } from "next/navigation";
import { useState, useRef, useTransition } from "react";

type AttachmentItem = {
  id: string;
  url: string;
  type: "image" | "file" | "link";
  name: string;
  description: string;
};

export function RichInputBox() {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [linkInput, setLinkInput] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  function handleTextareaFocus() {
    if (typeof window === "undefined") return;
    const vv = window.visualViewport;
    if (!vv) return;

    const align = () => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      // 让容器底端在键盘顶端上方留 80px 呼吸空间
      const PADDING = 80;
      const delta = rect.bottom - vv.height + PADDING;
      if (Math.abs(delta) > 1) window.scrollBy({ top: delta, behavior: "smooth" });
    };

    let done = false;
    const onResize = () => {
      if (done) return;
      done = true;
      vv.removeEventListener("resize", onResize);
      align();
    };
    vv.addEventListener("resize", onResize);
    setTimeout(() => {
      if (done) return;
      done = true;
      vv.removeEventListener("resize", onResize);
      align();
    }, 500);
  }

  async function handleFileUpload(file: File) {
    setUploading(true);
    setStatus("上传中...");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = (await res.json()) as { ok: boolean; data?: AttachmentItem; error?: string };
      if (data.ok && data.data) {
        setAttachments((prev) => [...prev, data.data!]);
        setStatus("");
      } else {
        setStatus(data.error ?? "上传失败");
      }
    } catch {
      setStatus("上传失败");
    } finally {
      setUploading(false);
    }
  }

  function addLink() {
    const url = linkInput.trim();
    if (!url) return;
    setAttachments((prev) => [
      ...prev,
      { id: `link-${Date.now()}`, url, type: "link", name: url, description: url }
    ]);
    setLinkInput("");
    setShowLinkInput(false);
  }

  function removeAttachment(id: string) {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }

  async function handleSubmit() {
    if (!content.trim() && attachments.length === 0) return;
    if (loading || uploading) return;

    setLoading(true);
    setStatus("保存中...");

    const parts: string[] = [];
    if (content.trim()) parts.push(content.trim());
    attachments.forEach((att) => {
      if (att.type === "image") parts.push(`[图片：${att.description}]`);
      else if (att.type === "link") parts.push(`[链接：${att.description}]`);
      else parts.push(`[文件：${att.description}]`);
    });
    const rawContent = parts.join("\n\n");

    // 只绑定真实的 DB 附件（图片/文档），链接不是 Attachment 记录
    const attachmentIds = attachments
      .filter((att) => att.type !== "link" && att.id && !att.id.startsWith("link-"))
      .map((att) => att.id);

    try {
      const savedRes = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawContent, type: "text", attachmentIds })
      });
      const saved = (await savedRes.json()) as { ok: boolean; data?: { id?: string }; error?: string };

      if (!saved.ok) {
        setStatus(saved.error ?? "保存失败");
        setLoading(false);
        return;
      }

      // 稍作停顿再反馈，避免太突兀
      await new Promise((r) => setTimeout(r, 500));
      setStatus("已保存 ✓");
      setLoading(false);
      setContent("");
      setAttachments([]);
      // 不立刻刷新，等 AI 分析完再刷，避免中间状态导致的页面闪动

      // AI 分析完后刷一次，记录带标签一起出现
      const entryId = saved.data?.id;
      if (entryId) {
        void fetch("/api/ai/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entryId, content: rawContent, type: "text" })
        }).then(() => startTransition(() => router.refresh()));
      }
    } catch {
      setStatus("提交失败，请重试");
      setLoading(false);
    }
  }

  return (
    <div ref={containerRef} className="flex flex-1 flex-col gap-3 min-h-0">
      <textarea
        className="flex-1 min-h-0 w-full resize-none overflow-y-auto bg-transparent p-0 text-lg text-white outline-none placeholder:text-slate-700 transition leading-relaxed"
        placeholder="今天发生了什么？"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onFocus={handleTextareaFocus}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void handleSubmit();
        }}
      />

      {/* 附件预览 */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300"
            >
              {att.type === "image" ? (
                <img src={att.url} alt="" className="h-7 w-7 rounded-lg object-cover shrink-0" />
              ) : (
                <span className="text-base leading-none">{att.type === "link" ? "🔗" : "📄"}</span>
              )}
              <span className="max-w-[140px] truncate">{att.description || att.name}</span>
              <button
                type="button"
                onClick={() => removeAttachment(att.id)}
                className="ml-1 text-slate-500 hover:text-rose-400 transition"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 链接输入 */}
      {showLinkInput && (
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white outline-none focus:border-red-500/40"
            placeholder="粘贴链接..."
            value={linkInput}
            onChange={(e) => setLinkInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addLink()}
            autoFocus
          />
          <button
            type="button"
            onClick={addLink}
            className="rounded-xl bg-red-500/20 px-3 py-2 text-xs text-red-400 hover:bg-red-500/30 transition"
          >
            确认
          </button>
          <button
            type="button"
            onClick={() => setShowLinkInput(false)}
            className="rounded-xl bg-white/5 px-3 py-2 text-xs text-slate-400 hover:bg-white/10 transition"
          >
            取消
          </button>
        </div>
      )}

      {/* 工具栏 */}
      <div className="mt-auto flex min-h-11 shrink-0 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-1">
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { if (e.target.files?.[0]) void handleFileUpload(e.target.files[0]); e.target.value = ""; }}
          />
          <input
            ref={docInputRef}
            type="file"
            accept=".pdf,.txt,.doc,.docx"
            className="hidden"
            onChange={(e) => { if (e.target.files?.[0]) void handleFileUpload(e.target.files[0]); e.target.value = ""; }}
          />
          <button
            type="button"
            title="上传图片"
            disabled={uploading}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => imageInputRef.current?.click()}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-base leading-none transition hover:border-red-500/30 hover:bg-red-500/10 disabled:opacity-40"
          >
            📷
          </button>
          <button
            type="button"
            title="上传文档"
            disabled={uploading}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => docInputRef.current?.click()}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-base leading-none transition hover:border-red-500/30 hover:bg-red-500/10 disabled:opacity-40"
          >
            📎
          </button>
          <button
            type="button"
            title="添加链接"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setShowLinkInput((v) => !v)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-base leading-none transition hover:border-red-500/30 hover:bg-red-500/10"
          >
            🔗
          </button>
          <span
            aria-live="polite"
            className={`ml-2 min-w-0 flex-1 truncate text-xs leading-none text-slate-400 transition-opacity ${
              uploading || status ? "opacity-100" : "opacity-0"
            }`}
          >
            {status || "\u00a0"}
          </span>
        </div>

        <button
          type="button"
          disabled={loading || uploading}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => void handleSubmit()}
          className="rounded-full bg-red-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "处理中..." : "记录"}
        </button>
      </div>
    </div>
  );
}
