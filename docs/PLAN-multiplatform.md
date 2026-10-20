# Plan: đưa linh vật lên nhiều nền tảng (Web, React, Flutter, native)

Tài liệu này để giao cho người hoặc AI agent thực hiện. Làm theo từng giai
đoạn, mỗi giai đoạn là một PR riêng, đạt đủ "Tiêu chí xong" mới sang giai đoạn
sau. Phần nào cần con người (dựng animation trong Rive editor) được ghi rõ.

## 1. Mục tiêu

- Một nguồn sự thật cho nhân vật: hình, danh sách trạng thái, thời lượng,
  hành vi lặp hay một lần. Mọi nền tảng đọc từ cùng nguồn này, không chép tay.
- Chạy mượt (60 FPS), nhẹ, ít RAM trên mobile, theo cách các app lớn làm:
  **Rive** cho nhân vật tương tác (Duolingo, Intercom dùng Rive).
- Dùng lại dễ: cài một package rồi gọi `state = 'happy'`, ở Web, React và
  Flutter, cùng một API.
- Có đường lùi khi chưa có file Rive hoặc nền tảng chưa hỗ trợ: web component
  hiện tại (Web) và sprite sheet (Flutter, native).

## 2. Không làm trong plan này

- Không vẽ lại nhân vật hay đổi thiết kế bản `plush` và `classic`.
- Không bỏ web component `<penguin-mascot>` hiện tại; nó vẫn là bản Web zero-dependency.
- Không phát hành lên npm hoặc pub.dev công khai khi chưa được nhóm đồng ý (xem mục 8).

## 3. Hiện trạng (đã kiểm tra)

- `penguin.js` (khoảng 710 dòng): web component, SVG dựng bằng JS, animation bằng CSS.
  Có 2 variant: `classic` (vector phẳng) và `plush` (lông bông, dựng thủ tục bằng
  nhiều nét vẽ ngẫu nhiên có seed, cộng filter `feTurbulence`/`feDisplacementMap`).
- Các bộ phận đã tách lớp với class `pg-*`: `pg-body`, `pg-belly`, `pg-face`,
  `pg-wing-l/r`, `pg-foot-l/r`, `pg-pupil`, `pg-beak-top/bot`, `pg-brows`,
  `pg-eyes-happy/closed/heart`, `pg-mouth`, `pg-cap`, hiệu ứng (`pg-confetti`,
  `pg-heart`, `pg-z`, `pg-tear`, `pg-flame`...).
- 15 trạng thái: lặp `idle, think, sleep, dance, walk, talk`; một lần `wave,
  happy, celebrate, sad, surprised, no, yes, love, streak` (thời lượng ở `ONE_SHOT`).
- `tools/export-frames.mjs`: xuất sprite sheet WebP + `manifest.json` qua Chrome.
  Đang được app PRM393_G6_FE (Flutter) dùng, khoảng 3MB cho 9 dáng, khoảng 15MB
  RAM cho mỗi sheet khi giải mã. Chạy được nhưng nặng.
- **Lỗi đã biết:** thuộc tính `variant` ghi sẵn trong HTML bị bỏ qua. Constructor
  gọi `_render()` trước khi parser gán thuộc tính, còn `attributeChangedCallback`
  bỏ qua khi chưa `isConnected`.
- Danh sách trạng thái và thời lượng đang bị chép ở 2 nơi: `penguin.js` và
  `tools/export-frames.mjs` (`LOOPS`, `ONE_SHOT`).

## 4. Kiến trúc đích

```text
penguin-mascot/
├── spec/
│   └── mascot.json            # NGUỒN SỰ THẬT: trạng thái, thời lượng, loop, input Rive
├── art/
│   ├── classic/               # SVG nguồn từng bộ phận (vector)
│   └── plush/                 # PNG từng bộ phận đã nướng sẵn lông (raster) + parts.json
├── rive/
│   ├── bipbip.riv             # file chạy (con người dựng trong Rive editor)
│   └── README.md              # hợp đồng rig: tên bone, artboard, state machine, input
├── packages/
│   ├── web/                   # penguin.js hiện tại (web component, không phụ thuộc)
│   ├── web-rive/              # <penguin-mascot renderer="rive"> dùng @rive-app/canvas
│   ├── react/                 # <PenguinMascot state="happy" /> (Rive, lùi về web component)
│   └── flutter/               # package Dart `penguin_mascot`: widget Mascot (Rive, lùi về sprite)
├── tools/
│   ├── codegen.mjs            # spec/mascot.json -> types TS + enum Dart
│   ├── export-layers.mjs      # tách bộ phận ra PNG/SVG để nhập vào Rive
│   └── export-frames.mjs      # sprite sheet (đường lùi), đọc từ spec
├── examples/                  # web, react (Vite), flutter: mỗi cái một trang demo đủ trạng thái
└── docs/
```

Một repo, nhiều package (monorepo). Web và React dùng npm workspaces. Flutter là
package Dart trong `packages/flutter`, app dùng qua git dependency:

```yaml
penguin_mascot:
  git:
    url: <url repo>
    path: packages/flutter
    ref: v1.0.0
```

### 4.1. Hợp đồng chung `spec/mascot.json`

Mọi package và mọi tool đọc từ file này. Ví dụ:

```json
{
  "name": "BipBip",
  "variants": ["plush", "classic"],
  "defaultVariant": "plush",
  "states": {
    "idle":      { "loop": true,  "durationMs": 2800, "riveInput": { "type": "number", "name": "mood", "value": 0 } },
    "think":     { "loop": true,  "durationMs": 3000, "riveInput": { "type": "number", "name": "mood", "value": 1 } },
    "wave":      { "loop": false, "durationMs": 2000, "riveInput": { "type": "trigger", "name": "wave" } },
    "happy":     { "loop": false, "durationMs": 1200, "riveInput": { "type": "trigger", "name": "happy" } }
  },
  "rive": {
    "file": "rive/bipbip.riv",
    "artboards": { "plush": "BipBip Plush", "classic": "BipBip Classic" },
    "stateMachine": "Main",
    "doneEvent": "done",
    "extraInputs": [
      { "type": "number", "name": "lookX", "min": -1, "max": 1 },
      { "type": "number", "name": "lookY", "min": -1, "max": 1 }
    ]
  }
}
```

Quy ước:

- Trạng thái lặp là giá trị của input số `mood`; trạng thái một lần là trigger
  cùng tên. Chạy xong, state machine tự về `mood` hiện tại và phát Rive Event `done`.
- `lookX/lookY` để mắt nhìn theo con trỏ hoặc ngón tay (tùy chọn, làm sau).
- `codegen.mjs` sinh `packages/react/src/states.ts` và
  `packages/flutter/lib/src/states.dart` (enum `MascotState`). Không ai sửa tay
  hai file sinh ra; CI kiểm tra chúng khớp với spec.

### 4.2. API giống nhau ở mọi nền tảng

| | Web component | React | Flutter |
| --- | --- | --- | --- |
| Hiển thị | `<penguin-mascot state="idle" size="160">` | `<PenguinMascot state="idle" size={160} />` | `Mascot(state: MascotState.idle, size: 160)` |
| Đổi trạng thái | `el.play('happy')` trả về Promise | đổi prop `state` | đổi `state` |
| Xong animation một lần | sự kiện `animationdone` | `onDone` | `onDone` |
| Variant | `variant="plush"` | `variant="plush"` | `variant: MascotVariant.plush` |
| Giảm chuyển động | theo `prefers-reduced-motion` | như web | theo `MediaQuery.disableAnimations` |
| Renderer | `renderer="svg"` (mặc định) hoặc `"rive"` | tự chọn Rive, lùi về web component | tự chọn Rive, lùi về sprite sheet |

Chạy lại cùng một trạng thái một lần (ví dụ trả lời sai hai lần liên tiếp)
phải phát lại animation. Ở Flutter, thêm `Mascot.controller` hoặc tham số
`replayKey` thay vì bắt người dùng đổi `Key`.

## 5. Các giai đoạn

### Giai đoạn 0: dọn nền (agent tự làm)

1. Tạo `spec/mascot.json` từ `LOOPING`/`ONE_SHOT` hiện tại, đủ 15 trạng thái.
2. `penguin.js` và `tools/export-frames.mjs` đọc từ spec (web component: nhúng spec
   lúc build, hoặc giữ hằng số và thêm test so khớp với spec).
3. Sửa lỗi `variant`: trong `connectedCallback` gọi `_render()` nếu variant đang
   vẽ khác thuộc tính hiện tại. Thêm test.
4. Thêm test tối thiểu bằng `node --test`: spec hợp lệ, mọi trạng thái trong
   `penguin.js` đều có trong spec và ngược lại, `variant` đọc đúng từ HTML (dùng Chrome
   headless như `export-frames.mjs`, không thêm thư viện nặng).
5. Thêm `.editorconfig` và GitHub Actions chạy test.

**Tiêu chí xong:** `npm test` pass; `index.html` vẫn chạy như cũ; README không đổi
cách dùng; `<penguin-mascot variant="plush">` viết trong HTML hiện đúng bản bông.

### Giai đoạn 1: chuyển sang monorepo (agent tự làm)

1. Chuyển `penguin.js`, `penguin.svg`, `penguin-plush.svg` vào `packages/web/`;
   giữ file `penguin.js` ở thư mục gốc (copy lúc build hoặc file re-export) để
   link cũ không hỏng.
2. npm workspaces ở `package.json` gốc. Đặt tên package dạng scope, ví dụ
   `@prm393/penguin-mascot`, chưa publish.
3. `tools/codegen.mjs` và script `npm run codegen`.
4. `examples/web/` (là `index.html` hiện tại).

**Tiêu chí xong:** `npm test` và `npm run codegen` chạy được từ thư mục gốc;
`examples/web` mở được, đủ 15 trạng thái và 2 variant.

### Giai đoạn 2: chuẩn bị cho Rive (agent tự làm)

1. `tools/export-layers.mjs`: dùng cách dựng trang và CDP giống `export-frames.mjs`,
   ẩn hết bộ phận rồi bật từng bộ phận một để chụp.
   - `classic`: xuất SVG từng bộ phận (`art/classic/*.svg`), vì Rive nhập SVG được.
   - `plush`: xuất PNG trong suốt từng bộ phận ở 3x (`art/plush/*.png`), lông đã
     được nướng sẵn, vì Rive không có filter `feTurbulence`. Viền lông có thể
     tràn ra ngoài khung bộ phận, chừa lề khi chụp.
   - `parts.json`: tên bộ phận, khung bao, gợi ý điểm xoay (pivot) cho cánh
     (gốc vai), chân, đầu, mắt.
2. `rive/README.md`: hợp đồng rig cho người dựng:
   - Artboard: `BipBip Plush` và `BipBip Classic`, cùng kích thước 200x240 và cùng gốc tọa độ.
   - Bone: `root, body, head, wing_l, wing_r, foot_l, foot_r, eye_l, eye_r`.
   - State machine `Main`: input số `mood`, trigger theo spec, input số `lookX`, `lookY`.
   - Mỗi trigger chạy animation một lần rồi về layer `mood`, phát event `done`.
   - Hiệu ứng (pháo giấy, tim, Zzz, nước mắt, lửa) là layer riêng, ẩn mặc định.
   - Ngân sách: file `.riv` dưới 600KB cho bản plush (raster), dưới 100KB cho classic.
   - Bảng trạng thái (copy từ README chính) để người dựng bám theo nhịp và thời lượng.

**Tiêu chí xong:** chạy `node tools/export-layers.mjs` ra đủ bộ phận cho 2 variant;
ghép các PNG lại theo `parts.json` trùng với ảnh `penguin-plush.svg` (agent tự kiểm
tra bằng cách dựng lại một trang ghép và so ảnh).

### Giai đoạn 3: dựng `bipbip.riv` (CON NGƯỜI, trong Rive editor)

Agent không làm được bước này: file `.riv` chỉ tạo được trong Rive editor.

1. Nhập `art/plush/*.png` và `art/classic/*.svg`, rig theo `rive/README.md`.
2. Dựng ít nhất 9 trạng thái app đang dùng: `idle, wave, happy, sad, think,
   celebrate, sleep, surprised, love`. Còn lại làm sau.
3. Xuất `rive/bipbip.riv`.

**Tiêu chí xong:** mở `bipbip.riv` trong Rive editor thấy đủ input theo spec; chạy
từng trigger thì về lại `idle` và có event `done`.

### Giai đoạn 4: runtime Web và React (agent tự làm, sau khi có `.riv`)

1. `packages/web-rive`: thêm `renderer="rive"` dùng `@rive-app/canvas` (hoặc
   `@rive-app/webgl2` nếu cần hiệu ứng nặng), API y hệt web component cũ, map
   `play(state)` sang input theo spec.
2. `packages/react`: component `PenguinMascot` dùng `@rive-app/react-canvas`
   (`useRive` + `useStateMachineInput`). Không có `.riv` hoặc lỗi nạp thì lùi về
   `<penguin-mascot>`.
3. `examples/react` (Vite): đủ trạng thái, nút bật/tắt giảm chuyển động.
4. Dừng render khi khuất màn hình (`IntersectionObserver`), tôn trọng `prefers-reduced-motion`.

**Tiêu chí xong:** ví dụ React chạy, đổi trạng thái mượt, không lỗi console; đo
bằng Chrome Performance: khoảng 60 FPS trên laptop, không rò bộ nhớ khi đổi trạng
thái 100 lần.

### Giai đoạn 5: runtime Flutter (agent tự làm, sau khi có `.riv`)

1. `packages/flutter` (package Dart `penguin_mascot`): widget `Mascot` dùng package
   `rive` với state machine theo spec; `enum MascotState` sinh từ spec.
2. Đường lùi: nạp sprite sheet từ `export-frames.mjs` khi chưa có `.riv` (logic như
   `lib/widgets/mascot.dart` của PRM393_G6_FE), nhưng chỉ giữ trong RAM sheet đang
   chạy cộng `idle`, giải phóng (`ui.Image.dispose`) cái còn lại.
3. Dùng chung một `RiveFile` cho mọi `Mascot` trên màn; mỗi widget một artboard
   instance; tạm dừng khi `TickerMode` tắt hoặc khuất màn.
4. `examples/flutter`: đủ trạng thái, chạy trên Android, iOS và Web.
5. Test widget: dựng được, đổi trạng thái, `onDone` được gọi. Ghi rõ trong README:
   khi đang chạy dáng lặp thì dùng `pump(Duration)`, không dùng `pumpAndSettle`.

**Tiêu chí xong:** `flutter test` pass trong `packages/flutter`; ví dụ chạy trên
ít nhất Android và Web; DevTools cho thấy khoảng 60 FPS và RAM không tăng dần.

### Giai đoạn 6: áp dụng vào PRM393_G6_FE (làm ở repo app)

1. Thêm dependency `penguin_mascot` (git, theo tag).
2. Thay `lib/widgets/mascot.dart` bằng widget từ package, giữ cùng tên `Mascot` và
   `MascotState` để màn hình không phải sửa.
3. Xóa `assets/mascot/*.webp` và `manifest.json`, bỏ khỏi `pubspec.yaml`.
4. Cập nhật `DESIGN.md` mục BipBip.

**Tiêu chí xong:** `flutter analyze` không lỗi mới, `flutter test` pass, màn login
chạy đúng `wave` và `sad`; kích thước asset giảm từ khoảng 3MB xuống dưới 1MB.

## 6. Hướng dẫn hiệu năng (áp dụng mọi nền tảng)

- Một file `.riv` nạp một lần, dùng chung; mỗi linh vật hiển thị là một artboard instance.
- Không chạy khi không thấy: khuất màn, tab ẩn, app ở nền.
- Tôn trọng chế độ giảm chuyển động của hệ điều hành: đứng yên ở `idle`.
- Bản plush trong Rive: ảnh bộ phận ở 2x đến 3x so với kích thước hiển thị lớn nhất, không lớn hơn.
- Sprite sheet chỉ là đường lùi: khung tối đa 256x320, 15 FPS, giữ tối đa 2 sheet trong RAM.

## 7. Rủi ro

| Rủi ro | Cách xử lý |
| --- | --- |
| Lông bản plush làm bằng filter; Rive không có filter đó | Nướng lông vào PNG từng bộ phận rồi rig bằng bone/mesh. Viền lông có thể lộ đường nối ở khớp: chồng lớp và chừa lề. |
| Package `rive` cho Flutter: bản mới nhất 0.14 (runtime `rive_native`, nhanh nhất) cần **Dart ≥ 3.6**; app PRM393 đang khóa Dart `>=2.17.0 <3.0.0` | Xem quyết định ở mục 8. Bản `rive` 0.13.x chạy với Dart 2.17 nhưng là runtime cũ. |
| Cần người dựng animation trong Rive editor | Giai đoạn 0 đến 2 làm trước, không phụ thuộc; app tiếp tục dùng sprite sheet cho tới giai đoạn 6. |
| Hai variant làm gấp đôi công dựng | Ưu tiên `plush` (app đang dùng); `classic` làm sau. |

## 8. Quyết định cần nhóm chốt trước khi làm

1. **Dart 3 cho app PRM393:** nâng `environment.sdk` lên `>=3.6.0` để dùng `rive`
   0.14 (khuyến nghị; Flutter SDK trên máy đã là 3.47), hay giữ Dart 2.17 và dùng
   `rive` 0.13.x. Nâng thì phải cập nhật quy định tương ứng trong `CLAUDE.md` của app.
2. **Ai dựng file `.riv`** và có tài khoản Rive (bản miễn phí đủ để dựng và xuất file).
3. **Phát hành:** chỉ dùng qua git tag (khuyến nghị lúc đầu) hay publish npm/pub.dev.
4. **Tên chính thức:** repo đang gọi là "Pingu" và variant "Bông"; app gọi là
   BipBip. Thống nhất một tên trong spec (`"name"`) và README.
