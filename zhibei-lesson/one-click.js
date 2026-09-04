// 智备教案 - 一键生成模块（通用主题版：PPT + 教案 + Word + PDF）
// 借鉴 Gamma / Kimi PPT / 讯飞智文 的「大纲先行 → 逐页填充 → 主题渲染」流水线：
//   1. AI 生成结构化大纲（每页 layout/title/bullets/notes）
//   2. 大纲绑定主题渲染为 HTML deck + 原生可编辑 PPTX（dsh-slides 引擎）
//   3. Edge 无头打印导出 PDF（课件 PDF / 教案 PDF）
//   4. 教案走既有四轮迭代流水线（联网检索→初稿→评审→定稿）输出 Word docx
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFile } = require('child_process');
const { chat } = require('./llm.js');
const { generateLessonPlan, parsePlan } = require('./pipeline.js');

// ---------- Deck 大纲 Schema ----------
const DECK_SCHEMA = `{
  "title": "演示标题",
  "subtitle": "副标题",
  "author": "作者/单位",
  "slides": [
    { "layout": "title|section|bullets|quote|image", "title": "页标题",
      "subtitle": "副标题(可选)", "bullets": ["要点1", "要点2"],
      "quote": "金句(quote布局用)", "attribution": "署名(quote布局用)",
      "notes": "演讲者备注" }
  ]
}`;

const DECK_SYS = '你是一位资深演示设计专家，擅长把任何主题组织成结构清晰、信息密度得当的演示文稿。' +
  '请严格按下方 JSON 结构输出演示大纲，只输出一个合法 JSON 对象，不要 Markdown 代码块、不要注释、不要多余文字。\n\n' +
  '输出 JSON 结构：' + DECK_SCHEMA + '\n\n' +
  '设计规范：1) 第一页必须是 title 布局；2) 中间穿插 1~2 页 section 布局做分节；3) 主体用 bullets，每页 3~6 条、每条不超过 30 字，一条一个信息点；' +
  '4) 结尾用 quote 布局收束主题；5) 每页都写 notes 演讲者备注（1~2 句，讲这页时说什么）；6) 内容具体、有干货，不要空话套话。';

function templateOutline(input) {
  // 离线兜底大纲
  const topic = input.topic || '演示主题';
  const audience = input.audience || '观众';
  const n = Math.min(10, Math.max(6, Number(input.slides) || 8));
  const slides = [{ layout: 'title', title: topic, subtitle: input.subtitle || ('面向' + audience + '的演示'), notes: '开场：一句话点题，说明今天讲什么。' }];
  const sections = ['背景与现状', '核心概念', '方法与步骤', '案例与实践', '总结与展望'];
  for (let i = 0; i < n - 2; i++) {
    const sec = sections[i % sections.length];
    slides.push({ layout: 'bullets', title: sec + (i >= sections.length ? '（续）' : ''), bullets: [topic + ' 的关键要点 ' + (i + 1), '具体做法与注意事项', '一个真实例子'], notes: '逐条讲解，结合例子。' });
  }
  slides.push({ layout: 'quote', title: '小结', quote: '把最重要的一件事带回去', attribution: topic, notes: '收束：回顾主线，给行动建议。' });
  return { title: topic, subtitle: input.subtitle || '', author: input.author || '智备教案', slides };
}

async function buildDeckOutline(input, llm) {
  if (!llm || !llm.apiKey) return { deck: templateOutline(input), mode: 'template' };
  try {
    const user = '主题：' + (input.topic || '') + '\n受众：' + (input.audience || '通用') + '\n页数：' + (input.slides || 8) +
      ' 页左右\n补充要求：' + (input.extra || '（无）') + '\n\n请生成演示大纲 JSON。';
    const r = await chat(Object.assign({}, llm, {
      messages: [{ role: 'system', content: DECK_SYS }, { role: 'user', content: user }],
      jsonMode: true, maxTokens: 8000
    }));
    let t = String(r.content || '').trim().replace(/^```[a-zA-Z]*\s*/, '').replace(/\s*```$/, '');
    const m = t.match(/\{[\s\S]*\}/);
    if (m) t = m[0];
    const deck = JSON.parse(t.replace(/,\s*([}\]])/g, '$1'));
    if (!deck.slides || !deck.slides.length) throw new Error('空大纲');
    deck.slides.forEach(s => { if (!s.layout) s.layout = 'bullets'; });
    return { deck: deck, mode: 'ai', reasoning: r.reasoning };
  } catch (e) {
    console.warn('[one-click] AI 大纲失败，回退模板：', e.message);
    return { deck: templateOutline(input), mode: 'template' };
  }
}

// ---------- dsh-slides 渲染 ----------
function findSlidesLib() {
  const cands = [
    process.env.DSH_SLIDES_LIB || '',
    path.join(os.homedir(), '.dsh', 'profiles', 'web', 'node_modules', 'dsh-slides', 'lib', 'index.js'),
    path.join(process.env.APPDATA || '', 'npm', 'node_modules', 'dsh-slides', 'lib', 'index.js')
  ];
  for (const c of cands) if (c && fs.existsSync(c)) return c;
  return null;
}

async function renderDeck(deck, outDir, themeName) {
  const libPath = findSlidesLib();
  if (!libPath) throw new Error('dsh-slides 未安装');
  const lib = await import('file:///' + libPath.replace(/\\/g, '/'));
  lib.validateDeck(deck);
  const theme = lib.resolveTheme(themeName || 'plain');
  const stem = '课件_' + String(deck.title || '课件').replace(/[\\/:*?"<>|]/g, '_');
  fs.mkdirSync(outDir, { recursive: true });
  const htmlPath = path.join(outDir, stem + '.html');
  const pptxPath = path.join(outDir, stem + '.pptx');
  fs.writeFileSync(htmlPath, lib.renderDeckHtml(deck, theme), 'utf8');
  fs.writeFileSync(pptxPath, await lib.renderDeckPptx(deck, theme, {}));
  return { htmlPath, pptxPath };
}

// ---------- PDF 导出（Edge 无头打印） ----------
function findEdge() {
  const cands = [
    path.join(process.env['ProgramFiles(x86)'] || '', 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    path.join(process.env.ProgramFiles || '', 'Microsoft', 'Edge', 'Application', 'msedge.exe')
  ];
  for (const c of cands) if (c && fs.existsSync(c)) return c;
  return null;
}

function htmlToPdf(htmlPath, pdfPath) {
  return new Promise(function (resolve) {
    const edge = findEdge();
    if (!edge) return resolve({ ok: false, reason: '未找到 Edge 浏览器' });
    const udd = path.join(os.tmpdir(), 'zhibei-pdf-profile-' + Date.now());
    execFile(edge, [
      '--headless', '--disable-gpu', '--no-first-run',
      '--no-pdf-header-footer',
      '--user-data-dir=' + udd,
      '--print-to-pdf=' + pdfPath,
      'file:///' + htmlPath.replace(/\\/g, '/')
    ], { timeout: 60000 }, function (err) {
      try { if (fs.existsSync(udd)) fs.rmSync(udd, { recursive: true, force: true }); } catch (e) {}
      if (!err && fs.existsSync(pdfPath)) return resolve({ ok: true, pdfPath: pdfPath });
      resolve({ ok: false, reason: err ? err.message : 'PDF 未生成' });
    });
  });
}

// 教案 → 打印版 HTML（A4 版式）
function lessonToPrintHtml(plan) {
  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const rows = (plan.process || []).map(function (p) {
    return '<tr><td>' + esc(p.step) + '</td><td>' + esc(p.minutes) + '</td><td>' + esc(p.teacher) + '</td><td>' + esc(p.student) + '</td><td>' + esc(p.intent) + '</td></tr>';
  }).join('');
  return '<!doctype html><html><head><meta charset="utf-8"><title>' + esc(plan.title || plan.topic) + '</title><style>' +
    '@page { size: A4; margin: 18mm 16mm; }' +
    'body { font-family: "Microsoft YaHei", sans-serif; color: #222; font-size: 12.5px; line-height: 1.8; }' +
    'h1 { text-align: center; color: #1F3864; font-size: 20px; margin: 0 0 4px; }' +
    '.sub { text-align: center; color: #888; font-size: 11px; margin-bottom: 14px; }' +
    'table { width: 100%; border-collapse: collapse; margin: 6px 0 12px; }' +
    'th, td { border: 1px solid #9db3d1; padding: 6px 8px; font-size: 11.5px; text-align: left; vertical-align: top; }' +
    'th { background: #EDF2FA; color: #1F3864; }' +
    'h2 { color: #1F3864; font-size: 15px; border-left: 4px solid #2E74B5; padding-left: 8px; margin: 16px 0 8px; }' +
    '.bb { background: #f6f8fc; border: 1px solid #d8dee8; border-radius: 6px; padding: 10px 14px; white-space: pre-wrap; font-family: Consolas, "Microsoft YaHei"; font-size: 11.5px; }' +
    '</style></head><body>' +
    '<h1>' + esc(plan.title || plan.topic) + '</h1>' +
    '<div class="sub">课程：' + esc(plan.course) + '｜章节：' + esc(plan.chapter) + '｜对象：' + esc(plan.audience) + '｜课时：' + esc(plan.hours) + '｜教师：' + esc(plan.teacher) + '｜日期：' + esc(plan.date) + '</div>' +
    '<h2>一、教学目标</h2><p>1. 知识目标：' + esc(plan.goals && plan.goals.knowledge) + '<br/>2. 能力目标：' + esc(plan.goals && plan.goals.ability) + '<br/>3. 素养目标：' + esc(plan.goals && plan.goals.quality) + '</p>' +
    '<h2>二、教学重点与难点</h2><p>重点：' + esc(plan.keyPoints) + '<br/>难点：' + esc(plan.difficulties) + '</p>' +
    '<h2>三、教学准备</h2><p>' + esc(plan.preparation) + '</p>' +
    '<h2>四、教学过程</h2><table><thead><tr><th>环节</th><th>时间</th><th>教师活动</th><th>学生活动</th><th>设计意图</th></tr></thead><tbody>' + rows + '</tbody></table>' +
    '<h2>五、板书设计</h2><div class="bb">' + esc(plan.blackboard) + '</div>' +
    '<h2>六、作业布置</h2><p>' + esc(plan.homework) + '</p>' +
    '<h2>七、教学反思</h2><p>' + esc(plan.reflection) + '</p>' +
    '</body></html>';
}

// ---------- 一键主流程 ----------
// input: { topic, audience, slides, extra, theme, author, subtitle,
//          wantLesson, lessonInput, aiApiKey, aiProvider, aiModel, aiReasoningEffort, aiWebSearch, aiBaseUrl }
async function oneClickGenerate(input, outDir) {
  fs.mkdirSync(outDir, { recursive: true });
  const results = { files: [], deckMode: 'template', lessonMode: null, errors: [] };

  const llm = input.aiApiKey ? {
    provider: input.aiProvider || 'abc', apiKey: input.aiApiKey,
    baseUrl: input.aiBaseUrl || undefined, model: input.aiModel || 'glm-5.3',
    reasoningEffort: input.aiReasoningEffort || 'high', webSearch: input.aiWebSearch !== false
  } : null;

  // 1) 演示大纲 + 渲染
  try {
    const outline = await buildDeckOutline(input, llm);
    results.deckMode = outline.mode;
    const deck = outline.deck;
    const r = await renderDeck(deck, outDir, input.theme);
    results.files.push({ type: 'deck-html', path: r.htmlPath, label: '课件 HTML（浏览器放映）' });
    results.files.push({ type: 'deck-pptx', path: r.pptxPath, label: '课件 PPTX（可编辑）' });
    // 课件 PDF
    const pdfPath = r.htmlPath.replace(/\.html$/, '.pdf');
    const pr = await htmlToPdf(r.htmlPath, pdfPath);
    if (pr.ok) results.files.push({ type: 'deck-pdf', path: pdfPath, label: '课件 PDF（可打印）' });
    else results.errors.push('课件 PDF：' + pr.reason);
  } catch (e) { results.errors.push('课件生成：' + e.message); }

  // 2) 教案（可选）
  if (input.wantLesson) {
    try {
      const lessonInput = Object.assign({
        course: input.topic || '课程', topic: input.topic || '主题',
        audience: input.audience || '学生', hours: '2 课时（90 分钟）'
      }, input.lessonInput || {});
      let plan;
      if (llm) {
        const res = await generateLessonPlan(lessonInput, llm);
        plan = res.plan;
        results.lessonMode = 'ai';
      } else {
        plan = null;
      }
      if (!plan) {
        const { templateGenerate } = require('./content.js');
        plan = templateGenerate(lessonInput);
        results.lessonMode = 'template';
      }
      const { genDocx } = require('./gen-docx.js');
      const safe = String(plan.topic || '教案').replace(/[\\/:*?"<>|]/g, '_');
      const docxPath = path.join(outDir, '教案_' + safe + '.docx');
      await genDocx(plan, docxPath);
      results.files.push({ type: 'lesson-docx', path: docxPath, label: '教案 Word（可编辑）' });
      // 教案 PDF
      const printHtml = path.join(outDir, '教案_' + safe + '_print.html');
      fs.writeFileSync(printHtml, lessonToPrintHtml(plan), 'utf8');
      const lessonPdf = printHtml.replace(/_print\.html$/, '.pdf');
      const lp = await htmlToPdf(printHtml, lessonPdf);
      if (lp.ok) results.files.push({ type: 'lesson-pdf', path: lessonPdf, label: '教案 PDF（可打印）' });
      else results.errors.push('教案 PDF：' + lp.reason);
      results.plan = plan;
    } catch (e) { results.errors.push('教案生成：' + e.message); }
  }

  return results;
}

module.exports = { oneClickGenerate, buildDeckOutline, templateOutline, renderDeck, htmlToPdf, lessonToPrintHtml };
