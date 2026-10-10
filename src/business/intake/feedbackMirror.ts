// FbRecord port type (stub) — the feedback record shape this package routes.
export type FbOriginKind = 'human' | 'agent' | 'engine';

export interface FbRecord {
  id: string;
  created: string;
  updated: string;
  status: string;
  type: string;
  page: string;
  page_title: string;
  body: string;
  author_name: string;
  author_role: string;
  reply_to: string;
  element_label: string;
  /** Source identifier (multi-source era 0927; always present when read from
   * the db, remote may omit it). */
  source?: string;
  /** Creator kind (default = legacy external record, treated as human and
   * intaked as before — fail-open backward compatibility). */
  origin_kind?: FbOriginKind;
  /** Concrete creator identity (audit surface: 'cyber' / 'juli-dev' /
   * 'mirror-sync'). */
  origin_actor?: string;
  /** Back-link (workflow id / parent record — closes the accountability
   * chain). */
  origin_ref?: string;
}
