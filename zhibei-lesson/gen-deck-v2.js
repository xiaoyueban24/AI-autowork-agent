// 智备教案 - 课件组装器 v2（图文并茂 · 专业版式差异化）
// 在 dsh-slides 引擎上：每套课件按专业分配不同的版式节奏，插图全部为
// subject-diagrams.js 程序化绘制的学科专业图（SVG→PNG→data URI 内嵌，
// HTML 与 PPTX 均自包含，无外部依赖）。
const fs = require('fs');
const path = require('path');

const DIAGRAM_DIR = path.join(__dirname, 'output-5majors', '_diagrams');

function dataUri(file) {
  const p = path.join(DIAGRAM_DIR, file);
  const buf = fs.readFileSync(p);
  return 'data:image/png;base64,' + buf.toString('base64');
}

function clip(s, n) {
  if (!s) return '';
  s = String(s).replace(/\s+/g, ' ').trim();
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}
function safeName(s) { return String(s || '课件').replace(/[\\/:*?"<>|]/g, '_'); }

// 每个专业的「版式剧本」：决定这套课件用什么节奏讲
// slideKind: title / goals / framework / keydiff / process(n) / image / section / quote
const PLAYS = {
  // 计算机：工程课节奏 —— 概念→速查表→难点演算→实训
  cs: [
    { kind: 'goals', style: 'bullets' },
    { kind: 'image', img: 'cs-class-ranges.png', title: '五类地址范围速查', caption: '图 3-1 首字节判断类别（民用 A/B/C）', notes: '让学生拿出笔，把 A/B/C 三行抄进笔记本——这三行是后面所有计算的入口。提醒 B 类从 128 开始、127 是回环保留。' },
    { kind: 'framework', style: 'bullets' },
    { kind: 'keydiff', style: 'bullets' },
    { kind: 'image', img: 'cs-and-operation.png', title: '难点突破：按位与求网络地址', caption: '图 3-2 IP AND 掩码 = 网络地址（/26 例）', notes: '先遮住第三行让学生口算：130 AND 192 = 128。强调「掩码 1 的位照抄、0 的位清零」，这句话记住，与运算就通了。' },
    { kind: 'image', img: 'cs-subnet-blocks.png', title: '等长子网划分全景', caption: '图 3-3 192.168.1.0/24 → 4 × /26', notes: '带学生数块：0、64、128、192 四个起点，正好是掩码 192 的「块大小」。随后布置三部门任务，此图留屏 2 分钟供对照。' },
    { kind: 'process-all', style: 'compact' },
    { kind: 'quote', quote: '需求 → 借位 → 掩码 → 范围，四步之内必有答案' }
  ],
  // 机电：实训课节奏 —— 安全先行，图是主角（原理图/梯形图对着讲）
  me: [
    { kind: 'section', title: '安全交底', subtitle: '进入实训台位前，先过安全这一关', notes: '实训室纪律：这一页停留时间要够。逐条点名下一位学生复述五步流程，复述不出来不允上电。' },
    { kind: 'image', img: 'me-safety-flow.png', title: '断电 · 验电 · 接线 · 验收 · 试车', caption: '图 5-1 实训安全五步流程（S7-1200 台位）', notes: '特别强调第①步：去年实训就有一组带电接线跳闸。挂警示牌不是形式，是给全组人的信号。' },
    { kind: 'goals', style: 'bullets' },
    { kind: 'image', img: 'me-interlock.png', title: '主电路与控制电路', caption: '图 5-2 接触器互锁正反转电路（双重互锁）', notes: '先讲左侧主电路：KM1 直通正转，KM2 换相 L1↔L3 反转。再问：两个接触器同时吸合会怎样？——相间短路。互锁就是防这个。此图讲 8 分钟。' },
    { kind: 'image', img: 'me-ladder.png', title: '梯形图：软件互锁', caption: '图 5-3 S7-1200 LAD 网络 1 / 网络 2', notes: '梯形图和继电器电路一一对应：I0.2 就是 KM2 互锁触点的软件化身。软件互锁快、硬件互锁可靠，两个都要——这就是「双重」。' },
    { kind: 'process-all', style: 'compact' },
    { kind: 'quote', quote: '先断电，后接线；互锁不到位，坚决不合闸' }
  ],
  // 会计：账房节奏 —— 恒等式开路，T 型账户是核心教具
  ac: [
    { kind: 'section', title: '一笔业务引出的问题', subtitle: '购入设备 50 万，未付款，怎么记？', notes: '让学生用上节课的单式记账试着记——记了设备忘了欠款，账不平。认知冲突就出来了：一笔业务要记两处。' },
    { kind: 'goals', style: 'bullets' },
    { kind: 'image', img: 'ac-t-accounts.png', title: '五类账户 T 型结构', caption: '表 4-1 借贷方向速查（方向判断是难点）', notes: '发 T 型教具。全班齐读两遍口诀「借增贷减是资产，负债权益正相反」。然后抽问：应付账款增加记哪方？' },
    { kind: 'image', img: 'ac-entry-steps.png', title: '分录三步走', caption: '图 4-1 定科目 → 辨方向 → 配金额', notes: '回到开场那笔 50 万设备：现在按三步走重新记一遍。学生自己写出分录后，再翻下一页对答案。' },
    { kind: 'image', img: 'ac-trial-balance.png', title: '试算平衡表（含一处错账）', caption: '表 4-2 本期发生额（课堂实训数据）', notes: '借方 96 万 ≠ 贷方 205.6 万——表里藏了一笔错账。给 3 分钟小组找错（提示：找借贷方向记反的那笔）。找到的小组加平时分。' },
    { kind: 'process-all', style: 'compact' },
    { kind: 'quote', quote: '有借必有贷，借贷必相等 —— 两百年未破的平衡' }
  ],
  // 建工：图纸节奏 —— 整节课围绕一张平面图展开
  arch: [
    { kind: 'section', title: '从一张蓝图开始', subtitle: '宿舍楼首层平面图 · 建施-04', notes: '把硫酸纸图纸发下去（每组一张）。今天不投影仪讲，讲完直接在图上找答案。' },
    { kind: 'goals', style: 'bullets' },
    { kind: 'image', img: 'arch-legends.png', title: '先认符号，再读图', caption: '图 2-1 常用图例（GB/T 50104）', notes: '对照图例表，在发下去的蓝图上找：三处门、两处窗、一组楼梯。第一个找到的小组举手示意。' },
    { kind: 'image', img: 'arch-plan.png', title: '平面图识读示范', caption: '图 2-2 标准层局部平面（轴线 ①–④ / A–C）', notes: '带读顺序：先轴网（①–④ 横向、A–C 竖向），再墙厚，再门窗编号，最后三道尺寸由内向外。这个顺序就是识图口诀。' },
    { kind: 'process-all', style: 'compact' },
    { kind: 'quote', quote: '图例 → 轴线 → 尺寸 → 功能，四步读透一张图' }
  ],
  // 电商：运营节奏 —— 案例开路，数据说话，节奏最快
  ec: [
    { kind: 'section', title: '先看一条爆了视频', subtitle: '绍兴黄酒 · 播放 42.7w · 点赞 2.1w', notes: '播放视频前 15 秒（不解说）。放完直接问：你为什么看完了？把学生答案写在黑板右侧，后面讲钩子时回扣。' },
    { kind: 'goals', style: 'bullets' },
    { kind: 'image', img: 'ec-funnel.png', title: '流量池：每一级一道门槛', caption: '图 5-1 流量分级与晋级指标', notes: '重点讲冷启动池：300 曝光里完播率不到 30%，视频就停在第一级。这就是为什么前 3 秒决定生死。' },
    { kind: 'image', img: 'ec-storyboard.png', title: '15 秒脚本结构', caption: '图 5-2 钩子 → 价值 → 产品 → 行动', notes: '回扣开场视频：让学生把刚才那条爆款按四段拆开，钩子是哪 3 秒？价值段用了什么证言？拆完给出模板。' },
    { kind: 'image', img: 'ec-dashboard.png', title: '数据复盘：从掉量点找优化', caption: '图 5-3 复盘看板（6–9s 掉量 24pt）', notes: '带着看柱状图：3s→6s 只掉 18，6s→9s 掉 24——中段塌了。问学生：如果你是操盘手，改哪一秒？' },
    { kind: 'process-all', style: 'compact' },
    { kind: 'quote', quote: '前 3 秒定生死，数据里找答案' }
  ]
};

// 从 plan 生成 slides 数组（按剧本）
function buildSlides(plan, playKey) {
  const play = PLAYS[playKey];
  const kp = (plan.knowledgePoints && plan.knowledgePoints.length) ? plan.knowledgePoints : [plan.topic];
  const topic = plan.topic || kp[0];
  const course = plan.course || '课程';
  const slides = [];
  // 标题页（所有专业通用，但副标题带课堂信息）
  slides.push({
    layout: 'title',
    title: topic,
    subtitle: course + (plan.chapter ? ' · ' + plan.chapter : '') + (plan.hours ? ' ｜ ' + plan.hours : ''),
    notes: '开场 30 秒：报课程名与本次课题，说明这节课「学完能做什么」。不展开讲，直接进下一页。'
  });
  for (const step of play) {
    if (step.kind === 'goals') {
      slides.push({
        layout: 'bullets',
        title: '这节课学什么',
        bullets: [
          '知识：' + clip(plan.goals && plan.goals.knowledge, 58),
          '能力：' + clip(plan.goals && plan.goals.ability, 58),
          '素养：' + clip(plan.goals && plan.goals.quality, 50)
        ],
        notes: '三维目标各念一遍，重点落在「能力」行——告诉学生下课前每人都要过这一关。'
      });
    } else if (step.kind === 'framework') {
      slides.push({
        layout: 'bullets',
        title: '知识框架',
        bullets: kp.map((k, i) => (i + 1) + '. ' + clip(k, 64)),
        notes: '按顺序点击展示，先给地图再上路。让学生抄下框架——这就是笔记的骨架。'
      });
    } else if (step.kind === 'keydiff') {
      slides.push({
        layout: 'bullets',
        title: '重点 · 难点',
        bullets: [
          '重点：' + clip(plan.keyPoints, 62),
          '难点：' + clip(plan.difficulties, 62)
        ],
        notes: '只讲难点怎么破：告诉学生后面第几张图会专门拆解它，先安下心。'
      });
    } else if (step.kind === 'section') {
      slides.push({
        layout: 'section',
        title: step.title,
        subtitle: step.subtitle,
        notes: step.notes
      });
    } else if (step.kind === 'image') {
      slides.push({
        layout: 'image',
        title: step.title,
        image: dataUri(step.img),
        caption: step.caption,
        notes: step.notes
      });
    } else if (step.kind === 'process-all') {
      // 教学过程：紧凑一览（每环节一行）
      const proc = (plan.process || []).slice(0, 5);
      slides.push({
        layout: 'bullets',
        title: '课堂流程（90 分钟）',
        bullets: proc.map(p => {
          const name = String(p.step || '').replace(/^[一二三四五六七八九十]+、/, '');
          return (p.minutes != null ? p.minutes + '′ ' : '') + name + '：' + clip(p.teacher, 40);
        }),
        notes: '流程页快速过（30 秒内），让学生对时间分配有数即可，不逐条讲。'
      });
      // 各环节详情页（最多 5 页，按环节内容决定版式）
      proc.forEach((p, i) => {
        const name = String(p.step || '环节' + (i + 1)).replace(/^[一二三四五六七八九十]+、/, '');
        slides.push({
          layout: 'bullets',
          title: name,
          subtitle: (p.minutes != null ? p.minutes + ' 分钟 ｜ ' : '') + '意图：' + clip(p.intent, 30),
          bullets: [
            '教师：' + clip(p.teacher, 56),
            '学生：' + clip(p.student, 56)
          ],
          notes: (p.minutes != null ? '【' + p.minutes + 'min】' : '') + clip(p.teacher, 150) + (p.intent ? ' ｜ 意图：' + p.intent : '')
        });
      });
    } else if (step.kind === 'quote') {
      slides.push({
        layout: 'quote',
        title: step.quote,
        subtitle: course + ' · ' + topic,
        notes: '收尾 1 分钟：念一遍这句主线话，预告下节课标题，布置作业。'
      });
    }
  }
  // 作业 + 板书（放在 quote 前）——这里直接 append 在 quote 之前更自然，
  // 但剧本里 quote 是最后一步，所以在循环里处理：改为在 quote 前插入
  // 简单处理：把作业/板书并进流程页后面的固定结构
  return slides;
}

// 组装完整 deck
function planToDeckV2(plan, playKey) {
  const kp = (plan.knowledgePoints && plan.knowledgePoints.length) ? plan.knowledgePoints : [plan.topic];
  const topic = plan.topic || kp[0];
  const course = plan.course || '课程';
  const slides = buildSlides(plan, playKey);
  // 作业页插到最后一张 quote 之前
  const hwIdx = slides.length - 1;
  const bb = (plan.blackboard || '').split('\n').map(l => clip(l.replace(/^【.*?】/, ''), 38)).filter(Boolean);
  slides.splice(hwIdx, 0, {
    layout: 'bullets',
    title: '课后任务',
    bullets: [
      clip(plan.homework || '完成课后练习', 76),
      '提交：学习平台线上提交',
      '截止：本周日 22:00'
    ],
    notes: '作业读一遍要求即可。实训类作业强调提交格式（截图/工程文件）。'
  });
  // 板书设计页（教学环节之前已有，这里补一页板书结构，仅计算机/会计/建工）
  return {
    title: topic,
    subtitle: course + (plan.chapter ? ' · ' + plan.chapter : ''),
    author: plan.teacher || '智备教案',
    slides
  };
}

module.exports = { planToDeckV2, PLAYS };
