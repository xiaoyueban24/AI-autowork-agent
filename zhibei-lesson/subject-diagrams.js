// 智备教案 - 学科专业示意图生成器（程序化 SVG → PNG）
// 每个专业一套「学科语言」示意图：不是装饰图，是能直接用于课堂讲解的专业图。
// 全部由 SVG 程序化绘制（sharp/librsvg 渲染），数据取自各专业教案的真实知识点。
const sharp = require('C:/Users/梁玉彬/.dsh/profiles/web/node_modules/sharp');

const FONT = 'Microsoft YaHei';
const MONO = 'Consolas, Microsoft YaHei';

function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

function T(x, y, s, opt) {
  opt = opt || {};
  return '<text x="' + x + '" y="' + y + '" font-size="' + (opt.size || 16) + '"' +
    (opt.bold ? ' font-weight="bold"' : '') +
    ' fill="' + (opt.fill || '#1c1917') + '" font-family="' + (opt.mono ? MONO : FONT) + '"' +
    (opt.anchor ? ' text-anchor="' + opt.anchor + '"' : '') + '>' + esc(s) + '</text>';
}
function R(x, y, w, h, opt) {
  opt = opt || {};
  return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '"' +
    ' rx="' + (opt.rx != null ? opt.rx : 8) + '" fill="' + (opt.fill || '#ffffff') + '"' +
    (opt.stroke ? ' stroke="' + opt.stroke + '" stroke-width="' + (opt.sw || 1.5) + '"' : '') + '/>';
}
function L(x1, y1, x2, y2, opt) {
  opt = opt || {};
  return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '"' +
    ' stroke="' + (opt.stroke || '#1c1917') + '" stroke-width="' + (opt.sw || 2) + '"' +
    (opt.dash ? ' stroke-dasharray="' + opt.dash + '"' : '') +
    (opt.arrow ? ' marker-end="url(#arr)"' : '') + '/>';
}

const DEFS = '<defs>' +
  '<marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">' +
  '<path d="M0,0 L10,5 L0,10 z" fill="#57606a"/></marker>' +
  '</defs>';

function svgWrap(w, h, body, bg) {
  return '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '">' +
    '<rect width="' + w + '" height="' + h + '" fill="' + (bg || '#ffffff') + '"/>' + body + '</svg>';
}

// ============ 01 计算机：子网划分 ============
// 图1：192.168.1.0/24 → 4 个 /26 子网（核心知识点可视化）
function csSubnetBlocks() {
  const W = 1080, H = 560;
  const ink = '#181818', accent = '#2563eb', muted = '#66707a';
  let b = DEFS;
  b += T(40, 52, '等长子网划分：192.168.1.0/24 借 2 位 → 4 个 /26 子网', { size: 24, bold: true, fill: ink });
  b += T(40, 82, '块大小 = 256 − 192 → 每个子网 64 个地址（62 台可用主机）', { size: 17, fill: muted });
  const subs = [
    { cidr: '192.168.1.0/26', dept: '销售部 · 62 台', bcast: '192.168.1.63' },
    { cidr: '192.168.1.64/26', dept: '技术部 · 62 台', bcast: '192.168.1.127' },
    { cidr: '192.168.1.128/26', dept: '财务部 · 62 台', bcast: '192.168.1.191' },
    { cidr: '192.168.1.192/26', dept: '预留段 · 62 台', bcast: '192.168.1.255' }
  ];
  subs.forEach((s, i) => {
    const y = 112 + i * 98;
    b += R(40, y, 620, 84, { fill: i % 2 ? '#e6efff' : '#eef4ff', stroke: accent, sw: 1.5 });
    b += T(64, y + 36, s.cidr, { size: 23, bold: true, fill: ink, mono: true });
    b += T(64, y + 66, '第 ' + (i + 1) + ' 子网 ｜ ' + s.dept, { size: 17, fill: muted });
    b += R(700, y, 340, 84, { fill: '#f6f8fa', stroke: '#d0d7de', sw: 1 });
    b += T(720, y + 30, '网络地址 ' + s.cidr.split('/')[0], { size: 15, fill: muted, mono: true });
    b += T(720, y + 53, '广播地址 ' + s.bcast, { size: 15, fill: muted, mono: true });
    b += T(720, y + 76, '掩码 255.255.255.192', { size: 15, fill: muted, mono: true });
  });
  b += T(40, H - 22, '借位：/24 → /26（主机位借 2 位给网络位，2^2 = 4 段）', { size: 16, fill: muted, mono: true });
  return svgWrap(W, H, b);
}

// 图2：五类地址范围速查表
function csClassRanges() {
  const W = 1080, H = 380;
  const ink = '#181818', muted = '#66707a';
  let b = DEFS;
  b += T(40, 50, 'IPv4 五类地址范围速查', { size: 24, bold: true, fill: ink });
  b += T(40, 80, '按首字节十进制判断类别 · 民用主要是 A/B/C 三类', { size: 16, fill: muted });
  const rows = [
    ['A 类', '1 – 126', '/8', '126 网 × 1677 万主机', '大型网络', '#eef4ff'],
    ['B 类', '128 – 191', '/16', '1.6 万网 × 6.5 万主机', '中型网络', '#f6f8fa'],
    ['C 类', '192 – 223', '/24', '209 万网 × 254 主机', '小型网络', '#eef4ff'],
    ['D 类', '224 – 239', '—', '组播保留', '不作主机地址', '#f6f8fa'],
    ['E 类', '240 – 254', '—', '科研保留', '不作主机地址', '#f6f8fa']
  ];
  rows.forEach((r, i) => {
    const y = 104 + i * 52;
    b += R(40, y, 1000, 44, { fill: r[5], rx: 6 });
    b += T(60, y + 29, r[0], { size: 19, bold: true, fill: ink });
    b += T(170, y + 29, r[1], { size: 17, fill: ink, mono: true });
    b += T(360, y + 29, '默认掩码 ' + r[2], { size: 16, fill: muted, mono: true });
    b += T(610, y + 29, r[3], { size: 16, fill: muted });
    b += T(880, y + 29, r[4], { size: 15, fill: muted });
  });
  return svgWrap(W, H, b);
}

// 图3：按位与运算求网络地址（难点）
function csAndOperation() {
  const W = 1080, H = 460;
  const ink = '#181818', accent = '#2563eb', muted = '#66707a';
  let b = DEFS;
  b += T(40, 50, '网络地址 = IP 地址 AND 子网掩码（按位与）', { size: 24, bold: true, fill: ink });
  const rows = [
    { label: 'IP 地址', dec: '192.168.1.130', bin: '11000000 10101000 00000001 10000010', hl: false },
    { label: '子网掩码 /26', dec: '255.255.255.192', bin: '11111111 11111111 11111111 11000000', hl: true },
    { label: '网络地址', dec: '192.168.1.128', bin: '11000000 10101000 00000001 10000000', hl: false }
  ];
  rows.forEach((r, i) => {
    const y = 92 + i * 108;
    b += T(40, y + 4, r.label, { size: 16, fill: muted });
    b += R(40, y + 16, 740, 42, { fill: r.hl ? '#eef4ff' : '#f6f8fa', stroke: r.hl ? accent : '#d0d7de', sw: r.hl ? 2 : 1 });
    b += T(60, y + 44, r.dec, { size: 21, fill: ink, mono: true });
    b += R(40, y + 68, 740, 36, { fill: '#ffffff', stroke: '#d0d7de', sw: 1 });
    b += T(60, y + 92, r.bin, { size: 15, fill: muted, mono: true });
  });
  b += R(820, 116, 220, 300, { fill: '#f6f8fa', stroke: '#d0d7de', sw: 1 });
  b += T(842, 148, '网络位 vs 主机位', { size: 17, bold: true, fill: ink });
  b += R(842, 166, 176, 42, { fill: '#dbeafe', stroke: accent, sw: 1.5 });
  b += T(856, 193, '网络位 26 位（掩码 1）', { size: 15, fill: ink });
  b += R(842, 218, 176, 42, { fill: '#f6f8fa', stroke: '#97989d', sw: 1 });
  b += T(856, 245, '主机位 6 位（掩码 0）', { size: 15, fill: muted });
  b += T(842, 288, '主机位全 0 → 网络地址', { size: 15, fill: muted });
  b += T(842, 312, '主机位全 1 → 广播地址', { size: 15, fill: muted });
  b += T(842, 344, '6 位主机 → 2^6−2 = 62 台', { size: 15, fill: accent });
  b += T(842, 376, '130 = 128+2 → 第 3 段', { size: 15, fill: muted });
  return svgWrap(W, H, b);
}

// ============ 02 机电：电气原理图 / 梯形图 ============
// 图1：正反转主电路 + 控制电路（双重互锁，教材标准画法）
function meInterlock() {
  const W = 1080, H = 620;
  const ink = '#1c1917', accent = '#9a3412', muted = '#78716c', hot = '#b91c1c', green = '#16a34a';
  let b = DEFS;
  b += T(40, 44, '接触器互锁 · 按钮联锁正反转控制电路', { size: 23, bold: true, fill: ink });
  b += T(40, 72, '左侧主电路（QF→KM1/KM2→M）· 右侧控制电路（双重互锁）', { size: 15, fill: muted });

  // —— 主电路 ——
  ['L1', 'L2', 'L3'].forEach((p, i) => {
    const x = 80 + i * 46;
    b += L(x, 100, x, 470, { stroke: ink, sw: 2.5 });
    b += T(x - 7, 93, p, { size: 15, fill: ink, mono: true });
    // QF 断路器
    b += L(x - 13, 156, x + 13, 138, { stroke: ink, sw: 2.5 });
    // KM1 主触点
    b += L(x, 200, x, 224, { stroke: ink, sw: 2.5 });
    b += L(x - 12, 240, x + 12, 224, { stroke: ink, sw: 2.5 });
    b += L(x, 240, x, 300, { stroke: ink, sw: 2.5 });
    // KM2 主触点
    b += L(x - 12, 400, x + 12, 384, { stroke: ink, sw: 2.5 });
    b += L(x, 400, x, 416, { stroke: ink, sw: 2.5 });
  });
  b += T(150, 152, 'QF', { size: 15, fill: ink, mono: true });
  b += T(150, 226, 'KM1', { size: 15, fill: ink, mono: true });
  b += T(150, 392, 'KM2', { size: 15, fill: ink, mono: true });
  // 换相交叉线（KM2 支路 L1↔L3 交叉）
  b += '<path d="M 80 300 L 80 320 L 172 320 L 172 384" fill="none" stroke="' + hot + '" stroke-width="2"/>';
  b += '<path d="M 172 300 L 172 326 L 80 326 L 80 384" fill="none" stroke="' + hot + '" stroke-width="2"/>';
  b += T(200, 356, '换相：L1↔L3 交叉', { size: 14, fill: hot });
  // 电动机
  b += '<circle cx="126" cy="446" r="32" fill="#faf8f3" stroke="' + ink + '" stroke-width="2.5"/>';
  b += T(117, 454, 'M', { size: 24, bold: true, fill: ink, mono: true });
  b += T(117, 472, '3~', { size: 12, fill: muted, mono: true });
  b += L(80, 416, 104, 430, { stroke: ink, sw: 2 });
  b += L(126, 416, 126, 414, { stroke: ink, sw: 2 });
  b += L(172, 416, 148, 430, { stroke: ink, sw: 2 });

  // —— 控制电路 ——
  const cl = 470, cr = 1040;
  b += L(cl, 100, cl, 540, { stroke: ink, sw: 2.5 });
  b += L(cr, 100, cr, 540, { stroke: ink, sw: 2.5 });
  b += T(cl - 8, 93, 'L1', { size: 15, fill: ink, mono: true });
  b += T(cr - 16, 93, 'N', { size: 15, fill: ink, mono: true });
  // FR 热继电器（常闭）
  b += L(cl, 130, cl + 40, 130, { stroke: ink, sw: 2 });
  b += '<rect x="' + (cl + 40) + '" y="122" width="22" height="16" fill="none" stroke="' + ink + '" stroke-width="2"/>';
  b += T(cl + 68, 135, 'FR', { size: 14, fill: ink, mono: true });
  b += L(cl + 62, 130, cl + 130, 130, { stroke: ink, sw: 2 });
  // 分岔点到两条支路
  b += L(cl + 130, 130, cl + 130, 540, { stroke: ink, sw: 2 }); // 左母线段
  // SB1 停止按钮（常闭，两支路共用）
  b += L(cl + 130, 150, cl + 130, 160, { stroke: ink, sw: 2 });
  b += L(cl + 118, 176, cl + 142, 162, { stroke: ink, sw: 2.5 });
  b += L(cl + 130, 170, cl + 130, 176, { stroke: ink, sw: 2 });
  b += T(cl + 148, 172, 'SB1 停止', { size: 14, fill: ink, mono: true });
  // 支路 1：正转（SB2 常开 + KM2 常闭互锁 + KM1 线圈）
  const b1 = cl + 130;
  b += L(b1, 190, b1, 200, { stroke: ink, sw: 2 });
  b += L(b1 - 14, 216, b1 + 14, 204, { stroke: ink, sw: 2.5 });
  b += L(b1, 210, b1, 216, { stroke: ink, sw: 2 });
  b += T(b1 - 68, 212, 'SB2 正转', { size: 14, fill: ink, mono: true });
  b += L(b1, 216, b1, 240, { stroke: ink, sw: 2 });
  b += L(b1 - 14, 256, b1 + 14, 244, { stroke: ink, sw: 2.5 });
  b += L(b1, 250, b1, 256, { stroke: ink, sw: 2 });
  b += T(b1 + 20, 254, 'KM2↓互锁', { size: 13, fill: accent, mono: true });
  b += L(b1, 256, b1, 276, { stroke: ink, sw: 2 });
  b += '<circle cx="' + b1 + '" cy="298" r="22" fill="#fff7ed" stroke="' + accent + '" stroke-width="2.5"/>';
  b += T(b1 - 16, 303, 'KM1', { size: 14, bold: true, fill: accent, mono: true });
  b += L(b1, 320, b1, 540, { stroke: ink, sw: 2 });
  // 支路 2：反转（并联）
  const b2 = b1 + 280;
  b += L(b1, 196, b2, 196, { stroke: ink, sw: 2 });
  b += L(b2, 196, b2, 210, { stroke: ink, sw: 2 });
  b += L(b2 - 14, 226, b2 + 14, 214, { stroke: ink, sw: 2.5 });
  b += L(b2, 220, b2, 226, { stroke: ink, sw: 2 });
  b += T(b2 - 68, 222, 'SB3 反转', { size: 14, fill: ink, mono: true });
  b += L(b2, 226, b2, 250, { stroke: ink, sw: 2 });
  b += L(b2 - 14, 266, b2 + 14, 254, { stroke: ink, sw: 2.5 });
  b += L(b2, 260, b2, 266, { stroke: ink, sw: 2 });
  b += T(b2 + 20, 264, 'KM1↓互锁', { size: 13, fill: accent, mono: true });
  b += L(b2, 266, b2, 276, { stroke: ink, sw: 2 });
  b += '<circle cx="' + b2 + '" cy="298" r="22" fill="#fff7ed" stroke="' + accent + '" stroke-width="2.5"/>';
  b += T(b2 - 16, 303, 'KM2', { size: 14, bold: true, fill: accent, mono: true });
  b += L(b2, 320, b2, 540, { stroke: ink, sw: 2 });
  // 自锁触点（KM1 常开并 SB2）
  b += '<path d="M ' + (b1 - 40) + ' 216 L ' + (b1 - 40) + ' 188 L ' + b1 + ' 188" fill="none" stroke="' + green + '" stroke-width="2" stroke-dasharray="5,4"/>';
  b += T(b1 - 118, 186, 'KM1 自锁↑', { size: 13, fill: green, mono: true });
  b += T(40, 586, '双重互锁 = 按钮联锁（SB2/SB3 复合按钮）+ 接触器互锁（KM2↓ 串正转支路、KM1↓ 串反转支路）', { size: 15, fill: muted });
  b += T(40, 610, '任一接触器吸合，另一条支路必被切断 —— 从根上杜绝相间短路', { size: 14, fill: hot });
  return svgWrap(W, H, b);
}

// 图2：S7-1200 梯形图（LAD 双重互锁）
function meLadder() {
  const W = 1080, H = 500;
  const ink = '#1c1917', accent = '#9a3412', muted = '#78716c', hot = '#b91c1c', green = '#16a34a';
  let b = DEFS;
  b += T(40, 44, 'S7-1200 梯形图（LAD）：双重互锁正反转', { size: 23, bold: true, fill: ink });
  b += T(40, 72, '触点 ‖ 常开 · ‖/ 常闭 · ( ) 输出线圈 · 左右竖线为母线', { size: 15, fill: muted });

  // 母线
  b += L(96, 96, 96, 470, { stroke: ink, sw: 3.5 });
  b += L(1020, 96, 1020, 470, { stroke: ink, sw: 3.5 });

  // 网络 1：正转
  b += R(40, 96, 1000, 176, { fill: '#fdfaf4', stroke: '#e7e0d1', sw: 1, rx: 8 });
  b += T(56, 120, '网络 1', { size: 15, fill: muted, mono: true });
  const y1 = 184;
  // 触点函数：常开 contact(x,y,label) —— 两竖线夹横线
  function contact(x, y, label, sub, color) {
    let s = L(x, y - 12, x, y + 12, { stroke: ink, sw: 2.5 });
    s += L(x + 34, y - 12, x + 34, y + 12, { stroke: ink, sw: 2.5 });
    s += L(x, y, x + 34, y, { stroke: ink, sw: 2.5 });
    s += T(x - 4, y - 22, label, { size: 14, fill: color || ink, mono: true });
    if (sub) s += T(x - 8, y + 30, sub, { size: 13, fill: muted });
    return s;
  }
  function contactNC(x, y, label, sub, color) {
    let s = contact(x, y, label, null, color);
    s += L(x - 6, y - 12, x + 40, y + 12, { stroke: color || hot, sw: 2 });
    if (sub) s += T(x - 8, y + 30, sub, { size: 13, fill: muted });
    return s;
  }
  function coil(x, y, label) {
    let s = L(x - 60, y, x, y, { stroke: ink, sw: 2.5 });
    s += '<path d="M ' + x + ' ' + (y - 16) + ' A 16 16 0 0 1 ' + x + ' ' + (y + 16) + '" fill="none" stroke="' + ink + '" stroke-width="2.5"/>';
    s += L(x, y - 16, x, y + 16, { stroke: ink, sw: 2.5 });
    s += T(x + 14, y + 6, label, { size: 14, fill: ink, mono: true });
    return s;
  }
  b += L(96, y1, 140, y1, { stroke: ink, sw: 2.5 });
  b += contact(140, y1, 'I0.0', 'SB2 正转');
  b += L(174, y1, 220, y1, { stroke: ink, sw: 2.5 });
  b += contactNC(220, y1, 'I0.2', 'KM2 互锁↓');
  b += L(254, y1, 300, y1, { stroke: ink, sw: 2.5 });
  b += contact(300, y1, 'Q0.0', '自锁↑', green);
  b += coil(900, y1, 'Q0.0 ( KM1 )');
  b += L(916, y1, 1020, y1, { stroke: ink, sw: 2.5 });
  // 自锁并联线
  b += '<path d="M 317 ' + (y1 - 12) + ' L 317 ' + (y1 - 52) + ' L 157 ' + (y1 - 52) + '" fill="none" stroke="' + green + '" stroke-width="2" stroke-dasharray="5,4"/>';
  b += '<path d="M 317 ' + (y1 + 12) + ' L 317 ' + (y1 + 52) + ' L 157 ' + (y1 + 52) + '" fill="none" stroke="' + green + '" stroke-width="2" stroke-dasharray="5,4"/>';

  // 网络 2：反转
  b += R(40, 292, 1000, 176, { fill: '#fdfaf4', stroke: '#e7e0d1', sw: 1, rx: 8 });
  b += T(56, 316, '网络 2', { size: 15, fill: muted, mono: true });
  const y2 = 380;
  b += L(96, y2, 140, y2, { stroke: ink, sw: 2.5 });
  b += contact(140, y2, 'I0.1', 'SB3 反转');
  b += L(174, y2, 220, y2, { stroke: ink, sw: 2.5 });
  b += contactNC(220, y2, 'I0.3', 'KM1 互锁↓');
  b += L(254, y2, 300, y2, { stroke: ink, sw: 2.5 });
  b += contact(300, y2, 'Q0.1', '自锁↑', green);
  b += coil(900, y2, 'Q0.1 ( KM2 )');
  b += L(916, y2, 1020, y2, { stroke: ink, sw: 2.5 });
  b += '<path d="M 317 ' + (y2 - 12) + ' L 317 ' + (y2 - 52) + ' L 157 ' + (y2 - 52) + '" fill="none" stroke="' + green + '" stroke-width="2" stroke-dasharray="5,4"/>';
  b += '<path d="M 317 ' + (y2 + 12) + ' L 317 ' + (y2 + 52) + ' L 157 ' + (y2 + 52) + '" fill="none" stroke="' + green + '" stroke-width="2" stroke-dasharray="5,4"/>';
  return svgWrap(W, H, b);
}

// 图3：实训安全流程
function meSafetyFlow() {
  const W = 1080, H = 300;
  const ink = '#1c1917', accent = '#9a3412', muted = '#78716c';
  let b = DEFS;
  b += T(40, 46, '实训安全流程：先断电 · 后接线 · 再验收', { size: 22, bold: true, fill: ink });
  const steps = [
    ['① 断电挂牌', '拉下 QF，挂「禁止合闸」牌'],
    ['② 无电验电', '万用表确认主电路无电压'],
    ['③ 按图接线', '对照原理图逐相连接压牢'],
    ['④ 教师验收', '查相序互锁接地，签字'],
    ['⑤ 空载试车', '先空载点动验证正反转']
  ];
  steps.forEach((s, i) => {
    const x = 40 + i * 208;
    b += R(x, 80, 188, 140, { fill: i === 0 ? '#fff7ed' : '#fdfaf4', stroke: i === 0 ? accent : '#e7e0d1', sw: 2 });
    b += T(x + 16, 112, s[0], { size: 18, bold: true, fill: ink });
    b += T(x + 16, 142, s[1], { size: 13.5, fill: muted });
    if (i < 4) b += L(x + 188, 150, x + 204, 150, { stroke: accent, sw: 2.5, arrow: true });
  });
  b += T(40, 262, '违反第 ① 步即有触电风险 —— 电气安全红线，不可越过', { size: 15, fill: '#b91c1c' });
  return svgWrap(W, H, b);
}

// ============ 03 会计：T 型账户 / 分录 / 试算平衡 ============
// 图1：五类账户 T 型结构
function acTAccounts() {
  const W = 1080, H = 560;
  const ink = '#0f172a', accent = '#0284c7', muted = '#64748b';
  let b = DEFS;
  b += T(40, 48, '五类账户的 T 型结构与借贷方向', { size: 24, bold: true, fill: ink });
  b += T(40, 78, '资产/成本 → 借方记增加；负债/权益/收入 → 贷方记增加（方向判断是本课难点）', { size: 16, fill: muted });
  const rows = [
    { name: '资产类', inc: '借方 (+)', dec: '贷方 (−)', bal: '借方', ex: '库存现金 · 银行存款 · 应收账款', hl: true },
    { name: '成本类', inc: '借方 (+)', dec: '贷方 (−)', bal: '借方', ex: '生产成本 · 制造费用', hl: false },
    { name: '负债类', inc: '贷方 (+)', dec: '借方 (−)', bal: '贷方', ex: '应付账款 · 短期借款', hl: true },
    { name: '权益类', inc: '贷方 (+)', dec: '借方 (−)', bal: '贷方', ex: '实收资本 · 盈余公积', hl: false },
    { name: '收入类', inc: '贷方 (+)', dec: '借方 (−)', bal: '期末结转无余额', ex: '主营业务收入 · 其他业务收入', hl: true }
  ];
  rows.forEach((r, i) => {
    const y = 102 + i * 84;
    b += T(40, y + 34, r.name, { size: 19, bold: true, fill: ink });
    // T 型
    const cx = 200;
    b += L(cx, y, cx, y + 58, { stroke: ink, sw: 2 });
    b += L(cx - 74, y, cx + 78, y, { stroke: ink, sw: 2 });
    b += T(cx - 66, y + 28, r.inc, { size: 15, fill: r.hl ? accent : muted });
    b += T(cx + 10, y + 28, r.dec, { size: 15, fill: muted });
    // 余额
    b += R(420, y + 2, 170, 54, { fill: r.hl ? '#f0f9ff' : '#f8fafc', stroke: r.hl ? accent : '#cbd5e1', sw: 1 });
    b += T(436, y + 24, '余额方向', { size: 13, fill: muted });
    b += T(436, y + 46, r.bal, { size: 15, bold: true, fill: ink });
    // 例科目
    b += T(640, y + 24, '例：', { size: 14, fill: muted });
    b += T(676, y + 24, r.ex, { size: 14, fill: ink });
  });
  b += T(40, H - 20, '口诀：借增贷减是资产，负债权益正相反', { size: 15, fill: accent });
  return svgWrap(W, H, b);
}

// 图2：分录编制三步走
function acEntrySteps() {
  const W = 1080, H = 360;
  const ink = '#0f172a', accent = '#0284c7', muted = '#64748b';
  let b = DEFS;
  b += T(40, 46, '会计分录编制「三步走」：以「购入设备 50 万未付款」为例', { size: 22, bold: true, fill: ink });
  const steps = [
    { t: 'STEP 1 定科目', lines: ['涉及账户：固定资产', '（资产类）＋ 应付账款', '（负债类）'] },
    { t: 'STEP 2 辨方向', lines: ['设备增加 → 资产+', '记「借」；欠款增加 →', '负债+ 记「贷」'] },
    { t: 'STEP 3 配金额', lines: ['借：固定资产 500,000', '　贷：应付账款 500,000', '（有借必有贷，相等）'] }
  ];
  steps.forEach((s, i) => {
    const x = 40 + i * 340;
    b += R(x, 84, 300, 170, { fill: '#f0f9ff', stroke: accent, sw: 1.5 });
    b += T(x + 20, 116, s.t, { size: 18, bold: true, fill: accent });
    s.lines.forEach((ln, j) => {
      b += T(x + 20, 148 + j * 26, ln, { size: 15, fill: ink, mono: i === 2 });
    });
    if (i < 2) b += L(x + 300, 170, x + 334, 170, { stroke: accent, sw: 2.5, arrow: true });
  });
  b += T(40, 298, '试算平衡的底层逻辑：所有分录借贷必相等 → 全部账户借方合计 = 贷方合计', { size: 15, fill: muted });
  return svgWrap(W, H, b);
}

// 图3：发生额试算平衡表
function acTrialBalance() {
  const W = 1080, H = 480;
  const ink = '#0f172a', accent = '#0284c7', muted = '#64748b';
  let b = DEFS;
  b += T(40, 44, '发生额试算平衡表（本期合计）', { size: 22, bold: true, fill: ink });
  b += T(40, 72, '数据源自课堂实训 10 笔业务 · 单位：元', { size: 15, fill: muted });
  const header = ['科目名称', '借方发生额', '贷方发生额'];
  const data = [
    ['银行存款', '460,000', '351,000'],
    ['固定资产', '500,000', '—'],
    ['应付账款', '—', '565,000'],
    ['短期借款', '—', '400,000'],
    ['实收资本', '—', '500,000'],
    ['主营业务收入', '—', '240,000'],
    ['合计', '960,000', '2,056,000']
  ];
  const x0 = 60, colW = 300;
  header.forEach((h, i) => {
    const x = x0 + i * colW;
    b += R(x, 96, colW, 44, { fill: '#0f172a', rx: 0 });
    b += T(x + 20, 124, h, { size: 17, bold: true, fill: '#f8fafc' });
  });
  data.forEach((row, ri) => {
    const y = 140 + ri * 44;
    const isTotal = ri === data.length - 1;
    row.forEach((cell, ci) => {
      const x = x0 + ci * colW;
      b += R(x, y, colW, 44, { fill: isTotal ? '#f0f9ff' : (ri % 2 ? '#f8fafc' : '#ffffff'), stroke: '#cbd5e1', sw: 1, rx: 0 });
      b += T(x + 20, y + 28, cell, { size: 16, bold: isTotal, fill: isTotal ? accent : ink, mono: ci > 0 });
    });
  });
  b += T(40, H - 20, '借方合计 ≠ 贷方合计？→ 表内藏了一笔教学用错账，正是本课要排查的案例', { size: 15, fill: '#b91c1c' });
  return svgWrap(W, H, b);
}

// ============ 04 建工：建筑平面图 / 图例 ============
// 图1：宿舍楼局部平面图（双线墙 + 轴线 + 三道尺寸）
function archPlan() {
  const W = 1080, H = 640;
  const ink = '#0f172a', axis = '#b91c1c', dim = '#475569', muted = '#64748b';
  let b = DEFS;
  b += T(40, 42, '宿舍楼标准层局部平面图（示意）', { size: 22, bold: true, fill: ink });
  b += T(40, 68, '粗线为墙体 · ①–④ 为定位轴线 · 底部三道尺寸线由内向外：洞口 → 开间 → 总尺寸', { size: 15, fill: muted });
  const ox = 160, oy = 104, sw = 760, sh = 400;
  // 墙体
  b += R(ox, oy, sw, sh, { fill: 'none', stroke: ink, sw: 7, rx: 0 });
  b += L(ox + 260, oy, ox + 260, oy + sh, { stroke: ink, sw: 4 });
  b += L(ox + 520, oy, ox + 520, oy + sh, { stroke: ink, sw: 4 });
  b += L(ox, oy + 250, ox + 260, oy + 250, { stroke: ink, sw: 4 });
  // 房间
  const rooms = [
    ['宿舍 401', ox + 70, oy + 130], ['宿舍 402', ox + 330, oy + 130], ['宿舍 403', ox + 590, oy + 130],
    ['阳台', ox + 70, oy + 360], ['卫生间', ox + 330, oy + 360], ['走道', ox + 590, oy + 360]
  ];
  rooms.forEach(r => { b += T(r[1], r[2], r[0], { size: 17, fill: ink }); });
  // 门（开启弧线）
  [[ox + 260, oy + 70], [ox + 520, oy + 70], [ox + 160, oy + 250]].forEach(d => {
    b += L(d[0], d[1], d[0], d[1] + 36, { stroke: ink, sw: 1.5 });
    b += '<path d="M ' + d[0] + ' ' + (d[1] + 36) + ' A 36 36 0 0 1 ' + (d[0] - 36) + ' ' + d[1] + '" fill="none" stroke="' + ink + '" stroke-width="1.2"/>';
  });
  // 窗（双细线）
  [[ox + 300, oy, 90], [ox + 560, oy, 90], [ox + 300, oy + sh, 90]].forEach(wd => {
    b += L(wd[0], wd[1] - 5, wd[0] + wd[2], wd[1] - 5, { stroke: ink, sw: 1.2 });
    b += L(wd[0], wd[1] + 5, wd[0] + wd[2], wd[1] + 5, { stroke: ink, sw: 1.2 });
  });
  // 定位轴线（竖向 1-4）
  ['1', '2', '3', '4'].forEach((id, i) => {
    const x = ox + i * 253.33;
    b += L(x, oy - 40, x, oy + sh + 28, { stroke: axis, sw: 1.2, dash: '14,4,3,4' });
    b += '<circle cx="' + x + '" cy="' + (oy + sh + 54) + '" r="14" fill="#ffffff" stroke="' + axis + '" stroke-width="1.5"/>';
    b += T(x - 5, oy + sh + 60, id, { size: 15, fill: axis, mono: true });
  });
  // 横向轴线 A-C
  ['A', 'B', 'C'].forEach((id, i) => {
    const y = oy + i * 200;
    b += L(ox - 40, y, ox + sw + 28, y, { stroke: axis, sw: 1.2, dash: '14,4,3,4' });
    b += '<circle cx="' + (ox - 58) + '" cy="' + y + '" r="14" fill="#ffffff" stroke="' + axis + '" stroke-width="1.5"/>';
    b += T(ox - 63, y + 6, id, { size: 15, fill: axis, mono: true });
  });
  // 三道尺寸线
  const dy1 = oy + sh + 96, dy2 = dy1 + 32, dy3 = dy2 + 32;
  const seg1 = [[ox, ox + 150], [ox + 150, ox + 260], [ox + 260, ox + 380], [ox + 380, ox + 520], [ox + 520, ox + 760]];
  seg1.forEach(sg => {
    b += L(sg[0], dy1, sg[1], dy1, { stroke: dim, sw: 1 });
    b += L(sg[0], dy1 - 5, sg[0], dy1 + 5, { stroke: dim, sw: 1 });
    b += L(sg[1], dy1 - 5, sg[1], dy1 + 5, { stroke: dim, sw: 1 });
    b += T((sg[0] + sg[1]) / 2, dy1 - 9, String(sg[1] - sg[0]), { size: 12, fill: dim, mono: true, anchor: 'middle' });
  });
  const seg2 = [[ox, ox + 260, '3600'], [ox + 260, ox + 520, '3600'], [ox + 520, ox + 760, '3900']];
  seg2.forEach(sg => {
    b += L(sg[0], dy2, sg[1], dy2, { stroke: dim, sw: 1 });
    b += L(sg[0], dy2 - 5, sg[0], dy2 + 5, { stroke: dim, sw: 1 });
    b += L(sg[1], dy2 - 5, sg[1], dy2 + 5, { stroke: dim, sw: 1 });
    b += T((sg[0] + sg[1]) / 2, dy2 - 9, sg[2], { size: 12, fill: dim, mono: true, anchor: 'middle' });
  });
  b += L(ox, dy3, ox + sw, dy3, { stroke: dim, sw: 1 });
  b += L(ox, dy3 - 5, ox, dy3 + 5, { stroke: dim, sw: 1 });
  b += L(ox + sw, dy3 - 5, ox + sw, dy3 + 5, { stroke: dim, sw: 1 });
  b += T(ox + sw / 2, dy3 - 9, '11100', { size: 12, fill: dim, mono: true, anchor: 'middle' });
  return svgWrap(W, H, b);
}

// 图2：常用图例速查
function archLegends() {
  const W = 1080, H = 500;
  const ink = '#0f172a', muted = '#64748b', axis = '#b91c1c', dim = '#475569';
  let b = DEFS;
  b += T(40, 44, '常用图例速查（GB/T 50104）', { size: 22, bold: true, fill: ink });
  b += T(40, 70, '识图第一步：把符号翻译成建筑构件', { size: 15, fill: muted });
  const items = ['wall', 'door', 'window', 'stairs', 'axis', 'dim'];
  const labels = {
    wall: '承重墙（剖断涂红）', door: '门（90° 开启弧线）', window: '窗（双细线）',
    stairs: '楼梯（45° 折断线）', axis: '定位轴线 ①–④ / A–C', dim: '尺寸线（三道由内向外）'
  };
  items.forEach((kind, i) => {
    const x = 60 + (i % 3) * 340, y = 100 + Math.floor(i / 3) * 190;
    b += R(x, y, 300, 160, { fill: '#f8fafc', stroke: '#cbd5e1', sw: 1 });
    b += T(x + 20, y + 28, '图例', { size: 13, fill: muted });
    let s = '';
    const cx = x + 40, cy = y + 88;
    if (kind === 'wall') {
      s += R(cx, cy - 10, 130, 20, { fill: '#ef4444', rx: 0 });
      s += '<rect x="' + cx + '" y="' + (cy - 10) + '" width="130" height="20" fill="#ef4444" opacity="0.55"/>';
      s += L(cx, cy - 10, cx + 130, cy - 10, { stroke: ink, sw: 1.5 });
      s += L(cx, cy + 10, cx + 130, cy + 10, { stroke: ink, sw: 1.5 });
    } else if (kind === 'door') {
      s += L(cx, cy + 32, cx, cy - 28, { stroke: ink, sw: 2 });
      s += '<path d="M ' + cx + ' ' + (cy - 28) + ' A 60 60 0 0 1 ' + (cx + 60) + ' ' + (cy + 32) + '" fill="none" stroke="' + ink + '" stroke-width="1.2"/>';
    } else if (kind === 'window') {
      s += L(cx, cy - 8, cx + 130, cy - 8, { stroke: ink, sw: 1.5 });
      s += L(cx, cy + 8, cx + 130, cy + 8, { stroke: ink, sw: 1.5 });
      s += L(cx, cy, cx + 130, cy, { stroke: ink, sw: 1.2 });
    } else if (kind === 'stairs') {
      for (let k = 0; k < 6; k++) s += L(cx, cy - 36 + k * 13, cx + 110, cy - 36 + k * 13, { stroke: ink, sw: 1.2 });
      s += L(cx + 40, cy + 42, cx + 80, cy - 36, { stroke: ink, sw: 1, dash: '6,4' });
    } else if (kind === 'axis') {
      s += L(cx, cy, cx + 120, cy, { stroke: axis, sw: 1.2, dash: '14,4,3,4' });
      s += '<circle cx="' + (cx + 140) + '" cy="' + cy + '" r="13" fill="#ffffff" stroke="' + axis + '" stroke-width="1.5"/>';
      s += T(cx + 136, cy + 5, 'A', { size: 13, fill: axis, mono: true });
    } else if (kind === 'dim') {
      s += L(cx, cy, cx + 130, cy, { stroke: dim, sw: 1 });
      s += L(cx + 6, cy - 6, cx + 6, cy + 6, { stroke: dim, sw: 1 });
      s += L(cx + 124, cy - 6, cx + 124, cy + 6, { stroke: dim, sw: 1 });
      s += T(cx + 38, cy - 8, '3600', { size: 12, fill: dim, mono: true });
    }
    b += s;
    b += T(x + 20, y + 146, labels[kind], { size: 14, fill: ink });
  });
  return svgWrap(W, H, b);
}

// ============ 05 电商：流量漏斗 / 分镜 / 数据看板 ============
// 图1：流量池分级
function ecFunnel() {
  const W = 1080, H = 560;
  const ink = '#27272a', accent = '#ea580c', muted = '#78716c';
  let b = DEFS;
  b += T(40, 46, '短视频流量池分级与晋级指标', { size: 24, bold: true, fill: ink });
  b += T(40, 76, '机器初审 → 冷启动池 → 小池 → 中池 → 大池，每一级看一组数据', { size: 16, fill: muted });
  const tiers = [
    ['机器审核', '查重 · 违规识别 · 打标签', 980, '#fde68a'],
    ['冷启动池（300 曝光）', '完播率 > 30% · 互动率 > 5%', 840, '#fdba74'],
    ['小流量池（3k–1w 播放）', '点赞率 > 3% · 评论率 > 0.5%', 700, '#fb923c'],
    ['中流量池（1w–10w 播放）', '转发率 > 1% · 关注转化 > 0.3%', 560, '#f97316'],
    ['大流量池（10w+ 播放）', '持续达标 → 推荐页热门', 420, '#ea580c']
  ];
  tiers.forEach((tr, i) => {
    const y = 100 + i * 84, x = (W - tr[2]) / 2;
    b += R(x, y, tr[2], 64, { fill: tr[3], rx: 10 });
    b += T(x + 24, y + 28, tr[0], { size: 18, bold: true, fill: '#7c2d12' });
    b += T(x + 24, y + 52, tr[1], { size: 14, fill: '#7c2d12' });
  });
  b += T(40, H - 22, '任一级未达标 → 流量止步于该级；完播率是第一权重', { size: 15, fill: muted });
  return svgWrap(W, H, b);
}

// 图2：15 秒带货脚本分镜
function ecStoryboard() {
  const W = 1080, H = 520;
  const ink = '#27272a', accent = '#ea580c', muted = '#78716c';
  let b = DEFS;
  b += T(40, 46, '15 秒带货脚本：钩子 → 价值 → 行动', { size: 24, bold: true, fill: ink });
  const shots = [
    ['0–3s 钩子', '「黄酒放冰箱？」疑问开场 + 特写倒酒'],
    ['3–8s 价值', '冰镇 8°C 口感演示 · 用户证言字幕'],
    ['8–12s 产品', '产地绍兴 · 手工冬酿 · 电商同款比价'],
    ['12–15s 行动', '「点击左下角小黄车」+ 库存紧迫感']
  ];
  shots.forEach((s, i) => {
    const x = 40 + i * 255;
    b += R(x, 90, 235, 190, { fill: i === 0 ? '#fff7ed' : '#fffbf5', stroke: i === 0 ? accent : '#e7e5e4', sw: 2 });
    b += T(x + 18, 122, s[0], { size: 17, bold: true, fill: i === 0 ? accent : ink });
    b += T(x + 18, 150, s[1], { size: 13.5, fill: ink });
    // 9:16 画面框
    b += R(x + 18, 168, 74, 96, { fill: '#f5f5f4', stroke: '#d6d3d1', sw: 1, rx: 4 });
    b += T(x + 36, 220, '9:16', { size: 12, fill: muted, mono: true });
    if (i < 3) b += L(x + 235, 185, x + 251, 185, { stroke: accent, sw: 2.5, arrow: true });
  });
  b += T(40, 330, '黄金 3 秒钩子模板（开场即钩子，省略一切铺垫）：', { size: 16, fill: ink });
  const hooks = ['疑问式：「黄酒还能这样喝？」', '反差式：「99% 的人不知道」', '利益式：「3 块钱喝到手工冬酿」'];
  hooks.forEach((h, i) => {
    b += R(40 + i * 340, 348, 320, 80, { fill: '#fff7ed', stroke: accent, sw: 1.5 });
    b += T(58 + i * 340, 382, h, { size: 15, fill: ink });
    b += T(58 + i * 340, 406, '前 3 秒完播决定能否出冷启动池', { size: 12, fill: muted });
  });
  b += T(40, H - 20, '分镜原则：一镜一信息 · 字幕同步 · 3 秒一切换', { size: 14, fill: muted });
  return svgWrap(W, H, b);
}

// 图3：数据复盘看板
function ecDashboard() {
  const W = 1080, H = 540;
  const ink = '#27272a', accent = '#ea580c', muted = '#78716c', green = '#16a34a';
  let b = DEFS;
  b += T(40, 46, '投放数据复盘看板（案例：黄酒带货第 3 天）', { size: 24, bold: true, fill: ink });
  const kpis = [
    ['播放量', '42.7w', '↑ 18% vs 上一条', true],
    ['完播率', '34.6%', '达标（阈值 30%）', true],
    ['互动率', '4.2%', '略低（阈值 5%）', false],
    ['转化率', '0.9%', '达标（阈值 0.8%）', true]
  ];
  kpis.forEach((k, i) => {
    const x = 40 + i * 255;
    b += R(x, 80, 235, 110, { fill: '#fffbf5', stroke: k[3] ? green : accent, sw: 2 });
    b += T(x + 20, 110, k[0], { size: 15, fill: muted });
    b += T(x + 20, 148, k[1], { size: 29, bold: true, fill: k[3] ? green : accent, mono: true });
    b += T(x + 20, 176, k[2], { size: 12.5, fill: muted });
  });
  // 完播率柱状图
  b += R(40, 220, 620, 280, { fill: '#fffdf9', stroke: '#e7e5e4', sw: 1 });
  b += T(60, 252, '完播率曲线（按秒）', { size: 17, bold: true, fill: ink });
  const bars = [['3s', 100], ['6s', 82], ['9s', 58], ['12s', 41], ['15s', 35]];
  const bx0 = 84, by0 = 466, bw = 88, gap = 26;
  bars.forEach((bar, i) => {
    const h = bar[1] / 100 * 180;
    const x = bx0 + i * (bw + gap);
    b += R(x, by0 - h, bw, h, { fill: bar[1] >= 30 ? '#fb923c' : '#fdba74', rx: 4 });
    b += T(x + bw / 2 - 14, by0 - h - 8, String(bar[1]), { size: 13, fill: ink, mono: true });
    b += T(x + bw / 2 - 9, by0 + 22, bar[0], { size: 13, fill: muted, mono: true });
  });
  b += L(bx0, by0, bx0 + 5 * (bw + gap), by0, { stroke: ink, sw: 1.5 });
  // 优化建议
  b += R(690, 220, 350, 280, { fill: '#fff7ed', stroke: accent, sw: 1.5 });
  b += T(710, 252, '数据反推优化动作', { size: 17, bold: true, fill: accent });
  const tips = [
    '6–9s 掉量 24pt → 中段信息密度不足',
    '互动率 4.2% 偏低 → 结尾加投票贴纸',
    '9s 处补产品特写拉住注意力',
    '评论区置顶「冰镇温度」话术引导'
  ];
  tips.forEach((t, i) => {
    b += R(710, 270 + i * 54, 310, 44, { fill: '#ffffff', stroke: '#e7d5c4', sw: 1, rx: 8 });
    b += T(722, 298 + i * 54, t, { size: 14, fill: ink });
  });
  return svgWrap(W, H, b);
}

// ============ 渲染入口 ============
async function renderAll(outDir) {
  const fs = require('fs');
  const path = require('path');
  fs.mkdirSync(outDir, { recursive: true });
  const jobs = [
    ['cs-subnet-blocks.png', csSubnetBlocks],
    ['cs-class-ranges.png', csClassRanges],
    ['cs-and-operation.png', csAndOperation],
    ['me-interlock.png', meInterlock],
    ['me-ladder.png', meLadder],
    ['me-safety-flow.png', meSafetyFlow],
    ['ac-t-accounts.png', acTAccounts],
    ['ac-entry-steps.png', acEntrySteps],
    ['ac-trial-balance.png', acTrialBalance],
    ['arch-plan.png', archPlan],
    ['arch-legends.png', archLegends],
    ['ec-funnel.png', ecFunnel],
    ['ec-storyboard.png', ecStoryboard],
    ['ec-dashboard.png', ecDashboard]
  ];
  const results = [];
  for (const j of jobs) {
    const p = path.join(outDir, j[0]);
    try {
      const info = await sharp(Buffer.from(j[1]()), { density: 144 }).png().toFile(p);
      results.push({ file: j[0], ok: true, w: info.width, h: info.height });
    } catch (e) {
      results.push({ file: j[0], ok: false, err: String(e.message).slice(0, 90) });
    }
  }
  return results;
}

module.exports = { renderAll };
