// 智备教案 - 主入口：一键生成 Word 教案 + PPT 课件
// 用法：node generate.js [输出目录]
const path = require('path');
const fs = require('fs');
const { buildLessonPlan } = require('./content.js');
const { genDocx } = require('./gen-docx.js');
const { genPptx } = require('./gen-pptx.js');
const { genPptxPptwise } = require('./gen-pptx-pptwise.js');
const { genPptxSlides } = require('./gen-pptx-slides.js');
const { polishPptx } = require('./polish-pptx.js');

async function main() {
  const config = require('./config.js');
  const outDir = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(__dirname, 'output');
  fs.mkdirSync(outDir, { recursive: true });

  const plan = await buildLessonPlan(config);
  if (!plan.knowledgePoints) plan.knowledgePoints = config.knowledgePoints || [plan.topic];

  const safe = (plan.topic || '文档').replace(/[\\/:*?"<>|]/g, '_');
  const docxPath = path.join(outDir, '教案_' + safe + '.docx');

  await genDocx(plan, docxPath);

  // PPT 引擎优先级：pptwise（组件化、内容充实）> dsh-slides（HTML deck+PPTX 双格式）> pptxgenjs（兜底）
  // 可用环境变量 ZHIBEI_PPT_ENGINE=slides 强制用 dsh-slides 引擎
  let pptxPath = null;
  let pptEngine = 'pptxgenjs';
  let htmlDeckPath = null;
  const wantEngine = process.env.ZHIBEI_PPT_ENGINE || 'pptwise';
  if (wantEngine === 'slides') {
    try {
      const r = await genPptxSlides(plan, outDir);
      if (r.used) { pptxPath = r.pptxPath; pptEngine = 'dsh-slides'; htmlDeckPath = r.htmlPath; }
    } catch (e) { console.warn('[提示] dsh-slides 渲染失败：', e.message); }
  } else {
    try {
      const r = genPptxPptwise(plan, outDir);
      if (r.used) { pptxPath = r.pptxPath; pptEngine = 'pptwise'; }
    } catch (e) {
      console.warn('[提示] pptwise 渲染失败，尝试 dsh-slides：', e.message);
      try {
        const r2 = await genPptxSlides(plan, outDir);
        if (r2.used) { pptxPath = r2.pptxPath; pptEngine = 'dsh-slides'; htmlDeckPath = r2.htmlPath; }
      } catch (e2) {}
    }
  }
  if (!pptxPath) {
    pptxPath = path.join(outDir, '课件_' + safe + '.pptx');
    await genPptx(plan, pptxPath);
  }

  // 动画打磨：转场 + 逐元素入场动画 + 演讲者备注（需本机 PowerPoint，失败静默跳过）
  const noteSets = buildNotes(plan);
  const notes = (pptEngine === 'dsh-slides') ? noteSets.notes12 : noteSets.notes8;
  const polished = polishPptx(pptxPath, notes, { maxShapesPerSlide: 6 });
  if (polished) console.log('动画打磨：已添加转场 + 入场动画 + 演讲者备注（' + notes.length + ' 页备注）');

  console.log('=== 智备教案 生成完成 ===');
  if (plan._meta) {
    console.log('生成方式：AI 多轮（' + plan._meta.model + '，思考强度 ' + plan._meta.reasoningEffort + '，联网 ' + (plan._meta.webSearch ? '开' : '关') + '）');
    const rs = plan._meta.rounds;
    if (rs.research && rs.research.sources && rs.research.sources.length) {
      console.log('联网检索到 ' + rs.research.sources.length + ' 个参考来源：');
      rs.research.sources.slice(0, 5).forEach(function (s) { console.log('  - ' + s.title + ' (' + s.url + ')'); });
    }
    if (rs.review && rs.review.content) {
      console.log('自我评审意见（节选）：' + rs.review.content.slice(0, 200).replace(/\n/g, ' '));
    }
  } else {
    console.log('生成方式：离线模板（未配置 АРI keys）');
  }
  console.log('Word 教案：' + docxPath);
  console.log('PPT  课件：' + pptxPath + '（引擎：' + pptEngine + '）');
  if (htmlDeckPath) console.log('HTML 演示：' + htmlDeckPath + '（浏览器打开，S 键看演讲备注）');
  console.log('知识点数量：' + plan.knowledgePoints.length + '，教学过程环节：' + plan.process.length);
}

// 按页生成演讲者备注（按引擎页结构自适应：pptwise 8 页 / dsh-slides 12 页）
function buildNotes(plan) {
  const t = (s, n) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, n);
  const proc = plan.process || [];
  const procNote = (i, dft) => proc[i] ? (t(proc[i].teacher, 60) + (proc[i].intent ? '｜意图：' + t(proc[i].intent, 40) : '')) : dft;
  const notes8 = [
    '开场：本节课主题「' + t(plan.topic, 30) + '」，' + (plan.hours || '2课时') + '。先以提问导入，激活前备知识。',
    '学习目标页：逐条讲解三维目标，强调「知识→能力→素养」递进关系，让学生明确本节课要达成的可测量成果。',
    '知识框架页：逐个点击展示知识点，构建整体认知地图，说明知识点间的逻辑顺序。',
    '重点难点页：先讲重点（' + t(plan.keyPoints, 30) + '），再讲难点（' + t(plan.difficulties, 30) + '），说明突破策略。',
    '教学过程页（五环节）：' + procNote(0, '按导入→新课→巩固→小结→作业推进'),
    procNote(1, '新课讲授环节：概念讲解与案例演示结合。'),
    '作业布置页：' + t(plan.homework, 80),
    '结束页：回顾本节课知识框架，预告下节课内容，布置课后任务。'
  ];
  // dsh-slides 12 页结构：title/goals/framework/keydiff/5×process/blackboard/homework/quote
  const notes12 = [
    notes8[0], notes8[1], notes8[2], notes8[3],
    ...proc.slice(0, 5).map((p, i) => (p.minutes != null ? p.minutes + 'min · ' : '') + procNote(i, '教学环节：引导学生完成任务。')),
    '板书设计页：边讲边写板书，强调知识结构可视化。',
    '作业布置页：' + t(plan.homework, 80),
    '结束页：回顾本节课知识框架，预告下节课内容，布置课后任务。'
  ];
  // 根据引擎返回的页数选择（run-time 由调用处传入 pptEngine）
  return { notes8, notes12 };
}

main().catch(function (e) {
  console.error('生成失败：', e);
  process.exit(1);
});