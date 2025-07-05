export type Page = 'dashboard' | 'projects' | 'project-detail' | 'marketing-groups' | 'templates' | 'copy' | 'testing' | 'tags' | 'test-builder' | 'marketing-group-types';

export interface BreadcrumbItem {
  label: string;
  page?: Page;
  params?: Record<string, any>;
} 