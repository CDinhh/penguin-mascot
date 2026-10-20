# @prm393/penguin-mascot-react

Component React cho BipBip (bản plush). Dùng Rive; không nạp được file `.riv` thì lùi về web component `<penguin-mascot>`.
Chưa publish; dùng trong monorepo hoặc qua git tag. Gói phân phối mã nguồn TypeScript (`src/`); với Next.js thêm vào `transpilePackages`.

```tsx
import { PenguinMascot } from '@prm393/penguin-mascot-react';

<PenguinMascot state="happy" size={160} onDone={(s) => console.log('xong', s)} />
```

| Prop | Ý nghĩa |
| --- | --- |
| `state` | Một trong 15 trạng thái (kiểu `MascotState` sinh từ `spec/mascot.json`) |
| `size` | Chiều rộng, số (px) hoặc chuỗi CSS. Mặc định 200 |
| `variant` | `'plush'` (hiện chỉ có bản này) |
| `onDone` | Gọi khi animation một lần xong |
| `replayKey` | Đổi giá trị để phát lại đúng trạng thái một lần đang chọn (ví dụ sai hai lần liền) |
| `src` | Đường dẫn file `.riv`, mặc định `rive/bipbip.riv` |
| `reducedMotion` | Ép giảm chuyển động; mặc định theo `prefers-reduced-motion` |
| `onFallback` | Gọi khi đã lùi về web component |

- Giảm chuyển động: đứng yên ở `idle`; animation một lần không chạy nhưng `onDone` vẫn được gọi.
- Khuất màn hình thì tạm dừng (do `@rive-app/react-canvas`).
- Tự host `rive.wasm`: `RuntimeLoader.setWasmUrl(url)` từ `@rive-app/canvas` (xem `examples/react/src/main.tsx`).
- Ví dụ chạy được: `npm run dev -w @prm393/example-react`.
