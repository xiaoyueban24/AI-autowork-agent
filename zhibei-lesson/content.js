// 智备教案 - 教案内容生成（AI 多轮优先 + 模板兜底）
const { generateLessonPlan } = require('./pipeline.js');

async function buildLessonPlan(input) {
  // 配置了 API key：走多轮 AI 生成（联网检索→初稿→评审→定稿）
  // key 优先级：显式传入 > 环境变量 ABC_API_KEY / ZHIPU_API_KEY
  const apiKey = input.aiApiKey || process.env.ABC_API_KEY || process.env.ZHIPU_API_KEY || '';
  if (apiKey) {
    try {
      const llm = {
        provider: input.aiProvider || 'abc',
        apiKey: apiKey,
        baseUrl: input.aiBaseUrl || undefined,
        model: input.aiModel || 'glm-5.3',
        reasoningEffort: input.aiReasoningEffort || 'max',
        webSearch: input.aiWebSearch !== false // 默认开启联网搜索
      };
      const res = await generateLessonPlan(input, llm);
      return res.plan;
    } catch (e) {
      console.warn('[提示] AI 生成失败，已回退模板模式：', e.message);
    }
  }
  return templateGenerate(input);
}

// 模板模式（离线兜底，保证无 key 也能出稿）
function templateGenerate(input) {
  const kp = (input.knowledgePoints && input.knowledgePoints.length)
    ? input.knowledgePoints
    : [input.topic || '本章核心内容'];
  const course = input.course || '专业课程';
  const chapter = input.chapter || '';
  const topic = input.topic || kp[0];

  const lecture = kp.map(function (k, i) {
    return '知识点' + (i + 1) + '「' + k + '」：讲解概念 → 演示案例 → 归纳要点，结合课件与板书逐步展开。';
  }).join('；');

  const process = [
    { step: '一、导入新课', minutes: 5, teacher: '以生活/岗位实例设疑引入，展示学习目标。', student: '观察情境，思考并回答提问。', intent: '创设情境、激活前备知识。' },
    { step: '二、新课讲授', minutes: 40, teacher: lecture, student: '听讲记笔记，参与问答与课堂练习。', intent: '由浅入深突破重难点。' },
    { step: '三、巩固练习', minutes: 25, teacher: '布置分层练习与小组任务，巡回指导纠错。', student: '独立或协作完成任务，互评互纠。', intent: '即时检测，学以致用。' },
    { step: '四、课堂小结', minutes: 10, teacher: '梳理知识框架，强调重难点与易错点。', student: '回顾总结，提出疑问。', intent: '形成结构化记忆。' },
    { step: '五、作业布置', minutes: 10, teacher: '布置课后作业与拓展任务。', student: '记录作业与要求。', intent: '巩固课堂所学，延伸课外。' }
  ];

  const keyPoints = input.keyPoints || (kp[0] + ' 的概念与核心方法');
  const difficulties = input.difficulties || (kp.length > 1 ? kp[1] : kp[0]) + ' 的理解与应用';

  return {
    title: course + (chapter ? ' · ' + chapter : '') + ' · ' + topic + '（教案）',
    course: course, chapter: chapter, topic: topic,
    audience: input.audience || '在校学生',
    hours: input.hours || '2 课时（90 分钟）',
    teacher: input.teacher || '',
    date: input.date || new Date().toLocaleDateString('zh-CN'),
    goals: {
      knowledge: input.goalKnowledge || ('掌握 ' + kp.join('、') + ' 的基本概念、原理与方法。'),
      ability: input.goalAbility || ('能运用 ' + kp[0] + ' 相关知识分析与解决实际问题。'),
      quality: input.goalQuality || '培养严谨求实的科学态度与职业素养。'
    },
    keyPoints: keyPoints,
    difficulties: difficulties,
    preparation: input.preparation || '多媒体课件、板书、课堂练习材料、网络学习平台',
    process: process,
    blackboard: input.blackboard || ('【课题】' + topic + '\n【重点】' + keyPoints + '\n【难点】' + difficulties + '\n【知识框架】' + kp.join(' → ')),
    homework: input.homework || ('完成 ' + topic + ' 相关课后练习。'),
    reflection: input.reflection || '课后根据反馈进一步优化重难点讲解。'
  };
}

module.exports = { buildLessonPlan, templateGenerate };
