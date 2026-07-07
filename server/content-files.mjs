const collectionConfig = {
  company: {
    path: 'src/content/companies',
    required: ['slug', 'title', 'summary', 'company', 'role', 'stage', 'lastInterviewDate', 'tags', 'share', 'body']
  },
  interview: {
    path: 'src/content/interviews',
    required: ['slug', 'title', 'summary', 'company', 'role', 'round', 'date', 'status', 'score', 'tags', 'share', 'body']
  },
  questions: {
    path: 'src/content/questions',
    required: ['slug', 'title', 'summary', 'category', 'difficulty', 'source', 'companies', 'tags', 'share', 'body']
  },
  knowledge: {
    path: 'src/content/knowledge',
    required: ['slug', 'title', 'summary', 'category', 'priority', 'updatedAt', 'companies', 'tags', 'share', 'body']
  }
};

const statusValues = new Set(['passed', 'pending', 'failed']);
const questionDifficulties = new Set(['基础', '进阶', '高频']);
const knowledgePriorities = new Set(['低', '中', '高']);

export function validateDraft(draft) {
  if (!draft || typeof draft !== 'object') {
    throw new Error('draft must be an object');
  }

  validateEntry('company', draft.company, collectionConfig.company.required);
  validateEntry('interview', draft.interview, collectionConfig.interview.required);

  if (!Array.isArray(draft.questions)) throw new Error('questions must be an array');
  if (!Array.isArray(draft.knowledge)) throw new Error('knowledge must be an array');

  draft.questions.forEach((item, index) => validateEntry(`questions[${index}]`, item, collectionConfig.questions.required));
  draft.knowledge.forEach((item, index) => validateEntry(`knowledge[${index}]`, item, collectionConfig.knowledge.required));

  if (!statusValues.has(draft.interview.status)) throw new Error('interview.status must be passed, pending, or failed');
  if (typeof draft.interview.score !== 'number' || draft.interview.score < 0 || draft.interview.score > 100) {
    throw new Error('interview.score must be a number between 0 and 100');
  }

  draft.questions.forEach((item, index) => {
    if (!questionDifficulties.has(item.difficulty)) throw new Error(`questions[${index}].difficulty is invalid`);
  });
  draft.knowledge.forEach((item, index) => {
    if (!knowledgePriorities.has(item.priority)) throw new Error(`knowledge[${index}].priority is invalid`);
  });

  return draft;
}

export function buildContentFiles(draft) {
  validateDraft(draft);

  return [
    entryFile(collectionConfig.company.path, draft.company, [
      'title', 'summary', 'company', 'role', 'stage', 'lastInterviewDate', 'tags', 'share'
    ]),
    entryFile(collectionConfig.interview.path, draft.interview, [
      'title', 'summary', 'company', 'role', 'round', 'date', 'status', 'score', 'tags', 'share'
    ]),
    ...draft.questions.map((item) => entryFile(collectionConfig.questions.path, item, [
      'title', 'summary', 'category', 'difficulty', 'source', 'companies', 'tags', 'share'
    ])),
    ...draft.knowledge.map((item) => entryFile(collectionConfig.knowledge.path, item, [
      'title', 'summary', 'category', 'priority', 'updatedAt', 'companies', 'tags', 'share'
    ]))
  ];
}

function validateEntry(name, entry, requiredFields) {
  if (!entry || typeof entry !== 'object') throw new Error(`${name} must be an object`);
  for (const field of requiredFields) {
    const value = entry[field];
    if (value === undefined || value === null || value === '') throw new Error(`${name}.${field} is required`);
  }
  if (!isSafeSlug(entry.slug)) throw new Error(`${name}.slug must use lowercase letters, numbers, and hyphens`);
  if (!Array.isArray(entry.tags)) throw new Error(`${name}.tags must be an array`);
  if (entry.companies !== undefined && !Array.isArray(entry.companies)) throw new Error(`${name}.companies must be an array`);
  if (typeof entry.body !== 'string' || !entry.body.trim().startsWith('##')) {
    throw new Error(`${name}.body must be markdown content starting with a heading`);
  }
}

function entryFile(directory, entry, frontmatterFields) {
  return {
    path: `${directory}/${entry.slug}.md`,
    content: renderEntry(entry, frontmatterFields)
  };
}

function renderEntry(entry, frontmatterFields) {
  const frontmatter = frontmatterFields.map((field) => `${field}: ${formatYamlValue(entry[field])}`).join('\n');
  return `---\n${frontmatter}\n---\n\n${entry.body.trim()}\n`;
}

function formatYamlValue(value) {
  if (Array.isArray(value)) return `[${value.map(formatArrayItem).join(', ')}]`;
  if (typeof value === 'boolean' || typeof value === 'number') return String(value);
  return formatScalar(String(value));
}

function formatArrayItem(value) {
  return formatScalar(String(value));
}

function formatScalar(value) {
  if (/[:#\[\]{}]|^\s|\s$|^$/.test(value)) return JSON.stringify(value);
  return value;
}

function isSafeSlug(value) {
  return typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}