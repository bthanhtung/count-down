// Đếm ngược Tết theo giờ Việt Nam (GMT+7). Mùng 1 Tết lấy từ bảng âm lịch bên dưới.
//   ?mode=duong  -> đếm đến Tết Dương lịch     ?demo=10 -> giả lập còn 10 giây (để thử pháo hoa)
const TET = [   // năm, tháng, ngày (dương lịch) của Mùng 1, can chi, con giáp
  [2026, 2, 17, 'Bính Ngọ', 'Ngựa'], [2027, 2, 6, 'Đinh Mùi', 'Dê'], [2028, 1, 26, 'Mậu Thân', 'Khỉ'],
  [2029, 2, 13, 'Kỷ Dậu', 'Gà'], [2030, 2, 3, 'Canh Tuất', 'Chó'], [2031, 1, 23, 'Tân Hợi', 'Lợn'], [2032, 2, 11, 'Nhâm Tý', 'Chuột'],
];
const WISHES = [
  'An khang thịnh vượng', 'Vạn sự như ý', 'Sức khỏe dồi dào', 'Tấn tài tấn lộc', 'Gia đình sum vầy',
  'Tiền vô như nước', 'Công việc hanh thông', 'Năm mới bình an', 'Cười nhiều hơn năm cũ', 'Code ít bug, deploy là chạy',
];
const VN = 7 * 3600e3, DAY = 864e5;
const at = (y, m, d) => Date.UTC(y, m - 1, d) - VN;          // 00:00 giờ Việt Nam
const THU = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
const pad = n => String(n).padStart(2, '0');
const $ = s => document.querySelector(s);

const params = new URLSearchParams(location.search);
let mode = params.get('mode') === 'duong' ? 'duong' : 'tet';
const demo = params.has('demo') ? Date.now() + (+params.get('demo') || 10) * 1000 : null;

// mốc hiện tại: [mốc trước, mốc tới, thông tin]; trong 3 ngày đầu năm thì "đang ăn Tết"
function target(now) {
  if (demo) return { prev: demo - 30 * DAY, next: demo, name: 'Tết Đinh Mùi 2027', sub: 'Giả lập', celebrating: now >= demo && now < demo + 3 * DAY };
  if (mode === 'duong') {
    const y = new Date(now + VN).getUTCFullYear();
    const thisNY = at(y, 1, 1), nextNY = at(y + 1, 1, 1);
    const celebrating = now < thisNY + DAY;
    const t = celebrating ? thisNY : nextNY, ty = celebrating ? y : y + 1;
    return { prev: celebrating ? at(y - 1, 1, 1) : thisNY, next: t, celebrating, name: `Năm mới ${ty}`, sub: `<b>${THU[new Date(t + VN).getUTCDay()]}, 01/01/${ty}</b>` };
  }
  for (let i = 1; i < TET.length; i++) {
    const [y, m, d, canchi, giap] = TET[i], t = at(y, m, d), p = TET[i - 1], tp = at(p[0], p[1], p[2]);
    if (now < tp + 3 * DAY && now >= tp) return info(TET[i - 1], tp, at(...TET[i - 2]?.slice(0, 3) || [p[0] - 1, 2, 1]), true);
    if (now < t) return info(TET[i], t, tp, false);
  }
  return null;
  function info([y, m, d, canchi, giap], t, prev, celebrating) {
    return { prev, next: t, celebrating, name: `Tết ${canchi} ${y}`, canchi, giap,
      sub: `<b>${THU[new Date(t + VN).getUTCDay()]}, ${pad(d)}/${pad(m)}/${y}</b> · Mùng 1 tháng Giêng · năm con ${giap}` };
  }
}

// số lật: mỗi chữ số trượt lên khi đổi
const nums = Object.fromEntries([...document.querySelectorAll('.num')].map(n => [n.dataset.u, n]));
function setNum(u, str) {
  const box = nums[u];
  while (box.children.length < str.length) box.insertAdjacentHTML('afterbegin', '<b class="d"><i></i></b>');
  while (box.children.length > str.length) box.firstChild.remove();
  [...str].forEach((ch, k) => {
    const d = box.children[k], cur = d.lastElementChild;
    if (cur.textContent === ch) return;
    if (!cur.textContent) { cur.textContent = ch; return; }
    d.querySelectorAll('.old').forEach(x => x.remove());
    cur.className = 'old';
    const n = document.createElement('i'); n.className = 'new'; n.textContent = ch; d.appendChild(n);
    setTimeout(() => cur.remove(), 520);
  });
}

let last = null, celebrated = false;
function tick() {
  const now = Date.now(), T = target(now);
  if (!T) return;
  document.body.classList.toggle('celebrate', T.celebrating);
  $('#kicker').textContent = T.celebrating ? 'Chúc mừng năm mới' : 'Còn lại đến';
  $('#title').textContent = T.celebrating ? (mode === 'tet' && !demo ? `Xuân ${T.canchi}` : T.name.replace('Năm mới', 'Happy New Year')) : T.name;
  $('#date').innerHTML = T.sub;
  if (T.celebrating) {
    if (!celebrated) { celebrated = true; show(); fw.play(fw.programs.finale); setTimeout(() => fw.play(fw.programs.ambient, { loop: true }), 17000); }
    return;
  }
  if (celebrated) fw.stop();
  celebrated = false;
  const left = Math.max(0, T.next - now);
  const d = Math.floor(left / DAY), h = Math.floor(left % DAY / 3600e3), m = Math.floor(left % 3600e3 / 6e4), s = Math.floor(left % 6e4 / 1e3);
  setNum('d', d >= 100 ? String(d) : pad(d)); setNum('h', pad(h)); setNum('m', pad(m)); setNum('s', pad(s));
  const pct = Math.min(100, (now - T.prev) / (T.next - T.prev) * 100);
  $('#bar').style.width = pct.toFixed(2) + '%';
  $('#progress-text').textContent = `Đã đi được ${pct.toFixed(1)}% chặng đường từ ${mode === 'tet' ? 'Tết năm ngoái' : 'đầu năm'}`;
  if (last !== m) { last = m; $('#sr').textContent = `Còn ${d} ngày ${h} giờ ${m} phút`; }
  if (left < 11000 && left > 1000) fw.launch({ caliber: .75, rise: 1.4 });   // mười giây cuối: mỗi giây một quả nhỏ
}

// lời chúc xoay vòng
let wi = Math.floor(Math.random() * WISHES.length);
function show() { $('#wish').textContent = WISHES[wi % WISHES.length]; }
setInterval(() => { const w = $('#wish'); w.classList.add('swap'); setTimeout(() => { wi++; show(); w.classList.remove('swap'); }, 600); }, 4500);

// công tắc Tết Nguyên Đán / Dương lịch
const sw = $('.switch');
function setMode(m) {
  mode = m; sw.dataset.mode = m; last = null; celebrated = false;
  sw.querySelectorAll('button').forEach(b => b.setAttribute('aria-selected', b.dataset.mode === m));
  const u = new URL(location); if (m === 'duong') u.searchParams.set('mode', 'duong'); else u.searchParams.delete('mode');
  history.replaceState(null, '', u); tick();
}
sw.addEventListener('click', e => { const b = e.target.closest('button'); if (b) setMode(b.dataset.mode); });

function toast(t) { const el = $('#toast'); el.textContent = t; el.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('show'), 1800); }
// ---------- chia sẻ: Facebook, Messenger, Zalo, Telegram, X, chép link ----------
const SITE = 'https://saptet.tungdadev.com/';
const mobile = matchMedia('(pointer: coarse)').matches;
function shareInfo() {
  const T = target(Date.now());
  const url = SITE + (mode === 'duong' ? '?mode=duong' : '');
  const text = T.celebrating ? `Chúc mừng năm mới! ${WISHES[wi % WISHES.length]} 🧧` : `Còn ${parseInt($('[data-u=d]').textContent, 10)} ngày nữa là ${T.name} 🧧`;
  return { url, text };
}
async function copyLink(msg) {
  const { url, text } = shareInfo();
  try { await navigator.clipboard.writeText(`${text}\n${url}`); toast(msg || 'Đã chép link, dán gửi bạn bè nhé'); return true; }
  catch { toast(url); return false; }
}
const enc = encodeURIComponent;
const ACTIONS = {
  facebook: () => { const { url } = shareInfo(); popup(`https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`); },
  messenger: async () => {
    const { url } = shareInfo();
    if (mobile) { location.href = `fb-messenger://share/?link=${enc(url)}`; return; }
    await copyLink('Đã chép link, dán vào Messenger nhé'); window.open('https://www.messenger.com/', '_blank', 'noopener');
  },
  zalo: async () => {
    // Zalo không có link chia sẻ công khai: điện thoại dùng bảng chia sẻ của máy (có Zalo), máy tính chép link rồi mở Zalo Web
    if (mobile && navigator.share) { const { url, text } = shareInfo(); try { await navigator.share({ text, url }); } catch {} return; }
    await copyLink('Đã chép link, dán vào Zalo nhé'); window.open('https://chat.zalo.me/', '_blank', 'noopener');
  },
  telegram: () => { const { url, text } = shareInfo(); popup(`https://t.me/share/url?url=${enc(url)}&text=${enc(text)}`); },
  x: () => { const { url, text } = shareInfo(); popup(`https://x.com/intent/post?text=${enc(text)}&url=${enc(url)}`); },
  copy: () => copyLink(),
  more: async () => { const { url, text } = shareInfo(); try { await navigator.share({ text, url }); } catch {} },
};
function popup(u) { window.open(u, '_blank', 'noopener,width=620,height=640'); }
const sheet = $('#share-sheet');
if (!navigator.share) sheet.querySelector('[data-share=more]').remove();
function openSheet(open) {
  document.body.classList.toggle('sheet-open', open);
  sheet.setAttribute('aria-hidden', !open);
  if (open) { $('#share-preview').textContent = shareInfo().text; sheet.querySelector('button[data-share]').focus(); }
}
$('#share-btn').onclick = () => openSheet(true);
$('#sheet-scrim').onclick = () => openSheet(false);
$('#sheet-close').onclick = () => openSheet(false);
addEventListener('keydown', e => { if (e.key === 'Escape') openSheet(false); });
sheet.addEventListener('click', e => {
  const b = e.target.closest('[data-share]'); if (!b) return;
  ACTIONS[b.dataset.share]();
  if (b.dataset.share !== 'copy') openSheet(false);
});

// ---------- hoa mai rơi ----------
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const pc = $('#petals'), px = pc.getContext('2d'), fc = $('#fireworks');
let W, H, DPR = Math.min(2, devicePixelRatio || 1);
function size() { W = innerWidth; H = innerHeight; for (const c of [pc]) { c.width = W * DPR; c.height = H * DPR; c.getContext('2d').setTransform(DPR, 0, 0, DPR, 0, 0); } }
size(); addEventListener('resize', size);
const petals = Array.from({ length: W < 600 ? 14 : 28 }, () => newPetal(true));
function newPetal(any) {
  return { x: Math.random() * W, y: any ? Math.random() * H : -30, r: 7 + Math.random() * 9, vy: .35 + Math.random() * .7, vx: -.2 + Math.random() * .4,
    a: Math.random() * 6.28, va: (Math.random() - .5) * .02, sway: Math.random() * 6.28, flower: Math.random() < .55 };
}
function drawPetal(p) {
  px.save(); px.translate(p.x, p.y); px.rotate(p.a);
  if (p.flower) {                      // bông mai 5 cánh
    px.fillStyle = '#ffcf3f';
    for (let k = 0; k < 5; k++) { px.rotate(Math.PI * 2 / 5); px.beginPath(); px.ellipse(0, -p.r * .55, p.r * .42, p.r * .6, 0, 0, 7); px.fill(); }
    px.fillStyle = '#d9771e'; px.beginPath(); px.arc(0, 0, p.r * .22, 0, 7); px.fill();
  } else {                             // một cánh rơi lẻ
    px.fillStyle = 'rgba(255, 210, 80, .9)'; px.beginPath(); px.ellipse(0, 0, p.r * .4, p.r * .62, 0, 0, 7); px.fill();
  }
  px.restore();
}
function petalsLoop() {
  px.clearRect(0, 0, W, H);
  for (const p of petals) {
    p.sway += .015; p.x += p.vx + Math.sin(p.sway) * .5; p.y += p.vy; p.a += p.va;
    if (p.y > H + 30) Object.assign(p, newPetal(false));
    drawPetal(p);
  }
  requestAnimationFrame(petalsLoop);
}
if (!reduce) petalsLoop(); else petals.slice(0, 10).forEach(drawPetal);

// ---------- pháo hoa (engine trong fireworks.js: vật lý theo giây, biên đạo như màn trình diễn thật) ----------
const fw = createFireworks(fc, { reduceMotion: reduce });
$('#fire-btn').onclick = () => fw.play(fw.programs.salvo);
addEventListener('pointerdown', e => { if (!e.target.closest('button, a')) fw.launch({ x: e.clientX, y: Math.min(e.clientY, H * .5) }); });

setMode(mode); show(); tick(); setInterval(tick, 1000);
