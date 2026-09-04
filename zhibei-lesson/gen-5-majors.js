// 智备教案 - 五大专业主题课件生成器
// 5 个专业 x 5 套 dsh-slides 主题，每份内容都按专业真实课程定制
const path = require('path');
const fs = require('fs');
const { genPptxSlides } = require('./gen-pptx-slides.js');
const { polishPptx } = require('./polish-pptx.js');

// ---------- 5 个专业的教案内容（真实课程、真实知识点） ----------
const MAJORS = [
  {
    slug: '01-计算机应用技术-plain', theme: 'plain',
    plan: {
      course: '计算机网络基础', chapter: '第3章 网络层', topic: 'IP地址与子网划分',
      audience: '2024级计算机应用技术专业学生', hours: '2课时（90分钟）', teacher: '智备教案', date: '2026-09-15',
      knowledgePoints: ['IP地址的结构与分类', '子网掩码与网络地址', '等长子网划分方法', 'CIDR无类别编址'],
      goals: {
        knowledge: '掌握IPv4地址点分十进制表示与A/B/C类地址范围，理解子网掩码的作用，掌握等长子网划分的计算步骤。',
        ability: '能根据部门主机数需求完成子网规划，正确计算网络地址、广播地址与可用主机范围。',
        quality: '养成严谨的计算习惯与网络工程规范意识，树立网络安全责任。'
      },
      keyPoints: '子网掩码的作用与等长子网划分的计算方法',
      difficulties: '借位后网络位与主机位的划分理解及广播地址计算',
      preparation: '多媒体课件、eNSP模拟器、子网计算练习单、机房环境',
      process: [
        { step: '一、导入新课', minutes: 5, teacher: '情境导入：某公司销售部100人、技术部50人需隔离组网，如何分配地址？', student: '思考讨论，提出初步方案', intent: '真实岗位情境激发学习动机' },
        { step: '二、新课讲授', minutes: 30, teacher: '讲解IP地址结构、A/B/C类范围、子网掩码与网络地址的与运算关系', student: '听讲记笔记，完成随堂判断练习', intent: '由浅入深建立概念框架' },
        { step: '三、例题演示', minutes: 20, teacher: '板演192.168.1.0/24划分4个子网的全过程，强调块大小计算', student: '跟随演算，记录计算模板', intent: '示范计算范式突破重难点' },
        { step: '四、分层实训', minutes: 25, teacher: '布置任务：按三个部门人数规划子网，巡回指导纠错', student: '在eNSP中配置验证，互评互纠', intent: '即时检测，学以致用' },
        { step: '五、小结作业', minutes: 10, teacher: '梳理「需求→借位→掩码→范围」四步法，布置作业', student: '回顾总结，记录作业要求', intent: '形成结构化记忆' }
      ],
      blackboard: '【课题】IP地址与子网划分\n【重点】等长子网划分四步法\n【难点】广播地址计算\n【框架】地址结构→掩码→划分→验证',
      homework: '基础题：将10.0.0.0/8划分为容纳1000台主机的子网；实训题：在eNSP完成三部门组网并截图；预习：路由器基本配置。',
      reflection: '学生对借位理解存在差异，下次可增加二进制数轴可视化演示。'
    }
  },
  {
    slug: '02-机电一体化-ink', theme: 'ink',
    plan: {
      course: 'PLC应用技术', chapter: '项目三 电动机控制', topic: '三相异步电动机正反转的PLC控制',
      audience: '2024级机电一体化技术专业学生', hours: '2课时（90分钟）', teacher: '智备教案', date: '2026-09-15',
      knowledgePoints: ['正反转控制的电气原理', '互锁与自锁电路设计', '梯形图编程与接线', '联机调试与故障排查'],
      goals: {
        knowledge: '掌握接触器互锁与按钮互锁的电气原理，理解软件互锁与硬件互锁双重保护的必要性。',
        ability: '能独立完成正反转控制梯形图编程、外部接线与联机调试，会排查常见故障。',
        quality: '树立电气安全红线意识，养成先断电后接线的规范操作习惯。'
      },
      keyPoints: '互锁电路的设计与梯形图实现',
      difficulties: '软件互锁与硬件互锁双重保护的必要性理解',
      preparation: 'PLC实训台（西门子S7-1200）、三相异步电动机、编程电脑、万用表、安全操作规程挂牌',
      process: [
        { step: '一、导入新课', minutes: 5, teacher: '演示车间行车自动往返运行视频，提问：如何实现电机反向？', student: '观察思考，联系继电器知识', intent: '岗位情境激活前备知识' },
        { step: '二、原理分析', minutes: 20, teacher: '分析接触器互锁与按钮互锁电路，强调相间短路的危害', student: '对照原理图分析触点动作时序', intent: '安全红线教育融入原理' },
        { step: '三、梯形图设计', minutes: 25, teacher: '示范双重互锁梯形图编程，讲解置位复位指令应用', student: '在编程软件中同步完成程序', intent: '软硬件对照突破重难点' },
        { step: '四、接线与调试', minutes: 30, teacher: '指导按图接线（先断电），监督上电调试流程与故障排查方法', student: '分组接线、空载调试、记录数据、轮换操作', intent: '理实一体强化规范' },
        { step: '五、小结作业', minutes: 10, teacher: '总结双重互锁要点，布置延展任务（星三角降压启动）', student: '清理工位，记录作业', intent: '闭环管理，任务延伸' }
      ],
      blackboard: '【课题】正反转的PLC控制\n【重点】双重互锁设计\n【难点】互锁必要性理解\n【流程】原理→梯形图→接线→调试',
      homework: '基础题：绘制带双重互锁的梯形图并标注触点；实训报告：整理调试数据与故障排查记录；预习：星三角降压启动控制。',
      reflection: '个别小组接线耗时偏长，下次课前发放接线微课视频供预习。'
    }
  },
  {
    slug: '03-大数据与会计-midnight', theme: 'midnight',
    plan: {
      course: '基础会计', chapter: '第四章 复式记账', topic: '借贷记账法与会计分录编制',
      audience: '2024级大数据与会计专业学生', hours: '2课时（90分钟）', teacher: '智备教案', date: '2026-09-15',
      knowledgePoints: ['会计恒等式与账户结构', '借贷记账法的记账规则', '会计分录的编制步骤', '试算平衡表的编制'],
      goals: {
        knowledge: '掌握资产、负债、所有者权益类账户的借贷结构，理解「有借必有贷、借贷必相等」记账规则。',
        ability: '能对常见经济业务独立编制会计分录，会编制试算平衡表并检查平衡。',
        quality: '培育诚信为本、不做假账的会计职业道德底线。'
      },
      keyPoints: '借贷记账法记账规则与分录编制步骤',
      difficulties: '不同类型账户借贷方向的经济含义区分',
      preparation: '多媒体课件、T型账户教具、企业业务案例卡（10笔）、财务软件演示环境',
      process: [
        { step: '一、导入新课', minutes: 5, teacher: '情境导入：企业购入设备50万元未付款，如何记录？', student: '讨论思考单式记账的局限', intent: '认知冲突引出复式记账' },
        { step: '二、新课讲授', minutes: 30, teacher: '讲解会计恒等式、五类账户的T型结构、借贷记账规则', student: '用T型教具演练账户增减方向', intent: '结构化建立账户模型' },
        { step: '三、例题演示', minutes: 20, teacher: '板演3笔典型业务分录（筹资/购料/销售），归纳「三步走」编制法', student: '同步演练，互查借贷方向', intent: '示范规范突破重难点' },
        { step: '四、业务实训', minutes: 25, teacher: '发放10笔业务案例卡，巡回指导，组织试算平衡表编制', student: '独立编制分录，小组核对平衡', intent: '高强度练习形成技能' },
        { step: '五、小结作业', minutes: 10, teacher: '梳理账户方向口诀，强调诚信底线，布置作业', student: '总结口诀，记录作业', intent: '价值引领与知识闭环' }
      ],
      blackboard: '【课题】借贷记账法\n【重点】记账规则三步走\n【难点】账户借贷方向\n【公式】资产=负债+所有者权益',
      homework: '基础题：完成教材习题10笔业务分录；拓展题：编制本期发生额试算平衡表；预习：期间费用的核算。',
      reflection: '负债类账户方向错误率较高，下次课增加「方向判断」专项抢答环节。'
    }
  },
  {
    slug: '04-建筑工程技术-slate', theme: 'slate',
    plan: {
      course: '建筑识图与构造', chapter: '第二章 建筑施工图识读', topic: '建筑平面图识读',
      audience: '2024级建筑工程技术专业学生', hours: '2课时（90分钟）', teacher: '智备教案', date: '2026-09-15',
      knowledgePoints: ['平面图的形成与图例', '定位轴线与尺寸标注', '门窗编号与开启方向', '房间布局与交通流线'],
      goals: {
        knowledge: '掌握建筑平面图的形成原理与常用图例，理解定位轴线编号规则与三道尺寸线的含义。',
        ability: '能独立识读宿舍楼首层平面图，准确说出房间功能、开间进深与门窗位置。',
        quality: '培养精益求精的工匠精神与图面表达的规范意识。'
      },
      keyPoints: '定位轴线编号规则与三道尺寸线识读',
      difficulties: '剖切符号与标高符号对应的空间想象',
      preparation: '全套宿舍楼施工图（蓝图）、制图规范GB/T 50104、CAD机房、硫酸纸与针管笔',
      process: [
        { step: '一、导入新课', minutes: 5, teacher: '展示售楼处户型图与施工图对比，提问：图纸如何传达建造信息？', student: '观察比较两种图纸差异', intent: '生活情境引入专业视角' },
        { step: '二、图例讲解', minutes: 25, teacher: '讲解墙体、门窗、楼梯图例及定位轴线编号规则（数字/字母）', student: '对照图例表在图纸上查找标注', intent: '建立识图符号系统' },
        { step: '三、实例识读', minutes: 25, teacher: '带领识读宿舍楼首层平面图，示范三道尺寸线逐级读取方法', student: '分组跟读，回答房间功能与尺寸', intent: '真实图纸训练综合识读' },
        { step: '四、抄绘实训', minutes: 25, teacher: '布置局部平面图抄绘任务，强调线型分级与轴线圆圈规范', student: '用CAD或手绘完成抄绘，互查规范', intent: '以绘促读强化规范意识' },
        { step: '五、小结作业', minutes: 10, teacher: '总结识图四要素，布置立面图预习任务', student: '梳理笔记，记录作业', intent: '识图能力逐层递进' }
      ],
      blackboard: '【课题】建筑平面图识读\n【重点】轴线编号与尺寸线\n【难点】剖切符号空间对应\n【方法】图例→轴线→尺寸→功能',
      homework: '基础题：完成首层平面图识读记录表；实训题：抄绘标准层局部平面图（1:100）；预习：建筑立面图识读。',
      reflection: '学生空间想象差异明显，下次结合BIM模型做三维对照演示。'
    }
  },
  {
    slug: '05-电子商务-sunrise', theme: 'sunrise',
    plan: {
      course: '网络营销实务', chapter: '项目五 内容营销', topic: '短视频营销策划与投放',
      audience: '2024级电子商务专业学生', hours: '2课时（90分钟）', teacher: '智备教案', date: '2026-09-15',
      knowledgePoints: ['短视频平台的流量逻辑', '选题策划与脚本结构', '拍摄剪辑要点', '投放数据复盘'],
      goals: {
        knowledge: '理解短视频平台推荐算法的流量分发逻辑，掌握黄金3秒开头与完播率导向的脚本结构。',
        ability: '能为本地产品独立完成短视频选题策划、脚本撰写与数据复盘方案。',
        quality: '培育真实合规的营销底线意识与本土品牌情怀。'
      },
      keyPoints: '黄金3秒开头与完播率导向的脚本设计',
      difficulties: '从完播率、互动率等数据指标反推内容优化策略',
      preparation: '剪映专业版机房、爆款案例视频库、绍兴黄酒产品资料卡、数据复盘模板表格',
      process: [
        { step: '一、导入新课', minutes: 5, teacher: '现场拆解一条百万播放的黄酒带货视频，提问：它凭什么火？', student: '观看记录爆款要素', intent: '爆款拆解激发兴趣' },
        { step: '二、策划方法', minutes: 25, teacher: '讲解流量池分发逻辑与「钩子-价值-行动」三段式脚本结构', student: '分析案例视频的钩子设计', intent: '方法论先行建立框架' },
        { step: '三、脚本实操', minutes: 25, teacher: '发布任务：为绍兴黄酒撰写15秒带货脚本，巡回指导修改', student: '小组共创脚本，互评黄金3秒', intent: '真实产品练实战' },
        { step: '四、数据复盘', minutes: 20, teacher: '演示完播率/互动率/转化率的复盘模板，讲解优化策略反推方法', student: '用模板分析给定数据并提出优化点', intent: '数据思维突破重难点' },
        { step: '五、总结展示', minutes: 15, teacher: '组织优秀脚本路演点评，强调真实合规营销底线', student: '小组展示脚本，投票互评', intent: '路演激励与价值引领' }
      ],
      blackboard: '【课题】短视频营销策划\n【重点】黄金3秒钩子设计\n【难点】数据反推内容优化\n【结构】钩子→价值→行动',
      homework: '基础题：完成一条爆款视频的要素拆解表；实训题：小组完成完整脚本与分镜并提交剪映工程；预习：直播带货运营。',
      reflection: '部分小组脚本同质化明显，下次引入多行业选题盲盒增加多样性。'
    }
  }
];

// 演讲者备注（对应 dsh-slides 12 页结构）
function buildNotes12(plan) {
  const t = (s, n) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, n);
  const proc = plan.process || [];
  const notes = [
    '开场：本节课主题「' + t(plan.topic, 26) + '」。提问导入，激活前备知识。',
    '学习目标页：逐条讲解三维目标，强调「知识→能力→素养」递进关系。',
    '知识框架页：逐个点击展示知识点，构建整体认知地图。',
    '重点难点页：先重点后难点，说明突破策略。'
  ];
  proc.slice(0, 5).forEach(p => {
    notes.push((p.minutes != null ? p.minutes + 'min · ' : '') + t(p.teacher, 60) + (p.intent ? '｜意图：' + t(p.intent, 40) : ''));
  });
  notes.push('板书设计页：边讲边写板书，强调知识结构可视化。');
  notes.push('作业布置页：' + t(plan.homework, 70));
  notes.push('结束页：回顾本节课知识框架，预告下节课内容。');
  return notes;
}

(async () => {
  const root = path.resolve(__dirname, 'output-5majors');
  fs.mkdirSync(root, { recursive: true });
  for (const m of MAJORS) {
    const outDir = path.join(root, m.slug);
    try {
      const r = await genPptxSlides(m.plan, outDir, { theme: m.theme });
      if (!r.used) { console.log(m.slug + ' FAIL: ' + r.reason); continue; }
      const polished = polishPptx(r.pptxPath, buildNotes12(m.plan), { maxShapesPerSlide: 6 });
      console.log(m.slug + ' OK | theme=' + m.theme + ' | animated=' + polished + ' | ' + path.basename(r.htmlPath) + ' + ' + path.basename(r.pptxPath));
    } catch (e) {
      console.log(m.slug + ' ERROR: ' + e.message);
    }
  }
  console.log('DONE');
})();