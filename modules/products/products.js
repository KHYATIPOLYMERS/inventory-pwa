/* products.js
   Loads products from a Google Sheet (sheet name "products") and renders:
   - unique categories as cards
   - items in a selected category as cards
   - item details when an item is selected
*/

/* ====== CONFIG ====== */
// Replace with your Google Sheet ID
const SHEET_ID = "1KrgWaKCXp0jfHP_OCkH0PRq-Ib228N4sOJrHvdbPmNg";
// Sheet name exactly as in Google Sheets
const SHEET_NAME = "products";

/* ====== DOM refs ====== */
const categoriesView = document.getElementById("categoriesView");
const itemsView = document.getElementById("itemsView");
const detailsView = document.getElementById("detailsView");
const viewTitle = document.getElementById("viewTitle");
const quickFilter = document.getElementById("quickFilter");
const globalSearch = document.getElementById("globalSearch");
const refreshBtn = document.getElementById("refreshBtn");
const backToItemsBtn = document.getElementById("backToItems");

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

/* in-memory data */
let rawRows = [];        // array of row objects
let categories = [];     // unique category names
let currentCategory = null;

/* ====== Init ====== */
document.addEventListener("DOMContentLoaded", () => {
  bindUI();
  loadSheetData();
});

/* ====== UI bindings ====== */
function bindUI() {
  quickFilter.addEventListener("input", () => {
    if (currentCategory) renderItems(currentCategory);
    else renderCategories();
  });
  globalSearch && globalSearch.addEventListener("input", () => {
    if (currentCategory) renderItems(currentCategory);
    else renderCategories();
  });
  refreshBtn.addEventListener("click", loadSheetData);
  backToItemsBtn && backToItemsBtn.addEventListener("click", () => {
    showItemsView(currentCategory);
  });
}

/* ====== Google Sheets fetch ======
   Uses the "gviz/tq?tqx=out:json" endpoint which returns JSON wrapped in a JS function call.
   Make sure the sheet is published to the web (File → Publish to web) or the sheet is shared publicly.
*/
async function loadSheetData() {
  showLoadingState(true);
  try {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(SHEET_NAME)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Network response not ok: " + res.status);
    const text = await res.text();
    // strip the leading "/*O_o*/\ngoogle.visualization.Query.setResponse(" and trailing ");"
    const jsonText = text.replace(/^[^\(]*\(/, "").replace(/\);?$/, "");
    const data = JSON.parse(jsonText);
    parseSheetData(data);
    showLoadingState(false);
  } catch (err) {
    showLoadingState(false);
    console.error("Failed to load sheet:", err);
    categoriesView.innerHTML = `<div class="empty-row">Unable to load data. Check SHEET_ID, publish settings, and network.</div>`;
  }
}

/* ====== Parse gviz response into array of objects ======
   Assumes first row in sheet is header row with these exact headers:
   category, item, alias, unit, rate, weight, wallthicknessmin, wallthicknessmax, innerdiameter, currentstock
*/
function parseSheetData(gviz) {
  const table = gviz.table;
  const cols = table.cols.map(c => (c && c.label) ? c.label.trim().toLowerCase() : "");
  const rows = table.rows || [];
  rawRows = rows.map((r, idx) => {
    const obj = { __row: idx + 1 }; // keep row index
    cols.forEach((colName, i) => {
      const cell = r.c[i];
      obj[colName || `col${i}`] = cell ? cell.v : "";
    });
    return obj;
  });

  // normalize header keys we expect (map possible variations)
  rawRows = rawRows.map(r => ({
    category: (r.category || r.cat || r["Category"] || "").toString().trim(),
    item: (r.item || r.name || r["Item"] || "").toString().trim(),
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

  // build unique categories (preserve order)
  const seen = new Set();
  categories = [];
  rawRows.forEach(r => {
    const cat = r.category || "Uncategorized";
    if (!seen.has(cat)) {
      seen.add(cat);
      categories.push(cat);
    }
  });

  // initial render
  currentCategory = null;
  renderCategories();
}

/* ====== Render categories as cards ====== */
function renderCategories() {
  viewTitle.textContent = "Categories";
  categoriesView.style.display = "";
  itemsView.style.display = "none";
  detailsView.style.display = "none";

  const filter = (quickFilter.value || "").toLowerCase();
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

/* ====== Render items in a category as cards ====== */
function renderItems(category) {
  viewTitle.textContent = `Category: ${category}`;
  categoriesView.style.display = "none";
  itemsView.style.display = "";
  detailsView.style.display = "none";

  const filter = (quickFilter.value || "").toLowerCase();
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

/* ====== Show details for a single item (by row index) ====== */
function showItemDetails(rowIndex) {
  const item = rawRows.find(r => r.__row === rowIndex);
  if (!item) return;
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

/* ====== Helpers ====== */
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

/* ====== Public navigation helpers (optional) ====== */
window.showCategories = function() {
  currentCategory = null;
  renderCategories();
};

window.showItemsView = function(category) {
  currentCategory = category;
  renderItems(category);
};
