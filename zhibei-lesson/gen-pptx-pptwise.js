// 智备教案 - PPT 课件生成器（pptwise：原生可编辑、内容充实）
// 把 4 轮 AI 生成的真实教案内容映射成 pptwise deck（spec + pages），再渲染成 .pptx
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');

// 定位 pptwise CLI：优先 DSH 插件安装路径，其次 npx
function findPptwiseCli() {
  const candidates = [
    process.env.PPTWISE_CLI || '',
    path.join(process.env.USERPROFILE || '~', '.dsh', 'profiles', 'web', 'node_modules', '@liustack', 'pptwise', 'dist', 'cli.js'),
    path.join(process.env.APPDATA || '', 'npm', 'node_modules', '@liustack', 'pptwise', 'dist', 'cli.js')
  ];
  for (const c of candidates) {
    if (c && fs.existsSync(c)) return c;
  }
  return null;
}

// 截断/安全处理（pptwite bullet 单条约 14 个汉字内最稳）
function clip(s, n) {
  if (!s) return '';
  s = String(s).replace(/\s+/g, ' ').trim();
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

function safeName(s) {
  return String(s || '课件').replace(/[\\/:*?"<>|]/g, '_');
}

// 把教案 plan 映射为 pptwise deck（返回 deck 目录路径）
function buildDeck(plan, deckDir) {
  fs.mkdirSync(path.join(deckDir, 'pages'), { recursive: true });
  const kp = (plan.knowledgePoints && plan.knowledgePoints.length) ? plan.knowledgePoints : [plan.topic || '本章核心'];
  const topic = plan.topic || kp[0];
  const course = plan.course || '课程';
  const chapter = plan.chapter || '';

  const spec = {
    version: '1',
    filename: '课件_' + safeName(topic) + '.pptx',
    narrative: 'training',
    theme: 'classroom',
    meta: { organization: course, date: plan.date || '' },
    pages: [
      { id: 'cover', type: 'cover', heading: topic, summary: course + (chapter ? ' · ' + chapter : '') },
      { id: 'goals', type: 'content', kind: 'points', heading: '学习目标', summary: '知识·能力·素养三维目标' },
      { id: 'framework', type: 'content', kind: 'list', heading: '知识框架', summary: '本节课的知识点' },
      { id: 'key-difficult', type: 'content', kind: 'comparison', heading: '重点与难点', summary: '教学重难点' },
      { id: 'process', type: 'content', kind: 'process', heading: '教学过程', summary: '五个教学环节' },
      { id: 'blackboard', type: 'content', kind: 'list', heading: '板书设计', summary: '板书框架' },
      { id: 'homework', type: 'content', kind: 'list', heading: '作业布置', summary: '课后巩固' },
      { id: 'ending', type: 'ending', heading: '课堂小结', summary: '回顾 + 作业' }
    ]
  };
  fs.writeFileSync(path.join(deckDir, 'deck.spec.json'), JSON.stringify(spec, null, 2), 'utf8');

  const P = (id, obj) => fs.writeFileSync(path.join(deckDir, 'pages', id + '.json'), JSON.stringify(obj, null, 2), 'utf8');

  // 0. 封面（写 subheading 以去掉 placeholder 标记）
  P('cover', { subheading: course + (chapter ? ' · ' + chapter : '') });

  // 1. 学习目标（numbered_cards：标题短 + 详情长，避免 bullet 截断）
  P('goals', { components: [
    { type: 'numbered_cards', items: [
      { title: '知识目标', text: clip(plan.goals && plan.goals.knowledge || '掌握本课核心概念与原理', 48) },
      { title: '能力目标', text: clip(plan.goals && plan.goals.ability || '能运用所学解决实际问题', 48) },
      { title: '素养目标', text: clip(plan.goals && plan.goals.quality || '培养严谨求实的科学态度', 48) }
    ] }
  ] });

  // 2. 知识框架（bullets）
  P('framework', { components: [
    { type: 'bullets', items: kp.map((k, i) => clip('知识点' + (i + 1) + ' · ' + k, 18)) }
  ] });

  // 3. 重点难点（comparison）
  P('key-difficult', { components: [
    { type: 'comparison', columns: ['教学重点', '教学难点'], rows: [
      { label: '内容', cells: [clip(plan.keyPoints || '', 26), clip(plan.difficulties || '', 26)] },
      { label: '突破方法', cells: ['案例演示 + 精讲', '分层练习 + 反馈'] }
    ] }
  ] });

  // 4. 教学过程（steps：5 环节）
  const proc = (plan.process && plan.process.length) ? plan.process : [
    { step: '导入新课', teacher: '' }, { step: '新课讲授', teacher: '' },
    { step: '巩固练习', teacher: '' }, { step: '课堂小结', teacher: '' }, { step: '作业布置', teacher: '' }
  ];
  P('process', { components: [
    { type: 'steps', items: proc.slice(0, 5).map((s) => ({
      title: clip(String(s.step || '环节').replace(/^[一二三四五六七八九十]+、/, ''), 8),
      text: clip((s.minutes != null ? s.minutes + 'min · ' : '') + (s.teacher || s.intent || ''), 30)
    })) }
  ] });

  // 5. 板书设计（bullets：拆分行）
  const bb = (plan.blackboard || '').split('\n').map((l) => clip(l.replace(/^【.*?】/, ''), 18)).filter(Boolean);
  P('blackboard', { components: [
    { type: 'bullets', items: (bb.length ? bb : [clip(kp.join(' → '), 18)]).slice(0, 5) }
  ] });

  // 6. 作业布置（bullets）
  P('homework', { components: [
    { type: 'bullets', items: [
      clip(plan.homework || '完成课后练习', 22),
      '提交：学习平台线上提交',
      '评价：准确性 + 完整性'
    ] }
  ] });

  // 7. 结尾
  P('ending', { subheading: '智备教案 · AI 一键生成' });

  return deckDir;
}

// 渲染 deck（调用 pptwise CLI），返回 .pptx 路径；pptwise 不可用返回 null
function renderDeck(deckDir, outDir, pptxName) {
  const cli = findPptwiseCli();
  if (!cli) return null;
  fs.mkdirSync(outDir, { recursive: true });
  const outPptx = path.join(outDir, pptxName || '课件.pptx');
  try {
    // 注意：本环境子进程不能用 stdio:'pipe'（命名管道 EPERM），统一用 'ignore'，
    // 并用 render -o 显式指定输出路径，避免解析 stdout。
    execFileSync(process.execPath, [cli, 'assemble', deckDir], { stdio: 'ignore' });
    execFileSync(process.execPath, [cli, 'render', deckDir, '-o', outPptx], { stdio: 'ignore' });
    return fs.existsSync(outPptx) ? outPptx : null;
  } catch (e) {
    return null;
  }
}

// 一键：生成 deck + 渲染，返回 { pptxPath, deckDir, used }；pptwise 不可用返回 used=false
function genPptxPptwise(plan, outDir, deckDir) {
  const dir = deckDir || path.join(outDir, '.deck_' + safeName(plan.topic));
  buildDeck(plan, dir);
  const pptxName = '课件_' + safeName(plan.topic || '课件') + '.pptx';
  const pptxPath = renderDeck(dir, outDir, pptxName);
  return { pptxPath, deckDir: dir, used: !!pptxPath };
}

module.exports = { buildDeck, renderDeck, genPptxPptwise, findPptwiseCli };