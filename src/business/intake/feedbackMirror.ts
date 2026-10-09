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
  /** 来源标识（多源时代 0927；db 读出恒有，remote may omit it）。 */
  source?: string;
  /** 创建者类型（缺省 = legacy 外部记录，视同 human 照旧进件，fail-open 向后兼容）。 */
  origin_kind?: FbOriginKind;
  /** 具体创建者身份（审计面：'cyber' / 'juli-dev' / 'mirror-sync'）。 */
  origin_actor?: string;
  /** 回链（workflow id / 父记录——追责链闭环）。 */
  origin_ref?: string;
}
