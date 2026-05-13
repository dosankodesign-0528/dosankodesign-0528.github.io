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

import type { StatusOptionKey } from "./schema-resolver.js";

export interface CompanyRecord {
  pageId: string;
  name: string;
  url: string | null;
  contactYears: string[];
  mediaTags: string[];
  /** Notion 上の現在の表示名（例: "S:継続中"）。書き込み・比較は statusKey 経由を推奨 */
  status: string | null;
  /** ステータスの内部 role key（rename されても不変） */
  statusKey: StatusOptionKey | null;
  lastContactAt: Date | null;
  /** 前回 sync 完了時に記録したステータス。手動編集検知に使う。 */
  lastKnownStatus: string | null;
  /** lastKnownStatus を内部 role key に解決したもの */
  lastKnownStatusKey: StatusOptionKey | null;
  /** Notion 側「重複疑い」checkbox の現在値 */
  duplicateFlag: boolean;
}

export interface SyncStats {
  fetched: number;
  added: number;
  updated: number;
  skipped: number;
  errors: number;
  errorDetails: string[];
}
