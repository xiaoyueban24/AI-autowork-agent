// 智备教案 - PPT 课件生成器（dsh-slides 引擎：HTML deck + 可编辑 PPTX 双格式）
// 把教案 plan 映射为 dsh-slides DeckSpec，渲染出自包含 HTML 演示 + 原生可编辑 PPTX
const fs = require('fs');
const path = require('path');
const os = require('os');

// dsh-slides 库位置（DSH profile 安装路径）
function findSlidesLib() {
  const cands = [
    process.env.DSH_SLIDES_LIB || '',
    path.join(os.homedir(), '.dsh', 'profiles', 'web', 'node_modules', 'dsh-slides', 'lib', 'index.js'),
    path.join(process.env.APPDATA || '', 'npm', 'node_modules', 'dsh-slides', 'lib', 'index.js')
  ];
  for (const c of cands) {
    if (c && fs.existsSync(c)) return c;
  }
  return null;
}

function clip(s, n) {
  if (!s) return '';
  s = String(s).replace(/\s+/g, ' ').trim();
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

function safeName(s) {
  return String(s || '课件').replace(/[\\/:*?"<>|]/g, '_');
}

// 教案 plan -> DeckSpec（布局：title/bullets/section/quote，支持 notes 演讲备注）
function planToDeck(plan) {
  const kp = (plan.knowledgePoints && plan.knowledgePoints.length) ? plan.knowledgePoints : [plan.topic || '本章核心'];
  const topic = plan.topic || kp[0];
  const course = plan.course || '课程';
  const chapter = plan.chapter || '';
  const proc = (plan.process && plan.process.length) ? plan.process : [];

  const slides = [];
  // 标题页
  slides.push({
    layout: 'title',
    title: topic,
    subtitle: course + (chapter ? ' · ' + chapter : '') + (plan.hours ? '｜' + plan.hours : ''),
    notes: '开场页：介绍主题，说明学习目标。' 
  });
  // 学习目标（bullets）
  slides.push({
    layout: 'bullets',
    title: '学习目标',
    bullets: [
      '知识：' + clip(plan.goals && plan.goals.knowledge, 60),
      '能力：' + clip(plan.goals && plan.goals.ability, 60),
      '素养：' + clip(plan.goals && plan.goals.quality, 60)
    ],
    notes: '三维目标逐条讲解，强调递进关系。'
  });
  // 知识框架（bullets）
  slides.push({
    layout: 'bullets',
    title: '知识框架',
    bullets: kp.map((k, i) => clip('知识点' + (i + 1) + ' · ' + k, 70)),
    notes: '构建整体认知地图，说明知识点逻辑顺序。'
  });
  // 重点难点（bullets 对比）
  slides.push({
    layout: 'bullets',
    title: '重点与难点',
    bullets: [
      '重点：' + clip(plan.keyPoints, 60),
      '难点：' + clip(plan.difficulties, 60)
    ],
    notes: '先讲重点再讲难点，说明突破策略。'
  });
  // 教学过程（每环节一页）
  const procSteps = proc.slice(0, 5);
  procSteps.forEach((p, i) => {
    slides.push({
      layout: 'bullets',
      title: clip(String(p.step || '环节' + (i + 1)).replace(/^[一二三四五六七八九十]+、/, ''), 12),
      bullets: [
        (p.minutes != null ? p.minutes + 'min · ' : '') + '教师：' + clip(p.teacher, 55),
        '学生：' + clip(p.student, 55),
        '意图：' + clip(p.intent, 45)
      ].filter(Boolean),
      notes: clip(p.teacher, 200) + (p.intent ? ' 意图：' + p.intent : '')
    });
  });
  // 板书设计（bullets）
  const bb = (plan.blackboard || '').split('\n').map(l => clip(l.replace(/^【.*?】/, ''), 40)).filter(Boolean);
  slides.push({
    layout: 'bullets',
    title: '板书设计',
    bullets: bb.length ? bb.slice(0, 5) : [clip(kp.join(' → '), 70)],
    notes: '边讲边写板书，强调结构。'
  });
  // 作业（bullets）
  slides.push({
    layout: 'bullets',
    title: '作业布置',
    bullets: [
      clip(plan.homework || '完成课后练习', 80),
      '提交：学习平台线上提交',
      '评价：准确性 + 完整性'
    ],
    notes: '明确提交要求与评价标准。'
  });
  // 结尾（quote）
  slides.push({
    layout: 'quote',
    title: '课堂小结',
    quote: '回顾知识框架 → 强化重难点 → 课后巩固练习',
    attribution: course + ' · ' + topic,
    notes: '回顾总结，预告下节课。'
  });

  return {
    title: topic,
    subtitle: course + (chapter ? ' · ' + chapter : ''),
    author: plan.teacher || '智备教案',
    slides
  };
}

// 渲染：HTML deck + PPTX 双格式，返回 { htmlPath, pptxPath, used }
async function genPptxSlides(plan, outDir, opts) {
  const libPath = findSlidesLib();
  if (!libPath) return { used: false, reason: 'dsh-slides 未安装' };
  const lib = await import('file:///' + libPath.replace(/\\/g, '/'));
  const deck = planToDeck(plan);
  lib.validateDeck(deck);
  const theme = lib.resolveTheme((opts && opts.theme) || 'ink');
  const stem = '课件_' + safeName(plan.topic || '课件');
  fs.mkdirSync(outDir, { recursive: true });
  const htmlPath = path.join(outDir, stem + '.html');
  const pptxPath = path.join(outDir, stem + '.pptx');
  // HTML deck
  const html = lib.renderDeckHtml(deck, theme);
  fs.writeFileSync(htmlPath, html, 'utf8');
  // PPTX
  const pptxBuf = await lib.renderDeckPptx(deck, theme, {});
  fs.writeFileSync(pptxPath, pptxBuf);
  return { used: true, htmlPath, pptxPath };
}

module.exports = { genPptxSlides, planToDeck, findSlidesLib };
