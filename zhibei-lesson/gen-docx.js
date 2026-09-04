// 智备教案 - Word 教案生成器（docx）
const fs = require('fs');
const { Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType } = require('docx');

const FONT = '微软雅黑';
const DARK = '1F3864';
const ACCENT = '2E74B5';
const GRAY = 'F2F2F2';

function run(text, o) {
  o = o || {};
  return new TextRun({
    text: text,
    font: FONT,
    size: o.size || 21,
    bold: !!o.bold,
    color: o.color || '000000',
    italics: !!o.italics
  });
}

function heading(text, level) {
  const size = level === 1 ? 26 : 24;
  return new Paragraph({
    children: [run(text, { size: size, bold: true, color: DARK })],
    spacing: { before: 240, after: 120 },
  });
}

function body(text) {
  return new Paragraph({
    children: [run(text)],
    spacing: { after: 100, line: 320 },
  });
}

function labelCell(text) {
  return new TableCell({
    children: [new Paragraph({ children: [run(text, { bold: true, color: DARK })], alignment: AlignmentType.CENTER })],
    width: { size: 22, type: WidthType.PERCENTAGE },
    shading: { fill: GRAY, type: ShadingType.CLEAR },
    verticalAlign: 'center',
    margins: { top: 80, bottom: 80, left: 100, right: 100 }
  });
}

function valueCell(text) {
  return new TableCell({
    children: [new Paragraph({ children: [run(text)], spacing: { line: 280 } })],
    width: { size: 78, type: WidthType.PERCENTAGE },
    margins: { top: 80, bottom: 80, left: 100, right: 100 }
  });
}

function borderedCell(text, opts) {
  opts = opts || {};
  return new TableCell({
    children: [new Paragraph({
      children: [run(text, { bold: !!opts.bold, color: opts.bold ? 'FFFFFF' : '000000' })],
      alignment: opts.center ? AlignmentType.CENTER : AlignmentType.LEFT,
      spacing: { line: 260 }
    })],
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
    shading: opts.fill ? { fill: opts.fill, type: ShadingType.CLEAR } : undefined,
    margins: { top: 60, bottom: 60, left: 80, right: 80 }
  });
}

function withBorders(cell) {
  const b = { style: BorderStyle.SINGLE, size: 4, color: 'BFBFBF' };
  cell.borders = { top: b, bottom: b, left: b, right: b };
  return cell;
}

async function genDocx(plan, outPath) {
  const children = [];

  // 标题
  children.push(new Paragraph({
    children: [run(plan.title, { size: 36, bold: true, color: DARK })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 60 }
  }));
  children.push(new Paragraph({
    children: [run('—— 智能生成教案 ——', { size: 20, color: '7F7F7F', italics: true })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 }
  }));

  // 基本信息表
  const info = [
    ['课程名称', plan.course],
    ['章节主题', (plan.chapter ? plan.chapter + ' · ' : '') + plan.topic],
    ['授课对象', plan.audience],
    ['课时安排', plan.hours],
    ['授课教师', plan.teacher || '——'],
    ['授课日期', plan.date]
  ];
  children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: info.map(function (row) {
      return new TableRow({
        children: [labelCell(row[0]), valueCell(row[1])]
      });
    })
  }));

  // 教学目标
  children.push(heading('一、教学目标'));
  children.push(body('1. 知识目标：' + plan.goals.knowledge));
  children.push(body('2. 能力目标：' + plan.goals.ability));
  children.push(body('3. 素养目标：' + plan.goals.quality));

  // 重点难点
  children.push(heading('二、教学重点与难点'));
  children.push(body('教学重点：' + plan.keyPoints));
  children.push(body('教学难点：' + plan.difficulties));

  // 教学准备
  children.push(heading('三、教学准备'));
  children.push(body(plan.preparation));

  // 教学过程
  children.push(heading('四、教学过程'));
  const headRow = new TableRow({
    children: ['教学环节', '时间', '教师活动', '学生活动', '设计意图'].map(function (t, i) {
      const widths = [16, 8, 30, 24, 22];
      return withBorders(borderedCell(t, { bold: true, fill: ACCENT, center: true, width: widths[i] }));
    })
  });
  const dataRows = plan.process.map(function (p) {
    return new TableRow({
      children: [
        withBorders(borderedCell(p.step, { bold: true, width: 16 })),
        withBorders(borderedCell(p.minutes + ' 分钟', { center: true, width: 8 })),
        withBorders(borderedCell(p.teacher, { width: 30 })),
        withBorders(borderedCell(p.student, { width: 24 })),
        withBorders(borderedCell(p.intent, { width: 22 }))
      ]
    });
  });
  children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headRow].concat(dataRows)
  }));

  // 板书设计
  children.push(heading('五、板书设计'));
  plan.blackboard.split('\n').forEach(function (line) {
    children.push(new Paragraph({
      children: [run(line, { color: DARK })],
      spacing: { after: 40, line: 300 },
      indent: { left: 200 }
    }));
  });

  // 作业与反思
  children.push(heading('六、作业布置'));
  children.push(body(plan.homework));
  children.push(heading('七、教学反思'));
  children.push(body(plan.reflection));

  const doc = new Document({
    styles: { default: { document: { run: { font: FONT, size: 21 } } } },
    sections: [{
      properties: { page: { margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 } } },
      children: children
    }]
  });

  const buf = await Packer.toBuffer(doc);
  fs.writeFileSync(outPath, buf);
  return outPath;
}

module.exports = { genDocx };
