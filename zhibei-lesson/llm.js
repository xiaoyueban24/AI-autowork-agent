// 智备教案 - 统一 LLM 客户端（多模型）
// 支持：智谱 GLM、DeepSeek、GLM 中转站（abc）、任意 AI Platform 兼容接口
// 能力：深度思考（reasoning_content）、结构化输出（JSON）、联网搜索工具（仅智谱官方）
// 传输：node:http/https 直连（无 undici 默认 5 分钟超时限制，长思考不中断）
const http = require('http');
const https = require('https');

const PROVIDERS = {
  zhipu: { name: '智谱 GLM', base: 'https://open.bigmodel.cn/api/paas/v4' },
  deepseek: { name: 'DeepSeek', base: 'https://api.deepseek.com' },
  abc: { name: 'GLM 中转站', base: 'http://171.80.3.206:28080/v1' },
  openai: { name: 'AI Platform 兼容', base: '' } // 自定义 base 由用户提供
};

function postJson(urlStr, headers, bodyObj, timeoutMs) {
  return new Promise(function (resolve, reject) {
    let u;
    try { u = new URL(urlStr); } catch (e) { return reject(new Error('接口地址非法: ' + urlStr)); }
    const mod = u.protocol === 'https:' ? https : http;
    const data = Buffer.from(JSON.stringify(bodyObj), 'utf8');
    const req = mod.request({
      hostname: u.hostname,
      port: u.port || (u.protocol === 'https:' ? 443 : 80),
      path: u.pathname + u.search,
      method: 'POST',
      headers: Object.assign({ 'Content-Length': data.length }, headers)
    }, function (res) {
      const chunks = [];
      res.on('data', function (c) { chunks.push(c); });
      res.on('end', function () {
        resolve({ status: res.statusCode, text: Buffer.concat(chunks).toString('utf8') });
      });
    });
    req.on('error', function (e) { reject(new Error('网络错误: ' + e.message)); });
    if (timeoutMs) {
      req.setTimeout(timeoutMs, function () {
        req.destroy(new Error('请求超时（' + Math.round(timeoutMs / 1000) + ' 秒），模型响应过慢，可调低思考强度'));
      });
    }
    req.write(data);
    req.end();
  });
}

/**
 * 调用大模型对话接口
 * opts: provider/apiKey/baseUrl/model/messages/temperature/maxTokens/
 *       thinking/reasoningEffort/jsonMode/tools
 * @returns {content, reasoning, toolCalls, searchResult, usage}
 */
async function chat(opts) {
  const prov = PROVIDERS[opts.provider] || PROVIDERS.openai;
  const base = (opts.baseUrl || prov.base).replace(/\/$/, '');
  const url = base + '/chat/completions';

  const body = {
    model: opts.model,
    messages: opts.messages,
    temperature: opts.temperature != null ? opts.temperature : 0.7
  };
  if (opts.maxTokens) body.max_tokens = opts.maxTokens;

  // 深度思考：GLM 系（zhipu 官方 / abc 中转站）支持 thinking / reasoning_effort
  if ((opts.provider === 'zhipu' || opts.provider === 'abc') && opts.thinking) {
    body.thinking = { type: 'enabled' };
  }
  if ((opts.provider === 'zhipu' || opts.provider === 'abc') && opts.reasoningEffort) {
    body.reasoning_effort = opts.reasoningEffort;
  }

  // 结构化输出（JSON 模式）
  if (opts.jsonMode) {
    body.response_format = { type: 'json_object' };
  }

  // 工具（联网搜索等，仅智谱官方通道真正支持执行）
  if (opts.tools && opts.tools.length) {
    body.tools = opts.tools;
    body.tool_choice = 'auto';
  }

  const resp = await postJson(url, {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + opts.apiKey
  }, body, opts.timeoutMs || 900000); // 默认单轮最长 15 分钟（长思考不中断）

  if (resp.status !== 200) {
    throw new Error('LLM 接口错误 ' + resp.status + '：' + resp.text.slice(0, 400));
  }
  let data;
  try { data = JSON.parse(resp.text); }
  catch (e) { throw new Error('LLM 返回非 JSON：' + resp.text.slice(0, 200)); }

  const msg = data.choices && data.choices[0] && data.choices[0].message;
  if (!msg) throw new Error('LLM 返回为空：' + resp.text.slice(0, 200));

  return {
    content: (msg.content || '').trim(),
    reasoning: (msg.reasoning_content || msg.reasoning || '').trim(),
    toolCalls: msg.tool_calls || null,
    searchResult: msg.search_result || msg.web_search || null,
    usage: data.usage || null
  };
}

/** 联网搜索工具（GLM web_search，仅智谱官方通道支持执行） */
function webSearchTool(searchPrompt, count) {
  return {
    type: 'web_search',
    web_search: {
      enable: true,
      search_engine: 'search_pro',
      search_result: true,
      search_prompt: searchPrompt || '请检索与本课程主题相关的最新、权威知识与教学资料。',
      count: count || 8
    }
  };
}

/** 从返回中提取参考来源 */
function extractSources(res) {
  const out = [];
  if (res && res.searchResult && Array.isArray(res.searchResult)) {
    for (const s of res.searchResult) {
      if (s && (s.title || s.link)) out.push({ title: s.title || '', url: s.link || s.url || '', snippet: (s.content || s.summary || '').slice(0, 200) });
    }
  }
  if (res && res.toolCalls) {
    for (const tc of res.toolCalls) {
      if (tc && tc.function) {
        try {
          const a = JSON.parse(tc.function.arguments || '{}');
          if (a.search_result) {
            for (const s of a.search_result) {
              out.push({ title: s.title || '', url: s.link || s.url || '', snippet: (s.content || s.summary || '').slice(0, 200) });
            }
          }
        } catch (e) {}
      }
    }
  }
  return out;
}

module.exports = { chat, PROVIDERS, webSearchTool, extractSources };
