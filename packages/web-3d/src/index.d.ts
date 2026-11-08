export interface Configure {
  /** Thư mục chứa các file .glb (mặc định: thư mục `models` của gói). */
  baseUrl?: string;
  /** Hoặc đường dẫn riêng cho LOD0, LOD1, LOD2. */
  urls?: [string, string, string];
  /** Trần DPR khi vẽ (mặc định 2). */
  maxDpr?: number;
  /** Trần chiều rộng pixel khi vẽ (mặc định 1024). */
  maxPixels?: number;
}
export function configure(o?: Configure): void;
/** 0 = chi tiết nhất (trên 260 px), 1 = 111..260 px, 2 = từ 110 px trở xuống. */
export function pickLod(px: number): 0 | 1 | 2;
export const LOD_FILES: readonly string[];
export function createThreeRenderer(root: ShadowRoot, ctx: { host: HTMLElement; variant: string; fail(err: unknown): void }): { play(state: string): Promise<string>; destroy(): void };
