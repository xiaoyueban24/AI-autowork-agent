// 智备教案 - 配置示例（照你的课程改即可）
module.exports = {
  // 基本信息
  course: '计算机网络基础',
  chapter: '第3章 网络层',
  topic: 'IP地址与子网划分',
  audience: '2024级计算机应用技术专业学生',
  hours: '2 课时（90 分钟）',
  teacher: '（你的姓名）',
  date: '2026-09-15',

  // 知识点（联网检索与教案生成都会参考）
  knowledgePoints: [
    'IP地址的概念与分类',
    '子网掩码的作用',
    '子网划分的方法',
    'CIDR 无类别编址'
  ],

  // 教学目标/重难点（可留空，AI 会自动补全）
  goalKnowledge: '',
  goalAbility: '',
  goalQuality: '',
  keyPoints: '',
  difficulties: '',
  preparation: '',
  homework: '',

  // ---- AI 模式（多轮生成：联网检索→初稿→评审→定稿）----
  // key 优先级：此处填写 > 环境变量 ABC_API_KEY / ZHIPU_API_KEY
  // 留空且无环境变量时，自动回退离线模板模式。
  aiApiKey: '',                    // 例：'sk-ar-xxxx'；留空则读环境变量
  aiProvider: 'abc',               // zhipu | deepseek | abc（GLM 中转站）| openai
  aiModel: 'glm-5.3',              // glm-5.3 / glm-5.3-flash / deepseek-v4-pro ...
  aiBaseUrl: '',                   // 留空用 llm.js 内置默认；自定义接口时填
  aiReasoningEffort: 'max',        // low | high | max（GLM 思考强度）
  aiWebSearch: true                // 是否联网搜索
};
