import { describe, expect, it } from 'vitest';
import { buildContentFiles, validateDraft } from '../server/content-files.mjs';

const validDraft = {
  company: {
    slug: 'demo-company',
    title: '演示公司',
    summary: '演示公司摘要。',
    company: '演示公司',
    role: '项目经理',
    stage: 'HR 初面后等待结果',
    lastInterviewDate: '2026-07-07',
    tags: ['HR初面', '项目交付'],
    share: false,
    body: '## 当前状态\n\n已完成 HR 初面。'
  },
  interview: {
    slug: '2026-07-07-demo-hr-interview',
    title: '演示公司 HR 初面复盘',
    summary: '围绕岗位匹配和项目经验展开。',
    company: '演示公司',
    role: '项目经理',
    round: 'HR 初面',
    date: '2026-07-07',
    status: 'pending',
    score: 78,
    tags: ['HR初面'],
    share: false,
    body: '## 面试结构\n\n电话初面。'
  },
  questions: [
    {
      slug: 'demo-question',
      title: '为什么适合这个岗位？',
      summary: '用于判断岗位匹配。',
      category: 'Career',
      difficulty: '高频',
      source: '演示公司 HR 初面',
      companies: ['演示公司'],
      tags: ['岗位匹配'],
      share: true,
      body: '## 推荐回答\n\n围绕经验和岗位匹配回答。'
    }
  ],
  knowledge: [
    {
      slug: 'demo-knowledge',
      title: 'HR 初面表达框架',
      summary: '少讲细节，多讲匹配。',
      category: 'Career',
      priority: '中',
      updatedAt: '2026-07-07',
      companies: ['演示公司'],
      tags: ['HR面'],
      share: true,
      body: '## 原则\n\n表达清晰。'
    }
  ]
};

describe('ingest content files', () => {
  it('renders a draft into content collection markdown files', () => {
    const files = buildContentFiles(validDraft);

    expect(files.map((file) => file.path)).toEqual([
      'src/content/companies/demo-company.md',
      'src/content/interviews/2026-07-07-demo-hr-interview.md',
      'src/content/questions/demo-question.md',
      'src/content/knowledge/demo-knowledge.md'
    ]);
    expect(files[0].content).toContain('title: 演示公司');
    expect(files[0].content).toContain('tags: [HR初面, 项目交付]');
    expect(files[1].content).toContain('status: pending');
    expect(files[2].content).toContain('difficulty: 高频');
    expect(files[3].content).toContain('priority: 中');
  });

  it('rejects drafts with missing required fields before commit', () => {
    const brokenDraft = structuredClone(validDraft);
    brokenDraft.interview.status = 'unknown';

    expect(() => validateDraft(brokenDraft)).toThrow('interview.status');
  });
});