// 1. 初始化與環境設定
const supabaseUrl = 'https://gvsglqvfkgfdymcntldb.supabase.co';
const supabaseKey = 'sb_publishable_s5grpgB4G9GP1gF9_YIcqw_f9cz-ZB7';
const supaClient = supabase.createClient(supabaseUrl, supabaseKey);
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
    en: { tab_inv: "Inventory", tab_dash: "Dashboard", tab_master: "Master Data", btn_refresh: "Refresh", btn_po: "Goods Receipt", btn_issue: "Goods Issue", btn_create: "Create Material", col_pn: "Part Number", col_model: "Model", col_desc: "Description", col_loc: "Loc", col_stock: "Stock", col_unit: "Unit", lbl_ref: "PO Number/Reference", lbl_user: "User", lbl_date: "Date", lbl_qty: "Qty", lbl_safe: "Safety Stock", btn_add_line: "Add Line", btn_cancel: "Cancel", btn_post: "Post", btn_save: "Save", btn_close: "Close", btn_ok: "OK", card_crit: "Critical Stock", sub_crit: "Items Out of Stock", card_low: "Low Stock", sub_low: "Below Safety Level", card_total: "Total Items", sub_total: "Active SKU Count", card_hist: "Recent Movements", modal_detail: "Details", txt_display: "Display", btn_logout: "Logout", btn_pwd: "Pwd", lbl_account: "Username", lbl_password: "Password", lbl_name: "Display Name", btn_signin: "Sign In", btn_signup: "Sign Up", btn_change: "Change", txt_new_user: "New User?", link_register: "Register Here", modal_reg_title: "Register Account", modal_cp_title: "Change Password", lbl_old_pass: "Old Password", lbl_new_pass: "New Password", lbl_confirm_pass: "Confirm New", msg_reg_success: "Register Success! Please Login.", msg_pass_changed: "Password Changed! Please login again.", msg_pass_mismatch: "Passwords do not match", msg_fill_all: "All fields required", confirm_post_title: "Post Confirmation", confirm_post_body: "Are you sure you want to post these transactions?", confirm_delete: "Delete this master data?", deleted: "Deleted!", msg_input_required: "Input Required", msg_input_empty: "Please fill in PO/Reference and User field.", txt_page: "Page", txt_of: "of" },
    zh: { tab_inv: "庫存列表", tab_dash: "管理看板", tab_master: "物料主檔", btn_refresh: "刷新", btn_po: "收貨入庫", btn_issue: "發貨領料", btn_create: "建立物料", col_pn: "料號", col_model: "型號", col_desc: "品名描述", col_loc: "儲位", col_stock: "庫存", col_unit: "單位", lbl_ref: "採購單號/用途", lbl_user: "操作人員", lbl_date: "日期", lbl_qty: "數量", lbl_safe: "安全庫存", btn_add_line: "新增項目", btn_cancel: "取消", btn_post: "過帳", btn_save: "儲存", btn_close: "關閉", btn_ok: "確定", card_crit: "缺料警告", sub_crit: "庫存為 0", card_low: "低庫存", sub_low: "低於安全水位", card_total: "物料總數", sub_total: "系統內 SKU", card_hist: "最近異動", modal_detail: "詳細資訊", txt_display: "查看", btn_logout: "登出", btn_pwd: "密碼", lbl_account: "帳號", lbl_password: "密碼", lbl_name: "顯示名稱", btn_signin: "登入", btn_signup: "註冊", btn_change: "修改", txt_new_user: "還沒帳號?", link_register: "點此註冊", modal_reg_title: "註冊帳號", modal_cp_title: "修改密碼", lbl_old_pass: "舊密碼", lbl_new_pass: "新密碼", lbl_confirm_pass: "確認新密碼", msg_reg_success: "註冊成功！請登入。", msg_pass_changed: "密碼已修改！請重新登入。", msg_pass_mismatch: "新密碼不一致", msg_fill_all: "請填寫所有欄位", confirm_post_title: "過帳確認", confirm_post_body: "您確定要提交這些異動資料嗎？", confirm_delete: "確定要刪除此物料主檔嗎？", deleted: "已刪除！", msg_input_required: "欄位必填", msg_input_empty: "請填寫單號/用途與操作人員欄位。", txt_page: "第", txt_of: "頁 / 共" }
};

// 🔥 修復：補上遺失的翻譯函數
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
    document.getElementById('pendingOverlay').style.display = 'none'; document.getElementById('logoutBtn').style.display = 'block'; document.getElementById('changePassBtn').style.display = 'block'; document.getElementById('userInfoDisplay').innerText = `${name} (${dept})`;
    setupRealtime(); fetchData(); 
}

async function doLogout() { await supaClient.auth.signOut(); location.reload(); }
function clearLoginError() { document.getElementById('loginFeedback').innerText = ""; const btn = document.getElementById('btnLogin'); if(btn.disabled) { btn.disabled = false; btn.innerText = getTrans('btn_signin'); } }

// 🔥 修復：完整的註冊與密碼修改邏輯
async function doRegister() {
    const u = document.getElementById('regUser').value.trim(), p = document.getElementById('regPass').value.trim(), n = document.getElementById('regName').value.trim();
    if(!u || !p || !n) { showToast(getTrans('msg_fill_all'), true); return; }
    if(p.length < 6) { showToast("Password minimum 6 characters", true); return; } 
    
    setLoading(true);
    const { data, error } = await supaClient.auth.signUp({
        email: u + VIRTUAL_DOMAIN, password: p, options: { data: { username: u, name: n } }
    });
    
    setLoading(false);
    if(!error) { 
        await supaClient.auth.signOut();
        closeModal('registerModal'); 
        showMsg("Registration Sent", currentLang === 'en' ? "Registration sent! Your account is 'Pending'." : "申請已送出！您的帳號目前為 '待審核' 狀態。"); 
    } 
    else { showMsg("Error", error.message); }
}

async function doChangePass() {
    const newP = document.getElementById('cpNew').value.trim();
    const confP = document.getElementById('cpConfirm').value.trim();
    
    if(!newP || !confP) { showToast(getTrans('msg_fill_all'), true); return; }
    if(newP !== confP) { showToast(getTrans('msg_pass_mismatch'), true); return; }
    if(newP.length < 6) { showToast("Password minimum 6 characters", true); return; }

    setLoading(true);
    const { error } = await supaClient.auth.updateUser({ password: newP });
    setLoading(false);

    if(!error) { 
        showToast(getTrans('msg_pass_changed')); 
        closeModal('changePassModal'); 
        setTimeout(() => { doLogout(); }, 1500); 
    } 
    else { showMsg("Error", error.message); }
}

function openRegister() { ['regUser','regPass','regName'].forEach(id => { if(document.getElementById(id)) document.getElementById(id).value = ""; }); openModal('registerModal'); }
function openChangePass() { ['cpOld','cpNew','cpConfirm'].forEach(id => { if(document.getElementById(id)) document.getElementById(id).value = ""; }); openModal('changePassModal'); }

// 3. Server-Side 大數據與即時監聽 
function setupRealtime() {
    supaClient.channel('wms-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' }, payload => {
            showToast('🔄 庫存有異動，即時更新中...'); fetchDashboardStats(); fetchInventoryServerSide();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'history' }, payload => { fetchDashboardStats(); })
        .subscribe();
}

function fetchData() { fetchDashboardStats(); fetchInventoryServerSide(true); fetchMasterServerSide(true); }

async function fetchDashboardStats() {
    const {count: critCount} = await supaClient.from('view_inventory').select('*', {count: 'exact', head: true}).eq('is_critical', true);
    const {count: lowCount}  = await supaClient.from('view_inventory').select('*', {count: 'exact', head: true}).eq('is_low', true);
    const {count: totCount}  = await supaClient.from('view_inventory').select('*', {count: 'exact', head: true});
    
    document.getElementById('dashCrit').innerText = critCount || 0;
    document.getElementById('dashLow').innerText = lowCount || 0;
    document.getElementById('dashTotal').innerText = totCount || 0;

    const {data: hist} = await supaClient.from('history').select('*').order('timestamp', {ascending: false}).limit(10);
    document.getElementById('dashHistory').innerHTML = (hist || []).map(h => `<div style="border-bottom:1px solid #eee; padding:5px 0;"><span style="font-weight:bold;">${h.part_number}</span> <span style="float:right; color:${h.quantity>0?'green':'red'}">${h.quantity>0?'+':''}${h.quantity}</span><div style="font-size:11px; color:#999;">${new Date(h.timestamp).toLocaleDateString()} - ${h.action}</div></div>`).join('');
}

async function fetchInventoryServerSide(resetPage = false) {
    if(resetPage) curPageInv = 1; setLoading(true);
    try {
        let query = supaClient.from('view_inventory').select('*', { count: 'exact' });
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
    document.getElementById('detId').innerText = item.part_number; document.getElementById('detModel').innerText = item.model; document.getElementById('detDesc').innerText = item.description; document.getElementById('detStock').innerText = item.stock; document.getElementById('detLoc').innerText = item.location || "None";
    const { data: hList } = await supaClient.from('history').select('*').eq('part_number', item.part_number).order('timestamp', { ascending: false }).limit(20);
    document.getElementById('detHistory').innerHTML = hList && hList.length ? hList.map(h => `<div style="border-bottom:1px solid #eee; padding:8px 0;"><div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;"><span style="font-weight:600; font-size:13px; color:#333;">${h.action} <span style="color:${h.quantity > 0 ? '#107e3e' : '#bb0000'}">(${h.quantity > 0 ? '+' : ''}${h.quantity})</span></span><span style="font-size:11px; color:#888;">${new Date(h.timestamp).toLocaleDateString()}</span></div><div style="display:flex; justify-content:space-between; font-size:12px; color:#666;"><span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:180px;">📄 ${h.reference || '-'}</span><span>👤 ${h.operator_user}</span></div></div>`).join('') : '<div style="text-align:center; padding:10px; color:#999;">No History</div>';
    openModal('detailsModal');
}

// 5. 交易層與其他工具
async function resolvePart(input) {
    const id = input.value.trim(), row = input.parentElement.parentElement; row.querySelector('.tx-info').value = ""; row.querySelector('.tx-loc').value = ""; if (!id) return;
    const { data } = await supaClient.from('view_inventory').select('*').eq('part_number', id).maybeSingle();
    if(data) {
        row.querySelector('.tx-info').value = data.description || data.model;
        if(currentTxType === 'receive' || currentTxType === 'issue') row.querySelector('.tx-loc').value = data.location || "";
    } else if (currentTxType === 'receive') {
        const { data: mData } = await supaClient.from('master').select('*').eq('part_number', id).maybeSingle();
        if(mData) row.querySelector('.tx-info').value = mData.description || mData.model;
        else { showMsg(i18n[currentLang].msg_unknown_title, i18n[currentLang].msg_unknown_body); input.value = ""; }
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
        if (type === 'inventory') {
            const { data: dbData } = await supaClient.from('view_inventory').select('*');
            data = dbData.map(i => ({ "Part Number": i.part_number, "Model": i.model, "Description": i.description, "Location": i.location, "Stock": i.stock, "Unit": i.unit, "Main Stock": i.main_stock }));
            filename = "Inventory_List.xlsx";
        } else {
            const { data: dbData } = await supaClient.from('master').select('*');
            data = dbData.map(k => ({ "Part Number": k.part_number, "Model": k.model, "Description": k.description, "Unit": k.unit, "Main Stock": k.main_stock }));
            filename = "Master_Data.xlsx";
        }
        if(data.length === 0) return;
        const ws = XLSX.utils.json_to_sheet(data), wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Sheet1"); XLSX.writeFile(wb, filename);
    } finally { setLoading(false); }
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
function addTxRow() { const tr = document.createElement('tr'), isIss = currentTxType === 'issue'; tr.innerHTML = `<td><input type="text" class="tx-input tx-id" onchange="resolvePart(this)"></td><td><input type="text" class="tx-input tx-info" readonly tabindex="-1"></td><td><input type="number" class="tx-input tx-qty"></td><td><input type="text" class="tx-input tx-loc" ${isIss?'readonly tabindex="-1"':''} style="${isIss?'background-color:#f5f5f5; color:#666;':''}"></td><td style="text-align:center; cursor:pointer; color:#ccc;" onclick="this.parentElement.remove()">✕</td>`; document.getElementById('txBody').appendChild(tr); }
function submitTx() { const lang = i18n[currentLang], ref = document.getElementById('txRef').value.trim(), user = document.getElementById('txUser').value.trim(), rows = document.querySelectorAll('#txBody tr'), items = []; if (!ref || !user) { showMsg(lang.msg_input_required, lang.msg_input_empty); return; } for (let i = 0; i < rows.length; i++) { const id = rows[i].querySelector('.tx-id').value.trim(), qty = Number(rows[i].querySelector('.tx-qty').value.trim()), loc = rows[i].querySelector('.tx-loc').value.trim(); if (!id || isNaN(qty) || qty <= 0) { showMsg(lang.msg_input_required, `Row ${i + 1} invalid`); return; } if (currentTxType === 'receive' && !loc) { showMsg(lang.msg_input_required, `Row ${i + 1} needs Location`); return; } items.push({ id, qty, loc }); } document.getElementById('msgTitle').innerText = lang.confirm_post_title; document.getElementById('msgContent').innerText = lang.confirm_post_body; document.querySelector('#msgModal .btn-primary').onclick = function() { closeModal('msgModal'); executeSubmit(items); }; openModal('msgModal'); }
async function deleteMaster(id) { setLoading(true); const { error } = await supaClient.from('master').delete().eq('part_number', id); setLoading(false); if(!error) { renderMasterTable(); showToast(i18n[currentLang].deleted); } else showMsg("Error", error.message); }
async function submitCreateMaster() { const id = document.getElementById('newId').value.trim(), model = document.getElementById('newModel').value, desc = document.getElementById('newDesc').value, unit = document.getElementById('newUnit').value, min = document.getElementById('newMinStock').value, dept = document.getElementById('newDept').value; if(!id) { showToast("ID Required", true); return; } setLoading(true); const { error } = await supaClient.from('master').insert([{ part_number: id, model, description: desc, unit, main_stock: min, department: dept }]); setLoading(false); if(!error) { renderMasterTable(); closeModal('createModal'); showToast("Created!"); } else showMsg("Error", error.message); }
function openCreateMasterModal() { ['newId','newModel','newDesc','newUnit'].forEach(id => document.getElementById(id).value = ""); document.getElementById('newMinStock').value = 0; document.getElementById('newDept').value = currentUserDept || "Pending"; document.getElementById('newUser').value = currentUserDisplayName; openModal('createModal'); }
function checkMasterExists() { /* 移除此前端驗證，統一交由資料庫後端防呆 */ }
function openReportModal() { const now = new Date(), y = now.getFullYear(), m = String(now.getMonth() + 1).padStart(2, '0'), d = String(now.getDate()).padStart(2, '0'); document.getElementById('rptStart').value = `${y}-${m}-01`; document.getElementById('rptEnd').value = `${y}-${m}-${d}`; openModal('reportModal'); }
async function downloadReport() { const start = document.getElementById('rptStart').value, end = document.getElementById('rptEnd').value; if(!start || !end) { showToast("Select dates!", true); return; } setLoading(true); const endDay = new Date(end); endDay.setDate(endDay.getDate() + 1); const { data, error } = await supaClient.from('history').select('timestamp, reference, action, part_number, quantity, operator_user, note').gte('timestamp', start).lt('timestamp', endDay.toISOString()); setLoading(false); if(error) showMsg("Error", error.message); else if(!data || data.length === 0) showMsg("No Data", "No movements found."); else { const ws = XLSX.utils.json_to_sheet(data); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Report"); XLSX.writeFile(wb, `Report_${start}_to_${end}.xlsx`); closeModal('reportModal'); } }
