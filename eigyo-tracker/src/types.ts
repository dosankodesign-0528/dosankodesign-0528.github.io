export interface Source {
  name: string;
  enabled: boolean;
  query: string;
  tag: string;
  memo?: string;
}

export interface RawMessage {
  id: string;
  threadId: string;
  fromName?: string;
  fromAddress: string;
  fromDomain: string;
  subject: string;
  snippet: string;
  date: Date;
  isOutgoing: boolean;
}

export interface ClassifiedMessage extends RawMessage {
  sourceTag: string;
  companyName: string;
  companyDomain: string;
  companyUrl: string;
}

export interface CompanyRecord {
  pageId: string;
  name: string;
  url: string | null;
  contactYears: string[];
  mediaTags: string[];
  reaction: string | null;
}

export interface SyncStats {
  fetched: number;
  added: number;
  updated: number;
  skipped: number;
  errors: number;
  errorDetails: string[];
}
