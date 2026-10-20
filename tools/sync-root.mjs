// Giữ link cũ không hỏng: chép penguin.js và penguin-plush.svg từ packages/web ra thư mục gốc.
// File ở gốc là bản chép (không sửa tay); test/root-copy.test.mjs kiểm tra chúng giống bản gốc.
import { copyFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const COPIED = ['penguin.js', 'penguin-plush.svg'];

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  for (const f of COPIED) copyFileSync(join(root, 'packages', 'web', f), join(root, f));
  console.log(`Đã chép ${COPIED.join(', ')} ra thư mục gốc`);
}
