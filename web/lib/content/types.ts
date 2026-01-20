export interface ContentFrontmatter {
  title: string;
  date?: string | Date;
  tags?: string[];
  summary?: string;
  source_url?: string;
}

export interface ContentMetadata extends ContentFrontmatter {
  slug: string;
  path: string;
  url: string;
}

export interface ContentPage extends ContentMetadata {
  content: string;
  html: string;
}

export interface SearchIndexItem {
  slug: string;
  url: string;
  title: string;
  date?: string | Date;
  summary?: string;
  tags?: string[];
  body: string;
}

