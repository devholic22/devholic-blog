export interface PostMeta {
  title: string;
  date: string;
  tags: string[];
  description: string;
  source?: string;
  author?: string;
  [key: string]: any;
}

export interface Post extends PostMeta {
  slug: string;
  content: string;
  html: string;
}
