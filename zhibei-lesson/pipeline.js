// 智备教案 - AI 多轮迭代生成流水线
// 四轮：①联网检索 → ②初稿生成 → ③自我评审 → ④优化定稿
// 每轮都保留模型的 reasoning_content（思考过程）
const { chat, webSearchTool, extractSources } = require('./llm.js');

// 固定 JSON 结构（与 docx/pptx 渲染器一致）
const SCHEMA = `{
  \"title\": \"教案标题\",
  \"course\": \"课程名称\",
  \"chapter\": \"章节\",
  \"topic\": \"主题/项目任务\",
  \"audience\": \"授课对象\",
  \"hours\": \"课时\",
  \"teacher\": \"授课教师\",
  \"date\": \"授课日期\",
  \"goals\": { \"knowledge\": \"知识目标\", \"ability\": \"能力目标\", \"quality\": \"素养目标\" },
  \"keyPoints\": \"教学重点（一句话）\",
  \"difficulties\": \"教学难点（一句话）\",
  \"preparation\": \"教学准备（软硬件/资源/案例）\",
  \"process\": [
    { \"step\": \"环节名\", \"minutes\": 数字, \"teacher\": \"教师活动\", \"student\": \"学生活动\", \"intent\": \"设计意图\" }
  ],
  \"blackboard\": \"板书设计（分行，用换行分隔）\",
  \"homework\": \"作业布置\",
  \"reflection\": \"教学反思\"
}`;

const SYS_SCHEMA = '你是一名深耕职业教育十余年的教学设计专家，擅长「理实一体」教学，熟悉高职课堂节奏与实训规范。请严格按下方 JSON 结构输出，只输出一个合法 JSON 对象，不要 Markdown 代码块、不要注释、不要任何前后缀文字，字段名与类型不得增删。\n\n输出 JSON 结构：\n' + SCHEMA + '\n\n内容规范：1) 教学目标用可测量的动词（能说出/会配置/能独立完成…）；2) 重点=必须掌握的核心，难点=易错抽象需突破的；3) process 覆盖「导入→新课/演示→任务实训→突破重难点→小结→作业」5~8 个环节，minutes 用数字且总和与课时匹配，每个环节的 teacher/student/intent 各 1~3 句、具体可操作；4) blackboard 用换行分行描述；5) homework 分基础题+拓展/实操题；6) 贴合职业教育，融入项目任务、岗位情境、实训操作。';

async function generateLessonPlan(input, llm) {
  // llm: { provider, apiKey, baseUrl, model, reasoningEffort, webSearch }
  const results = { research: {}, draft: {}, review: {}, finalize: {} };
  const onRound = function (s) { if (typeof input._onRound === 'function') input._onRound(s); };
  const rEffort = llm.reasoningEffort || 'max';
  // 分轮思考强度：检索/评审用 low 提速，初稿/定稿用配置强度保证质量
  const base = { provider: llm.provider, apiKey: llm.apiKey, baseUrl: llm.baseUrl, model: llm.model, reasoningEffort: rEffort, thinking: true };
  const quick = Object.assign({}, base, { reasoningEffort: 'low' });

  const topic = input.topic || input.course || '本课程';

  // ---------- 第 1 轮：联网检索 ----------
  // web_search 工具仅智谱官方通道真正支持执行（中转站会忽略工具参数）
  const tools = (llm.webSearch && llm.provider === 'zhipu')
    ? [webSearchTool('检索与「' + topic + '」相关的最新、权威知识点、行业/岗位现状、典型教学案例、常见考点与易错点，用于生成职业教育教案。')]
    : undefined;
  const researchSys = '你是教研助手，负责为教案撰写做前期资料搜集。请联网检索并整理一份简洁的知识要点清单，涵盖：核心概念、关键原理、真实岗位/行业应用案例、常见考点与易错点。若无法联网，就用你的知识整理。只输出要点清单正文，不要 JSON。';
  const researchUser = '课程：' + (input.course || '') + '｜章节：' + (input.chapter || '') + '｜主题：' + topic + '｜授课对象：' + (input.audience || '') + '｜知识点：' + ((input.knowledgePoints || []).join('、') || '（通用）') + '。请联网检索并整理上述要点清单。';
  const r1 = await chat(Object.assign({}, quick, { messages: [ {role:'system',content:researchSys}, {role:'user',content:researchUser} ], tools: tools, jsonMode: false }));
  results.research = { content: r1.content, reasoning: r1.reasoning, sources: extractSources(r1) };

  // ---------- 第 2 轮：初稿生成 ----------
  onRound('AI 第2轮：生成教案初稿');
  const draftUser = '请根据以下课程信息与检索资料，生成一份完整的高职教案 JSON。\n\n【课程信息】\n课程名称：' + (input.course || '') + '\n章节：' + (input.chapter || '') + '\n主题：' + topic + '\n授课对象：' + (input.audience || '') + '\n课时：' + (input.hours || '') + '\n知识点：' + ((input.knowledgePoints || []).join('、') || '（通用）') + '\n\n【检索资料（仅供参考，可取舍）】\n' + (r1.content || '（无）').slice(0, 4000);
  const r2 = await chat(Object.assign({}, base, { messages: [ {role:'system',content:SYS_SCHEMA}, {role:'user',content:draftUser} ], jsonMode: true, maxTokens: 12000 }));
  results.draft = { content: r2.content, reasoning: r2.reasoning };

  // ---------- 第 3 轮：自我评审 ----------
  onRound('AI 第3轮：教研员视角自我评审');
  const reviewSys = '你是一名资深教研员，负责评审教案质量。请从「准确性、实用性、学情匹配度、职教规范性、重难点是否清晰、环节是否完整」六个维度评审，指出 3~5 个具体问题并给出修改建议。只输出评审意见正文，不要 JSON。';
  const reviewUser = '请评审下面这份教案（JSON），指出问题与修改建议：\n' + r2.content.slice(0, 6000);
  const r3 = await chat(Object.assign({}, quick, { messages: [ {role:'system',content:reviewSys}, {role:'user',content:reviewUser} ], jsonMode: false }));
  results.review = { content: r3.content, reasoning: r3.reasoning };

  // ---------- 第 4 轮：优化定稿 ----------
  onRound('AI 第4轮：按评审意见优化定稿');
  const finalUser = '请根据以下评审意见，逐条优化教案，并输出最终版 JSON。\n\n【上一版教案 JSON】\n' + r2.content.slice(0, 6000) + '\n\n【评审意见】\n' + r3.content.slice(0, 3000) + '\n\n请输出优化后的完整 JSON。';
  // 定稿轮若 JSON 解析失败，自动追加一次修复重试
  let r4 = await chat(Object.assign({}, base, { messages: [ {role:'system',content:SYS_SCHEMA}, {role:'user',content:finalUser} ], jsonMode: true, maxTokens: 12000 }));
  if (!tryParse(r4.content)) {
    const repairUser = '你上一次输出的内容不是合法 JSON。请把它修复为完全合法的 JSON（不要 Markdown 代码块、不要注释、不要多余文字），原样保留全部字段内容后重新输出：\n' + r4.content.slice(0, 8000);
    const r4b = await chat(Object.assign({}, base, { messages: [ {role:'system',content:SYS_SCHEMA}, {role:'user',content:repairUser} ], jsonMode: true, maxTokens: 12000 }));
    if (tryParse(r4b.content)) r4 = r4b;
  }
  results.finalize = { content: r4.content, reasoning: r4.reasoning };

  const plan = parsePlan(r4.content, input);
  plan._meta = {
    model: llm.model,
    reasoningEffort: rEffort,
    webSearch: !!tools,
    rounds: results
  };
  return { plan: plan, results: results };
}

// 尝试解析（去围栏/截取花括号），成功返回对象否则 null
function tryParse(text) {
  if (!text) return null;
  let t = String(text).trim();
  // 去 Markdown 代码块围栏
  t = t.replace(/^```[a-zA-Z]*\s*/, '').replace(/\s*```$/, '');
  try { return JSON.parse(t); } catch (e) {}
  // 截取第一个 { 到最后一个 }
  const m = t.match(/\{[\s\S]*\}/);
  if (m) {
    let s = m[0];
    try { return JSON.parse(s); } catch (e) {}
    // 修常见问题：尾逗号
    const s2 = s.replace(/,\s*([}\]])/g, '$1');
    try { return JSON.parse(s2); } catch (e) {}
  }
  return null;
}

// 把 LLM 输出的 JSON 解析并归一化成渲染器需要的结构
function parsePlan(text, input) {
  const json = tryParse(text);
  if (!json) throw new Error('AI 未能输出合法 JSON（已自动重试仍失败），请重试或切换模板模式。');
  const pick = function (v, d) { return (v === undefined || v === null || v === '') ? d : v; };
  const str = function (v) { return Array.isArray(v) ? v.join('；') : String(v); };
  const plan = {
    title: pick(json.title, (input.course || '') + ' · ' + (input.topic || '') + '（教案）'),
    course: pick(json.course, input.course || ''),
    chapter: pick(json.chapter, input.chapter || ''),
    topic: pick(json.topic, input.topic || ''),
    audience: pick(json.audience, input.audience || ''),
    hours: pick(json.hours, input.hours || ''),
    teacher: pick(json.teacher, input.teacher || ''),
    date: pick(json.date, input.date || new Date().toLocaleDateString('zh-CN')),
    goals: {
      knowledge: pick(json.goals && json.goals.knowledge, ''),
      ability: pick(json.goals && json.goals.ability, ''),
      quality: pick(json.goals && json.goals.quality, '')
    },
    keyPoints: str(pick(json.keyPoints, '')),
    difficulties: str(pick(json.difficulties, '')),
    preparation: str(pick(json.preparation, '')),
    process: (Array.isArray(json.process) ? json.process : []).map(function (p) {
      return {
        step: p.step || '',
        minutes: Number(p.minutes) || 0,
        teacher: p.teacher || '',
        student: p.student || '',
        intent: p.intent || ''
      };
    }),
    blackboard: str(pick(json.blackboard, '')),
    homework: str(pick(json.homework, '')),
    reflection: str(pick(json.reflection, ''))
  };
  if (!plan.process.length) plan.process = [{ step: '一、新课讲授', minutes: 90, teacher: '', student: '', intent: '' }];
  return plan;
}

module.exports = { generateLessonPlan, parsePlan };
