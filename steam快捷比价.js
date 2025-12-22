// ==UserScript==
// @name         Steam 额外地区价格显示 (修复版)
// @namespace    https://github.com/linyaocrush/My-Tampermonkey-script
// @version      0.2.6
// @description  商店价格旁追加目标地区实际价格；修复详情页购买框重叠问题；更强鲁棒性
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
      .sapx-extra-price { margin-left: 6px; font-size: 0.85em; opacity: 0.9; white-space: nowrap; pointer-events: none; color: #a3d200; }
      strike .sapx-extra-price, .discount_original_price .sapx-extra-price { opacity: 0.7; font-size: 0.85em; color: inherit; text-decoration: line-through; }
      
      #sapx-cart-summary { margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,.08); color: #c6d4df; font-size: 12px; line-height: 1.4; }
      #sapx-cart-summary .sapx-row { display: flex; justify-content: space-between; gap: 8px; align-items: baseline; }
      #sapx-cart-summary .sapx-value { font-weight: 700; white-space: nowrap; }

      /* 详情页购买框修复 */
      .game_purchase_action_bg .discount_block.game_purchase_discount { 
          height: auto !important; 
          min-height: 40px !important; 
          padding-bottom: 8px !important; 
          display: flex !important; 
          align-items: center !important;
      }
      .game_purchase_action_bg .discount_block.game_purchase_discount .discount_prices { 
          display: flex !important; 
          flex-direction: column !important; 
          justify-content: center !important; 
          align-items: flex-start !important;
          background: none !important;
          padding: 4px 8px !important;
      }
      .game_purchase_action_bg .discount_prices > div { 
          display: flex !important; 
          align-items: baseline !important; 
          gap: 6px !important; 
          line-height: 1.4 !important;
          height: auto !important;
      }
      .game_purchase_action_bg .sapx-price-label { 
          font-size: 11px; 
          opacity: 0.6; 
          min-width: 32px; 
          display: inline-block;
      }
    `;
    document.head.appendChild(style);
  }

  // --- API & Cache Logic (保持不变) ---
  function gmGet(url) {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: 'GET', url, timeout: 20000,
        onload: (res) => {
          if ((res.status >= 200 && res.status < 300) || (res.status === 0 && res.responseText)) resolve(res.responseText);
          else reject(new Error(`HTTP ${res.status}`));
        },
        onerror: reject, ontimeout: () => reject(new Error('Timeout'))
      });
    });
  }

  class RequestQueue {
    constructor(concurrency = 4) { this.concurrency = concurrency; this.running = 0; this.queue = []; }
    enqueue(task) { return new Promise((resolve, reject) => { this.queue.push({ task, resolve, reject }); this._deq(); }); }
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
  const priceCache = new Map();
  const CACHE_TTL_MS = 5 * 60 * 1000;

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
        return digits ? parseInt(digits, 10) : null;
    }
    const lastDot = s.lastIndexOf('.');
    const lastComma = s.lastIndexOf(',');
    let decSep = (lastDot > lastComma) ? '.' : (lastComma >= 0 ? ',' : null);
    let parts = decSep ? s.split(decSep) : [s];
    let fracPart = decSep ? parts.pop() : '';
    let intPart = parts.join('').replace(/\D/g, '') || '0';
    fracPart = (fracPart.replace(/\D/g, '') + '000').slice(0, fd);
    return parseInt(intPart, 10) * Math.pow(10, fd) + parseInt(fracPart, 10);
  }

  function normalizePrice({ currency, final, initial, finalFormatted, initialFormatted, discountPercent }) {
    return { ok: !!(finalFormatted || initialFormatted), currency, final, initial, finalFormatted, initialFormatted, discountPercent };
  }

  async function getAppPrice(appid, cc, currencyFallback) {
    try {
        const text = await requestQueue.enqueue(() => gmGet(`https://store.steampowered.com/api/appdetails?appids=${appid}&cc=${cc}&filters=price_overview,is_free`));
        const data = JSON.parse(text)?.[appid]?.data;
        if (!data) return null;
        if (data.is_free) return normalizePrice({ currency: currencyFallback, final: 0, initial: 0, finalFormatted: 'Free', initialFormatted: 'Free' });
        const po = data.price_overview;
        return po ? normalizePrice({ currency: po.currency, final: po.final, initial: po.initial, finalFormatted: po.final_formatted, initialFormatted: po.initial_formatted || po.final_formatted }) : null;
    } catch { return null; }
  }

  async function getPackagePrice(packageid, cc, currencyFallback) {
    try {
        const text = await requestQueue.enqueue(() => gmGet(`https://store.steampowered.com/api/packagedetails?packageids=${packageid}&cc=${cc}`));
        const p = JSON.parse(text)?.[packageid]?.data?.price;
        return p ? normalizePrice({ currency: p.currency, final: p.final, initial: p.initial, finalFormatted: p.final_formatted, initialFormatted: p.initial_formatted }) : null;
    } catch { return null; }
  }

  async function getBundlePrice(bundleid, cc, currencyFallback) {
    try {
        const html = await requestQueue.enqueue(() => gmGet(`https://store.steampowered.com/bundle/${bundleid}/?cc=${cc}&l=english`));
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const finalEl = doc.querySelector('.discount_final_price') || doc.querySelector('.game_purchase_price');
        if (!finalEl) return null;
        const finalFormatted = finalEl.textContent.trim();
        return normalizePrice({ currency: currencyFallback, final: parseFormattedToMinor(finalFormatted, currencyFallback), finalFormatted, initialFormatted: finalFormatted });
    } catch { return null; }
  }

  async function getPriceForItem(item, region) {
    const cacheKey = `${item.type}:${item.id}:${region.id}`;
    if (priceCache.has(cacheKey)) {
        const v = priceCache.get(cacheKey);
        if (Date.now() - v.ts < CACHE_TTL_MS) return v.val;
    }
    for (const cc of region.ccCandidates) {
        let res = null;
        if (item.type === 'app') res = await getAppPrice(item.id, cc, region.currency);
        else if (item.type === 'package') res = await getPackagePrice(item.id, cc, region.currency);
        else if (item.type === 'bundle') res = await getBundlePrice(item.id, cc, region.currency);
        if (res) { priceCache.set(cacheKey, { ts: Date.now(), val: res }); return res; }
    }
    return null;
  }

  // --- DOM Logic ---
  function inferItemFromScope(el) {
    const holder = el.closest('[data-ds-appid],[data-ds-packageid],[data-ds-bundleid]');
    if (holder) {
        if (holder.dataset.dsPackageid) return { type: 'package', id: holder.dataset.dsPackageid.split(',')[0] };
        if (holder.dataset.dsBundleid) return { type: 'bundle', id: holder.dataset.dsBundleid };
        if (holder.dataset.dsAppid) return { type: 'app', id: holder.dataset.dsAppid.split(',')[0] };
    }
    const href = el.closest('a')?.href || '';
    let m = href.match(/\/app\/(\d+)/); if (m) return { type: 'app', id: m[1] };
    m = href.match(/\/sub\/(\d+)/); if (m) return { type: 'package', id: m[1] };
    m = href.match(/\/bundle\/(\d+)/); if (m) return { type: 'bundle', id: m[1] };
    const p = location.pathname;
    m = p.match(/^\/app\/(\d+)/); if (m) return { type: 'app', id: m[1] };
    m = p.match(/^\/sub\/(\d+)/); if (m) return { type: 'package', id: m[1] };
    return null;
  }

  async function enhancePriceElement(priceEl) {
    if (!priceEl || priceEl.classList.contains(EXTRA_CLASS)) return;
    
    // 过滤：如果是纯百分比（如 -20%）则跳过，防止重叠
    const txt = priceEl.textContent.trim();
    if (/^-\d+%$/.test(txt)) return;
    // 过滤：隐藏元素跳过
    if (priceEl.offsetWidth === 0) return;

    const region = getTargetRegion();
    if (priceEl.querySelector(`.${EXTRA_CLASS}[${MARK_ATTR}="${region.id}"]`)) return;

    const item = inferItemFromScope(priceEl);
    if (!item) return;

    const price = await getPriceForItem(item, region);
    if (!price) return;

    const isInitial = priceEl.classList.contains('discount_original_price') || priceEl.tagName === 'STRIKE';
    const formatted = isInitial ? price.initialFormatted : price.finalFormatted;
    if (!formatted) return;

    // 详情页特殊处理标签
    const buyBox = priceEl.closest('.game_purchase_discount');
    if (buyBox) {
        let label = priceEl.querySelector('.' + DETAIL_LABEL_CLASS);
        if (!label) {
            label = document.createElement('span');
            label.className = DETAIL_LABEL_CLASS;
            priceEl.prepend(label);
        }
        label.textContent = isInitial ? '原价' : '现价';
    }

    let span = priceEl.querySelector('.' + EXTRA_CLASS);
    if (!span) {
        span = document.createElement('span');
        span.className = EXTRA_CLASS;
        priceEl.appendChild(span);
    }
    span.setAttribute(MARK_ATTR, region.id);
    span.textContent = getShowRegionCode() ? `(${region.short} ${formatted})` : `(${formatted})`;
  }

  // --- Observer & Initial ---
  const SELECTORS = '.discount_final_price, .discount_original_price, strike, .game_purchase_price, .cart_item_price .price';
  
  function scan(root = document) {
    root.querySelectorAll(SELECTORS).forEach(el => enhancePriceElement(el));
    if (isCartPage()) updateCart();
  }

  async function updateCart() {
    // 购物车逻辑简化，主要复用 enhancePriceElement
    document.querySelectorAll('.cart_item_row').forEach(row => {
        const p = row.querySelector('.cart_item_price .price, .discount_final_price');
        if (p) enhancePriceElement(p);
    });
  }

  let timer = null;
  const observer = new MutationObserver(() => {
    clearTimeout(timer);
    timer = setTimeout(() => scan(), 500);
  });

  function init() {
    addStyle();
    GM_registerMenuCommand('设置地区', () => {
        const i = prompt(REGIONS.map((r,idx)=>`${idx+1}. ${r.label}`).join('\n') + '\n请输入序号:');
        if (i && REGIONS[i-1]) { GM_setValue(STORAGE_KEY_REGION_ID, REGIONS[i-1].id); location.reload(); }
    });
    GM_registerMenuCommand('切换代码显示', () => { GM_setValue(STORAGE_KEY_SHOW_CODE, !getShowRegionCode()); location.reload(); });
    
    scan();
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
