# @prm393/penguin-mascot-rive

Thêm `renderer="rive"` cho web component `<penguin-mascot>` (chạy bằng [`@rive-app/canvas`](https://www.npmjs.com/package/@rive-app/canvas)).
Chưa publish; dùng trong monorepo hoặc qua git tag.

```js
import '@prm393/penguin-mascot';                 // hoặc <script src="penguin.js">
import { configure } from '@prm393/penguin-mascot-rive';

configure({ src: '/assets/bipbip.riv', wasmUrl: '/assets/rive.wasm' }); // tùy chọn
```

```html
<penguin-mascot renderer="rive" state="idle" size="160"></penguin-mascot>
```

API giống bản SVG: `el.play('happy')` trả về Promise (resolve khi animation một lần xong), sự kiện `statechange`, `animationdone`.

- **File .riv**: thuộc tính `rive-src`, hoặc `configure({ src })`, hoặc `rive/bipbip.riv` (tương đối với trang). Hợp đồng rig ở [`rive/README.md`](../../rive/README.md).
- **Đường lùi**: không nạp được file (thiếu, hỏng, thiếu input theo spec) thì thẻ tự về SVG và phát sự kiện `rendererfallback` (`detail.error`).
- **Hiệu năng**: dừng vẽ khi khuất màn hình (`IntersectionObserver`), tab ẩn (`visibilitychange`) và khi `prefers-reduced-motion`; mỗi thẻ một instance Rive.
- **WASM**: mặc định runtime tải `rive.wasm` từ CDN của Rive. Dùng `configure({ wasmUrl })` để tự host (xem `examples/web-rive`).
- Trạng thái, thời lượng, input lấy từ `src/spec.generated.js` (sinh từ `spec/mascot.json` bằng `npm run codegen`).
- `driver` (`@prm393/penguin-mascot-rive/driver`) không phụ thuộc DOM hay thư viện Rive, có test với Rive giả.
