type DatedEntry = {
  data: {
    date: Date;
  };
};

type CategorizedEntry = {
  data: {
    title: string;
    category: string;
  };
};

type CompanyLinkedEntry = {
  data: {
    companies?: string[];
  };
};

const statusLabels = {
  passed: '已通过',
  pending: '等待结果',
  failed: '未通过'
} as const;

export type InterviewStatus = keyof typeof statusLabels;

export function sortByDateDesc<T extends DatedEntry>(entries: T[]): T[] {
  return [...entries].sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export function groupByCategory<T extends CategorizedEntry>(entries: T[]): Record<string, string[]> {
  return entries.reduce<Record<string, string[]>>((groups, entry) => {
    const category = entry.data.category;
    groups[category] = groups[category] ?? [];
    groups[category].push(entry.data.title);
    return groups;
  }, {});
}

export function filterByCompany<T extends CompanyLinkedEntry>(entries: T[], company: string): T[] {
  return entries.filter((entry) => entry.data.companies?.includes(company));
}

export function getStatusLabel(status: InterviewStatus): string {
  return statusLabels[status];
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}