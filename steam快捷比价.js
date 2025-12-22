// ==UserScript==
// @name         Steam 额外地区价格显示
// @namespace    https://github.com/linyaocrush/My-Tampermonkey-script
// @version      0.2.4
// @description  商店价格旁追加目标地区实际价格；购物车页显示“目标地区预计付款”，不可购买项提示并从合计剔除（更强鲁棒性）
// @match        https://store.steampowered.com/*
// @run-at       document-idle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        GM_xmlhttpRequest
// @connect      store.steampowered.com
// @license MIT
// ==/UserScript==


    (function () {
  'use strict';

  const STORAGE_KEY_REGION_ID = 'sapx_target_region_id_v1';
  const STORAGE_KEY_SHOW_CODE = 'sapx_show_region_code_v1';

  const REGIONS = [
    { id: 'SASIA_USD', short: 'SASIA', label: 'South Asia - USD', currency: 'USD', ccCandidates: ['PK'] },
    { id: 'CNY', short: 'CN', label: 'Chinese Yuan', currency: 'CNY', ccCandidates: ['CN'] },
    { id: 'INR', short: 'IN', label: 'Indian Rupee', currency: 'INR', ccCandidates: ['IN'] },
    { id: 'UAH', short: 'UA', label: 'Ukrainian Hryvnia', currency: 'UAH', ccCandidates: ['UA'] },
    { id: 'VND', short: 'VN', label: 'Vietnamese Dong', currency: 'VND', ccCandidates: ['VN'] },
    { id: 'IDR', short: 'ID', label: 'Indonesian Rupiah', currency: 'IDR', ccCandidates: ['ID'] },
    { id: 'KZT', short: 'KZ', label: 'Kazakhstani Tenge', currency: 'KZT', ccCandidates: ['KZ'] },
    { id: 'PHP', short: 'PH', label: 'Philippine Peso', currency: 'PHP', ccCandidates: ['PH'] },
    { id: 'KRW', short: 'KR', label: 'South Korea Won', currency: 'KRW', ccCandidates: ['KR'] },
    { id: 'PEN', short: 'PE', label: 'Peruvian Sol', currency: 'PEN', ccCandidates: ['PE'] },
    { id: 'JPY', short: 'JP', label: 'Japanese Yen', currency: 'JPY', ccCandidates: ['JP'] },
    { id: 'CIS_USD', short: 'CIS', label: 'CIS - U.S. Dollar', currency: 'USD', ccCandidates: ['AZ'] },
    { id: 'LATAM_USD', short: 'LATAM', label: 'LATAM - U.S. Dollar', currency: 'USD', ccCandidates: ['AR'] },
    { id: 'MENA_USD', short: 'MENA', label: 'MENA - U.S. Dollar', currency: 'USD', ccCandidates: ['TR'] },
    { id: 'THB', short: 'TH', label: 'Thai Baht', currency: 'THB', ccCandidates: ['TH'] },
    { id: 'MYR', short: 'MY', label: 'Malaysian Ringgit', currency: 'MYR', ccCandidates: ['MY'] },
    { id: 'CLP', short: 'CL', label: 'Chilean Peso', currency: 'CLP', ccCandidates: ['CL'] },
    { id: 'MXN', short: 'MX', label: 'Mexican Peso', currency: 'MXN', ccCandidates: ['MX'] },
    { id: 'UYU', short: 'UY', label: 'Uruguayan Peso', currency: 'UYU', ccCandidates: ['UY'] },
    { id: 'BRL', short: 'BR', label: 'Brazilian Real', currency: 'BRL', ccCandidates: ['BR'] },
    { id: 'TWD', short: 'TW', label: 'Taiwan Dollar', currency: 'TWD', ccCandidates: ['TW'] },
    { id: 'ZAR', short: 'ZA', label: 'South African Rand', currency: 'ZAR', ccCandidates: ['ZA'] },
    { id: 'AED', short: 'AE', label: 'U.A.E. Dirham', currency: 'AED', ccCandidates: ['AE'] },
    { id: 'HKD', short: 'HK', label: 'Hong Kong Dollar', currency: 'HKD', ccCandidates: ['HK'] },
    { id: 'NZD', short: 'NZ', label: 'New Zealand Dollar', currency: 'NZD', ccCandidates: ['NZ'] },
    { id: 'NOK', short: 'NO', label: 'Norwegian Krone', currency: 'NOK', ccCandidates: ['NO'] },
    { id: 'KWD', short: 'KW', label: 'Kuwaiti Dinar', currency: 'KWD', ccCandidates: ['KW'] },
    { id: 'COP', short: 'CO', label: 'Colombian Peso', currency: 'COP', ccCandidates: ['CO'] },
    { id: 'AUD', short: 'AU', label: 'Australian Dollar', currency: 'AUD', ccCandidates: ['AU'] },
    { id: 'USD', short: 'US', label: 'U.S. Dollar', currency: 'USD', ccCandidates: ['US'] },
    { id: 'CAD', short: 'CA', label: 'Canadian Dollar', currency: 'CAD', ccCandidates: ['CA'] },
    { id: 'SGD', short: 'SG', label: 'Singapore Dollar', currency: 'SGD', ccCandidates: ['SG'] },
    { id: 'SAR', short: 'SA', label: 'Saudi Riyal', currency: 'SAR', ccCandidates: ['SA'] },
    { id: 'QAR', short: 'QA', label: 'Qatari Riyal', currency: 'QAR', ccCandidates: ['QA'] },
    { id: 'GBP', short: 'GB', label: 'British Pound', currency: 'GBP', ccCandidates: ['GB'] },
    { id: 'EUR', short: 'EU', label: 'Euro', currency: 'EUR', ccCandidates: ['EU', 'DE'] },
    { id: 'PLN', short: 'PL', label: 'Polish Zloty', currency: 'PLN', ccCandidates: ['PL'] },
    { id: 'CRC', short: 'CR', label: 'Costa Rican Colon', currency: 'CRC', ccCandidates: ['CR'] },
    { id: 'ILS', short: 'IL', label: 'Israeli New Shekel', currency: 'ILS', ccCandidates: ['IL'] },
    { id: 'CHF', short: 'CH', label: 'Swiss Franc', currency: 'CHF', ccCandidates: ['CH'] },
    { id: 'RUB', short: 'RU', label: 'Russian Ruble', currency: 'RUB', ccCandidates: ['RU'] }
  ];

  function getRegionById(id) { return REGIONS.find(r => r.id === id) || null; }
  function getTargetRegion() { const id = GM_getValue(STORAGE_KEY_REGION_ID, 'CNY'); return getRegionById(id) || getRegionById('CNY'); }
  function getShowRegionCode() { return Boolean(GM_getValue(STORAGE_KEY_SHOW_CODE, true)); }
  function isCartPage() { return location.pathname === '/cart/' || location.pathname.startsWith('/cart'); }

  const STYLE_ID = 'sapx-style';
  const EXTRA_CLASS = 'sapx-extra-price';
  const CART_SUMMARY_ID = 'sapx-cart-summary';
  const MARK_ATTR = 'data-sapx-region';
  const DETAIL_LABEL_CLASS = 'sapx-price-label';

  function addStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .sapx-extra-price{margin-left:6px;font-size:.85em;opacity:.9;white-space:nowrap;pointer-events:none}
      strike .sapx-extra-price,.discount_original_price .sapx-extra-price{opacity:.75;font-size:.82em}
      #sapx-cart-summary{margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,.08);color:#c6d4df;font-size:12px;line-height:1.4}
      #sapx-cart-summary .sapx-row{display:flex;justify-content:space-between;gap:8px;align-items:baseline}
      #sapx-cart-summary .sapx-label{opacity:.9}
      #sapx-cart-summary .sapx-value{font-weight:700;white-space:nowrap}
      #sapx-cart-summary .sapx-sub{margin-top:4px;opacity:.85}
      #sapx-cart-summary .sapx-warn{margin-top:6px;color:#ffcc6a;opacity:.95}
      .game_purchase_action_bg .discount_block.game_purchase_discount .discount_prices{position:relative !important;z-index:5 !important}
      .game_purchase_action_bg .discount_block.game_purchase_discount .discount_prices>.discount_original_price,
      .game_purchase_action_bg .discount_block.game_purchase_discount .discount_prices>.discount_final_price{position:relative !important;z-index:6 !important;display:flex !important;align-items:baseline;gap:8px;white-space:nowrap}
      .game_purchase_action_bg .discount_prices .sapx-price-label{font-size:12px;opacity:.85;min-width:2.6em;flex:0 0 auto;pointer-events:none}
      .game_purchase_action_bg .discount_prices .sapx-extra-price{margin-left:0 !important;flex:0 0 auto;font-size:.85em;opacity:.9}
      .game_purchase_action_bg .discount_prices>.discount_original_price .sapx-extra-price{opacity:.75;font-size:.82em}
    `;
    document.head.appendChild(style);
  }

  function gmGet(url) {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: 'GET',
        url,
        timeout: 20000,
        onload: (res) => {
          if ((res.status >= 200 && res.status < 300) || (res.status === 0 && res.responseText)) resolve(res.responseText);
          else reject(new Error(`HTTP ${res.status} ${res.statusText}`));
        },
        onerror: reject,
        ontimeout: () => reject(new Error('Timeout'))
      });
    });
  }

  class RequestQueue {
    constructor(concurrency = 4) { this.concurrency = concurrency; this.running = 0; this.queue = []; }
    enqueue(task) {
      return new Promise((resolve, reject) => {
        this.queue.push({ task, resolve, reject });
        this._deq();
      });
    }
    _deq() {
      if (this.running >= this.concurrency) return;
      const job = this.queue.shift();
      if (!job) return;
      this.running++;
      Promise.resolve().then(job.task).then(job.resolve).catch(job.reject).finally(() => { this.running--; this._deq(); });
    }
  }

  const requestQueue = new RequestQueue(4);
  const currencyDigitsCache = new Map();

  function getCurrencyFractionDigits(currency) {
    if (currencyDigitsCache.has(currency)) return currencyDigitsCache.get(currency);
    let digits = 2;
    try { digits = new Intl.NumberFormat('en-US', { style: 'currency', currency }).resolvedOptions().maximumFractionDigits; } catch {}
    currencyDigitsCache.set(currency, digits);
    return digits;
  }

  function formatMinorToCurrency(minor, currency) {
    const fd = getCurrencyFractionDigits(currency);
    const major = minor / Math.pow(10, fd);
    try { return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(major); } catch { return `${major.toFixed(fd)} ${currency}`; }
  }

  function parseFormattedToMinor(formatted, currency) {
    if (!formatted) return null;
    const fd = getCurrencyFractionDigits(currency);
    let s = String(formatted).replace(/\s+/g, '').replace(/[^\d.,]/g, '');
    if (!s) return null;
    if (fd === 0) {
      const digits = s.replace(/\D/g, '');
      if (!digits) return null;
      const n = parseInt(digits, 10);
      return Number.isFinite(n) ? n : null;
    }
    const lastDot = s.lastIndexOf('.');
    const lastComma = s.lastIndexOf(',');
    let decSep = null;
    if (lastDot >= 0 && lastComma >= 0) decSep = lastDot > lastComma ? '.' : ',';
    else if (lastDot >= 0) { const after = s.length - lastDot - 1; decSep = (after === fd) ? '.' : null; }
    else if (lastComma >= 0) { const after = s.length - lastComma - 1; decSep = (after === fd) ? ',' : null; }
    let intPart = s;
    let fracPart = '';
    if (decSep) { const parts = s.split(decSep); fracPart = parts.pop() || ''; intPart = parts.join(''); }
    intPart = intPart.replace(/[.,]/g, '').replace(/\D/g, '');
    fracPart = fracPart.replace(/\D/g, '');
    if (!intPart) intPart = '0';
    if (fracPart.length > fd) fracPart = fracPart.slice(0, fd);
    while (fracPart.length < fd) fracPart += '0';
    const i = parseInt(intPart, 10);
    const f = parseInt(fracPart || '0', 10);
    if (!Number.isFinite(i) || !Number.isFinite(f)) return null;
    return i * Math.pow(10, fd) + f;
  }

  const priceCache = new Map();
  const CACHE_TTL_MS = 5 * 60 * 1000;

  function now() { return Date.now(); }

  function cacheGet(key) {
    const v = priceCache.get(key);
    if (!v) return undefined;
    if (now() - v.ts > CACHE_TTL_MS) { priceCache.delete(key); return undefined; }
    return v.value;
  }

  function cacheSet(key, value) { priceCache.set(key, { ts: now(), value }); }

  function normalizePrice({ currency, final, initial, finalFormatted, initialFormatted, discountPercent }) {
    const ok = Boolean(finalFormatted || initialFormatted || Number.isFinite(final) || Number.isFinite(initial));
    return { ok, currency: currency || null, final: Number.isFinite(final) ? final : null, initial: Number.isFinite(initial) ? initial : null, finalFormatted: finalFormatted || '', initialFormatted: initialFormatted || finalFormatted || '', discountPercent: Number.isFinite(discountPercent) ? discountPercent : null };
  }

  async function getAppPrice(appid, cc, currencyFallback) {
    const url = `https://store.steampowered.com/api/appdetails?appids=${encodeURIComponent(appid)}&cc=${encodeURIComponent(cc)}&filters=price_overview,is_free`;
    const text = await requestQueue.enqueue(() => gmGet(url));
    const json = JSON.parse(text);
    const block = json?.[String(appid)];
    if (!block?.success) return null;
    const data = block.data || {};
    const po = data.price_overview;
    if (!po && data.is_free) return normalizePrice({ currency: currencyFallback, final: 0, initial: 0, finalFormatted: 'Free', initialFormatted: 'Free', discountPercent: 0 });
    if (!po) return null;
    return normalizePrice({ currency: po.currency || currencyFallback, final: po.final, initial: po.initial, finalFormatted: po.final_formatted || '', initialFormatted: po.initial_formatted || po.final_formatted || '', discountPercent: po.discount_percent });
  }

  async function getPackagePrice(packageid, cc, currencyFallback) {
    const url = `https://store.steampowered.com/api/packagedetails?packageids=${encodeURIComponent(packageid)}&cc=${encodeURIComponent(cc)}`;
    const text = await requestQueue.enqueue(() => gmGet(url));
    const json = JSON.parse(text);
    const block = json?.[String(packageid)];
    if (!block?.success) return null;
    const data = block.data || {};
    const p = data.price || data.price_overview;
    if (!p) return null;
    return normalizePrice({ currency: p.currency || currencyFallback, final: p.final, initial: p.initial, finalFormatted: p.final_formatted || '', initialFormatted: p.initial_formatted || p.final_formatted || '', discountPercent: p.discount_percent });
  }

  async function getBundlePrice(bundleid, cc, currencyFallback) {
    const url = `https://store.steampowered.com/bundle/${encodeURIComponent(bundleid)}/?cc=${encodeURIComponent(cc)}&l=english`;
    const html = await requestQueue.enqueue(() => gmGet(url));
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const finalEl = doc.querySelector('.discount_final_price') || doc.querySelector('.game_purchase_price.price') || doc.querySelector('.game_purchase_price');
    const origEl = doc.querySelector('.discount_original_price');
    const finalFormatted = finalEl?.textContent?.trim() || '';
    const initialFormatted = origEl?.textContent?.trim() || finalFormatted;
    if (!finalFormatted && !initialFormatted) return null;
    const currency = currencyFallback;
    const finalMinor = parseFormattedToMinor(finalFormatted, currency);
    const initialMinor = parseFormattedToMinor(initialFormatted, currency);
    return normalizePrice({ currency, final: Number.isFinite(finalMinor) ? finalMinor : null, initial: Number.isFinite(initialMinor) ? initialMinor : null, finalFormatted, initialFormatted, discountPercent: null });
  }

  async function getPriceForItem(item, region) {
    const cacheKey = `${item.type}:${item.id}=>${region.id}`;
    const cached = cacheGet(cacheKey);
    if (cached !== undefined) return cached;
    for (const cc of region.ccCandidates) {
      try {
        let res = null;
        if (item.type === 'app') res = await getAppPrice(item.id, cc, region.currency);
        else if (item.type === 'package') res = await getPackagePrice(item.id, cc, region.currency);
        else if (item.type === 'bundle') res = await getBundlePrice(item.id, cc, region.currency);
        if (res?.ok) { cacheSet(cacheKey, res); return res; }
      } catch {}
    }
    cacheSet(cacheKey, null);
    return null;
  }

  function extractFirstNumber(str) { const m = String(str || '').match(/\d+/); return m ? m[0] : null; }

  function inferItemFromScope(scopeEl) {
    if (!scopeEl) return null;
    const holder = scopeEl.closest?.('[data-ds-appid],[data-ds-packageid],[data-ds-bundleid]') || scopeEl.querySelector?.('[data-ds-appid],[data-ds-packageid],[data-ds-bundleid]');
    if (holder) {
      const pkg = extractFirstNumber(holder.getAttribute('data-ds-packageid') || holder.dataset?.dsPackageid);
      const bundle = extractFirstNumber(holder.getAttribute('data-ds-bundleid') || holder.dataset?.dsBundleid);
      const app = extractFirstNumber(holder.getAttribute('data-ds-appid') || holder.dataset?.dsAppid);
      if (pkg) return { type: 'package', id: pkg };
      if (bundle) return { type: 'bundle', id: bundle };
      if (app) return { type: 'app', id: app };
    }
    const row = scopeEl.closest?.('.cart_item, .cart_item_row') || scopeEl;
    const link = row.querySelector?.('a[href*="/app/"],a[href*="/sub/"],a[href*="/bundle/"]') || scopeEl.closest?.('a[href*="/app/"],a[href*="/sub/"],a[href*="/bundle/"]');
    if (link) {
      const href = link.getAttribute('href') || '';
      let m = href.match(/\/app\/(\d+)/); if (m) return { type: 'app', id: m[1] };
      m = href.match(/\/sub\/(\d+)/); if (m) return { type: 'package', id: m[1] };
      m = href.match(/\/bundle\/(\d+)/); if (m) return { type: 'bundle', id: m[1] };
    }
    const p = location.pathname;
    let m = p.match(/^\/app\/(\d+)/); if (m) return { type: 'app', id: m[1] };
    m = p.match(/^\/sub\/(\d+)/); if (m) return { type: 'package', id: m[1] };
    m = p.match(/^\/bundle\/(\d+)/); if (m) return { type: 'bundle', id: m[1] };
    return null;
  }

  function isOriginalPriceElement(el) {
    if (!el) return false;
    if (el.classList.contains('discount_original_price')) return true;
    if (el.tagName === 'STRIKE') return true;
    if (el.closest?.('.discount_original_price')) return true;
    if (el.closest?.('strike')) return true;
    return false;
  }

  function buildExtraText(region, formatted) { return getShowRegionCode() ? `(${region.short} ${formatted})` : `(${formatted})`; }

  function ensureDetailLineLabel(priceEl, text) {
    const inDetailBuyBox = !!priceEl.closest('.game_purchase_action_bg .discount_block.game_purchase_discount');
    if (!inDetailBuyBox) return;
    let label = priceEl.querySelector(`:scope > .${DETAIL_LABEL_CLASS}`);
    if (!label) {
      label = document.createElement('span');
      label.className = DETAIL_LABEL_CLASS;
      priceEl.insertAdjacentElement('afterbegin', label);
    }
    label.textContent = text;
  }

  function upsertExtraInside(priceEl, region, formatted) {
    let span = priceEl.querySelector(`:scope > .${EXTRA_CLASS}`);
    const text = buildExtraText(region, formatted);
    if (!span) {
      span = document.createElement('span');
      span.className = EXTRA_CLASS;
      span.setAttribute(MARK_ATTR, region.id);
      span.textContent = text;
      priceEl.appendChild(span);
    } else {
      span.setAttribute(MARK_ATTR, region.id);
      span.textContent = text;
    }
  }

  async function enhancePriceElement(priceEl) {
    try {
      if (!priceEl || priceEl.nodeType !== 1) return;
      if (priceEl.classList.contains(EXTRA_CLASS)) return;
      const region = getTargetRegion();
      const exist = priceEl.querySelector(`:scope > .${EXTRA_CLASS}`);
      if (exist && exist.getAttribute(MARK_ATTR) === region.id) return;
      const item = inferItemFromScope(priceEl);
      if (!item) return;
      const price = await getPriceForItem(item, region);
      if (!price) return;
      const wantInitial = isOriginalPriceElement(priceEl);
      const formatted = wantInitial ? price.initialFormatted : price.finalFormatted;
      if (!formatted) return;
      const inDetailBuyBox = !!priceEl.closest('.game_purchase_action_bg .discount_block.game_purchase_discount');
      if (inDetailBuyBox) {
        if (priceEl.classList.contains('discount_original_price')) ensureDetailLineLabel(priceEl, '原价');
        else if (priceEl.classList.contains('discount_final_price')) ensureDetailLineLabel(priceEl, '现价');
      }
      upsertExtraInside(priceEl, region, formatted);
    } catch {}
  }

  let cartUpdateTimer = null;
  let lastCartKey = '';
  let lastCartComputed = null;

  function findCartTotalsContainer() { return document.querySelector('.cart_totals_area') || document.querySelector('#cart_total') || document.body; }

  function findCartItems() {
    const rows = Array.from(document.querySelectorAll('.cart_item, .cart_item_row'));
    const items = [];
    for (const row of rows) {
      const item = inferItemFromScope(row);
      if (!item) continue;
      const nameEl = row.querySelector('.cart_item_desc a') || row.querySelector('.cart_item_desc') || row.querySelector('a[href*="/app/"],a[href*="/sub/"],a[href*="/bundle/"]');
      const name = (nameEl?.textContent || '').trim() || `${item.type}:${item.id}`;
      items.push({ row, item, name });
    }
    return items;
  }

  function renderCartSummary(region, computed) {
    const container = findCartTotalsContainer();
    if (!container) return;
    let box = document.getElementById(CART_SUMMARY_ID);
    if (!computed) { if (box) box.remove(); return; }
    if (!box) { box = document.createElement('div'); box.id = CART_SUMMARY_ID; container.appendChild(box); } else box.textContent = '';
    const title = getShowRegionCode() ? `目标地区预计付款（${region.short}）` : '目标地区预计付款';
    const totalText = formatMinorToCurrency(computed.sumMinor, computed.currency || region.currency);
    const row = document.createElement('div'); row.className = 'sapx-row';
    const label = document.createElement('div'); label.className = 'sapx-label'; label.textContent = `${title}：`;
    const value = document.createElement('div'); value.className = 'sapx-value'; value.textContent = totalText;
    const sub = document.createElement('div'); sub.className = 'sapx-sub'; sub.textContent = `已按可获取价格的商品计算：${computed.okCount}/${computed.totalCount} 项（无法获取价格的已从合计剔除）`;
    row.appendChild(label); row.appendChild(value);
    box.appendChild(row); box.appendChild(sub);
    if (computed.missingNames.length) {
      const warn = document.createElement('div'); warn.className = 'sapx-warn';
      const maxShow = 6;
      const shown = computed.missingNames.slice(0, maxShow);
      const more = computed.missingNames.length > maxShow ? '…' : '';
      warn.textContent = `目标地区无法购买/不可售或价格不可用：${computed.missingNames.length} 项：${shown.join('、')}${more}`;
      box.appendChild(warn);
    }
  }

  function findRowPriceAnchor(row) {
    const preferred = row.querySelector('.cart_item_price, .cart_item_price .price, .cart_item_discount_price, .cart_item_discount_price .discount_final_price');
    if (preferred) return preferred;
    const candidates = Array.from(row.querySelectorAll('span, div')).filter(el => {
      const t = (el.textContent || '').trim();
      if (!t) return false;
      if (t.length > 20) return false;
      const hasCurrency = /[€£¥₩₫₹$]/.test(t);
      const hasNumber = /\d/.test(t);
      const looksDecimal = /\d+[.,]\d+/.test(t);
      return (hasCurrency && hasNumber) || looksDecimal;
    });
    return candidates[0] || null;
  }

  async function updateCartRegionTotal() {
    if (!isCartPage()) return;
    const region = getTargetRegion();
    const items = findCartItems();
    if (!items.length) { lastCartKey = ''; lastCartComputed = null; renderCartSummary(region, null); return; }
    const itemsKey = items.map(x => `${x.item.type}:${x.item.id}`).sort().join('|');
    const key = `${region.id}::${itemsKey}`;
    if (key === lastCartKey && lastCartComputed) { renderCartSummary(region, lastCartComputed); return; }
    const results = await Promise.allSettled(items.map(x => getPriceForItem(x.item, region)));
    let sumMinor = 0;
    let okCount = 0;
    const missingNames = [];
    const currency = region.currency;
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      const { row, name } = items[i];
      if (r.status !== 'fulfilled' || !r.value || !r.value.ok) { missingNames.push(name); continue; }
      let minor = r.value.final;
      if (!Number.isFinite(minor) && r.value.finalFormatted) {
        const parsed = parseFormattedToMinor(r.value.finalFormatted, currency);
        if (Number.isFinite(parsed)) minor = parsed;
      }
      if (!Number.isFinite(minor)) { missingNames.push(name); continue; }
      sumMinor += minor;
      okCount++;
      const anchor = findRowPriceAnchor(row);
      if (anchor) {
        const exist = anchor.querySelector(`:scope > .${EXTRA_CLASS}`);
        if (!exist) {
          const formatted = r.value.finalFormatted || formatMinorToCurrency(minor, currency);
          upsertExtraInside(anchor, region, formatted);
        }
      }
    }
    lastCartKey = key;
    lastCartComputed = { sumMinor, currency, okCount, totalCount: items.length, missingNames };
    renderCartSummary(region, lastCartComputed);
  }

  function scheduleCartUpdate() {
    if (!isCartPage()) return;
    if (cartUpdateTimer) return;
    cartUpdateTimer = setTimeout(async () => { cartUpdateTimer = null; try { await updateCartRegionTotal(); } catch {} }, 700);
  }

  const PRICE_SELECTORS = [
    '.discount_final_price',
    '.discount_original_price',
    '.game_purchase_price',
    '.game_purchase_price.price',
    '.game_area_dlc_price',
    '.col.search_price.responsive_secondrow strike',
    '.col.search_price.responsive_secondrow .discount_final_price',
    '.col.search_price.responsive_secondrow'
  ].join(', ');

  function collectPriceElements(root) {
    const els = [];
    if (root?.matches && root.matches(PRICE_SELECTORS)) els.push(root);
    if (root?.querySelectorAll) root.querySelectorAll(PRICE_SELECTORS).forEach(e => els.push(e));
    return els;
  }

  let scanTimer = null;
  const pendingRoots = new Set();

  function scheduleScan() {
    if (scanTimer) return;
    scanTimer = setTimeout(async () => {
      scanTimer = null;
      const roots = Array.from(pendingRoots);
      pendingRoots.clear();
      const tasks = [];
      for (const r of roots) {
        const priceEls = collectPriceElements(r);
        for (const el of priceEls) tasks.push(enhancePriceElement(el));
      }
      await Promise.allSettled(tasks);
      scheduleCartUpdate();
    }, 250);
  }

  function startObserver() {
    const obs = new MutationObserver((mutations) => {
      for (const m of mutations) for (const n of m.addedNodes) if (n && n.nodeType === 1) pendingRoots.add(n);
      scheduleScan();
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  function initialScan() { pendingRoots.add(document.body); scheduleScan(); }

  function clearInjected() {
    document.querySelectorAll(`.${EXTRA_CLASS}`).forEach(el => el.remove());
    document.getElementById(CART_SUMMARY_ID)?.remove();
    priceCache.clear();
    lastCartKey = '';
    lastCartComputed = null;
  }

  function showRegionPicker() {
    const current = getTargetRegion();
    const lines = REGIONS.map((r, i) => `${String(i + 1).padStart(2, '0')}. ${r.label}  [${r.id}]`).join('\n');
    const input = prompt(`请选择要额外显示的地区（输入序号）：\n当前：${current.label} [${current.id}]\n\n${lines}`);
    if (!input) return;
    const idx = parseInt(input, 10) - 1;
    const picked = REGIONS[idx];
    if (!picked) { alert('输入无效'); return; }
    GM_setValue(STORAGE_KEY_REGION_ID, picked.id);
    clearInjected();
    initialScan();
    scheduleCartUpdate();
  }

  function toggleShowCode() {
    const v = !getShowRegionCode();
    GM_setValue(STORAGE_KEY_SHOW_CODE, v);
    clearInjected();
    initialScan();
    scheduleCartUpdate();
  }

  function forceRerender() {
    clearInjected();
    initialScan();
    scheduleCartUpdate();
  }

  function registerMenu() {
    GM_registerMenuCommand('设置：额外显示的地区', showRegionPicker);
    GM_registerMenuCommand(`切换：显示地区缩写（当前：${getShowRegionCode() ? '开' : '关'}）`, toggleShowCode);
    GM_registerMenuCommand('重刷：重新渲染额外价格', forceRerender);
  }

  function cleanupLegacyDetailSiblings() {
    document.querySelectorAll('.game_purchase_action_bg .discount_prices > .sapx-extra-price').forEach(el => el.remove());
  }

  function ready(fn) {
    if (document.readyState === 'complete' || document.readyState === 'interactive') fn();
    else document.addEventListener('DOMContentLoaded', fn, { once: true });
  }

  ready(() => {
    addStyle();
    registerMenu();
    cleanupLegacyDetailSiblings();
    initialScan();
    startObserver();
    scheduleCartUpdate();
  });
})();
