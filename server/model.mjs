import { validateDraft } from './content-files.mjs';

export async function analyzeInterview({ metadata, transcript }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured');

  const baseUrl = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
  const model = process.env.AI_MODEL || 'gpt-4.1-mini';

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt() },
        { role: 'user', content: JSON.stringify({ metadata, transcript }) }
      ]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI analysis failed: ${response.status} ${errorText}`);
  }

  const json = await response.json();
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error('AI response did not include content');

  const draft = parseJsonContent(content);
  validateDraft(draft);
  return draft;
}

function parseJsonContent(content) {
  const trimmed = content.trim().replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
  try {
    return JSON.parse(trimmed);
  } catch (error) {
    throw new Error(`AI response was not valid JSON: ${error.message}`);
  }
}

function systemPrompt() {
  return `你是一个面试复盘内容编辑器。请把用户提供的面试转写文本拆解成严格 JSON，不要输出 markdown 代码块或解释。

输出结构必须是：
{
  "company": {"slug","title","summary","company","role","stage","lastInterviewDate","tags","share","body"},
  "interview": {"slug","title","summary","company","role","round","date","status","score","tags","share","body"},
  "questions": [{"slug","title","summary","category","difficulty","source","companies","tags","share","body"}],
  "knowledge": [{"slug","title","summary","category","priority","updatedAt","companies","tags","share","body"}]
}

要求：
- slug 只能使用小写英文、数字和连字符。
- status 只能是 pending、passed、failed。
- difficulty 只能是 基础、进阶、高频。
- priority 只能是 低、中、高。
- body 必须是中文 Markdown，并以二级标题开头。
- 公司名、岗位、轮次、日期优先采用 metadata。
- 不要全文收录原始转写，只保留结构化复盘、建议回答、风险点和知识沉淀。
- questions 建议 4 到 8 条，knowledge 建议 3 到 6 条。
- share 默认 false 用于公司和面试，问题和知识点可用 true。`;
}