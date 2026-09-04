// 智备教案 - PPT 课件生成器（pptxgenjs）
const pptxgen = require('pptxgenjs');

const FONT = '微软雅黑';
const DARK = '1F3864';
const ACCENT = '2E74B5';
const LIGHT = 'EDF2FA';
const W = 13.333;
const H = 7.5;
let ST = null; // ShapeType 是实例属性，在 genPptx 内赋值

function addTitleBar(slide, text) {
  slide.addShape(ST.rect, { x: 0, y: 0, w: W, h: 1.05, fill: { color: DARK } });
  slide.addShape(ST.rect, { x: 0, y: 1.05, w: W, h: 0.06, fill: { color: ACCENT } });
  slide.addText(text, { x: 0.45, y: 0.12, w: 12.4, h: 0.8, fontSize: 24, bold: true, color: 'FFFFFF', fontFace: FONT, valign: 'middle' });
}

function addFooter(slide, page, total) {
  slide.addText('智备教案 · AI 一键生成', { x: 0.45, y: 7.05, w: 4, h: 0.3, fontSize: 9, color: 'B0B0B0', fontFace: FONT });
  slide.addText(page + ' / ' + total, { x: 11.4, y: 7.05, w: 1.5, h: 0.3, fontSize: 9, color: 'B0B0B0', fontFace: FONT, align: 'right' });
}

function bullets(slide, items, y) {
  const text = items.map(function (t) { return '•  ' + t; }).join('\n');
  slide.addText(text, { x: 0.7, y: y, w: 11.9, h: 5.6 - (y - 1.4), fontSize: 18, color: '333333', fontFace: FONT, valign: 'top', lineSpacingMultiple: 1.5 });
}

async function genPptx(plan, outPath) {
  const pptx = new pptxgen();
  ST = pptx.ShapeType;
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = plan.teacher || '智备教案';
  pptx.company = '浙工院 AI 应用大赛';
  pptx.title = plan.title;

  const kp = plan.knowledgePoints || [plan.topic];
  const total = 5 + kp.length + 3; // 封面 + 目标 + 框架 + 每个知识点 + 小结 + 作业 + 结尾
  let page = 0;

  // 1. 封面
  const cover = pptx.addSlide();
  cover.background = { color: DARK };
  cover.addShape(ST.rect, { x: 0, y: 4.9, w: W, h: 0.05, fill: { color: ACCENT } });
  cover.addText(plan.course, { x: 1, y: 2.0, w: 11.3, h: 1.1, fontSize: 38, bold: true, color: 'FFFFFF', fontFace: FONT, align: 'center' });
  cover.addText((plan.chapter ? plan.chapter + ' · ' : '') + plan.topic, { x: 1, y: 3.1, w: 11.3, h: 0.8, fontSize: 24, color: 'D6E4F0', fontFace: FONT, align: 'center' });
  cover.addText('授课教师：' + (plan.teacher || '——') + '　　' + plan.date, { x: 1, y: 5.2, w: 11.3, h: 0.5, fontSize: 14, color: 'FFFFFF', fontFace: FONT, align: 'center' });
  page += 1;

  // 2. 学习目标
  let s = pptx.addSlide();
  addTitleBar(s, '学习目标');
  bullets(s, [
    '知识目标｜' + plan.goals.knowledge,
    '能力目标｜' + plan.goals.ability,
    '素养目标｜' + plan.goals.quality
  ], 1.6);
  addFooter(s, ++page, total);

  // 3. 知识框架
  s = pptx.addSlide();
  addTitleBar(s, '知识框架');
  bullets(s, kp.map(function (k, i) { return '第 ' + (i + 1) + ' 讲｜' + k; }), 1.6);
  addFooter(s, ++page, total);

  // 4. 每个知识点一页
  kp.forEach(function (k, i) {
    s = pptx.addSlide();
    addTitleBar(s, '知识点 ' + (i + 1) + '｜' + k);
    bullets(s, [
      '核心概念：' + k + ' 的基本定义与内涵',
      '关键要点：' + k + ' 的主要特征与判断标准',
      '应用场景：' + k + ' 在真实任务中的典型用法',
      '常见误区：' + k + ' 易混淆点与注意事项'
    ], 1.6);
    addFooter(s, ++page, total);
  });

  // 5. 重点难点
  s = pptx.addSlide();
  addTitleBar(s, '重点与难点');
  bullets(s, [
    '教学重点｜' + plan.keyPoints,
    '教学难点｜' + plan.difficulties,
    '突破方法｜案例演示 + 分层练习 + 即时反馈'
  ], 1.6);
  addFooter(s, ++page, total);

  // 6. 课堂小结
  s = pptx.addSlide();
  addTitleBar(s, '课堂小结');
  bullets(s, kp.map(function (k) { return '已掌握：' + k; }).concat(['请同学们课后整理思维导图，巩固记忆']), 1.6);
  addFooter(s, ++page, total);

  // 7. 作业布置
  s = pptx.addSlide();
  addTitleBar(s, '作业布置');
  bullets(s, [plan.homework, '提交方式：学习平台线上提交', '评价标准：准确性 + 完整性 + 及时性'], 1.6);
  addFooter(s, ++page, total);

  // 8. 结尾
  const end = pptx.addSlide();
  end.background = { color: DARK };
  end.addText('感谢聆听', { x: 1, y: 2.6, w: 11.3, h: 1.2, fontSize: 44, bold: true, color: 'FFFFFF', fontFace: FONT, align: 'center' });
  end.addText('智备教案 · AI 一键生成', { x: 1, y: 3.9, w: 11.3, h: 0.6, fontSize: 18, color: 'D6E4F0', fontFace: FONT, align: 'center' });

  await pptx.writeFile({ fileName: outPath });
  return outPath;
}

module.exports = { genPptx };
