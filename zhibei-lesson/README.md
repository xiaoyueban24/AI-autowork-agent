# 智备教案 · AI 一键生成教案与课件

> **v2 一体化生成**（`unified.js` + `/api/unified` 异步任务 + 工作台「一体化生成台」）：填一次课上课内容 → 一次产出 Word 教案 + 教案 A4 PDF + PPT 三件套（PPTX + 放映 HTML + 打印 PDF），支持自定义 AI 接口地址（OpenAI 兼容），实时显示四轮迭代阶段。

> **v1.1 新增：通用「一键生成」**（`one-click.js` + `/api/oneclick` + 工作台「一键生成控制台」）
> 任意主题 → PPT 三件套（HTML 放映 + 可编辑 PPTX + 可打印 PDF），可选同时产出教案（Word + A4 PDF）。
> 流水线借鉴 Gamma / Kimi PPT：AI 大纲先行（逐页 layout/bullets/notes）→ 主题渲染（dsh-slides 5 套主题）→ Edge 无头打印 PDF；离线模板兜底。

浙江工业职业技术学院「电信杯」首届 AI 应用大赛参赛作品。

输入课程信息，**真实大模型多轮生成**：联网检索 → 初稿 → 自我评审 → 优化定稿，一键输出排版整齐的 Word 教案(.docx) 与配套 PPT 课件(.pptx)，并保留模型的思考过程与参考来源。

## 功能特点

- **真·多轮 AI 生成**（非模板套皮）：联网检索 → 初稿 → 自我评审 → 优化定稿，四轮迭代
- **多模型支持**：GLM 中转站（校内直连）、智谱 GLM-5.3 官方、DeepSeek、任意 AI Platform 兼容接口
- **深度思考模式**：保留并展示模型的 reasoning_content（思考过程），推理强度 low/high/max 可调
- **联网搜索**：调用 GLM web_search 检索最新权威资料，并标注参考来源
- **双向输出**：Word 教案 + PPT 课件一次生成，内容对应、风格统一
- **PPT 内容充实**：课件用 pptwise 引擎渲染，原生可编辑 PPTX（非图片/HTML），每页用真实教案内容填满
- **双引擎输出**：除 pptwise 外，另集成 dsh-slides 引擎——同时产出 **HTML 自包含演示**（浏览器放映，S 键看演讲备注，Ctrl+P 直接打印 PDF）与可编辑 PPTX，5 套主题（plain/ink/midnight/slate/sunrise）
- **动画自动化**：通过 PowerPoint COM 给课件自动加转场、逐元素入场动画、演讲者备注（教师活动/设计意图自动写入），拿到手就能放映
- **模板兜底**：无 API key 时离线模板兜底，保证随时可用

## 快速开始

```bash
npm install            # 安装依赖（docx、pptxgenjs）
node generate.js       # 命令行生成（读 config.js），输出到 output/
node server.js         # 启动 Web 界面，浏览器打开 http://localhost:3000
```

或双击 `启动智备教案.bat` 一键启动并打开浏览器。

**PPT 引擎切换**：默认 pptwise；`set ZHIBEI_PPT_ENGINE=slides` 后用 dsh-slides 引擎（输出 HTML 演示 + PPTX 双格式）。

## 接入真实 AI（关键）

**推荐：GLM 中转站（无需注册，校内网络直连）**

```js
// config.js
aiApiKey: 'sk-ar-xxxx',      // 中转站 key（服务器端环境变量 ABC_API_KEY 同样有效）
aiProvider: 'abc',            // GLM 中转站
aiModel: 'glm-5.3',           // glm-5.3 / glm-5.3-flash / deepseek-v4-pro ...
aiReasoningEffort: 'max',     // low | high | max（GLM 思考强度）
aiWebSearch: true             // 是否联网搜索
```

也可用环境变量（推荐，避免硬编码泄露）：先 `set ABC_API_KEY=sk-ar-xxxx` 再启动。

其他通道：

- 智谱 GLM 官方：https://open.bigmodel.cn （aiProvider: 'zhipu'）
- DeepSeek：https://platform.deepseek.com （aiProvider: 'deepseek'）
- 任意 AI Platform 兼容接口：填 aiProvider 'openai' + aiBaseUrl

## 生成流程（多轮迭代）

1. **联网检索**：调用 web_search 检索主题最新权威资料，整理知识要点与参考来源；
2. **初稿生成**：结合检索资料 + 课程信息，生成完整教案 JSON（结构化输出）；
3. **自我评审**：以教研员视角从准确性/实用性/学情匹配/职教规范等维度评审；
4. **优化定稿**：根据评审意见逐条优化，输出最终 JSON，渲染成 Word + PPT。

每轮的 reasoning_content（思考过程）都会保留，Web 界面会展示「参考来源」「自我评审意见」「模型思考过程」。

## 目录结构

```
zhibei-lesson/
├── llm.js           # 多模型统一客户端（GLM/DeepSeek/OpenAI兼容 + 思考 + JSON + 联网工具）
├── pipeline.js      # 四轮迭代生成流水线
├── content.js       # 入口：AI 多轮优先 + 模板兜底
├── gen-docx.js      # Word 教案生成器（docx）
├── gen-pptx.js      # PPT 课件生成器（pptxgenjs，兜底）
├── gen-pptx-pptwise.js # PPT 课件生成器（pptwise，原生可编辑、内容充实，优先）
├── gen-pptx-slides.js # PPT 课件生成器（dsh-slides，HTML deck + PPTX 双格式）
├── generate.js      # 命令行入口
├── server.js        # Web 服务
├── config.js        # 课程 + 模型配置示例
├── 启动智备教案.bat  # 一键启动脚本
└── public/          # Web 界面
```

## 技术栈

- Node.js
- docx / pptxgenjs（生成 .docx / .pptx）
- pptwise（生成原生可编辑、内容充实的 PPTX）
- GLM-5.3（深度思考 + 联网搜索 + 结构化输出）/ DeepSeek API
