export interface Source {
  name: string;
  enabled: boolean;
  query: string;
  tag: string;
  memo?: string;
  fetchBody?: boolean;
}

export interface RawMessage {
  id: string;
  threadId: string;
  fromName?: string;
  fromAddress: string;
  fromDomain: string;
  subject: string;
  snippet: string;
  body?: string;
  date: Date;
  isOutgoing: boolean;
  /** 添付ファイル名のリスト（filename属性のあるpartのみ。署名画像など inline は除外） */
  attachmentNames?: string[];
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
  status: string | null;
  lastContactAt: Date | null;
  /** 前回 sync 完了時に記録したステータス。手動編集検知に使う。 */
  lastKnownStatus: string | null;
}

export interface SyncStats {
  fetched: number;
  added: number;
  updated: number;
  skipped: number;
  errors: number;
  errorDetails: string[];
}
