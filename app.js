const DB_NAME = "my-diary-local";
const DB_VERSION = 2;
const STORE = "entries";
const BACKUP_KEY = "my-diary-light-backup";

const state = {
  db: null,
  entries: [],
  photos: [],
  view: "today",
  dbReady: false,
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const ui = {
  dbStatus: $("#dbStatus"),
  entryCount: $("#entryCount"),
  todayLabel: $("#todayLabel"),
  viewTitle: $("#viewTitle"),
  saveBtn: $("#saveBtn"),
  textInput: $("#textInput"),
  moodInput: $("#moodInput"),
  tagInput: $("#tagInput"),
  photoInput: $("#photoInput"),
  preview: $("#preview"),
  saveHint: $("#saveHint"),
  dashboard: $("#dashboard"),
  content: $("#content"),
  searchInput: $("#searchInput"),
  filterInput: $("#filterInput"),
  exportBtn: $("#exportBtn"),
  importBtn: $("#importBtn"),
  importFile: $("#importFile"),
};

const titles = {
  today: "今日",
  timeline: "时间线",
  tasks: "任务",
  mood: "心情",
  money: "收支",
  photos: "相册",
};

boot();

async function boot() {
  ui.todayLabel.textContent = formatDateLong(new Date());
  bindEvents();

  try {
    state.db = await openDatabase();
    state.dbReady = true;
    setDbStatus("可用");
    state.entries = await dbGetAll();
  } catch (error) {
    console.error(error);
    setDbStatus("降级");
    state.entries = loadLightBackup();
  }

  sortEntries();
  updateCount();
  render();
  registerServiceWorker();
}

function bindEvents() {
  ui.saveBtn.addEventListener("click", saveCurrentEntry);
  ui.photoInput.addEventListener("change", handlePhotos);
  ui.searchInput.addEventListener("input", render);
  ui.filterInput.addEventListener("change", render);
  ui.exportBtn.addEventListener("click", exportData);
  ui.importBtn.addEventListener("click", () => ui.importFile.click());
  ui.importFile.addEventListener("change", importData);

  $$(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      state.view = tab.dataset.view;
      $$(".tab").forEach((item) => item.classList.toggle("active", item === tab));
      render();
    });
  });
}

async function saveCurrentEntry() {
  const text = ui.textInput.value.trim();
  if (!text && state.photos.length === 0) {
    showHint("先写点内容，或者添加图片。", true);
    return;
  }

  const entry = buildEntry(text);
  ui.saveBtn.disabled = true;
  ui.saveBtn.textContent = "保存中";

  try {
    await persistEntry(entry);
    const saved = state.dbReady ? await dbGet(entry.id) : entry;
    if (!saved) throw new Error("Save verification failed.");

    state.entries.unshift(saved);
    sortEntries();
    saveLightBackup();
    clearComposer();
    updateCount();
    render();
    showHint(`已保存。本地共有 ${state.entries.length} 条记录。`);
  } catch (error) {
    console.error(error);
    showHint("保存失败，请先导出已有数据后刷新页面。", true);
  } finally {
    ui.saveBtn.disabled = false;
    ui.saveBtn.textContent = "保存记录";
  }
}

function buildEntry(text) {
  const analysis = analyzeText(text);
  const manualMood = ui.moodInput.value;
  const manualTags = splitTags(ui.tagInput.value);
  if (manualMood) analysis.mood = manualMood;
  analysis.tags = unique([...analysis.tags, ...manualTags, ...state.photos.map(() => "图片")]);

  return {
    id: crypto.randomUUID(),
    text,
    photos: state.photos,
    analysis,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function analyzeText(text) {
  const money = extractMoney(text);
  const tasks = extractTasks(text);
  const mood = inferMood(text);
  const tags = inferTags(text, money, tasks, mood);
  const types = unique([
    text ? "日记" : "",
    money.length ? "收支" : "",
    tasks.length ? "任务" : "",
    mood ? "心情" : "",
  ].filter(Boolean));

  return {
    types,
    tags,
    mood,
    money,
    tasks,
    summary: makeSummary(text, money, tasks, mood),
  };
}

function extractMoney(text) {
  if (!text) return [];
  const result = [];
  const pattern = /(?:花了|花|消费|支出|买|收入|赚了|收到|工资)?\s*(\d+(?:\.\d+)?)\s*(?:元|块|rmb|RMB)?/g;
  let match;

  while ((match = pattern.exec(text))) {
    const amount = Number(match[1]);
    if (!amount || amount > 1000000) continue;
    const context = text.slice(Math.max(0, match.index - 10), Math.min(text.length, match.index + 24));
    const isIncome = /收入|赚了|收到|工资|奖金|转入/.test(context);
    const hasMoneyWord = /花|消费|支出|买|收入|赚了|收到|工资|元|块|rmb|RMB/.test(context);
    if (!hasMoneyWord) continue;
    result.push({
      id: crypto.randomUUID(),
      type: isIncome ? "income" : "expense",
      amount,
      category: inferCategory(context, isIncome),
      note: context.trim(),
    });
  }

  return result;
}

function inferCategory(text, isIncome) {
  if (isIncome) return "收入";
  if (/饭|餐|外卖|咖啡|奶茶|星巴克|吃|早餐|午饭|晚饭/.test(text)) return "餐饮";
  if (/地铁|公交|打车|高铁|机票|油|停车/.test(text)) return "交通";
  if (/衣服|鞋|淘宝|京东|买|购物/.test(text)) return "购物";
  if (/电影|游戏|会员|娱乐|酒/.test(text)) return "娱乐";
  if (/房租|水电|物业/.test(text)) return "居住";
  return "其他";
}

function extractTasks(text) {
  if (!text) return [];
  return text
    .split(/[。！？!?；;\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item) => /明天|后天|今晚|上午|下午|晚上|周[一二三四五六日天]|记得|待办|要|得/.test(item))
    .filter((item) => !/(花了|消费|收入|赚了|收到|元|块)/.test(item))
    .map((item) => ({
      id: crypto.randomUUID(),
      title: item.replace(/^(今天|明天|后天|今晚)?\s*(记得|要|得)?\s*/, "") || item,
      dueText: inferDue(item),
      done: false,
    }));
}

function inferDue(text) {
  const match = text.match(/今天|明天|后天|今晚|上午|下午|晚上|周[一二三四五六日天]|\d{1,2}\s*点/);
  return match ? match[0].replace(/\s/g, "") : "未定";
}

function inferMood(text) {
  const table = [
    ["开心", /开心|高兴|快乐|爽|满足/],
    ["平静", /平静|还好|稳定|普通/],
    ["疲惫", /累|困|疲惫|没精神|熬夜/],
    ["焦虑", /焦虑|慌|压力|紧张|担心|烦/],
    ["低落", /难过|低落|沮丧|崩溃|想哭/],
    ["生气", /生气|愤怒|火大|讨厌/],
  ];
  const found = table.find(([, reg]) => reg.test(text));
  return found ? found[0] : "";
}

function inferTags(text, money, tasks, mood) {
  const tags = [];
  if (money.length) tags.push("收支");
  if (tasks.length) tags.push("待办");
  if (mood) tags.push(mood);
  if (/工作|客户|合同|项目|会议|老板/.test(text)) tags.push("工作");
  if (/学习|英语|读书|课程|考试/.test(text)) tags.push("学习");
  if (/朋友|家人|同事|对象|父母/.test(text)) tags.push("关系");
  if (/运动|跑步|健身|睡觉|身体/.test(text)) tags.push("健康");
  return unique(tags);
}

function makeSummary(text, money, tasks, mood) {
  const parts = [];
  if (text) parts.push(text.length > 48 ? `${text.slice(0, 48)}...` : text);
  if (money.length) parts.push(`${money.length} 笔收支`);
  if (tasks.length) parts.push(`${tasks.length} 个任务`);
  if (mood) parts.push(`心情 ${mood}`);
  return parts.join(" · ") || "图片记录";
}

async function handlePhotos(event) {
  const files = [...event.target.files];
  state.photos = [];
  for (const file of files) {
    state.photos.push(await resizeImage(file));
  }
  renderPreview();
}

function resizeImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 1280;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve({
          id: crypto.randomUUID(),
          name: file.name,
          dataUrl: canvas.toDataURL("image/jpeg", 0.78),
          createdAt: new Date().toISOString(),
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
  ui.viewTitle.textContent = titles[state.view];
  renderDashboard();

  if (state.view === "today") renderEntries(todayEntries());
  if (state.view === "timeline") renderEntries(filteredEntries());
  if (state.view === "tasks") renderTasks();
  if (state.view === "mood") renderMood();
  if (state.view === "money") renderMoney();
  if (state.view === "photos") renderPhotos();
}

function renderDashboard() {
  const today = todayEntries();
  const allMoney = flattenMoney(today);
  const expense = allMoney.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0);
  ui.dashboard.innerHTML = [
    statHtml("今日记录", today.length),
    statHtml("今日任务", flattenTasks(today).filter((task) => !task.done).length),
    statHtml("今日支出", `¥${expense.toFixed(0)}`),
    statHtml("本地图片", today.reduce((sum, entry) => sum + entry.photos.length, 0)),
  ].join("");
}

function renderEntries(entries) {
  const list = filterBySearchAndKind(entries);
  if (!list.length) {
    ui.content.innerHTML = emptyHtml("这里还没有记录。");
    return;
  }

  ui.content.innerHTML = "";
  const tpl = $("#entryTpl");
  list.forEach((entry) => {
    const node = tpl.content.firstElementChild.cloneNode(true);
    node.dataset.id = entry.id;
    node.querySelector("time").textContent = formatDateTime(entry.createdAt);
    node.querySelector(".chips").innerHTML = chipsHtml(entry);
    node.querySelector(".entry-text").textContent = entry.text || "图片记录";
    node.querySelector(".photo-row").innerHTML = entry.photos.map((p) => `<img src="${p.dataUrl}" alt="${escapeHtml(p.name)}">`).join("");
    node.querySelector(".facts").innerHTML = factsHtml(entry);
    node.querySelector(".danger").addEventListener("click", () => removeEntry(entry.id));
    ui.content.appendChild(node);
  });
}

function renderTasks() {
  const tasks = flattenTasks(filteredEntries());
  if (!tasks.length) {
    ui.content.innerHTML = emptyHtml("还没有任务。写下“明天记得...”就会自动提取。");
    return;
  }
  ui.content.innerHTML = `<div class="list-panel">${tasks
    .map(
      (task) => `
        <div class="row">
          <label class="task-label">
            <input type="checkbox" data-entry="${task.entryId}" data-task="${task.id}" ${task.done ? "checked" : ""}>
            <span class="${task.done ? "done" : ""}">${escapeHtml(task.title)}</span>
          </label>
          <p>${escapeHtml(task.dueText)} · ${formatShortDate(task.createdAt)}</p>
        </div>`,
    )
    .join("")}</div>`;

  $$("[data-task]").forEach((box) => {
    box.addEventListener("change", () => toggleTask(box.dataset.entry, box.dataset.task, box.checked));
  });
}

function renderMood() {
  const moods = filteredEntries().filter((entry) => entry.analysis.mood);
  if (!moods.length) {
    ui.content.innerHTML = emptyHtml("还没有心情记录。可以手动选择心情，也可以在文字里写“焦虑、开心、累”等。");
    return;
  }
  const grouped = groupBy(moods, (entry) => entry.analysis.mood);
  const cards = Object.entries(grouped)
    .map(([mood, entries]) => `<div class="mood-card"><strong>${escapeHtml(mood)}</strong><p>${entries.length} 次</p></div>`)
    .join("");
  ui.content.innerHTML = `<div class="mood-grid">${cards}</div>${entriesPanel(moods)}`;
  bindDeleteButtons();
}

function renderMoney() {
  const money = flattenMoney(filteredEntries());
  if (!money.length) {
    ui.content.innerHTML = emptyHtml("还没有收支。写“午饭花了28”或“工资收到5000”就会自动提取。");
    return;
  }
  const expense = money.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0);
  const income = money.filter((item) => item.type === "income").reduce((sum, item) => sum + item.amount, 0);
  const rows = money
    .map(
      (item) => `
        <div class="row">
          <div>
            <strong>${escapeHtml(item.category)}</strong>
            <p>${escapeHtml(item.note)} · ${formatShortDate(item.createdAt)}</p>
          </div>
          <span class="amount ${item.type === "income" ? "income" : ""}">${item.type === "income" ? "+" : "-"}¥${item.amount.toFixed(2)}</span>
        </div>`,
    )
    .join("");
  ui.content.innerHTML = `
    <div class="dashboard">
      ${statHtml("支出", `¥${expense.toFixed(2)}`)}
      ${statHtml("收入", `¥${income.toFixed(2)}`)}
      ${statHtml("净额", `¥${(income - expense).toFixed(2)}`)}
      ${statHtml("笔数", money.length)}
    </div>
    <div class="list-panel">${rows}</div>`;
}

function renderPhotos() {
  const photos = filteredEntries().flatMap((entry) =>
    entry.photos.map((photo) => ({ ...photo, entryText: entry.text, createdAt: entry.createdAt })),
  );
  if (!photos.length) {
    ui.content.innerHTML = emptyHtml("还没有图片。");
    return;
  }
  ui.content.innerHTML = `<div class="photo-grid">${photos
    .map(
      (photo) => `
        <div class="photo-card">
          <img src="${photo.dataUrl}" alt="${escapeHtml(photo.name)}">
          <p>${escapeHtml(formatShortDate(photo.createdAt))} · ${escapeHtml(photo.entryText || "图片记录")}</p>
        </div>`,
    )
    .join("")}</div>`;
}

function entriesPanel(entries) {
  return `<div class="content" style="margin-top:12px">${entries.map(entryCardHtml).join("")}</div>`;
}

function entryCardHtml(entry) {
  return `
    <article class="entry" data-id="${entry.id}">
      <div class="entry-head">
        <div><time>${formatDateTime(entry.createdAt)}</time><div class="chips">${chipsHtml(entry)}</div></div>
        <button class="ghost danger" data-delete="${entry.id}" type="button">删除</button>
      </div>
      <p class="entry-text">${escapeHtml(entry.text || "图片记录")}</p>
      <div class="facts">${factsHtml(entry)}</div>
    </article>`;
}

function chipsHtml(entry) {
  const chips = unique([...entry.analysis.types, ...entry.analysis.tags]);
  return chips.map((chip) => `<span class="chip">${escapeHtml(chip)}</span>`).join("");
}

function factsHtml(entry) {
  const facts = [];
  if (entry.analysis.summary) facts.push(`摘要：${entry.analysis.summary}`);
  if (entry.analysis.mood) facts.push(`心情：${entry.analysis.mood}`);
  entry.analysis.tasks.forEach((task) => facts.push(`任务：${task.title}（${task.dueText}）`));
  entry.analysis.money.forEach((item) => facts.push(`收支：${item.category} ${item.type === "income" ? "收入" : "支出"} ¥${item.amount}`));
  if (entry.photos.length) facts.push(`图片：${entry.photos.length} 张，已保存在本地数据库`);
  return facts.map((fact) => `<div class="fact">${escapeHtml(fact)}</div>`).join("");
}

function bindDeleteButtons() {
  $$("[data-delete]").forEach((button) => button.addEventListener("click", () => removeEntry(button.dataset.delete)));
}

async function toggleTask(entryId, taskId, done) {
  const entry = state.entries.find((item) => item.id === entryId);
  if (!entry) return;
  entry.analysis.tasks = entry.analysis.tasks.map((task) => (task.id === taskId ? { ...task, done } : task));
  entry.updatedAt = new Date().toISOString();
  await persistEntry(entry);
  saveLightBackup();
  render();
}

async function removeEntry(id) {
  if (state.dbReady) await dbDelete(id);
  state.entries = state.entries.filter((entry) => entry.id !== id);
  saveLightBackup();
  updateCount();
  render();
  showHint("已删除。");
}

function filteredEntries() {
  return state.view === "today" ? todayEntries() : state.entries;
}

function filterBySearchAndKind(entries) {
  const q = ui.searchInput.value.trim().toLowerCase();
  const kind = ui.filterInput.value;
  return entries.filter((entry) => {
    const haystack = [entry.text, entry.analysis.mood, entry.analysis.summary, ...entry.analysis.tags]
      .join(" ")
      .toLowerCase();
    const kindOk =
      kind === "all" ||
      (kind === "diary" && entry.text) ||
      (kind === "task" && entry.analysis.tasks.length) ||
      (kind === "money" && entry.analysis.money.length) ||
      (kind === "mood" && entry.analysis.mood) ||
      (kind === "photo" && entry.photos.length);
    return kindOk && (!q || haystack.includes(q));
  });
}

function todayEntries() {
  const today = new Date().toDateString();
  return state.entries.filter((entry) => new Date(entry.createdAt).toDateString() === today);
}

function flattenTasks(entries) {
  return entries.flatMap((entry) => entry.analysis.tasks.map((task) => ({ ...task, entryId: entry.id, createdAt: entry.createdAt })));
}

function flattenMoney(entries) {
  return entries.flatMap((entry) => entry.analysis.money.map((item) => ({ ...item, createdAt: entry.createdAt })));
}

function renderPreview() {
  ui.preview.innerHTML = state.photos.map((photo) => `<img src="${photo.dataUrl}" alt="${escapeHtml(photo.name)}">`).join("");
}

function clearComposer() {
  ui.textInput.value = "";
  ui.moodInput.value = "";
  ui.tagInput.value = "";
  ui.photoInput.value = "";
  state.photos = [];
  renderPreview();
}

async function persistEntry(entry) {
  if (state.dbReady) {
    await dbPut(entry);
    return;
  }
  const index = state.entries.findIndex((item) => item.id === entry.id);
  if (index >= 0) state.entries[index] = entry;
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("IndexedDB is not supported."));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("createdAt", "createdAt");
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function dbGetAll() {
  return requestFromStore("readonly", (store) => store.getAll()).then((items) => items || []);
}

function dbGet(id) {
  return requestFromStore("readonly", (store) => store.get(id));
}

function dbPut(entry) {
  return requestFromStore("readwrite", (store) => store.put(entry));
}

function dbDelete(id) {
  return requestFromStore("readwrite", (store) => store.delete(id));
}

function requestFromStore(mode, createRequest) {
  return new Promise((resolve, reject) => {
    const tx = state.db.transaction(STORE, mode);
    const request = createRequest(tx.objectStore(STORE));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function saveLightBackup() {
  const light = state.entries.map((entry) => ({ ...entry, photos: [] }));
  localStorage.setItem(BACKUP_KEY, JSON.stringify(light.slice(0, 500)));
}

function loadLightBackup() {
  try {
    return JSON.parse(localStorage.getItem(BACKUP_KEY)) || [];
  } catch {
    return [];
  }
}

function exportData() {
  const payload = { version: 2, exportedAt: new Date().toISOString(), entries: state.entries };
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
  const payload = JSON.parse(await file.text());
  const entries = Array.isArray(payload.entries) ? payload.entries : [];
  for (const entry of entries) await persistEntry(normalizeImportedEntry(entry));
  state.entries = state.dbReady ? await dbGetAll() : entries;
  sortEntries();
  saveLightBackup();
  updateCount();
  render();
  showHint(`导入完成，共 ${entries.length} 条。`);
}

function normalizeImportedEntry(entry) {
  return {
    id: entry.id || crypto.randomUUID(),
    text: entry.text || "",
    photos: Array.isArray(entry.photos) ? entry.photos : [],
    analysis: {
      types: entry.analysis?.types || [],
      tags: entry.analysis?.tags || [],
      mood: entry.analysis?.mood || "",
      money: entry.analysis?.money || entry.analysis?.transactions || [],
      tasks: entry.analysis?.tasks || [],
      summary: entry.analysis?.summary || "",
    },
    createdAt: entry.createdAt || new Date().toISOString(),
    updatedAt: entry.updatedAt || new Date().toISOString(),
  };
}

function updateCount() {
  ui.entryCount.textContent = String(state.entries.length);
}

function setDbStatus(text) {
  ui.dbStatus.textContent = text;
}

function showHint(text, isError = false) {
  ui.saveHint.textContent = text;
  ui.saveHint.style.color = isError ? "var(--red)" : "var(--muted)";
}

function sortEntries() {
  state.entries.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function splitTags(value) {
  return value
    .split(/[,，、\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function groupBy(items, getter) {
  return items.reduce((acc, item) => {
    const key = getter(item);
    acc[key] ||= [];
    acc[key].push(item);
    return acc;
  }, {});
}

function statHtml(label, value) {
  return `<div class="stat"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
}

function emptyHtml(text) {
  return `<div class="empty">${escapeHtml(text)}</div>`;
}

function formatDateLong(date) {
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
