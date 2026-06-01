/* products.js
   Full module script with shared Back button handling and refresh toast.
   Replace SHEET_ID with your sheet id.
*/

/* CONFIG */
const SHEET_ID = "1KrgWaKCXp0jfHP_OCkH0PRq-Ib228N4sOJrHvdbPmNg";
const SHEET_NAME = "products";

/* DOM refs */
const categoriesView = document.getElementById("categoriesView");
const itemsView = document.getElementById("itemsView");
const detailsView = document.getElementById("detailsView");
const viewTitle = document.getElementById("viewTitle");
const quickFilter = document.getElementById("quickFilter");
const globalSearch = document.getElementById("globalSearch");
const refreshBtnEl = document.getElementById("refreshBtn");
const backPrevBtn = document.getElementById("backToPrev");

/* detail fields */
const detailName = document.getElementById("detailName");
const detailAlias = document.getElementById("detailAlias");
const detailCategory = document.getElementById("detailCategory");
const detailUnit = document.getElementById("detailUnit");
const detailStock = document.getElementById("detailStock");
const detailRate = document.getElementById("detailRate");
const detailWeight = document.getElementById("detailWeight");
const detailWall = document.getElementById("detailWall");
const detailInner = document.getElementById("detailInner");

/* state */
let rawRows = [];
let categories = [];
let currentCategory = null;
let currentView = "categories"; // "categories" | "items" | "details"

/* init */
document.addEventListener("DOMContentLoaded", () => {
  bindUI();
  loadSheetData();
});

/* UI bindings */
function bindUI() {
  if (quickFilter) quickFilter.addEventListener("input", () => {
    if (currentView === "items") renderItems(currentCategory);
    else renderCategories();
  });

  if (globalSearch) globalSearch.addEventListener("input", () => {
    if (currentView === "items") renderItems(currentCategory);
    else renderCategories();
  });

  if (refreshBtnEl) {
    refreshBtnEl.addEventListener("click", async () => {
      try {
        setRefreshLoading(true);
        const ok = await loadSheetData();
        if (ok) showToast("Products refreshed", "success");
        else showToast("Refresh failed. See console.", "error");
      } catch (err) {
        console.error("Refresh failed:", err);
        showToast("Refresh failed. See console.", "error");
      } finally {
        setTimeout(() => setRefreshLoading(false), 300);
      }
    });
  }

  if (backPrevBtn) {
    backPrevBtn.addEventListener("click", async () => {
      try {
        setBackLoading(true);
        await new Promise(r => setTimeout(r, 140));
        // step back: details -> items -> categories
        if (currentView === "details") {
          showItemsView(currentCategory);
        } else if (currentView === "items") {
          showCategories();
        } else {
          showCategories();
        }
      } catch (err) {
        console.error("Back navigation failed:", err);
        showCategories();
      } finally {
        setTimeout(() => setBackLoading(false), 180);
      }
    });
  }
}

// Ensure the details back button returns to the items list
const detailsBackBtn = document.getElementById("backToItems");
if (detailsBackBtn) {
  detailsBackBtn.addEventListener("click", async () => {
    try {
      // show small loading state on the button
      detailsBackBtn.setAttribute("aria-busy", "true");
      // brief delay for UX
      await new Promise(r => setTimeout(r, 120));
      // If a category is selected, show its items; otherwise show categories
      if (typeof currentCategory !== "undefined" && currentCategory) {
        showItemsView(currentCategory);
      } else {
        // fallback: show categories if no category is set
        if (typeof showCategories === "function") showCategories();
      }
    } catch (err) {
      console.error("Back to items failed:", err);
      if (typeof showCategories === "function") showCategories();
    } finally {
      // restore button state
      setTimeout(() => detailsBackBtn.setAttribute("aria-busy", "false"), 120);
    }
  });
}

/* UI helpers for buttons */
function setRefreshLoading(isLoading) {
  if (!refreshBtnEl) return;
  refreshBtnEl.setAttribute("aria-busy", isLoading ? "true" : "false");
  const label = refreshBtnEl.querySelector(".refresh-label");
  if (label) label.textContent = isLoading ? "Refreshing…" : "Refresh";
}

function setBackLoading(isLoading) {
  if (!backPrevBtn) return;
  backPrevBtn.setAttribute("aria-busy", isLoading ? "true" : "false");
  const label = backPrevBtn.querySelector(".back-label");
  if (label) label.textContent = isLoading ? "Going back…" : "Back";
}

/* Toast helper (keeps previous inline implementation) */
function showToast(message, type = "success", duration = 3000) {
  let container = document.getElementById("toastContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "toastContainer";
    container.setAttribute("aria-live", "polite");
    container.style.position = "fixed";
    container.style.right = "18px";
    container.style.bottom = "18px";
    container.style.zIndex = 99999;
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.gap = "10px";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.style.minWidth = "220px";
  toast.style.maxWidth = "360px";
  toast.style.padding = "10px 14px";
  toast.style.borderRadius = "10px";
  toast.style.boxShadow = "0 8px 20px rgba(10,20,30,0.12)";
  toast.style.display = "flex";
  toast.style.alignItems = "center";
  toast.style.gap = "10px";
  toast.style.opacity = "0";
  toast.style.transform = "translateY(8px)";
  toast.style.transition = "opacity .18s ease, transform .18s ease";

  if (type === "success") {
    toast.style.background = "linear-gradient(90deg,#f0fbf6,#ffffff)";
    toast.style.border = "1px solid rgba(16,185,129,0.12)";
    toast.style.color = "#0f5132";
  } else if (type === "error") {
    toast.style.background = "linear-gradient(90deg,#fff6f6,#ffffff)";
    toast.style.border = "1px solid rgba(232,85,45,0.12)";
    toast.style.color = "#6b1f1f";
  } else {
    toast.style.background = "#fff";
    toast.style.border = "1px solid rgba(0,0,0,0.06)";
    toast.style.color = "#223344";
  }

  const icon = document.createElement("div");
  icon.style.width = "36px";
  icon.style.height = "36px";
  icon.style.borderRadius = "8px";
  icon.style.display = "flex";
  icon.style.alignItems = "center";
  icon.style.justifyContent = "center";
  icon.style.flexShrink = "0";
  icon.style.fontSize = "16px";

  if (type === "success") {
    icon.innerHTML = '<i class="fas fa-check"></i>';
    icon.style.background = "rgba(16,185,129,0.12)";
    icon.style.color = "#10b981";
  } else if (type === "error") {
    icon.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
    icon.style.background = "rgba(232,85,45,0.10)";
    icon.style.color = "#e8552d";
  } else {
    icon.innerHTML = '<i class="fas fa-info-circle"></i>';
    icon.style.background = "rgba(43,125,233,0.08)";
    icon.style.color = "#2b7de9";
  }

  const text = document.createElement("div");
  text.style.fontSize = "13px";
  text.style.lineHeight = "1.2";
  text.textContent = message;

  const closeBtn = document.createElement("button");
  closeBtn.innerHTML = '<i class="fas fa-times"></i>';
  closeBtn.style.marginLeft = "auto";
  closeBtn.style.background = "transparent";
  closeBtn.style.border = "none";
  closeBtn.style.cursor = "pointer";
  closeBtn.style.color = "inherit";
  closeBtn.style.fontSize = "14px";
  closeBtn.setAttribute("aria-label", "Close notification");
  closeBtn.addEventListener("click", () => dismiss());

  toast.appendChild(icon);
  toast.appendChild(text);
  toast.appendChild(closeBtn);
  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";
  });

  const timeout = setTimeout(() => dismiss(), duration);

  function dismiss() {
    clearTimeout(timeout);
    toast.style.opacity = "0";
    toast.style.transform = "translateY(8px)";
    setTimeout(() => {
      if (toast && toast.parentNode) toast.parentNode.removeChild(toast);
      if (container && container.childElementCount === 0 && container.parentNode) {
        container.parentNode.removeChild(container);
      }
    }, 220);
  }
}

/* Google Sheets fetch */
async function loadSheetData() {
  showLoadingState(true);
  try {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(SHEET_NAME)}`;
    console.log("Fetching sheet URL:", url);
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    const text = await res.text();
    const jsonText = text.replace(/^[^\(]*\(/, "").replace(/\);?$/, "");
    const data = JSON.parse(jsonText);
    parseSheetData(data);
    showLoadingState(false);
    return true;
  } catch (err) {
    showLoadingState(false);
    console.error("Failed to load sheet:", err);
    categoriesView.innerHTML = `
      <div class="empty-row">
        <div style="font-weight:700;margin-bottom:8px;">Unable to load data</div>
        <div style="color:#7a8a99;margin-bottom:12px;">Check SHEET_ID, publish settings, or network. See console for details.</div>
        <div style="display:flex;gap:8px;justify-content:center;">
          <button id="sheetRetry" class="add-btn">Retry</button>
        </div>
      </div>
    `;
    const retryBtn = document.getElementById("sheetRetry");
    if (retryBtn) retryBtn.addEventListener("click", () => loadSheetData());
    return false;
  }
}

/* Parse gviz response */
function parseSheetData(gviz) {
  const table = gviz.table;
  const cols = table.cols.map(c => (c && c.label) ? c.label.trim().toLowerCase() : "");
  const rows = table.rows || [];
  rawRows = rows.map((r, idx) => {
    const obj = { __row: idx + 1 };
    cols.forEach((colName, i) => {
      const cell = r.c[i];
      obj[colName || `col${i}`] = cell ? cell.v : "";
    });
    return obj;
  });

  rawRows = rawRows.map(r => ({
    category: (r.category || r.cat || r["category"] || "").toString().trim(),
    item: (r.item || r.name || r["item"] || "").toString().trim(),
    alias: (r.alias || "").toString().trim(),
    unit: (r.unit || "").toString().trim(),
    rate: (r.rate || r.price || 0),
    weight: (r.weight || "").toString().trim(),
    wallthicknessmin: (r.wallthicknessmin || "").toString().trim(),
    wallthicknessmax: (r.wallthicknessmax || "").toString().trim(),
    innerdiameter: (r.innerdiameter || "").toString().trim(),
    currentstock: (r.currentstock || r.stock || 0),
    __row: r.__row
  }));

  const seen = new Set();
  categories = [];
  rawRows.forEach(r => {
    const cat = r.category || "Uncategorized";
    if (!seen.has(cat)) {
      seen.add(cat);
      categories.push(cat);
    }
  });

  currentCategory = null;
  renderCategories();
}

/* Render categories */
function renderCategories() {
  currentView = "categories";
  updateBackVisibility();
  viewTitle.textContent = "Categories";
  categoriesView.style.display = "";
  itemsView.style.display = "none";
  detailsView.style.display = "none";

  const filter = (quickFilter && quickFilter.value || "").toLowerCase();
  const gfilter = (globalSearch && globalSearch.value || "").toLowerCase();

  categoriesView.innerHTML = "";
  const filtered = categories.filter(cat => {
    const t = cat.toLowerCase();
    return t.includes(filter) && t.includes(gfilter);
  });

  if (!filtered.length) {
    categoriesView.innerHTML = `<div class="empty-row">No categories found.</div>`;
    return;
  }

  filtered.forEach((cat, i) => {
    const card = document.createElement("div");
    card.className = "module-card";
    card.dataset.category = cat;
    card.innerHTML = `
      <div class="mod-icon cat-${(i % 5) + 1}"><i class="fas fa-layer-group"></i></div>
      <div class="mod-name">${escapeHtml(cat)}</div>
      <div class="mod-desc">${countItemsInCategory(cat)} items</div>
      <div class="mod-link"><i class="fas fa-arrow-right"></i> Open</div>
    `;
    card.addEventListener("click", () => {
      currentCategory = cat;
      renderItems(cat);
    });
    categoriesView.appendChild(card);
  });
}

/* Render items */
function renderItems(category) {
  currentView = "items";
  updateBackVisibility();
  viewTitle.textContent = `Category: ${category}`;
  categoriesView.style.display = "none";
  itemsView.style.display = "";
  detailsView.style.display = "none";

  const filter = (quickFilter && quickFilter.value || "").toLowerCase();
  const gfilter = (globalSearch && globalSearch.value || "").toLowerCase();

  const rows = rawRows.filter(r => (r.category || "Uncategorized") === category);
  const filtered = rows.filter(r => {
    const text = `${r.item} ${r.alias} ${r.category}`.toLowerCase();
    return text.includes(filter) && text.includes(gfilter);
  });

  itemsView.innerHTML = "";
  if (!filtered.length) {
    itemsView.innerHTML = `<div class="empty-row">No items found in this category.</div>`;
    return;
  }

  filtered.forEach((r, i) => {
    const card = document.createElement("div");
    card.className = "module-card";
    card.dataset.itemId = r.__row;
    card.innerHTML = `
      <div class="mod-icon cat-${(i % 5) + 1}"><i class="fas fa-box"></i></div>
      <div class="mod-name">${escapeHtml(r.item)}</div>
      <div class="mod-desc">${escapeHtml(r.alias || "")}</div>
      <div class="mod-link"><i class="fas fa-info-circle"></i> Details</div>
    `;
    card.addEventListener("click", () => {
      showItemDetails(r.__row);
    });
    itemsView.appendChild(card);
  });
}

/* Show item details */
function showItemDetails(rowIndex) {
  const item = rawRows.find(r => r.__row === rowIndex);
  if (!item) return;
  currentView = "details";
  updateBackVisibility();
  viewTitle.textContent = `Item: ${item.item}`;
  categoriesView.style.display = "none";
  itemsView.style.display = "none";
  detailsView.style.display = "";

  detailName.textContent = item.item || "-";
  detailAlias.textContent = item.alias ? `Alias: ${item.alias}` : "";
  detailCategory.textContent = item.category || "Uncategorized";
  detailUnit.textContent = item.unit || "";
  detailStock.textContent = `Stock: ${Number(item.currentstock || 0).toLocaleString()}`;
  detailRate.textContent = item.rate ? `₹ ${Number(item.rate).toFixed(2)}` : "-";
  detailWeight.textContent = item.weight || "-";
  detailWall.textContent = `${item.wallthicknessmin || "-"} to ${item.wallthicknessmax || "-"}`;
  detailInner.textContent = item.innerdiameter || "-";
}

/* Helpers */
function countItemsInCategory(cat) {
  return rawRows.filter(r => (r.category || "Uncategorized") === cat).length;
}

function escapeHtml(s) {
  return String(s || "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function showLoadingState(isLoading) {
  if (isLoading) {
    categoriesView.innerHTML = `<div class="empty-row">Loading…</div>`;
    itemsView.innerHTML = "";
    detailsView.style.display = "none";
  }
}

/* Update back button visibility based on currentView */
function updateBackVisibility() {
  if (!backPrevBtn) return;
  // show back button for items and details, hide for categories
  if (currentView === "categories") {
    backPrevBtn.style.display = "none";
  } else {
    backPrevBtn.style.display = "";
  }
}

/* Public helpers */
window.showCategories = function() {
  currentCategory = null;
  renderCategories();
};

window.showItemsView = function(category) {
  currentCategory = category;
  renderItems(category);
};
