// 智备教案 - 简易 Web 服务（现场演示用）
// 启动：node server.js  →  浏览器打开 http://localhost:3000
const http = require('http');
const fs = require('fs');
const path = require('path');
const { buildLessonPlan } = require('./content.js');
const { genDocx } = require('./gen-docx.js');
const { genPptx } = require('./gen-pptx.js');
const { genPptxPptwise } = require('./gen-pptx-pptwise.js');
const { genPptxSlides } = require('./gen-pptx-slides.js');
const { polishPptx } = require('./polish-pptx.js');
const { oneClickGenerate } = require('./one-click.js');
const { unifiedGenerate } = require('./unified.js');

const PUBLIC = path.join(__dirname, 'public');
const OUTPUT = path.join(__dirname, 'output');

const DOCX_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const PPTX_TYPE = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';

function readBody(req) {
  return new Promise(function (resolve) {
    let body = '';
    req.on('data', function (c) { body += c; });
    req.on('end', function () { resolve(body); });
  });
}

const server = http.createServer(async function (req, res) {
  try {
    const url = new URL(req.url, 'http://localhost');
    // CORS：允许工作台/预览页跨域调用（仅开放本机常用来源）
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

    // 健康检查（窗口4控制台探测用）
    if (req.method === 'GET' && url.pathname === '/api/health') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: true, app: 'zhibei-lesson', version: '1.1', time: Date.now() }));
      return;
    }

    // 一体化生成（异步任务：课程信息 → 教案四轮迭代 + 全套成品 docx/pptx/html/双pdf）
    const JOBS = global.ZHIBEI_JOBS || (global.ZHIBEI_JOBS = new Map());
    if (req.method === 'POST' && url.pathname === '/api/unified') {
      const input = JSON.parse(await readBody(req));
      const taskId = 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const job = { id: taskId, state: 'running', stage: '排队中', startedAt: Date.now(), files: [], errors: [], title: input.topic || '', mode: null, durationSec: 0, meta: null };
      JOBS.set(taskId, job);
      // 异步执行（不阻塞响应）
      (async function () {
        try {
          job.stage = 'AI 四轮迭代（联网检索 → 初稿 → 评审 → 定稿）';
          const outDir = path.join(__dirname, 'output-unified');
          const r = await unifiedGenerate(Object.assign({}, input, {
            _onStage: function (s) { job.stage = s; }
          }), outDir);
          job.state = 'done';
          job.title = r.title; job.mode = r.mode; job.durationSec = r.durationSec; job.errors = r.errors;
          job.files = r.files.map(function (f) {
            return { type: f.type, label: f.label, name: path.basename(f.path), url: '/files-unified/' + encodeURIComponent(path.basename(f.path)) };
          });
          const m = (r.plan && r.plan._meta) || null;
          if (m) {
            job.meta = {
              model: m.model, reasoningEffort: m.reasoningEffort, webSearch: m.webSearch,
              sources: (m.rounds && m.rounds.research && m.rounds.research.sources || []).slice(0, 8),
              review: m.rounds && m.rounds.review && m.rounds.review.content ? m.rounds.review.content.slice(0, 2000) : null,
              reasoningFinal: m.rounds && m.rounds.finalize && m.rounds.finalize.reasoning ? m.rounds.finalize.reasoning.slice(0, 1500) : null
            };
          }
        } catch (e) {
          job.state = 'failed';
          job.errors = [String(e.message || e)];
        }
      })();
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: true, taskId: taskId }));
      return;
    }
    if (req.method === 'GET' && url.pathname === '/api/unified/status') {
      const job = JOBS.get(url.searchParams.get('id') || '');
      if (!job) { res.writeHead(404, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ ok: false, error: '任务不存在' })); return; }
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: true, job: job }));
      return;
    }

    // 一体化产物下载
    if (req.method === 'GET' && url.pathname.startsWith('/files-unified/')) {
      const name = path.basename(decodeURIComponent(url.pathname));
      const file = path.join(__dirname, 'output-unified', name);
      if (!fs.existsSync(file)) { res.writeHead(404); res.end('Not Found'); return; }
      const ext = path.extname(name).toLowerCase();
      const types = {
        '.html': 'text/html; charset=utf-8', '.pdf': 'application/pdf',
        '.docx': DOCX_TYPE, '.pptx': PPTX_TYPE
      };
      res.writeHead(200, {
        'Content-Type': types[ext] || 'application/octet-stream',
        'Content-Disposition': 'attachment; filename="' + encodeURIComponent(name) + '"'
      });
      res.end(fs.readFileSync(file));
      return;
    }

    // 一键生成（通用主题：PPT HTML/PPTX/PDF + 可选教案 DOCX/PDF）
    if (req.method === 'POST' && url.pathname === '/api/oneclick') {
      const input = JSON.parse(await readBody(req));
      const outDir = path.join(__dirname, 'output-oneclick');
      const r = await oneClickGenerate(input, outDir);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        ok: true,
        deckMode: r.deckMode,
        lessonMode: r.lessonMode,
        errors: r.errors,
        files: r.files.map(function (f) {
          return { type: f.type, label: f.label, name: path.basename(f.path), url: '/files/' + encodeURIComponent(path.basename(f.path)) };
        }),
        title: (r.plan && r.plan.title) || input.topic || '生成完成'
      }));
      return;
    }

    // 一键生成产物下载
    if (req.method === 'GET' && url.pathname.startsWith('/files/')) {
      const name = path.basename(decodeURIComponent(url.pathname));
      const file = path.join(__dirname, 'output-oneclick', name);
      if (!fs.existsSync(file)) { res.writeHead(404); res.end('Not Found'); return; }
      const ext = path.extname(name).toLowerCase();
      const types = {
        '.html': 'text/html; charset=utf-8', '.pdf': 'application/pdf',
        '.docx': DOCX_TYPE, '.pptx': PPTX_TYPE
      };
      res.writeHead(200, {
        'Content-Type': types[ext] || 'application/octet-stream',
        'Content-Disposition': 'attachment; filename="' + encodeURIComponent(name) + '"'
      });
      res.end(fs.readFileSync(file));
      return;
    }

    // 首页
    if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(fs.readFileSync(path.join(PUBLIC, 'index.html')));
      return;
    }

    // 生成接口
    if (req.method === 'POST' && url.pathname === '/api/generate') {
      const input = JSON.parse(await readBody(req));
      input.knowledgePoints = (input.knowledgePoints || []).map(function (s) { return (s || '').trim(); }).filter(Boolean);
      const plan = await buildLessonPlan(input);
      if (!plan.knowledgePoints) plan.knowledgePoints = input.knowledgePoints || [plan.topic];
      fs.mkdirSync(OUTPUT, { recursive: true });
      const stamp = Date.now();
      const docx = path.join(OUTPUT, 'lesson_' + stamp + '.docx');
      let pptx = path.join(OUTPUT, 'slides_' + stamp + '.pptx');
      await genDocx(plan, docx);
      // PPT 引擎链：指定主题(theme)时 dsh-slides 优先（唯一支持 5 主题）；否则 pptwise > dsh-slides > pptxgenjs
      let usedEngine = false;
      let engineName = 'pptxgenjs';
      const wantTheme = input.theme && input.theme !== 'plain';
      if (wantTheme) {
        // 用户选了 5 主题之一 → 直接用 dsh-slides 渲染
        try {
          const r2 = await genPptxSlides(plan, OUTPUT, { theme: input.theme });
          if (r2.used) { usedEngine = true; engineName = 'dsh-slides'; pptx = r2.pptxPath; }
        } catch (e) { console.warn('[server] dsh-slides(theme) 失败，回退:', e.message); }
      }
      if (!usedEngine) {
        try {
          const r = genPptxPptwise(plan, OUTPUT);
          if (r.used) { usedEngine = true; engineName = 'pptwise'; pptx = r.pptxPath; }
        } catch (e) { console.warn('[server] pptwise 失败，尝试 dsh-slides:', e.message); }
      }
      if (!usedEngine) {
        try {
          const r2 = await genPptxSlides(plan, OUTPUT, { theme: input.theme || 'plain' });
          if (r2.used) { usedEngine = true; engineName = 'dsh-slides'; pptx = r2.pptxPath; }
        } catch (e) { console.warn('[server] dsh-slides 失败，回退 pptxgenjs:', e.message); }
      }
      if (!usedEngine) await genPptx(plan, pptx);
      // 动画打磨：转场 + 入场动画 + 演讲者备注（本机 PowerPoint 可用时）
      try { polishPptx(pptx, buildNotes(plan), { maxShapesPerSlide: 6 }); } catch (e) { console.warn('[server] 动画打磨跳过：', e.message); }
      const meta = buildMeta(plan);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        ok: true,
        title: plan.title,
        docx: '/download/' + path.basename(docx),
        pptx: '/download/' + path.basename(pptx),
        meta: meta
      }));
      return;
    }

    // 下载
    if (req.method === 'GET' && url.pathname.startsWith('/download/')) {
      const name = path.basename(url.pathname);
      const file = path.join(OUTPUT, name);
      if (!fs.existsSync(file)) { res.writeHead(404); res.end('Not Found'); return; }
      const type = path.extname(name).toLowerCase() === '.docx' ? DOCX_TYPE : PPTX_TYPE;
      res.writeHead(200, {
        'Content-Type': type,
        'Content-Disposition': 'attachment; filename="' + encodeURIComponent(name) + '"'
      });
      res.end(fs.readFileSync(file));
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not Found');
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ ok: false, error: e.message }));
  }
});

// 按页生成演讲者备注（与 pptwise 8 页结构对应）
function buildNotes(plan) {
  const t = (s, n) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, n);
  const proc = plan.process || [];
  const procNote = (i, dft) => proc[i] ? (t(proc[i].teacher, 60) + (proc[i].intent ? '｜意图：' + t(proc[i].intent, 40) : '')) : dft;
  return [
    '开场：本节课主题「' + t(plan.topic, 30) + '」，' + (plan.hours || '2课时') + '。先以提问导入，激活前备知识。',
    '学习目标页：逐条讲解三维目标，强调「知识→能力→素养」递进关系，让学生明确本节课要达成的可测量成果。',
    '知识框架页：逐个点击展示知识点，构建整体认知地图，说明知识点间的逻辑顺序。',
    '重点难点页：先讲重点（' + t(plan.keyPoints, 30) + '），再讲难点（' + t(plan.difficulties, 30) + '），说明突破策略。',
    '教学过程页（五环节）：' + procNote(0, '按导入→新课→巩固→小结→作业推进'),
    procNote(1, '新课讲授环节：概念讲解与案例演示结合。'),
    '作业布置页：' + t(plan.homework, 80),
    '结束页：回顾本节课知识框架，预告下节课内容，布置课后任务。'
  ];
}

// 提取 AI 多轮生成的过程信息（思考过程、评审、参考来源）
function buildMeta(plan) {
  if (!plan._meta || !plan._meta.rounds) return null;
  const r = plan._meta.rounds;
  return {
    model: plan._meta.model || '',
    reasoningEffort: plan._meta.reasoningEffort || '',
    webSearch: !!plan._meta.webSearch,
    sources: (r.research && r.research.sources) || [],
    research: (r.research && r.research.content) || '',
    review: (r.review && r.review.content) || '',
    reasoningDraft: (r.draft && r.draft.reasoning) || '',
    reasoningFinal: (r.finalize && r.finalize.reasoning) || ''
  };
}

const PORT = 3000;
server.listen(PORT, function () {
  console.log('智备教案已启动：http://localhost:' + PORT);
});