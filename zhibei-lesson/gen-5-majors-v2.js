// 智备教案 - 五大专业课件 v2：图文并茂 + 专业元素 + 差异化版式
// 用法：node gen-5-majors-v2.js
const path = require('path');
const fs = require('fs');
const os = require('os');
const { polishPptx } = require('./polish-pptx.js');
const { planToDeckV2 } = require('./gen-deck-v2.js');

// dsh-slides 库
function findSlidesLib() {
  const cands = [
    process.env.DSH_SLIDES_LIB || '',
    path.join(os.homedir(), '.dsh', 'profiles', 'web', 'node_modules', 'dsh-slides', 'lib', 'index.js'),
    path.join(process.env.APPDATA || '', 'npm', 'node_modules', 'dsh-slides', 'lib', 'index.js')
  ];
  for (const c of cands) if (c && fs.existsSync(c)) return c;
  return null;
}

function safeName(s) { return String(s || '课件').replace(/[\\/:*?"<>|]/g, '_'); }
function clip(s, n) { if (!s) return ''; s = String(s).replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s; }

// ---- 5 个专业（内容沿用 v1 的真实课程数据） ----
const PLANS = {
  cs: {
    course: '计算机网络基础', chapter: '第3章 网络层', topic: 'IP地址与子网划分',
    hours: '2课时（90分钟）', teacher: '智备教案',
    knowledgePoints: ['IP地址的结构与分类', '子网掩码与网络地址', '等长子网划分方法', 'CIDR无类别编址'],
    goals: {
      knowledge: '掌握IPv4地址点分十进制表示与A/B/C类地址范围，理解子网掩码的作用，掌握等长子网划分的计算步骤。',
      ability: '能根据部门主机数需求完成子网规划，正确计算网络地址、广播地址与可用主机范围。',
      quality: '养成严谨的计算习惯与网络工程规范意识。'
    },
    keyPoints: '子网掩码的作用与等长子网划分的计算方法',
    difficulties: '借位后网络位与主机位的划分理解及广播地址计算',
    process: [
      { step: '一、导入新课', minutes: 5, teacher: '情境导入：销售部100人、技术部50人需隔离组网，如何分配地址？', student: '思考讨论，提出初步方案', intent: '真实岗位情境激发学习动机' },
      { step: '二、新课讲授', minutes: 30, teacher: '讲解IP地址结构、A/B/C类范围、子网掩码与网络地址的与运算关系', student: '听讲记笔记，完成随堂判断练习', intent: '由浅入深建立概念框架' },
      { step: '三、例题演示', minutes: 20, teacher: '板演192.168.1.0/24划分4个子网的全过程，强调块大小计算', student: '跟随演算，记录计算模板', intent: '示范计算范式突破重难点' },
      { step: '四、分层实训', minutes: 25, teacher: '布置任务：按三个部门人数规划子网，巡回指导纠错', student: '在eNSP中配置验证，互评互纠', intent: '即时检测，学以致用' },
      { step: '五、小结作业', minutes: 10, teacher: '梳理「需求→借位→掩码→范围」四步法，布置作业', student: '回顾总结，记录作业要求', intent: '形成结构化记忆' }
    ],
    homework: '基础题：将10.0.0.0/8划分为容纳1000台主机的子网；实训题：在eNSP完成三部门组网并截图；预习：路由器基本配置。'
  },
  me: {
    course: 'PLC应用技术', chapter: '项目三 电动机控制', topic: '三相异步电动机正反转的PLC控制',
    hours: '2课时（90分钟）', teacher: '智备教案',
    knowledgePoints: ['正反转控制的电气原理', '互锁与自锁电路设计', '梯形图编程与接线', '联机调试与故障排查'],
    goals: {
      knowledge: '掌握接触器互锁与按钮互锁的电气原理，理解软件互锁与硬件互锁双重保护的必要性。',
      ability: '能独立完成正反转控制梯形图编程、外部接线与联机调试，会排查常见故障。',
      quality: '树立电气安全红线意识，养成先断电后接线的规范操作习惯。'
    },
    keyPoints: '互锁电路的设计与梯形图实现',
    difficulties: '软件互锁与硬件互锁双重保护的必要性理解',
    process: [
      { step: '一、安全交底', minutes: 8, teacher: '宣读实训安全规程：断电挂牌、无电验电、按图接线、教师验收、空载试车五步', student: '逐条复述，签安全确认单', intent: '安全红线先于一切操作' },
      { step: '二、原理分析', minutes: 17, teacher: '分析接触器互锁与按钮互锁电路，强调相间短路的危害', student: '对照原理图分析触点动作时序', intent: '安全红线教育融入原理' },
      { step: '三、梯形图设计', minutes: 25, teacher: '示范双重互锁梯形图编程，讲解置位复位指令应用', student: '在编程软件中同步完成程序', intent: '软硬件对照突破重难点' },
      { step: '四、接线与调试', minutes: 30, teacher: '指导按图接线（先断电），监督上电调试流程与故障排查方法', student: '分组接线、空载调试、记录数据、轮换操作', intent: '理实一体强化规范' },
      { step: '五、小结作业', minutes: 10, teacher: '总结双重互锁要点，布置延展任务（星三角降压启动）', student: '清理工位，记录作业', intent: '闭环管理，任务延伸' }
    ],
    homework: '基础题：绘制带双重互锁的梯形图并标注触点；实训报告：整理调试数据与故障排查记录；预习：星三角降压启动控制。'
  },
  ac: {
    course: '基础会计', chapter: '第四章 复式记账', topic: '借贷记账法与会计分录编制',
    hours: '2课时（90分钟）', teacher: '智备教案',
    knowledgePoints: ['会计恒等式与账户结构', '借贷记账法的记账规则', '会计分录的编制步骤', '试算平衡表的编制'],
    goals: {
      knowledge: '掌握资产、负债、所有者权益类账户的借贷结构，理解「有借必有贷、借贷必相等」记账规则。',
      ability: '能对常见经济业务独立编制会计分录，会编制试算平衡表并检查平衡。',
      quality: '培育诚信为本、不做假账的会计职业道德底线。'
    },
    keyPoints: '借贷记账法记账规则与分录编制步骤',
    difficulties: '不同类型账户借贷方向的经济含义区分',
    process: [
      { step: '一、导入新课', minutes: 5, teacher: '情境导入：企业购入设备50万元未付款，如何记录？', student: '讨论思考单式记账的局限', intent: '认知冲突引出复式记账' },
      { step: '二、新课讲授', minutes: 30, teacher: '讲解会计恒等式、五类账户的T型结构、借贷记账规则', student: '用T型教具演练账户增减方向', intent: '结构化建立账户模型' },
      { step: '三、例题演示', minutes: 20, teacher: '板演3笔典型业务分录（筹资/购料/销售），归纳「三步走」编制法', student: '同步演练，互查借贷方向', intent: '示范规范突破重难点' },
      { step: '四、业务实训', minutes: 25, teacher: '发放10笔业务案例卡，巡回指导，组织试算平衡表编制', student: '独立编制分录，小组核对平衡', intent: '高强度练习形成技能' },
      { step: '五、小结作业', minutes: 10, teacher: '梳理账户方向口诀，强调诚信底线，布置作业', student: '总结口诀，记录作业', intent: '价值引领与知识闭环' }
    ],
    homework: '基础题：完成教材习题10笔业务分录；拓展题：编制本期发生额试算平衡表；预习：期间费用的核算。'
  },
  arch: {
    course: '建筑识图与构造', chapter: '第二章 建筑施工图识读', topic: '建筑平面图识读',
    hours: '2课时（90分钟）', teacher: '智备教案',
    knowledgePoints: ['平面图的形成与图例', '定位轴线与尺寸标注', '门窗编号与开启方向', '房间布局与交通流线'],
    goals: {
      knowledge: '掌握建筑平面图的形成原理与常用图例，理解定位轴线编号规则与三道尺寸线的含义。',
      ability: '能独立识读宿舍楼首层平面图，准确说出房间功能、开间进深与门窗位置。',
      quality: '培养精益求精的工匠精神与图面表达的规范意识。'
    },
    keyPoints: '定位轴线编号规则与三道尺寸线识读',
    difficulties: '剖切符号与标高符号对应的空间想象',
    process: [
      { step: '一、导入新课', minutes: 5, teacher: '展示售楼处户型图与施工图对比，提问：图纸如何传达建造信息？', student: '观察比较两种图纸差异', intent: '生活情境引入专业视角' },
      { step: '二、图例讲解', minutes: 25, teacher: '讲解墙体、门窗、楼梯图例及定位轴线编号规则（数字/字母）', student: '对照图例表在图纸上查找标注', intent: '建立识图符号系统' },
      { step: '三、实例识读', minutes: 25, teacher: '带领识读宿舍楼首层平面图，示范三道尺寸线逐级读取方法', student: '分组跟读，回答房间功能与尺寸', intent: '真实图纸训练综合识读' },
      { step: '四、抄绘实训', minutes: 25, teacher: '布置局部平面图抄绘任务，强调线型分级与轴线圆圈规范', student: '用CAD或手绘完成抄绘，互查规范', intent: '以绘促读强化规范意识' },
      { step: '五、小结作业', minutes: 10, teacher: '总结识图四要素，布置立面图预习任务', student: '梳理笔记，记录作业', intent: '识图能力逐层递进' }
    ],
    homework: '基础题：完成首层平面图识读记录表；实训题：抄绘标准层局部平面图（1:100）；预习：建筑立面图识读。'
  },
  ec: {
    course: '网络营销实务', chapter: '项目五 内容营销', topic: '短视频营销策划与投放',
    hours: '2课时（90分钟）', teacher: '智备教案',
    knowledgePoints: ['短视频平台的流量逻辑', '选题策划与脚本结构', '拍摄剪辑要点', '投放数据复盘'],
    goals: {
      knowledge: '理解短视频平台推荐算法的流量分发逻辑，掌握黄金3秒开头与完播率导向的脚本结构。',
      ability: '能为本地产品独立完成短视频选题策划、脚本撰写与数据复盘方案。',
      quality: '培育真实合规的营销底线意识与本土品牌情怀。'
    },
    keyPoints: '黄金3秒开头与完播率导向的脚本设计',
    difficulties: '从完播率、互动率等数据指标反推内容优化策略',
    process: [
      { step: '一、导入新课', minutes: 5, teacher: '现场拆解一条百万播放的黄酒带货视频：它凭什么火？', student: '观看记录爆款要素', intent: '爆款拆解激发兴趣' },
      { step: '二、策划方法', minutes: 25, teacher: '讲解流量池分发逻辑与「钩子-价值-行动」三段式脚本结构', student: '分析案例视频的钩子设计', intent: '方法论先行建立框架' },
      { step: '三、脚本实操', minutes: 25, teacher: '发布任务：为绍兴黄酒撰写15秒带货脚本，巡回指导修改', student: '小组共创脚本，互评黄金3秒', intent: '真实产品练实战' },
      { step: '四、数据复盘', minutes: 20, teacher: '演示完播率/互动率/转化率的复盘模板，讲解优化策略反推方法', student: '用模板分析给定数据并提出优化点', intent: '数据思维突破重难点' },
      { step: '五、路演小结', minutes: 15, teacher: '组织优秀脚本路演点评，强调真实合规营销底线', student: '小组展示脚本，投票互评', intent: '路演激励与价值引领' }
    ],
    homework: '基础题：完成一条爆款视频的要素拆解表；实训题：小组完成完整脚本与分镜并提交剪映工程；预习：直播带货运营。'
  }
};

// 每个专业对应的「剧本」（版式节奏）已定义在 gen-deck-v2.js 的 PLAYS 中。
// 按最终页序构建备注数组（给 COM 动画打磨用）——直接用 deck 的 notes 字段即可。
async function main() {
  const libPath = findSlidesLib();
  if (!libPath) { console.log('ERR: dsh-slides 未安装'); process.exit(1); }
  const lib = await import('file:///' + libPath.replace(/\\/g, '/'));
  const root = path.resolve(__dirname, 'output-5majors');
  const order = [
    { key: 'cs', slug: '01-计算机应用技术-plain', theme: 'plain' },
    { key: 'me', slug: '02-机电一体化-ink', theme: 'ink' },
    { key: 'ac', slug: '03-大数据与会计-midnight', theme: 'midnight' },
    { key: 'arch', slug: '04-建筑工程技术-slate', theme: 'slate' },
    { key: 'ec', slug: '05-电子商务-sunrise', theme: 'sunrise' }
  ];
  for (const m of order) {
    const plan = PLANS[m.key];
    const outDir = path.join(root, m.slug);
    try {
      const deck = planToDeckV2(plan, m.key);
      lib.validateDeck(deck);
      const theme = lib.resolveTheme(m.theme);
      const stem = '课件_' + safeName(plan.topic);
      fs.mkdirSync(outDir, { recursive: true });
      const htmlPath = path.join(outDir, stem + '.html');
      const pptxPath = path.join(outDir, stem + '.pptx');
      const html = lib.renderDeckHtml(deck, theme);
      fs.writeFileSync(htmlPath, html, 'utf8');
      const pptxBuf = await lib.renderDeckPptx(deck, theme, {});
      fs.writeFileSync(pptxPath, pptxBuf);
      // 备注数组（deck.slides 每页的 notes；HTML 首页是自动加的 opening，PPTX 也自动加——需对齐）
      const notes = deck.slides.map(s => s.notes).filter(Boolean);
      const polished = polishPptx(pptxPath, notes, { maxShapesPerSlide: 6 });
      const imgCount = deck.slides.filter(s => s.layout === 'image').length;
      console.log(m.slug + ' OK | theme=' + m.theme + ' | slides=' + deck.slides.length + ' | 图页=' + imgCount + ' | animated=' + polished);
    } catch (e) {
      console.log(m.slug + ' ERROR: ' + e.message);
    }
  }
  console.log('DONE');
}

main().catch(e => { console.log('FATAL', e); process.exit(1); });
