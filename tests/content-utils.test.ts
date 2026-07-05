import { describe, expect, it } from 'vitest';
import { filterByCompany, getStatusLabel, groupByCategory, sortByDateDesc } from '../src/lib/content-utils';

describe('content utilities', () => {
  it('sorts dated entries from newest to oldest', () => {
    const entries = [
      { data: { date: new Date('2026-06-18') } },
      { data: { date: new Date('2026-07-05') } },
      { data: { date: new Date('2026-05-12') } }
    ];

    expect(sortByDateDesc(entries).map((entry) => entry.data.date.toISOString().slice(0, 10))).toEqual([
      '2026-07-05',
      '2026-06-18',
      '2026-05-12'
    ]);
  });

  it('groups entries by category while preserving titles', () => {
    const entries = [
      { data: { title: 'React 渲染机制', category: 'Frontend' } },
      { data: { title: '行为题 STAR', category: 'Behavioral' } },
      { data: { title: '浏览器缓存', category: 'Frontend' } }
    ];

    expect(groupByCategory(entries)).toEqual({
      Frontend: ['React 渲染机制', '浏览器缓存'],
      Behavioral: ['行为题 STAR']
    });
  });

  it('returns readable status labels for interview outcomes', () => {
    expect(getStatusLabel('passed')).toBe('已通过');
    expect(getStatusLabel('pending')).toBe('等待结果');
    expect(getStatusLabel('failed')).toBe('未通过');
  });

  it('filters entries by explicit company relation', () => {
    const entries = [
      { data: { title: 'AI 工具经验', companies: ['晓数绿景'] } },
      { data: { title: '通用项目复盘', companies: [] } },
      { data: { title: '售前驻厂经验', companies: ['晓数绿景', '另一家公司'] } }
    ];

    expect(filterByCompany(entries, '晓数绿景').map((entry) => entry.data.title)).toEqual([
      'AI 工具经验',
      '售前驻厂经验'
    ]);
  });
});