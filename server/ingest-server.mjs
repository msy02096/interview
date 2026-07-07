import { createServer } from 'node:http';
import { buildContentFiles, validateDraft } from './content-files.mjs';
import { extractInputText } from './documents.mjs';
import { commitFilesToGitHub } from './github.mjs';
import { analyzeInterview } from './model.mjs';

const port = Number(process.env.PORT || 8787);

const server = createServer(async (request, response) => {
  setCorsHeaders(response);

  if (request.method === 'OPTIONS') {
    response.writeHead(204);
    response.end();
    return;
  }

  try {
    if (request.url === '/api/health' && request.method === 'GET') {
      sendJson(response, 200, { ok: true });
      return;
    }

    if (request.url === '/api/analyze-interview' && request.method === 'POST') {
      requireAdminToken(request);
      const payload = await readJson(request);
      const transcript = await extractInputText(payload);
      const draft = await analyzeInterview({ metadata: payload.metadata || {}, transcript });
      sendJson(response, 200, { draft });
      return;
    }

    if (request.url === '/api/commit-interview' && request.method === 'POST') {
      requireAdminToken(request);
      const payload = await readJson(request);
      const draft = validateDraft(payload.draft);
      const files = buildContentFiles(draft);
      const message = payload.message || `feat: add ${draft.interview.slug} interview notes`;
      const result = await commitFilesToGitHub(files, message);
      sendJson(response, 200, { ok: true, ...result });
      return;
    }

    sendJson(response, 404, { error: 'Not found' });
  } catch (error) {
    const status = error.statusCode || 500;
    sendJson(response, status, { error: error.message });
  }
});

server.listen(port, () => {
  console.log(`Interview ingest API listening on http://127.0.0.1:${port}`);
});

function requireAdminToken(request) {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) {
    const error = new Error('ADMIN_TOKEN is not configured');
    error.statusCode = 500;
    throw error;
  }

  const received = request.headers['x-admin-token'];
  if (received !== expected) {
    const error = new Error('Unauthorized');
    error.statusCode = 401;
    throw error;
  }
}

function setCorsHeaders(response) {
  response.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type,X-Admin-Token');
}

async function readJson(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 12 * 1024 * 1024) throw new Error('Request body is too large');
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  return JSON.parse(raw);
}

function sendJson(response, status, data) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(data));
}