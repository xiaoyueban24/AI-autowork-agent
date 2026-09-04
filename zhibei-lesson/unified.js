// 智备教案 - 一体化生成流水线（v2：教案+课件+Word+PPTX+PDF 一次全出）
// 统一入口：课程信息 → AI 四轮迭代教案 → 全套成品（docx/pptx/html/双pdf）
const fs = require('fs');
const path = require('path');
const { generateLessonPlan } = require('./pipeline.js');
const { templateGenerate } = require('./content.js');
const { genDocx } = require('./gen-docx.js');
const { planToDeck, findSlidesLib } = require('./gen-pptx-slides.js');
const { polishPptx } = require('./polish-pptx.js');
const { htmlToPdf, lessonToPrintHtml } = require('./one-click.js');

function safeName(s) { return String(s || '文档').replace(/[\\/:*?"<>|]/g, '_'); }

// notes 生成（与 generate.js 一致，按 dsh-slides 12 页结构）
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

/**
 * 一体化生成
 * input: {
 *   course, chapter, topic, audience, hours, teacher, date,
 *   knowledgePoints[], goalKnowledge, goalAbility, goalQuality,
 *   keyPoints, difficulties, preparation, homework,
 *   theme, slideCount, wantAnimations,
 *   aiApiKey, aiProvider, aiModel, aiBaseUrl, aiReasoningEffort, aiWebSearch
 * }
 */
async function unifiedGenerate(input, outDir) {
  fs.mkdirSync(outDir, { recursive: true });
  const files = [];
  const errors = [];
  const started = Date.now();
  const stage = function (s) { if (typeof input._onStage === 'function') input._onStage(s); };

  const llm = input.aiApiKey ? {
    provider: input.aiProvider || 'abc',
    apiKey: input.aiApiKey,
    baseUrl: input.aiBaseUrl || undefined,
    model: input.aiModel || 'glm-5.3',
    reasoningEffort: input.aiReasoningEffort || 'high',
    webSearch: input.aiWebSearch !== false
  } : null;

  // ---------- 1. 教案（AI 四轮 或 离线模板） ----------
  let plan = null;
  let meta = null;
  if (llm) {
    try {
      stage('AI 第1轮：联网检索资料');
      const res = await generateLessonPlan(Object.assign({}, input, {
        _onRound: function (r) { stage(r); }
      }), llm);
      plan = res.plan; // plan._meta 已含四轮过程（research/draft/review/finalize）
    } catch (e) {
      errors.push('AI 教案生成失败，已回退离线模板：' + e.message);
    }
  }
  if (!plan) plan = templateGenerate(input);

  const safe = safeName(plan.topic || input.topic || '文档');

  // ---------- 2. Word 教案 docx ----------
  stage(llm ? '生成 Word 教案' : '离线模板生成 Word 教案');
  try {
    const docxPath = path.join(outDir, '教案_' + safe + '.docx');
    await genDocx(plan, docxPath);
    files.push({ type: 'lesson-docx', path: docxPath, label: 'Word 教案（可编辑）' });
  } catch (e) { errors.push('Word 教案：' + e.message); }

  // ---------- 3. 教案 PDF（A4 打印版） ----------
  try {
    const printHtml = path.join(outDir, '教案_' + safe + '_print.html');
    fs.writeFileSync(printHtml, lessonToPrintHtml(plan), 'utf8');
    const pdfPath = printHtml.replace(/_print\.html$/, '.pdf');
    const pr = await htmlToPdf(printHtml, pdfPath);
    if (pr.ok) files.push({ type: 'lesson-pdf', path: pdfPath, label: '教案 PDF（A4 可打印）' });
    else errors.push('教案 PDF：' + pr.reason);
  } catch (e) { errors.push('教案 PDF：' + e.message); }

  // ---------- 4. PPT 课件（HTML + PPTX） ----------
  stage('渲染 PPT 课件（HTML + PPTX）');
  let deckHtmlPath = null;
  try {
    const libPath = findSlidesLib();
    if (!libPath) throw new Error('dsh-slides 未安装');
    const lib = await import('file:///' + libPath.replace(/\\/g, '/'));
    const deck = planToDeck(plan);
    const theme = lib.resolveTheme(input.theme || 'plain');
    const stem = '课件_' + safe;
    const htmlPath = path.join(outDir, stem + '.html');
    const pptxPath = path.join(outDir, stem + '.pptx');
    fs.writeFileSync(htmlPath, lib.renderDeckHtml(deck, theme), 'utf8');
    fs.writeFileSync(pptxPath, await lib.renderDeckPptx(deck, theme, {}));
    deckHtmlPath = htmlPath;
    files.push({ type: 'deck-html', path: htmlPath, label: '课件 HTML（浏览器放映）' });
    files.push({ type: 'deck-pptx', path: pptxPath, label: '课件 PPTX（可编辑）' });

    // 动画打磨（转场 + 入场动画 + 演讲者备注，需本机 PowerPoint）
    if (input.wantAnimations !== false) {
      try {
        const notes = buildNotes(plan);
        const polished = polishPptx(pptxPath, notes, { maxShapesPerSlide: 6 });
        if (polished) files.push({ type: 'pptx-polished', path: pptxPath, label: '（已加转场/入场动画 + 演讲者备注）' });
      } catch (e) { /* 动画失败静默 */ }
    }

    // ---------- 5. 课件 PDF ----------
    const deckPdf = htmlPath.replace(/\.html$/, '.pdf');
    const dp = await htmlToPdf(htmlPath, deckPdf);
    if (dp.ok) files.push({ type: 'deck-pdf', path: deckPdf, label: '课件 PDF（可打印）' });
    else errors.push('课件 PDF：' + dp.reason);
  } catch (e) { errors.push('课件生成：' + e.message); }

  return {
    files, errors,
    title: plan.title || plan.topic,
    mode: llm ? 'ai' : 'template',
    durationSec: Math.round((Date.now() - started) / 1000),
    plan: plan,
    deckPreview: deckHtmlPath
  };
}

module.exports = { unifiedGenerate };
