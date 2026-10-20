# Tiến độ dựng `bipbip.riv`

Cập nhật: 2026-10-20. Hợp đồng đầy đủ ở [`README.md`](README.md) (nếu lệch thì `spec/mascot.json` đúng).

## Đang ở đâu

- File Rive (web, tài khoản dinhp5432@gmail.com): `https://editor.rive.app/file/untitled/2667473`, tên "Untitled", chưa đổi tên. Rive tự lưu lên đám mây.
- **Chưa có** `rive/bipbip.riv` (chưa xuất). Code Web/React/Flutter vẫn chạy bằng đường lùi (web component, sprite sheet).
- Đã cài MCP Rive cho Claude Code: `claude mcp add --scope user --transport http rive http://127.0.0.1:9791/mcp` (user scope, dùng ở mọi project trên máy). Cần Rive desktop đang mở, mở file có artboard, rồi gõ **End Prompt** để AI áp dụng thay đổi. Chỉ nạp ở phiên Claude Code mới.

## Đã xong

- [x] Artboard `BipBip Plush` 200x240.
- [x] 20 ảnh PNG đặt đúng toạ độ theo `art/plush/parts.md` (ảnh 3x, scale 33,333%).
- [x] 7 lớp ẩn (opacity 0): `cap`, `brow_l/r`, `eyes_closed/happy/heart`, `mouth`.
- [x] 9 lớp hiệu ứng SVG (opacity 0, vị trí 0,0): `flame` (sau cùng, sau nhân vật), `hearts`, `zzz`, `question`, `exclaim`, `sparkles`, `confetti`, `tear`, `sweat`. Nằm ngoài `root`.
- [x] Bộ khung bằng **Group** (không phải Bone thật; code chỉ đọc state machine/input nên không ảnh hưởng):

```
BipBip Plush
├─ 8 nhóm hiệu ứng (confetti, tear, sweat, sparkles, question, hearts, exclaim, zzz)
├─ root (100,226)
│   ├─ foot_l (71,227)   ├─ foot_r (129,227)
│   ├─ body (100,224)
│   │   ├─ head (100,135): cap, eyes_closed, brow_r/l, mouth, eyes_heart/happy,
│   │   │    beak_top/bot, eye_l (nhóm), cheek_l/r, eye_r (nhóm), ảnh head (dưới cùng)
│   │   ├─ ảnh body
│   │   ├─ wing_l (41,149)   └─ wing_r (159,149)
│   └─ shadow
└─ flame
```

- [x] State machine `Main` với 12 input: Number `mood`, `lookX`, `lookY`; Trigger `wave`, `happy`, `celebrate`, `sad`, `surprised`, `no`, `yes`, `love`, `streak`.
- [x] Animation `idle` (Loop, 56 khung @20fps = 2,8 s): `body` thở (scale 100 → 99/102,5 → 100), `wing_l/r` đung đưa ±5°, `eye_l/r` chớp (scale Y 8% quanh khung 52). Entry của layer 1 đã nối tới `idle`.
- [x] Animation `wave` (One Shot, 40 khung @20fps = 2 s): `wing_r` xoay 0 → -145 → -112 → -150 → -112 → -150 → -120 → 0 (khung 0,6,11,16,22,27,33,40). Chưa có nghiêng người, mở miệng.

## Cập nhật 2026-10-20 (dựng lại cho khớp web)

Bản trước dựng từ ghi chú nên sai (60 fps nhưng khung theo 20 fps, không lặp, toạ độ Y theo hệ artboard, thiếu mặt và hiệu ứng). Đã xoá và sinh lại toàn bộ từ CSS trong `packages/web/penguin.js`.

- 20 animation @60 fps, độ dài, easing (cubic-bezier), delay, số lần lặp và alternate lấy đúng từ CSS: 6 lặp (`idle` 2,8 s, `think` 24 s = BCNN của 3 s và 1,6 s, `sleep`, `dance`, `walk`, `talk`), 9 một lần (`wave`…`streak`), `rest` (tư thế nghỉ), `blink` (4,2 s độc lập như web). `sleep`, `dance`, `walk` có thêm đoạn mở đầu `*_start` vì CSS có delay (Z, cánh phải, chân phải) nên vòng đầu khác các vòng sau.
- State machine `Main` có 3 layer: `Base` (chạy `rest`, đặt lại mọi thuộc tính), `Main` (18 state, một state một animation, trigger từ Any State, xong thì về trạng thái lặp theo `mood`), `Blink`. Một state không key thuộc tính nào thì `Base` trả về tư thế nghỉ, nên không cần layer OneShot riêng.
- **Điều kiện dùng ViewModel `Mascot`** (12 property cùng tên input cũ, instance `default`, gắn artboard) vì MCP không gắn điều kiện lên input legacy. Input legacy còn nhưng không nối. Code Web/React/Flutter và README phải đổi sang view model.
- Bóng `shadow` đã đưa ra ngoài `root` (như web, không nhảy theo). Mắt tim tách thành 2 ảnh (`eyes_heart_l/r`) để mỗi trái tim đập quanh tâm riêng; ảnh `eyes_heart` cũ ẩn, không dùng.
- Cờ transition qua `set_property_values`: property 152 (flags) 12 = bật exit time và exit time tính theo %, property 160 = 100.
- Kiểm tra thêm: phát lại đúng như Rive sẽ nội suy (cubic/hold/linear) mọi khung của mọi animation và so với mô hình CSS; sai lệch lớn nhất khoảng 7% opacity ở vài khung (do làm tròn mốc về khung 60 fps), không có lỗi hình dạng.
- Kiểm tra: so 3000 giá trị (tx, ty, xoay, scale, opacity của mọi phần) giữa CSS thật trên trang demo và dữ liệu sinh ra, tất cả khớp (sad lệch 0,2° vì CSS `scale() rotate()` thứ tự khác Rive). `simulateStateMachine` đúng thời lượng và chuyển state. Chưa xem chạy thật trong runtime.
- Thẻ tên `BipBip` (nhóm `tag` trong `body`) và dây da lộn `strap` (nhóm riêng, nằm sau đầu, trước ảnh thân) lắc cùng nhịp quanh lỗ treo (100, 148.2): `idle`/`talk` ±7° mỗi 2,8 s, `happy`/`celebrate`/`love`/`yes` ±14° mỗi 0,6 s (theo bản web đã pull ngày 21/10). Vì chu kỳ 2,8 s, 1,3 s và 0,64 s chỉ khớp nhau sau 291,2 s nên `talk` dài 291,2 s (17.472 khung).
- Mũ tốt nghiệp `cap` đã đặt đúng vị trí. Hiện/ẩn bằng property boolean `cap` của view model `Mascot` (gắn vào opacity qua converter `boolToNumber`); artboard gắn instance `capOn` (mũ bật). Chưa kiểm tra bind này ở runtime, chỉ ở editor.
- Đã xuất `rive/bipbip.riv`.

## Hoàn tất (2026-10-21)

- `rive/bipbip.riv` = **534 KB** (dưới 600 KB). Trước đó 3,1 MB vì 3 bản font Inter nhúng cho chữ Z, “?”, “!”; đã thay bằng đường viền (SVG), không còn font.
- Runtime đổi sang view model `Mascot`: `packages/web-rive` (driver, renderer, test), `packages/react`, `packages/flutter`, spec (`rive.viewModel`, `doneStates`, `capInput`, bỏ `doneEvent`), codegen, README và docs. Không có event `done` vì MCP không tạo được Rive Event: web/React nhận xong qua đổi state, Flutter theo `durationMs`.
- Mũ tốt nghiệp bật bằng property `cap` (mặc định tắt, như web); web component dùng `accessory="cap"`.
- Đã chạy file thật với runtime Rive web 2.45 trong Chrome bằng `RiveDriver` của repo: nạp được, view model gắn đúng, 9 trigger chạy xong sau khoảng thời lượng trong spec cộng 30 đến 55 ms, đổi `mood` đi qua state mở đầu rồi vào state lặp, trigger khi đang `talk` thì quay về `talk`, `cap` bật tắt đúng. Chạy trong tab tự động hoá nên phải thay `requestAnimationFrame` bằng timer; lần phát đầu ngay sau khi nạp có thể chậm hơn (khởi động wasm) và rơi về đồng hồ dự phòng.
- `npm test`: 31 đạt, 2 bỏ qua (tsc cần cài, Chrome); `flutter analyze` chỉ còn một cảnh báo cũ (`TickerMode.of`); `flutter test` đạt.
- Mã sinh keyframe đã đưa vào `tools/rive-anim/`.

## Còn lại

- Flutter chưa chạy file `.riv` thật (môi trường test không có thư viện native), mới kiểm tĩnh bằng analyze.
- Sai lệch thời gian tối đa một khung (60 fps) so với CSS ở vài keyframe; `talk` lặp sau 291,2 giây.
- `done` chưa phải Rive Event; `lookX`/`lookY` chưa dùng.

## Biên độ và thời lượng (từ `packages/web/penguin.js`)

Thời lượng ms → khung @20fps: idle 2800 → 56; think 3000 → 60; sleep 3000 → 60; dance 1600 → 32; walk 1800 → 36; talk 640 → 13; wave 2000 → 40; happy 1200 → 24; celebrate 2600 → 52; sad 2600 → 52; surprised 1400 → 28; no 1200 → 24; yes 1200 → 24; love 2400 → 48; streak 2400 → 48.

Chuyển động mẫu (CSS keyframes): `sad` thân scale 1,04/0,93 + xoay 2°, cánh rủ ±12°; `think` thân xoay -6° ↔ -2°, `wing_r` -28°; `sleep` thân xoay 4° + thở 1,03/0,97; `surprised` cánh dang ±60° (khung 12%-70%); `love` thân lắc ±4°, cánh ±14°; `happy` nhảy 2 lần (-36 px), vỗ cánh ±55°; `celebrate` cánh ±cheer liên tục; `streak` flame scale 0 → 1,12 → 1 → 0.

## Mẹo thao tác Rive (rút ra khi làm tay qua trình duyệt)

- **Không bao giờ** nhấn Ctrl+A hoặc gõ số/chữ khi ô nhập chưa focus: Rive hiểu là phím tắt (chọn hết, đổi opacity, tạo mesh, đổi công cụ). Đã từng phải dọn: Remove Mesh + xoá keyframe thừa.
- Đổi tên: chọn dòng → nhấp đúp → chờ 1 s → Ctrl+A → gõ → Enter, gói trong một lệnh, không chụp màn hình xen giữa.
- Đổi cha: chọn lớp, Alt+P, bấm lớp cha. Thứ tự trước/sau: Ctrl+Alt+] / Ctrl+Alt+[ (cùng cấp).
- Giữ nguyên vị trí khi đổi cha (Rive tự đổi sang toạ độ cục bộ).
- Timeline: đặt Snap Keys **20 fps** thì mọi animation ≤ 60 khung; thanh xanh trên thước là thanh thu phóng, kéo đầu phải để thấy toàn bộ.
- Nút ◇ cạnh từng thuộc tính tạo keyframe tại khung hiện tại.
