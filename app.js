const DB_NAME = "my-diary-db";
const DB_VERSION = 1;
const STORE = "entries";
const SETTINGS_KEY = "my-diary-settings";

const state = {
  db: null,
  entries: [],
  selectedPhotos: [],
  view: "today",
  settings: loadSettings(),
};

const el = {
  dateLabel: document.querySelector("#dateLabel"),
  viewTitle: document.querySelector("#viewTitle"),
  content: document.querySelector("#content"),
  entryInput: document.querySelector("#entryInput"),
  photoInput: document.querySelector("#photoInput"),
  photoPreview: document.querySelector("#photoPreview"),
  saveEntryBtn: document.querySelector("#saveEntryBtn"),
  navTabs: document.querySelectorAll(".nav-tab"),
  quickTypes: document.querySelectorAll(".quick-types button"),
  providerSelect: document.querySelector("#providerSelect"),
  apiKeyInput: document.querySelector("#apiKeyInput"),
  saveSettingsBtn: document.querySelector("#saveSettingsBtn"),
  exportBtn: document.querySelector("#exportBtn"),
  importBtn: document.querySelector("#importBtn"),
  importFile: document.querySelector("#importFile"),
  storageStatus: document.querySelector("#storageStatus"),
};

const viewTitles = {
  today: "今天",
  timeline: "时间线",
  tasks: "任务",
  money: "账本",
  insights: "分析",
};

init();

async function init() {
  el.dateLabel.textContent = formatDateLabel(new Date());
  el.providerSelect.value = state.settings.provider;
  el.apiKeyInput.value = state.settings.apiKey;
  state.db = await openDb();
  state.entries = await getAllEntries();
  bindEvents();
  render();
  registerServiceWorker();
}

function bindEvents() {
  el.saveEntryBtn.addEventListener("click", saveEntry);
  el.photoInput.addEventListener("change", handlePhotoSelection);
  el.saveSettingsBtn.addEventListener("click", saveSettings);
  el.exportBtn.addEventListener("click", exportData);
  el.importBtn.addEventListener("click", () => el.importFile.click());
  el.importFile.addEventListener("change", importData);

  el.navTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      state.view = tab.dataset.view;
      el.navTabs.forEach((item) => item.classList.toggle("active", item === tab));
      render();
    });
  });

  el.quickTypes.forEach((button) => {
    button.addEventListener("click", () => {
      el.entryInput.value += button.dataset.template;
      el.entryInput.focus();
    });
  });
}

async function saveEntry() {
  const text = el.entryInput.value.trim();
  if (!text && state.selectedPhotos.length === 0) return;

  el.saveEntryBtn.disabled = true;
  el.saveEntryBtn.textContent = "整理中";

  try {
    const analysis = await analyzeEntry(text, state.selectedPhotos);
    const entry = {
      id: crypto.randomUUID(),
      text,
      photos: state.selectedPhotos,
      analysis,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await putEntry(entry);
    state.entries.unshift(entry);
    el.entryInput.value = "";
    state.selectedPhotos = [];
    el.photoInput.value = "";
    renderPhotoPreview();
    render();
    showStatus("已保存到本地");
  } catch (error) {
    console.error(error);
    showStatus("保存失败");
  } finally {
    el.saveEntryBtn.disabled = false;
    el.saveEntryBtn.textContent = "保存并整理";
  }
}

async function analyzeEntry(text, photos) {
  if (state.settings.provider !== "local" && state.settings.apiKey) {
    const remote = await tryRemoteAnalyze(text, photos);
    if (remote) return remote;
  }
  return localAnalyze(text, photos);
}

async function tryRemoteAnalyze(text, photos) {
  const prompt = [
    "你是个人生活记录整理器。只返回 JSON，不要解释。",
    "字段：types,tags,mood,tasks,transactions,summary,photoNotes。",
    "tasks: [{title,dueText}]。",
    "transactions: [{type,amount,category,note}]。",
    `文字：${text || "无"}`,
    `图片数量：${photos.length}`,
  ].join("\n");

  try {
    if (state.settings.provider === "gemini") {
      const url =
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=" +
        encodeURIComponent(state.settings.apiKey);
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      });
      const data = await res.json();
      const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      return parseJsonResult(raw);
    }

    if (state.settings.provider === "openrouter") {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${state.settings.apiKey}`,
        },
        body: JSON.stringify({
          model: "openrouter/auto",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
        }),
      });
      const data = await res.json();
      return parseJsonResult(data?.choices?.[0]?.message?.content);
    }
  } catch (error) {
    console.warn("Remote AI failed, fallback to local rules.", error);
  }
  return null;
}

function parseJsonResult(raw) {
  if (!raw) return null;
  const cleaned = raw.replace(/```json|```/g, "").trim();
  try {
    return normalizeAnalysis(JSON.parse(cleaned));
  } catch {
    return null;
  }
}

function localAnalyze(text, photos) {
  const transactions = extractTransactions(text);
  const tasks = extractTasks(text);
  const mood = extractMood(text);
  const tags = extractTags(text, transactions, tasks, mood, photos);
  const types = [];

  if (text) types.push("日记");
  if (transactions.length) types.push("记账");
  if (tasks.length) types.push("任务");
  if (mood) types.push("情绪");
  if (photos.length) types.push("相册");

  return normalizeAnalysis({
    types,
    tags,
    mood,
    tasks,
    transactions,
    summary: buildSummary(text, transactions, tasks, mood, photos),
    photoNotes: photos.map((photo, index) => ({
      name: photo.name || `图片 ${index + 1}`,
      note: "已保存图片，可后续接入视觉模型识别内容",
    })),
  });
}

function normalizeAnalysis(input) {
  return {
    types: Array.isArray(input.types) ? input.types : [],
    tags: Array.isArray(input.tags) ? input.tags : [],
    mood: input.mood || "",
    tasks: Array.isArray(input.tasks) ? input.tasks : [],
    transactions: Array.isArray(input.transactions) ? input.transactions : [],
    summary: input.summary || "",
    photoNotes: Array.isArray(input.photoNotes) ? input.photoNotes : [],
  };
}

function extractTransactions(text) {
  const result = [];
  if (!text) return result;
  const regex = /(花了|消费|买|支出|收入|赚了|收到|转入)?\s*(\d+(?:\.\d+)?)\s*(元|块|rmb|RMB)?/g;
  let match;
  while ((match = regex.exec(text))) {
    const context = text.slice(Math.max(0, match.index - 8), match.index + 18);
    const isIncome = /收入|赚了|收到|转入|工资/.test(context);
    const category = inferMoneyCategory(context);
    result.push({
      type: isIncome ? "收入" : "支出",
      amount: Number(match[2]),
      category,
      note: context.trim(),
    });
  }
  return result;
}

function inferMoneyCategory(text) {
  if (/饭|餐|咖啡|奶茶|星巴克|吃|外卖|早餐|午饭|晚饭/.test(text)) return "餐饮";
  if (/地铁|公交|打车|高铁|机票|油费|停车/.test(text)) return "交通";
  if (/衣服|鞋|买|购物|淘宝|京东/.test(text)) return "购物";
  if (/电影|游戏|会员|娱乐/.test(text)) return "娱乐";
  if (/工资|奖金|收入/.test(text)) return "收入";
  return "其他";
}

function extractTasks(text) {
  if (!text) return [];
  const sentences = text.split(/[。！？!?；;\n]/).map((item) => item.trim()).filter(Boolean);
  return sentences
    .filter((sentence) => /明天|后天|今天|今晚|上午|下午|晚上|记得|要|得|待办|todo/i.test(sentence))
    .filter((sentence) => !/(花了|消费|收入|赚了)/.test(sentence))
    .map((sentence) => ({
      id: crypto.randomUUID(),
      title: sentence.replace(/^(明天|后天|今天|今晚)?\s*(记得|要|得)?\s*/g, "") || sentence,
      dueText: inferDueText(sentence),
      done: false,
    }));
}

function inferDueText(text) {
  const match = text.match(/(今天|明天|后天|今晚|上午|下午|晚上|\d{1,2}\s*点)/);
  return match ? match[0].replace(/\s/g, "") : "";
}

function extractMood(text) {
  if (!text) return "";
  const moods = [
    ["焦虑", /焦虑|慌|压力|烦/],
    ["疲惫", /累|困|疲惫|没精神/],
    ["开心", /开心|高兴|快乐|舒服/],
    ["低落", /难过|低落|沮丧|崩溃/],
    ["平静", /平静|还好|稳定/],
  ];
  const found = moods.find(([, regex]) => regex.test(text));
  return found ? found[0] : "";
}

function extractTags(text, transactions, tasks, mood, photos) {
  const tags = new Set();
  transactions.forEach((item) => tags.add(item.category));
  if (tasks.length) tags.add("待办");
  if (mood) tags.add(mood);
  if (photos.length) tags.add("照片");
  if (/工作|客户|合同|项目|会议/.test(text)) tags.add("工作");
  if (/学习|英语|读书|课程/.test(text)) tags.add("学习");
  if (/朋友|家人|同事/.test(text)) tags.add("关系");
  return [...tags];
}

function buildSummary(text, transactions, tasks, mood, photos) {
  const parts = [];
  if (text) parts.push(text.length > 42 ? `${text.slice(0, 42)}...` : text);
  if (transactions.length) parts.push(`记录了 ${transactions.length} 笔收支`);
  if (tasks.length) parts.push(`提取了 ${tasks.length} 个待办`);
  if (mood) parts.push(`情绪偏向：${mood}`);
  if (photos.length) parts.push(`添加了 ${photos.length} 张图片`);
  return parts.join(" · ") || "空白记录";
}

async function handlePhotoSelection(event) {
  const files = [...event.target.files];
  const compressed = [];
  for (const file of files) {
    compressed.push(await compressImage(file));
  }
  state.selectedPhotos = compressed;
  renderPhotoPreview();
}

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const max = 1280;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve({
          name: file.name,
          type: "image/jpeg",
          dataUrl: canvas.toDataURL("image/jpeg", 0.76),
        });
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function render() {
  el.viewTitle.textContent = viewTitles[state.view];
  if (state.view === "today") renderToday();
  if (state.view === "timeline") renderTimeline();
  if (state.view === "tasks") renderTasks();
  if (state.view === "money") renderMoney();
  if (state.view === "insights") renderInsights();
}

function renderToday() {
  const today = state.entries.filter((entry) => isToday(entry.createdAt));
  const stats = calculateStats(today);
  el.content.innerHTML = summaryHtml(stats) + entriesHtml(today);
  bindEntryActions();
}

function renderTimeline() {
  el.content.innerHTML = entriesHtml(state.entries);
  bindEntryActions();
}

function renderTasks() {
  const tasks = state.entries.flatMap((entry) =>
    entry.analysis.tasks.map((task) => ({ ...task, entryId: entry.id, createdAt: entry.createdAt })),
  );
  if (!tasks.length) {
    el.content.innerHTML = emptyHtml("还没有提取到任务。");
    return;
  }
  el.content.innerHTML = `<section class="entry-card">${tasks
    .map(
      (task) => `
        <div class="task-row">
          <label>
            <input type="checkbox" data-task-id="${task.id}" data-entry-id="${task.entryId}" ${task.done ? "checked" : ""}>
            <span class="${task.done ? "done" : ""}">${escapeHtml(task.title)}</span>
          </label>
          <small>${escapeHtml(task.dueText || formatShortDate(task.createdAt))}</small>
        </div>`,
    )
    .join("")}</section>`;
  document.querySelectorAll("[data-task-id]").forEach((input) => {
    input.addEventListener("change", () => toggleTask(input.dataset.entryId, input.dataset.taskId, input.checked));
  });
}

function renderMoney() {
  const items = state.entries.flatMap((entry) =>
    entry.analysis.transactions.map((transaction) => ({ ...transaction, createdAt: entry.createdAt })),
  );
  if (!items.length) {
    el.content.innerHTML = emptyHtml("还没有记账记录。");
    return;
  }
  const totalExpense = items.filter((item) => item.type !== "收入").reduce((sum, item) => sum + item.amount, 0);
  const totalIncome = items.filter((item) => item.type === "收入").reduce((sum, item) => sum + item.amount, 0);
  el.content.innerHTML = `
    <section class="summary-grid">
      <div class="stat-card"><span>支出</span><strong>¥${totalExpense.toFixed(2)}</strong></div>
      <div class="stat-card"><span>收入</span><strong>¥${totalIncome.toFixed(2)}</strong></div>
    </section>
    <section class="entry-card">
      ${items
        .map(
          (item) => `
            <div class="money-row">
              <div>
                <strong>${escapeHtml(item.category || "其他")}</strong>
                <p>${escapeHtml(item.note || formatShortDate(item.createdAt))}</p>
              </div>
              <span class="amount">${item.type === "收入" ? "+" : "-"}¥${Number(item.amount).toFixed(2)}</span>
            </div>`,
        )
        .join("")}
    </section>`;
}

function renderInsights() {
  const recent = state.entries.slice(0, 30);
  const stats = calculateStats(recent);
  const moods = recent.map((entry) => entry.analysis.mood).filter(Boolean);
  const tags = topItems(recent.flatMap((entry) => entry.analysis.tags));
  el.content.innerHTML = `
    <section class="insight-panel">
      <h3>最近状态</h3>
      <p>近 30 条记录中，共有 ${recent.length} 条记录、${stats.tasks} 个待办、${stats.transactions} 笔收支、${stats.photos} 张图片。</p>
      <p>常见标签：${tags.length ? tags.join("、") : "暂无"}</p>
      <p>情绪线索：${moods.length ? moods.slice(0, 8).join("、") : "暂无明显情绪词"}</p>
    </section>
    <section class="insight-panel">
      <h3>下一步 AI</h3>
      <p>当前版本先用本地规则整理，已经预留 Gemini 和 OpenRouter 接口。后续可以把图片内容识别、每日总结和月度复盘接入远程模型。</p>
    </section>`;
}

function summaryHtml(stats) {
  return `
    <section class="summary-grid">
      <div class="stat-card"><span>记录</span><strong>${stats.entries}</strong></div>
      <div class="stat-card"><span>任务</span><strong>${stats.tasks}</strong></div>
      <div class="stat-card"><span>支出</span><strong>¥${stats.expense.toFixed(0)}</strong></div>
      <div class="stat-card"><span>图片</span><strong>${stats.photos}</strong></div>
    </section>`;
}

function entriesHtml(entries) {
  if (!entries.length) return emptyHtml("还没有记录，先从随手记开始。");
  return entries.map(entryHtml).join("");
}

function entryHtml(entry) {
  const tags = entry.analysis.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("");
  const photos = entry.photos.map((photo) => `<img src="${photo.dataUrl}" alt="${escapeHtml(photo.name)}">`).join("");
  const breakdown = [
    entry.analysis.summary && `摘要：${entry.analysis.summary}`,
    entry.analysis.mood && `情绪：${entry.analysis.mood}`,
    entry.analysis.tasks.length && `任务：${entry.analysis.tasks.map((task) => task.title).join("；")}`,
    entry.analysis.transactions.length &&
      `收支：${entry.analysis.transactions.map((item) => `${item.category} ${item.type} ¥${item.amount}`).join("；")}`,
    entry.analysis.photoNotes.length && `图片：${entry.analysis.photoNotes.map((item) => item.note).join("；")}`,
  ]
    .filter(Boolean)
    .map((item) => `<div class="breakdown-item">${escapeHtml(String(item))}</div>`)
    .join("");

  return `
    <article class="entry-card" data-entry-id="${entry.id}">
      <div class="entry-meta">
        <span class="entry-time">${formatDateTime(entry.createdAt)}</span>
        <div class="entry-tags">${tags}</div>
      </div>
      ${entry.text ? `<p class="entry-text">${escapeHtml(entry.text)}</p>` : ""}
      ${photos ? `<div class="entry-photos">${photos}</div>` : ""}
      <div class="entry-breakdown">${breakdown}</div>
      <button class="delete-btn" data-delete-id="${entry.id}" type="button">删除</button>
    </article>`;
}

function bindEntryActions() {
  document.querySelectorAll("[data-delete-id]").forEach((button) => {
    button.addEventListener("click", async () => {
      await deleteEntry(button.dataset.deleteId);
      state.entries = state.entries.filter((entry) => entry.id !== button.dataset.deleteId);
      render();
    });
  });
}

async function toggleTask(entryId, taskId, done) {
  const entry = state.entries.find((item) => item.id === entryId);
  if (!entry) return;
  entry.analysis.tasks = entry.analysis.tasks.map((task) => (task.id === taskId ? { ...task, done } : task));
  entry.updatedAt = new Date().toISOString();
  await putEntry(entry);
  render();
}

function renderPhotoPreview() {
  el.photoPreview.innerHTML = state.selectedPhotos
    .map((photo) => `<img src="${photo.dataUrl}" alt="${escapeHtml(photo.name)}">`)
    .join("");
}

function calculateStats(entries) {
  const transactions = entries.flatMap((entry) => entry.analysis.transactions);
  return {
    entries: entries.length,
    tasks: entries.reduce((sum, entry) => sum + entry.analysis.tasks.length, 0),
    transactions: transactions.length,
    expense: transactions.filter((item) => item.type !== "收入").reduce((sum, item) => sum + Number(item.amount || 0), 0),
    photos: entries.reduce((sum, entry) => sum + entry.photos.length, 0),
  };
}

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      const store = db.createObjectStore(STORE, { keyPath: "id" });
      store.createIndex("createdAt", "createdAt");
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getAllEntries() {
  return new Promise((resolve, reject) => {
    const tx = state.db.transaction(STORE, "readonly");
    const request = tx.objectStore(STORE).getAll();
    request.onsuccess = () => resolve(request.result.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    request.onerror = () => reject(request.error);
  });
}

function putEntry(entry) {
  return new Promise((resolve, reject) => {
    const tx = state.db.transaction(STORE, "readwrite");
    const request = tx.objectStore(STORE).put(entry);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

function deleteEntry(id) {
  return new Promise((resolve, reject) => {
    const tx = state.db.transaction(STORE, "readwrite");
    const request = tx.objectStore(STORE).delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

function saveSettings() {
  state.settings = {
    provider: el.providerSelect.value,
    apiKey: el.apiKeyInput.value.trim(),
  };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
  showStatus("配置已保存");
}

function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || { provider: "local", apiKey: "" };
  } catch {
    return { provider: "local", apiKey: "" };
  }
}

function exportData() {
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    entries: state.entries,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `my-diary-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

async function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const text = await file.text();
  const payload = JSON.parse(text);
  const entries = Array.isArray(payload.entries) ? payload.entries : [];
  for (const entry of entries) await putEntry(entry);
  state.entries = await getAllEntries();
  render();
  showStatus("导入完成");
}

function showStatus(text) {
  el.storageStatus.textContent = text;
  setTimeout(() => {
    el.storageStatus.textContent = "本地保存";
  }, 1800);
}

function emptyHtml(text) {
  return `<section class="empty-state">${escapeHtml(text)}</section>`;
}

function topItems(items) {
  const counts = new Map();
  items.forEach((item) => counts.set(item, (counts.get(item) || 0) + 1));
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([item]) => item);
}

function isToday(date) {
  return new Date(date).toDateString() === new Date().toDateString();
}

function formatDateLabel(date) {
  return new Intl.DateTimeFormat("zh-CN", { month: "long", day: "numeric", weekday: "long" }).format(date);
}

function formatDateTime(date) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function formatShortDate(date) {
  return new Intl.DateTimeFormat("zh-CN", { month: "2-digit", day: "2-digit" }).format(new Date(date));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }
}
