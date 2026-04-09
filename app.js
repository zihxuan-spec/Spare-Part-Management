// 1. 初始化與環境設定
const supabaseUrl = 'https://gvsglqvfkgfdymcntldb.supabase.co';
const supabaseKey = 'sb_publishable_s5grpgB4G9GP1gF9_YIcqw_f9cz-ZB7';
const supaClient = supabase.createClient(supabaseUrl, supabaseKey, {
    auth: { storage: window.sessionStorage }
});
const VIRTUAL_DOMAIN = "@sunlit-wms.com";

let currentLang = 'en', currentTxType = 'receive';
let currentUserDisplayName = "", currentUserName = "", currentUserDept = "";
let curPageInv = 1, curPageMaster = 1;
const pageSize = 50;
let sortCol = '', sortAsc = true, currentFilter = 'all';
let logoutTimer;
const AUTO_LOGOUT_TIME = 30 * 60 * 1000; 

// 翻譯字庫
const i18n = {
    en: { tab_inv: "Inventory", tab_dash: "Dashboard", tab_master: "Master Data", btn_refresh: "Refresh", btn_po: "Goods Receipt", btn_issue: "Goods Issue", btn_create: "Create Material", col_pn: "Part Number", col_model: "Model", col_desc: "Description", col_loc: "Loc", col_stock: "Stock", col_unit: "Unit", lbl_ref: "PO Number/Reference", lbl_user: "User", lbl_date: "Date", lbl_qty: "Qty", lbl_safe: "Safety Stock", btn_add_line: "Add Line", btn_cancel: "Cancel", btn_post: "Post", btn_save: "Save", btn_close: "Close", btn_ok: "OK", card_crit: "Critical Stock", sub_crit: "Items Out of Stock", card_low: "Low Stock", sub_low: "Below Safety Level", card_total: "Total Items", sub_total: "Active SKU Count", card_hist: "Recent Movements", modal_detail: "Details", txt_display: "Display", btn_logout: "Logout", btn_pwd: "Pwd", lbl_account: "Username", lbl_password: "Password", lbl_name: "Display Name", btn_signin: "Sign In", btn_signup: "Sign Up", btn_change: "Change", txt_new_user: "New User?", link_register: "Register Here", modal_reg_title: "Register Account", modal_cp_title: "Change Password", lbl_old_pass: "Old Password", lbl_new_pass: "New Password", lbl_confirm_pass: "Confirm New", msg_reg_success: "Register Success! Please Login.", msg_pass_changed: "Password Changed! Please login again.", msg_pass_mismatch: "Passwords do not match", msg_fill_all: "All fields required", confirm_post_title: "Post Confirmation", confirm_post_body: "Are you sure you want to post these transactions?", confirm_delete: "Delete this master data?", deleted: "Deleted!", msg_input_required: "Input Required", msg_input_empty: "Please fill in PO/Reference and User field.", txt_page: "Page", txt_of: "of", msg_unknown_title: "Unknown Part", msg_unknown_body: "Part not found in Master Data.", ph_search: "Search / Scan...", title_scan: "Scan Barcode", msg_scan_ok: "Scanned: ", err_cam_title: "Camera Error", err_cam_msg: "Cannot access camera. Please check permissions.", modal_scan: "📷 Scan Barcode / QR Code", lbl_dept: "Department", sel_dept: "Select Dept...", msg_sel_dept: "Please assign a department.", opt_all_dept: "All Depts", card_today_in: "Today's Receipts", card_today_out: "Today's Issues", chart_health: "Inventory Health", chart_trend: "7-Day Movement Trend", card_top5: "🔥 Top 5 Moving (30d)", card_dead: "💤 Dead Stock Warning" },
    zh: { tab_inv: "庫存列表", tab_dash: "管理看板", tab_master: "物料主檔", btn_refresh: "刷新", btn_po: "收貨入庫", btn_issue: "發貨領料", btn_create: "建立物料", col_pn: "料號", col_model: "型號", col_desc: "品名描述", col_loc: "儲位", col_stock: "庫存", col_unit: "單位", lbl_ref: "採購單號/用途", lbl_user: "操作人員", lbl_date: "日期", lbl_qty: "數量", lbl_safe: "安全庫存", btn_add_line: "新增項目", btn_cancel: "取消", btn_post: "過帳", btn_save: "儲存", btn_close: "關閉", btn_ok: "確定", card_crit: "缺料警告", sub_crit: "庫存為 0", card_low: "低庫存", sub_low: "低於安全水位", card_total: "物料總數", sub_total: "系統內 SKU", card_hist: "最近異動", modal_detail: "詳細資訊", txt_display: "查看", btn_logout: "登出", btn_pwd: "密碼", lbl_account: "帳號", lbl_password: "密碼", lbl_name: "顯示名稱", btn_signin: "登入", btn_signup: "註冊", btn_change: "修改", txt_new_user: "還沒帳號?", link_register: "點此註冊", modal_reg_title: "註冊帳號", modal_cp_title: "修改密碼", lbl_old_pass: "舊密碼", lbl_new_pass: "新密碼", lbl_confirm_pass: "確認新密碼", msg_reg_success: "註冊成功！請登入。", msg_pass_changed: "密碼已修改！請重新登入。", msg_pass_mismatch: "新密碼不一致", msg_fill_all: "請填寫所有欄位", confirm_post_title: "過帳確認", confirm_post_body: "您確定要提交這些異動資料嗎？", confirm_delete: "確定要刪除此物料主檔嗎？", deleted: "已刪除！", msg_input_required: "欄位必填", msg_input_empty: "請填寫單號/用途與操作人員欄位。", txt_page: "第", txt_of: "頁 / 共", msg_unknown_title: "未知料號", msg_unknown_body: "在系統主檔中找不到此料號。", ph_search: "搜尋 / 掃描...", title_scan: "掃描條碼", msg_scan_ok: "成功掃描: ", err_cam_title: "相機錯誤", err_cam_msg: "無法啟動相機，請確認是否給予權限。", modal_scan: "📷 掃描條碼 / QR Code", lbl_dept: "所屬部門", sel_dept: "請選擇部門...", msg_sel_dept: "請選擇該物料所屬部門", opt_all_dept: "全公司 (All)", card_today_in: "今日入庫單數", card_today_out: "今日領料單數", chart_health: "庫存健康度", chart_trend: "近 7 天進出庫趨勢", card_top5: "🔥 高消耗排行榜 (30天)", card_dead: "💤 呆滯料預警 (30天未動)" }
};

function getTrans(key) { return i18n[currentLang][key] || key; }

document.addEventListener("DOMContentLoaded", () => {
    if ('serviceWorker' in navigator) { navigator.serviceWorker.register('sw.js').catch(err => console.log('SW error', err)); }
    checkAutoLogin();
});

// 2. Auth 安全管理層
async function doLogin() {
    const user = document.getElementById('loginUser').value.trim(), pass = document.getElementById('loginPass').value.trim(), fb = document.getElementById('loginFeedback'), btn = document.getElementById('btnLogin'); 
    if(!user || !pass) { fb.style.color = "#bb0000"; fb.innerText = "Please enter username and password"; return; }
    btn.innerText = "Connecting..."; btn.disabled = true; setLoading(true); 
    const { data: authData, error: authErr } = await supaClient.auth.signInWithPassword({ email: user + VIRTUAL_DOMAIN, password: pass });
    if(authErr) { setLoading(false); fb.style.color = "#bb0000"; fb.innerText = "Invalid Credentials"; btn.innerText = getTrans('btn_signin'); btn.disabled = false; return; }
    const { data: profile } = await supaClient.from('profiles').select('name, department').eq('id', authData.user.id).single();
    setLoading(false); if(profile) { fb.innerText = "Success!"; applyLoginState(profile.name, user, profile.department); }
}

async function checkAutoLogin() {
    const lastActive = sessionStorage.getItem('wms_last_active');
    if (lastActive && (Date.now() - parseInt(lastActive) > AUTO_LOGOUT_TIME)) { await supaClient.auth.signOut(); sessionStorage.removeItem('wms_last_active'); return; }
    const { data: { session } } = await supaClient.auth.getSession();
    if (session) {
        const { data: p } = await supaClient.from('profiles').select('username, name, department').eq('id', session.user.id).single();
        if(p) applyLoginState(p.name, p.username, p.department); else doLogout();
    }
}

function applyLoginState(name, uid, dept) {
    currentUserDisplayName = name; currentUserName = uid; currentUserDept = dept;
    document.getElementById('loginOverlay').style.display = 'none';
    if (dept === "Pending") { document.getElementById('pendingOverlay').style.display = 'flex'; return; }
    document.getElementById('pendingOverlay').style.display = 'none'; 
    document.getElementById('logoutBtn').style.display = 'block'; 
    document.getElementById('changePassBtn').style.display = 'block'; 
    document.getElementById('userInfoDisplay').innerText = `${name} (${dept})`;

    if (dept === 'Admin') {
        document.getElementById('tabMaster').style.display = 'block';
        document.getElementById('adminGlobalDept').style.display = 'block';
    } else {
        document.getElementById('tabMaster').style.display = 'none';
        document.getElementById('adminGlobalDept').style.display = 'none';
        if (document.getElementById('tabMaster').classList.contains('active')) switchView('dashboard');
    }

    setupRealtime(); fetchData(); 
    resetLogoutTimer();
}

async function doLogout() { await supaClient.auth.signOut(); sessionStorage.removeItem('wms_last_active'); location.reload(); }
function clearLoginError() { document.getElementById('loginFeedback').innerText = ""; const btn = document.getElementById('btnLogin'); if(btn.disabled) { btn.disabled = false; btn.innerText = getTrans('btn_signin'); } }
function resetLogoutTimer() { if (!currentUserName) return; sessionStorage.setItem('wms_last_active', Date.now()); clearTimeout(logoutTimer); logoutTimer = setTimeout(() => { showMsg(currentLang === 'zh' ? "自動登出" : "Auto Logout", currentLang === 'zh' ? "閒置過久，系統已自動登出保護您的資料。" : "Session timed out due to inactivity."); setTimeout(doLogout, 2500); }, AUTO_LOGOUT_TIME); }
['mousemove', 'keydown', 'click', 'touchstart'].forEach(evt => { document.addEventListener(evt, resetLogoutTimer); });

async function doRegister() {
    const u = document.getElementById('regUser').value.trim(), p = document.getElementById('regPass').value.trim(), n = document.getElementById('regName').value.trim();
    if(!u || !p || !n) { showToast(getTrans('msg_fill_all'), true); return; }
    if(p.length < 6) { showToast("Password minimum 6 characters", true); return; } 
    setLoading(true); const { data, error } = await supaClient.auth.signUp({ email: u + VIRTUAL_DOMAIN, password: p, options: { data: { username: u, name: n } } }); setLoading(false);
    if(!error) { await supaClient.auth.signOut(); closeModal('registerModal'); showMsg("Registration Sent", currentLang === 'en' ? "Registration sent! Your account is 'Pending'." : "申請已送出！您的帳號目前為 '待審核' 狀態。"); } else { showMsg("Error", error.message); }
}

async function doChangePass() {
    const newP = document.getElementById('cpNew').value.trim(), confP = document.getElementById('cpConfirm').value.trim();
    if(!newP || !confP) { showToast(getTrans('msg_fill_all'), true); return; } if(newP !== confP) { showToast(getTrans('msg_pass_mismatch'), true); return; } if(newP.length < 6) { showToast("Password minimum 6 characters", true); return; }
    setLoading(true); const { error } = await supaClient.auth.updateUser({ password: newP }); setLoading(false);
    if(!error) { showToast(getTrans('msg_pass_changed')); closeModal('changePassModal'); setTimeout(() => { doLogout(); }, 1500); } else { showMsg("Error", error.message); }
}

function openRegister() { ['regUser','regPass','regName'].forEach(id => { if(document.getElementById(id)) document.getElementById(id).value = ""; }); openModal('registerModal'); }
function openChangePass() { ['cpOld','cpNew','cpConfirm'].forEach(id => { if(document.getElementById(id)) document.getElementById(id).value = ""; }); openModal('changePassModal'); }

// 3. Server-Side 大數據與即時監聽 
function getTargetDept() {
    return currentUserDept === 'Admin' ? document.getElementById('adminGlobalDept').value : currentUserDept;
}

function setupRealtime() {
    supaClient.channel('wms-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' }, payload => { showToast('🔄 庫存有異動，即時更新中...'); fetchDashboardStats(); fetchInventoryServerSide(); })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'history' }, payload => { fetchDashboardStats(); })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'master' }, payload => { fetchMasterServerSide(); })
        .subscribe();
}

function fetchData() { fetchDashboardStats(); fetchInventoryServerSide(true); fetchMasterServerSide(true); }

let healthChartInstance = null;
let trendChartInstance = null;

async function fetchDashboardStats() {
    const target = getTargetDept();
    
    // 1. 抓取庫存狀態
    let qInv = supaClient.from('view_inventory').select('*');
    if (target !== 'All' && target !== 'Admin') qInv = qInv.eq('department', target);
    const { data: invData } = await qInv;
    
    let critCount = 0, lowCount = 0, safeCount = 0;
    const invMap = {};
    (invData || []).forEach(i => {
        invMap[i.part_number] = i;
        if (i.is_critical) critCount++;
        else if (i.is_low) lowCount++;
        else if (i.stock > 0) safeCount++;
    });

    document.getElementById('dashCrit').innerText = critCount;
    document.getElementById('dashLow').innerText = lowCount;
    document.getElementById('dashTotal').innerText = invData ? invData.length : 0; // 🔥 補上總物料數

    // 2. 抓取最近 30 天歷史紀錄
    const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30); thirtyDaysAgo.setHours(0,0,0,0);
    let qHist = supaClient.from('history').select('*').gte('timestamp', thirtyDaysAgo.toISOString()).order('timestamp', {ascending: false}).limit(1000);
    
    if (target !== 'All' && target !== 'Admin') {
        const partList = Object.keys(invMap);
        if (partList.length > 0) qHist = qHist.in('part_number', partList);
        else qHist = qHist.eq('part_number', 'NO_MATCH_DUMMY');
    }
    const { data: histData } = await qHist;

    // 3. 資料處理：今日收發、7天趨勢、Top 5、呆滯料
    const todayStr = new Date().toISOString().split('T')[0];
    let todayIn = 0, todayOut = 0;
    const trendMap = {}; 
    const moveCount = {}; 

    for(let i=6; i>=0; i--) { const d = new Date(); d.setDate(d.getDate() - i); trendMap[d.toISOString().split('T')[0]] = { in: 0, out: 0 }; }

    (histData || []).forEach(h => {
        const dateStr = h.timestamp.split('T')[0];
        const qty = Number(h.quantity), absQty = Math.abs(qty);

        if (dateStr === todayStr) {
            if (h.action.includes('In') || qty > 0) todayIn++;
            if (h.action.includes('Out') || qty < 0) todayOut++;
        }
        if (trendMap[dateStr]) {
            if (h.action.includes('In') || qty > 0) trendMap[dateStr].in += absQty;
            if (h.action.includes('Out') || qty < 0) trendMap[dateStr].out += absQty;
        }
        moveCount[h.part_number] = (moveCount[h.part_number] || 0) + absQty;
    });

    document.getElementById('dashTodayIn').innerText = todayIn;
    document.getElementById('dashTodayOut').innerText = todayOut;

    document.getElementById('dashHistory').innerHTML = (histData || []).slice(0, 20).map(h => {
        let qtyColor = h.quantity > 0 ? '#107e3e' : (h.quantity < 0 ? '#bb0000' : '#0a6ed1');
        let qtySign = h.quantity > 0 ? '+' : '';
        return `<div style="border-bottom:1px solid #eee; padding:10px 0;">
            <span style="font-weight:bold; font-size:14px; color:var(--sap-primary);">${h.part_number}</span> 
            <span style="float:right; font-size:15px; font-weight:bold; color:${qtyColor}">${qtySign}${h.quantity}</span>
            <div style="font-size:11px; color:#666; margin-top:4px;">${new Date(h.timestamp).toLocaleString()} | 👤 ${h.operator_user} | ${h.action}</div>
        </div>`;
    }).join('') || '<div style="color:#999; padding:10px;">No Data</div>';

    const top5 = Object.entries(moveCount).sort((a,b) => b[1] - a[1]).slice(0, 5);
    document.getElementById('dashTop5').innerHTML = top5.map((t, idx) => `
        <div style="border-bottom:1px solid #eee; padding:10px 0; display:flex; align-items:center;">
            <div style="width:24px; height:24px; background:#ffebeb; border-radius:50%; text-align:center; line-height:24px; font-size:12px; font-weight:bold; color:#bb0000; margin-right:10px;">${idx+1}</div>
            <div style="flex:1;"><div style="font-weight:bold; font-size:13px;">${t[0]}</div><div style="font-size:11px; color:#888;">${(invMap[t[0]] || {}).model || ''}</div></div>
            <div style="font-weight:bold; color:var(--sap-primary); font-size:14px;">${t[1]} <span style="font-size:10px;font-weight:normal;color:#888;">Mvmt</span></div>
        </div>
    `).join('') || '<div style="color:#999; padding:10px;">No Movements</div>';

    const deadList = Object.values(invMap).filter(i => i.stock > 0 && !moveCount[i.part_number]).sort((a,b) => b.stock - a.stock).slice(0, 10);
    document.getElementById('dashDead').innerHTML = deadList.map(d => `
        <div style="border-bottom:1px solid #eee; padding:10px 0;">
            <span style="font-weight:bold; font-size:13px; color:#555;">${d.part_number}</span>
            <span style="float:right; font-weight:bold; color:#e9730c; font-size:13px;">Stock: ${d.stock}</span>
            <div style="font-size:11px; color:#888; margin-top:4px;">${d.model || '-'} | Loc: <span style="background:#f0f0f0;padding:2px 4px;border-radius:3px;">${d.location || 'N/A'}</span></div>
        </div>
    `).join('') || '<div style="color:#107e3e; padding:10px; font-weight:bold;">✅ All stock is moving actively!</div>';

    updateCharts(critCount, lowCount, safeCount, trendMap);
}

function updateCharts(crit, low, safe, trendMap) {
    const ctxHealth = document.getElementById('chartHealth').getContext('2d');
    const ctxTrend = document.getElementById('chartTrend').getContext('2d');

    if(healthChartInstance) healthChartInstance.destroy();
    if(trendChartInstance) trendChartInstance.destroy();

    healthChartInstance = new Chart(ctxHealth, {
        type: 'doughnut',
        data: {
            labels: [i18n[currentLang].card_crit, i18n[currentLang].card_low, 'Safe Stock'],
            datasets: [{ data: [crit, low, safe], backgroundColor: ['#bb0000', '#e9730c', '#107e3e'], borderWidth: 0 }]
        },
        options: { responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { position: 'right', labels:{boxWidth:12, font:{size:11}} } } }
    });

    const labels = Object.keys(trendMap).map(d => d.slice(5)); 
    const dataIn = Object.values(trendMap).map(v => v.in);
    const dataOut = Object.values(trendMap).map(v => v.out);

    trendChartInstance = new Chart(ctxTrend, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                { label: 'Receipts (In)', data: dataIn, backgroundColor: '#107e3e', borderRadius: 3 },
                { label: 'Issues (Out)', data: dataOut, backgroundColor: '#0a6ed1', borderRadius: 3 }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top', labels:{boxWidth:12, font:{size:11}} } }, scales: { x: { grid: { display: false } }, y: { border: { display: false }, ticks: { precision: 0 } } } }
    });
}

async function fetchInventoryServerSide(resetPage = false) {
    if(resetPage) curPageInv = 1; setLoading(true);
    try {
        let query = supaClient.from('view_inventory').select('*', { count: 'exact' });
        const target = getTargetDept();
        if (target !== 'All' && target !== 'Admin') query = query.eq('department', target);

        const term = document.getElementById('searchInv').value.trim();
        if(term) query = query.or(`part_number.ilike.%${term}%,model.ilike.%${term}%,description.ilike.%${term}%`);
        if (currentFilter === 'crit') query = query.eq('is_critical', true);
        if (currentFilter === 'low') query = query.eq('is_low', true);
        if (sortCol) query = query.order(sortCol, { ascending: sortAsc }); else query = query.order('part_number', { ascending: true });
        
        const start = (curPageInv - 1) * pageSize;
        query = query.range(start, start + pageSize - 1);

        const { data, count, error } = await query;
        if (error) throw error;
        renderTableHTML(data || [], count || 0);
    } catch(e) { console.error(e); } finally { setLoading(false); }
}

async function fetchMasterServerSide(resetPage = false) {
    if(resetPage) curPageMaster = 1; setLoading(true);
    try {
        let query = supaClient.from('master').select('*', { count: 'exact' });
        const target = getTargetDept();
        if (target !== 'All' && target !== 'Admin') query = query.eq('department', target);

        const term = document.getElementById('searchMaster').value.trim();
        if(term) query = query.or(`part_number.ilike.%${term}%,model.ilike.%${term}%,description.ilike.%${term}%`);
        
        const start = (curPageMaster - 1) * pageSize;
        query = query.range(start, start + pageSize - 1).order('part_number', { ascending: true });
        
        const { data, count, error } = await query;
        if(error) throw error;
        renderMasterTableHTML(data || [], count || 0);
    } catch(e) { console.error(e); } finally { setLoading(false); }
}

// 4. UI 渲染層 
function renderTableHTML(dataList, totalCount) {
    const tbody = document.getElementById('inventoryBody'); tbody.innerHTML = '';
    const totalPages = Math.ceil(totalCount / pageSize) || 1;
    updateSortIcons();

    dataList.forEach((item) => {
        let statusClass = item.is_critical ? 'status-crit' : item.is_low ? 'status-low' : 'status-ok'; 
        const tr = document.createElement('tr'); tr.onclick = () => openDetailsObj(item);
        tr.innerHTML = `<td class="col-status"><span class="status-dot ${statusClass}"></span></td><td class="col-pn"><div style="font-size:14px;">${item.part_number}</div><div class="mobile-info"><div class="mobile-model">${item.model}</div><div class="mobile-desc">${item.description}</div></div></td><td class="col-model desktop-only">${item.model}</td><td class="col-desc desktop-only" style="color:#666; font-size:13px;">${item.description}</td><td class="col-loc"><span>${item.location||'-'}</span></td><td class="col-stock">${item.stock}</td><td class="col-unit desktop-only" style="color:#666; font-size:12px;">${item.unit}</td><td class="col-action" style="text-align:center;"><span style="color:#0a6ed1; font-weight:bold; font-size:12px;">${i18n[currentLang].txt_display}</span></td>`;
        tbody.appendChild(tr);
    });
    updatePagination('invPagination', curPageInv, totalPages, totalCount, 'changePage');
}

function renderMasterTableHTML(dataList, totalCount) {
    const tbody = document.getElementById('masterBody'); tbody.innerHTML = '';
    const totalPages = Math.ceil(totalCount / pageSize) || 1;

    dataList.forEach((item) => {
        const tr = document.createElement('tr'); 
        tr.onclick = async () => {
            const { data: invData } = await supaClient.from('inventory').select('*').eq('part_number', item.part_number).maybeSingle();
            openDetailsObj({ ...item, stock: invData ? invData.stock : 0, location: invData ? invData.location : '' }); 
        };
        tr.innerHTML = `<td class="col-pn"><div style="font-size:14px;">${item.part_number}</div><div class="mobile-info"><div class="mobile-model">${item.model}</div><div class="mobile-desc">${item.description}</div></div></td><td class="col-model desktop-only">${item.model}</td><td class="col-desc desktop-only" style="color:#666; font-size:13px;">${item.description}</td><td class="col-unit">${item.unit}</td><td class="col-stock desktop-only">${item.main_stock}</td><td class="col-action" id="action-${item.part_number}"></td>`;
        tbody.appendChild(tr);

        const td = document.getElementById(`action-${item.part_number}`);
        const btnDel = document.createElement('span'); btnDel.className = 'btn-delete'; btnDel.innerText = '✕';
        btnDel.onclick = async (e) => {
            e.stopPropagation(); 
            const { data: chk } = await supaClient.from('inventory').select('stock').eq('part_number', item.part_number).maybeSingle();
            if (chk && chk.stock > 0) { showMsg(currentLang === 'zh' ? "無法刪除" : "Cannot Delete", currentLang === 'zh' ? `料號尚有庫存 (${chk.stock})。` : `Part still has stock.`); return; }
            deleteMaster(item.part_number);
        }; td.appendChild(btnDel);
    });
    updatePagination('masterPagination', curPageMaster, totalPages, totalCount, 'changeMasterPage');
}

async function openDetailsObj(item) {
    document.getElementById('detId').innerText = item.part_number; 
    document.getElementById('detModel').innerText = item.model; 
    document.getElementById('detDesc').innerText = item.description; 
    document.getElementById('detStock').innerText = item.stock; 
    
    const safeLoc = item.location ? item.location.replace(/'/g, "\\'") : "";
    document.getElementById('detLoc').innerHTML = `
        <span style="cursor:pointer; display:inline-flex; align-items:center; gap:4px; transition:0.2s;" 
              onmouseover="this.style.opacity=0.7" onmouseout="this.style.opacity=1" 
              onclick="editLocationInline('${item.part_number}', ${item.stock}, '${safeLoc}')" 
              title="${currentLang === 'zh' ? '點擊修改儲位' : 'Click to edit location'}">
              ${item.location || "None"} <span style="font-size:12px; opacity:0.8;">✏️</span>
        </span>`;

    const { data: hList } = await supaClient.from('history').select('*').eq('part_number', item.part_number).order('timestamp', { ascending: false }).limit(20);
    document.getElementById('detHistory').innerHTML = hList && hList.length ? hList.map(h => {
        let qtyColor = h.quantity > 0 ? '#107e3e' : (h.quantity < 0 ? '#bb0000' : '#0a6ed1');
        let qtySign = h.quantity > 0 ? '+' : '';
        return `<div style="border-bottom:1px solid #eee; padding:8px 0;"><div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;"><span style="font-weight:600; font-size:13px; color:#333;">${h.action} <span style="color:${qtyColor}">(${qtySign}${h.quantity})</span></span><span style="font-size:11px; color:#888;">${new Date(h.timestamp).toLocaleDateString()}</span></div><div style="display:flex; justify-content:space-between; font-size:12px; color:#666;"><span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:180px;">📄 ${h.reference || '-'}</span><span>👤 ${h.operator_user}</span></div></div>`;
    }).join('') : '<div style="text-align:center; padding:10px; color:#999;">No History</div>';
    
    openModal('detailsModal');
}

// 5. 交易層與其他工具
async function resolvePart(input) {
    const id = input.value.trim();
    // 使用 closest('tr') 不管包了幾層 div，都能精準找到這筆資料的「那一行」
    const row = input.closest('tr'); 
    if (!row) return;

    const infoInput = row.querySelector('.tx-info');
    const locInput = row.querySelector('.tx-loc');
    
    if(infoInput) infoInput.value = ""; 
    if(locInput) locInput.value = ""; 
    if (!id) return;

    const { data } = await supaClient.from('view_inventory').select('*').eq('part_number', id).maybeSingle();
    if(data) {
        if(infoInput) infoInput.value = data.description || data.model;
        if(currentTxType === 'receive' || currentTxType === 'issue') {
            if(locInput) locInput.value = data.location || "";
        }
    } else if (currentTxType === 'receive') {
        const { data: mData } = await supaClient.from('master').select('*').eq('part_number', id).maybeSingle();
        if(mData) {
            if(infoInput) infoInput.value = mData.description || mData.model;
        } else { 
            showMsg(i18n[currentLang].msg_unknown_title, i18n[currentLang].msg_unknown_body); 
            input.value = ""; 
        }
    }
}

async function executeSubmit(items) {
    const ref = document.getElementById('txRef').value, displayUser = document.getElementById('txUser').value;
    if(items.length === 0) return; setLoading(true);
    try {
        const { error } = await supaClient.rpc('process_transaction', { tx_type: currentTxType, tx_ref: ref, tx_user: displayUser, tx_items: items });
        if (error) throw error;
        closeModal('txModal'); showToast("Transaction Posted!");
    } catch(e) { showMsg("Transaction Failed", e.message || "Unknown Error"); } finally { setLoading(false); }
}

async function exportToExcel(type) {
    setLoading(true);
    try {
        let data = [], filename = "";
        const target = getTargetDept();
        
        if (type === 'inventory') {
            let query = supaClient.from('view_inventory').select('*');
            if (target !== 'All' && target !== 'Admin') query = query.eq('department', target);
            const { data: dbData } = await query;
            data = dbData.map(i => ({ "Part Number": i.part_number, "Model": i.model, "Description": i.description, "Location": i.location, "Stock": i.stock, "Unit": i.unit, "Main Stock": i.main_stock }));
            filename = "Inventory_List.xlsx";
        } else {
            let query = supaClient.from('master').select('*');
            if (target !== 'All' && target !== 'Admin') query = query.eq('department', target);
            const { data: dbData } = await query;
            data = dbData.map(k => ({ "Part Number": k.part_number, "Model": k.model, "Description": k.description, "Unit": k.unit, "Main Stock": k.main_stock }));
            filename = "Master_Data.xlsx";
        }
        if(data.length === 0) return;
        const ws = XLSX.utils.json_to_sheet(data), wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Sheet1"); XLSX.writeFile(wb, filename);
    } finally { setLoading(false); }
}

async function checkMasterExists() { 
    const id = document.getElementById('newId').value.trim();
    const fb = document.getElementById('masterFeedback');
    if(!id) { fb.innerText = ""; return; }
    const { data } = await supaClient.from('master').select('part_number').eq('part_number', id).maybeSingle();
    if(data) { fb.innerText = "⚠️ Exists"; fb.style.color = "red"; }
    else { fb.innerText = "✅ Available"; fb.style.color = "green"; }
}

function applyFilter(f) { currentFilter = f; switchView('inventory'); fetchInventoryServerSide(true); const tag = document.getElementById('filterTag'), text = document.getElementById('filterText'); if(f === 'all') tag.style.display = 'none'; else { tag.style.display = 'inline-flex'; text.innerText = f === 'crit' ? "Showing: Critical Stock" : "Showing: Low Stock"; } }
function toggleLanguage() { currentLang = currentLang === 'en' ? 'zh' : 'en'; document.querySelectorAll('[data-i18n]').forEach(el => { const k = el.getAttribute('data-i18n'); if(i18n[currentLang][k]) el.innerText = i18n[currentLang][k]; }); fetchDashboardStats(); fetchInventoryServerSide(); fetchMasterServerSide(); }
function updatePagination(eid, cur, tot, len, func) { document.getElementById(eid).innerHTML = `<button class="btn-page" onclick="${func}(-1)" ${cur === 1 ? 'disabled' : ''}>◀</button><span class="page-info">${i18n[currentLang].txt_page} ${cur} ${i18n[currentLang].txt_of} ${tot} (${len})</span><button class="btn-page" onclick="${func}(1)" ${cur === tot || tot === 0 ? 'disabled' : ''}>▶</button>`; }
function changePage(delta) { curPageInv += delta; fetchInventoryServerSide(); }
function changeMasterPage(delta) { curPageMaster += delta; fetchMasterServerSide(); }
function toggleSort(col) { sortCol === col ? sortAsc = !sortAsc : (sortCol = col, sortAsc = true); fetchInventoryServerSide(true); }
function updateSortIcons() { document.querySelectorAll('.sort-icon').forEach(el => el.innerText = ''); if (sortCol && document.getElementById(`sort-${sortCol}`)) document.getElementById(`sort-${sortCol}`).innerText = sortAsc ? '▲' : '▼'; }
function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }
function setLoading(b) { document.getElementById('loading').style.display = b?'block':'none'; document.querySelector('.table-container').style.opacity = b?0.5:1; }
function showToast(msg, err) { const t = document.getElementById('toast'); t.innerText = msg; t.style.background = err ? "#bb0000" : "#32363a"; t.style.opacity = 1; setTimeout(()=>t.style.opacity=0, 3000); }
function showMsg(title, text) { document.getElementById('msgTitle').innerText = title; document.getElementById('msgTitle').style.color = "var(--sap-critical)"; document.getElementById('msgContent').innerText = text; document.querySelector('#msgModal .btn-primary').onclick = () => closeModal('msgModal'); openModal('msgModal'); }
function switchView(v) { ['Dashboard','Inventory','Master'].forEach(x => { document.getElementById('view'+x).style.display = 'none'; document.getElementById('tab'+(x==='Dashboard'?'Dash':x==='Inventory'?'Inv':'Master')).classList.remove('active'); }); document.getElementById('view'+ (v==='dashboard'?'Dashboard':v==='inventory'?'Inventory':'Master')).style.display = 'block'; document.getElementById('tab'+ (v==='dashboard'?'Dash':v==='inventory'?'Inv':'Master')).classList.add('active'); }
function openTxModal(type) { currentTxType = type; document.getElementById('txTitle').innerText = type === 'receive' ? i18n[currentLang].btn_po : i18n[currentLang].btn_issue; document.getElementById('txDate').value = new Date().toISOString().split('T')[0]; document.getElementById('txUser').value = currentUserDisplayName; document.getElementById('txRef').value = ""; document.getElementById('txBody').innerHTML = ""; addTxRow(); openModal('txModal'); }
function submitTx() { const lang = i18n[currentLang], ref = document.getElementById('txRef').value.trim(), user = document.getElementById('txUser').value.trim(), rows = document.querySelectorAll('#txBody tr'), items = []; if (!ref || !user) { showMsg(lang.msg_input_required, lang.msg_input_empty); return; } for (let i = 0; i < rows.length; i++) { const id = rows[i].querySelector('.tx-id').value.trim(), qty = Number(rows[i].querySelector('.tx-qty').value.trim()), loc = rows[i].querySelector('.tx-loc').value.trim(); if (!id || isNaN(qty) || qty <= 0) { showMsg(lang.msg_input_required, `Row ${i + 1} invalid`); return; } if (currentTxType === 'receive' && !loc) { showMsg(lang.msg_input_required, `Row ${i + 1} needs Location`); return; } items.push({ id, qty, loc }); } document.getElementById('msgTitle').innerText = lang.confirm_post_title; document.getElementById('msgContent').innerText = lang.confirm_post_body; document.querySelector('#msgModal .btn-primary').onclick = function() { closeModal('msgModal'); executeSubmit(items); }; openModal('msgModal'); }

async function deleteMaster(id) { setLoading(true); const { error } = await supaClient.from('master').delete().eq('part_number', id); setLoading(false); if(!error) { fetchMasterServerSide(); showToast(i18n[currentLang].deleted); } else showMsg("Error", error.message); }
async function submitCreateMaster() { const id = document.getElementById('newId').value.trim(), model = document.getElementById('newModel').value, desc = document.getElementById('newDesc').value, unit = document.getElementById('newUnit').value, min = document.getElementById('newMinStock').value, dept = document.getElementById('newDept').value; if(!id) { showToast("ID Required", true); return; } if(!dept) { showToast(i18n[currentLang].msg_sel_dept, true); return; } setLoading(true); const { error } = await supaClient.from('master').insert([{ part_number: id, model, description: desc, unit, main_stock: min, department: dept }]); setLoading(false); if(!error) { fetchMasterServerSide(); closeModal('createModal'); showToast("Created!"); } else showMsg("Error", error.message); }
function openCreateMasterModal() { ['newId','newModel','newDesc','newUnit'].forEach(id => document.getElementById(id).value = ""); document.getElementById('newMinStock').value = 0; document.getElementById('newDept').value = ""; document.getElementById('newUser').value = currentUserDisplayName; document.getElementById('masterFeedback').innerText = ""; openModal('createModal'); }
function openReportModal() { const now = new Date(), y = now.getFullYear(), m = String(now.getMonth() + 1).padStart(2, '0'), d = String(now.getDate()).padStart(2, '0'); document.getElementById('rptStart').value = `${y}-${m}-01`; document.getElementById('rptEnd').value = `${y}-${m}-${d}`; openModal('reportModal'); }
async function downloadReport() { const start = document.getElementById('rptStart').value, end = document.getElementById('rptEnd').value; if(!start || !end) { showToast("Select dates!", true); return; } setLoading(true); const endDay = new Date(end); endDay.setDate(endDay.getDate() + 1); const target = getTargetDept(); let query = supaClient.from('history').select('timestamp, reference, action, part_number, quantity, operator_user, note').gte('timestamp', start).lt('timestamp', endDay.toISOString()); if (target !== 'All' && target !== 'Admin') { const { data: deptParts } = await supaClient.from('master').select('part_number').eq('department', target); const partList = deptParts ? deptParts.map(p => p.part_number) : []; if (partList.length > 0) query = query.in('part_number', partList); else query = query.eq('part_number', 'NO_MATCH_DUMMY'); } const { data, error } = await query; setLoading(false); if(error) showMsg("Error", error.message); else if(!data || data.length === 0) showMsg("No Data", "No movements found."); else { const ws = XLSX.utils.json_to_sheet(data); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Report"); XLSX.writeFile(wb, `Report_${start}_to_${end}.xlsx`); closeModal('reportModal'); } }

window.editLocationInline = function(partNumber, stock, oldLoc) {
    const locDiv = document.getElementById('detLoc');
    locDiv.innerHTML = `
        <div style="display:flex; align-items:center; gap:5px;">
            <input type="text" id="inlineLocInput" value="${oldLoc}" 
                   style="width:70px; font-size:14px; text-align:center; border:1px solid #0a6ed1; border-radius:4px; outline:none; padding:2px;">
            <span style="cursor:pointer; color:#107e3e; font-size:16px; line-height:1;" 
                  onclick="saveLocationInline('${partNumber}', ${stock}, '${oldLoc}')" title="Save">✔️</span>
            <span style="cursor:pointer; color:#bb0000; font-size:16px; line-height:1;" 
                  onclick="cancelLocationInline('${partNumber}', ${stock}, '${oldLoc}')" title="Cancel">❌</span>
        </div>`;
    document.getElementById('inlineLocInput').focus();
};

window.cancelLocationInline = function(partNumber, stock, oldLoc) {
    openDetailsObj({ part_number: partNumber, model: document.getElementById('detModel').innerText, description: document.getElementById('detDesc').innerText, stock: stock, location: oldLoc });
};

window.saveLocationInline = async function(partNumber, stock, oldLoc) {
    let newLoc = document.getElementById('inlineLocInput').value.trim();
    if (newLoc === oldLoc) { cancelLocationInline(partNumber, stock, oldLoc); return; }
    setLoading(true);
    try {
        const { data: invData } = await supaClient.from('inventory').select('stock').eq('part_number', partNumber).maybeSingle();
        if (invData) await supaClient.from('inventory').update({ location: newLoc }).eq('part_number', partNumber);
        else await supaClient.from('inventory').insert({ part_number: partNumber, location: newLoc, stock: 0 });

        await supaClient.from('history').insert({ part_number: partNumber, action: currentLang === 'zh' ? "儲位變更" : "Location Change", quantity: 0, reference: `${oldLoc || 'None'} ➔ ${newLoc || 'None'}`, operator_user: currentUserDisplayName });
        showToast(currentLang === 'zh' ? "儲位已更新！" : "Location Updated!");

        openDetailsObj({ part_number: partNumber, model: document.getElementById('detModel').innerText, description: document.getElementById('detDesc').innerText, stock: stock, location: newLoc });
    } catch (e) { showMsg("Error", e.message); cancelLocationInline(partNumber, stock, oldLoc); } finally { setLoading(false); }
};

let autocompleteTimer;
window.handleAutocomplete = function(input) {
    clearTimeout(autocompleteTimer);
    const val = input.value.trim();
    
    // 更安全的移除舊選單方式
    let existingList = input.parentNode.querySelector('.autocomplete-list');
    if (existingList) existingList.remove();
    
    if (!val) return;

    autocompleteTimer = setTimeout(async () => {
        let query = supaClient.from('master').select('part_number, model');
        const target = getTargetDept();
        // 確保只有選擇特定部門時才過濾
        if (target !== 'All' && target !== 'Admin') query = query.eq('department', target);
        
        const { data, error } = await query.or(`part_number.ilike.%${val}%,model.ilike.%${val}%`).limit(10);
        
        if (error || !data || data.length === 0) return;

        // 再次檢查，避免手速太快產生重複選單
        existingList = input.parentNode.querySelector('.autocomplete-list');
        if (existingList) existingList.remove();

        let listDiv = document.createElement('div');
        listDiv.className = 'autocomplete-list';
        
        data.forEach(item => {
            const div = document.createElement('div');
            div.className = 'autocomplete-item';
            div.innerHTML = `<strong style="color:var(--sap-primary);">${item.part_number}</strong><br><span style="color:#666;font-size:11px;">${item.model || ''}</span>`;
            div.onclick = () => { 
                input.value = item.part_number; 
                listDiv.remove(); 
                // 點擊後觸發帶出品名
                resolvePart(input); 
            };
            listDiv.appendChild(div);
        });
        
        input.parentNode.style.position = 'relative';
        input.parentNode.insertBefore(listDiv, input.nextSibling);
    }, 300);
};

document.addEventListener('click', function (e) { document.querySelectorAll('.autocomplete-list').forEach(el => { if(e.target !== el.previousElementSibling) el.remove(); }); });

let html5QrcodeScanner;
let currentScanInput = null;

window.openScanner = function(btn) {
    currentScanInput = btn.previousElementSibling; 
    openModal('scannerModal');
    
    html5QrcodeScanner = new Html5Qrcode("reader");
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };
    
    html5QrcodeScanner.start({ facingMode: "environment" }, config, 
        (decodedText) => {
            if(currentScanInput) { currentScanInput.value = decodedText; resolvePart(currentScanInput); }
            stopScanner(); showToast(i18n[currentLang].msg_scan_ok + decodedText);
        },
        (errorMessage) => { }
    ).catch(err => {
        showMsg(i18n[currentLang].err_cam_title, i18n[currentLang].err_cam_msg); closeModal('scannerModal');
    });
};

window.stopScanner = function() {
    if(html5QrcodeScanner) {
        html5QrcodeScanner.stop().then(() => { html5QrcodeScanner.clear(); closeModal('scannerModal'); }).catch(err => closeModal('scannerModal'));
    } else { closeModal('scannerModal'); }
};

window.addTxRow = function() { 
    const tr = document.createElement('tr'), isIss = currentTxType === 'issue'; 
    tr.innerHTML = `
        <td style="position:relative;">
            <div style="display:flex; align-items:center; gap:5px;">
                <input type="text" class="tx-input tx-id" style="flex:1;" onkeyup="handleAutocomplete(this)" onchange="resolvePart(this)" placeholder="${i18n[currentLang].ph_search}" autocomplete="off">
                <button class="btn-icon" onclick="openScanner(this)" title="${i18n[currentLang].title_scan}">📷</button>
            </div>
        </td>
        <td><input type="text" class="tx-input tx-info" readonly tabindex="-1"></td>
        <td><input type="number" class="tx-input tx-qty"></td>
        <td><input type="text" class="tx-input tx-loc" ${isIss?'readonly tabindex="-1"':''} style="${isIss?'background-color:#f5f5f5; color:#666;':''}"></td>
        <td style="text-align:center; cursor:pointer; color:#ccc;" onclick="this.parentElement.remove()">✕</td>`; 
    document.getElementById('txBody').appendChild(tr); 
};
