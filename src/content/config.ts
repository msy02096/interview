import { defineCollection, z } from 'astro:content';

const shared = {
  title: z.string(),
  summary: z.string(),
  tags: z.array(z.string()).default([]),
  share: z.boolean().default(false)
};

const interviews = defineCollection({
  type: 'content',
  schema: z.object({
    ...shared,
    company: z.string(),
    role: z.string(),
    round: z.string(),
    date: z.date(),
    status: z.enum(['passed', 'pending', 'failed']),
    score: z.number().min(0).max(100)
  })
});

const companies = defineCollection({
  type: 'content',
  schema: z.object({
    ...shared,
    company: z.string(),
    role: z.string(),
    stage: z.string(),
    lastInterviewDate: z.date().optional()
  })
});

const questions = defineCollection({
  type: 'content',
  schema: z.object({
    ...shared,
    category: z.string(),
    difficulty: z.enum(['基础', '进阶', '高频']),
    source: z.string(),
    companies: z.array(z.string()).default([])
  })
});

const knowledge = defineCollection({
  type: 'content',
  schema: z.object({
    ...shared,
    category: z.string(),
    priority: z.enum(['低', '中', '高']),
    updatedAt: z.date(),
    companies: z.array(z.string()).default([])
  })
});

export const collections = {
  interviews,
  companies,
  questions,
  knowledge
};