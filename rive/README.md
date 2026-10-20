# Hợp đồng rig: `bipbip.riv`

Tài liệu này cho người dựng animation trong Rive editor (bản miễn phí là đủ). Code Web, React và Flutter đọc file `rive/bipbip.riv` theo đúng tên ở đây, nên **không đổi tên** artboard, bone, state machine và property của view model. Chỉ làm bản **plush** (đã bỏ classic).

Nguồn sự thật là [`spec/mascot.json`](../spec/mascot.json). Nếu bảng dưới lệch với spec thì spec đúng.

## 1. Chuẩn bị tài nguyên

Hình đã được tách sẵn trong [`art/plush/`](../art/plush/) (lông đã nướng vào PNG, vì Rive không có filter `feTurbulence`):

- `*.png`: từng bộ phận ở 3x, nền trong suốt. Danh sách, vị trí và tâm xoay ở [`parts.md`](../art/plush/parts.md) và `parts.json`.
- `fx/*.svg`: hiệu ứng (lửa, tim, Zzz, “?”, “!”, lấp lánh, pháo giấy, nước mắt, mồ hôi). Rive nhập được SVG. Các chữ Z, “?”, “!” là đường viền (không nhúng font, tránh nặng thêm vài MB).
- Chạy lại bằng `node tools/export-layers.mjs` (cần Chrome); thêm `--verify` để kiểm tra ghép lại trùng hình gốc.

## 2. Artboard

- Tên: **`BipBip Plush`**, kích thước **200 x 240**, gốc tọa độ ở góc trên trái, y hướng xuống.
- Đặt mỗi ảnh bộ phận đúng chỗ theo [`parts.md`](../art/plush/parts.md): kích thước rộng x cao theo bảng (PNG là 3x nên thu về 33,33%), còn vị trí là `x`, `y` góc trên trái (hoặc “tâm x, tâm y” nếu Rive đặt theo tâm).
- Thứ tự lớp từ sau ra trước giống thứ tự dòng trong `parts.md`: `shadow`, `body`, `strap`, `head`, `tag`, `cap`, `brow_*`, `eye_*`, `eyes_*`, `cheek_*`, `mouth`, `beak_bot`, `beak_top`, `wing_*`, `foot_*`. Chân vẽ trên cùng, đè lên thân.
- Khi xếp xong, nhân vật ở tư thế nghỉ phải giống ảnh [`penguin-plush.svg`](../packages/web/penguin-plush.svg).

## 3. Bone

Tên cố định: `root`, `body`, `head`, `tag`, `strap`, `wing_l`, `wing_r`, `foot_l`, `foot_r`, `eye_l`, `eye_r`.

| Bone | Gắn vào | Điều khiển các ảnh | Tâm xoay (pivot, đơn vị artboard) |
| --- | --- | --- | --- |
| `root` | gốc | tất cả (nhảy, nghiêng cả người) | 100, 226 |
| `body` | `root` | `body` | 100, 224 |
| `head` | `body` | `head`, `cap`, `brow_*`, `eyes_*`, `cheek_*`, `mouth`, `beak_*` | 100, 135 (gợi ý) |
| `tag`, `strap` | `body` | `tag` (đĩa tròn da giả/vải ép màu nâu caramel, mặt mờ có vân dệt mịn, đường kính khoảng 32 đơn vị, thẻ treo ngay dưới cằm trên bụng) và `strap` (dây da lộn màu xanh ô liu khaki, có vân nhung, đi vòng sau cổ, **nằm dưới lớp `head`** nên đầu che phần dây đi lên cổ, chỉ ló ra dưới mép cằm; không bao giờ nằm trên mặt hay cằm trắng); cả hai lắc cùng nhịp quanh lỗ treo | 100, 148,2 |
| `eye_l`, `eye_r` | `head` | `eye_l`, `eye_r` (nhìn quanh, chớp mắt) | 64, 94 và 136, 94 |
| `wing_l`, `wing_r` | `body` | `wing_l`, `wing_r` | 41, 149 và 159, 149 |
| `foot_l`, `foot_r` | `root` | `foot_l`, `foot_r` | 71, 227 và 129, 227 |

`shadow` gắn vào `root` (co lại khi nhảy). Pivot ghi trong `parts.json` lấy từ CSS của web component, dùng làm điểm xuất phát; chỉnh lại nếu xoay thấy lệch khớp.

## 4. State machine `Main` và view model `Mascot`

Điều khiển bằng **view model** (data binding), không dùng input legacy của state machine: editor và runtime mới chỉ cho đặt điều kiện chuyển state trên view model. View model tên **`Mascot`**, gắn vào artboard `BipBip Plush` (instance mặc định `default`, `cap` = tắt). Property (đúng tên, đúng kiểu):

| Property | Kiểu | Ghi chú |
| --- | --- | --- |
| `mood` | Number | Trạng thái lặp, xem bảng dưới |
| `wave`, `happy`, `celebrate`, `sad`, `surprised`, `no`, `yes`, `love`, `streak` | Trigger | Mỗi trạng thái một lần một trigger cùng tên |
| `cap` | Boolean | Đội mũ tốt nghiệp (web component: `accessory="cap"`). Gắn vào opacity của `cap` qua converter `boolToNumber` |
| `lookX`, `lookY` | Number, từ -1 đến 1 | Mắt nhìn theo con trỏ/ngón tay. Chưa dùng |

State machine `Main` có 3 layer:

1. **`Base`**: một state `rest` chạy animation tư thế nghỉ (key mọi thuộc tính bị animation khác đụng tới). Nhờ đó một state không key thuộc tính nào thì thuộc tính đó tự về tư thế nghỉ.
2. **`Main`** (layer đè lên `Base`): một state cho mỗi animation. Sáu trạng thái lặp (`idle`, `think`, `sleep`, `dance`, `walk`, `talk`) chạy **Loop**; chín trạng thái một lần chạy **One Shot**. `sleep`, `dance`, `walk` có thêm state mở đầu `sleep_start`, `dance_start`, `walk_start` (vì CSS có delay nên vòng đầu khác các vòng sau); `talk` dài 291,2 giây vì nhịp miệng, thân và thẻ chỉ khớp nhau sau chừng đó.
   - Trigger → state một lần, từ Any State (bấm lại khi đang chạy thì chạy lại).
   - Xong một lần (exit time 100%) → state lặp theo `mood` (`mood == n`, mọi n từ 0 đến 5; state mở đầu thì vào trước).
   - Đổi `mood` khi đang ở một state lặp → state lặp mới. Đổi `mood` khi đang chạy một lần thì áp dụng sau khi xong.
3. **`Blink`**: chớp mắt 4,2 giây lặp độc lập với state, như `.pg-eye` của web.

**Báo xong**: file không dùng Rive Event (đã bị đánh dấu deprecated và editor không tạo được qua MCP). Runtime web/React nhận biết một lần chạy xong khi state machine vào lại một state lặp (`spec.rive.doneStates`) sau khi đã vào state của trạng thái đó; Flutter báo xong theo `durationMs` trong spec. Cả hai còn có đồng hồ dự phòng.

Mọi animation 60 fps, độ dài, easing, delay và số lần lặp lấy từ CSS của `packages/web/penguin.js`.

## 5. Bảng trạng thái

Thời lượng một lần là **mili-giây**, khớp với web component (`ONE_SHOT`); trạng thái lặp là độ dài một chu kỳ nên để vòng lặp khớp đuôi với đầu. Xem chuyển động mẫu ở [`examples/web/index.html`](../examples/web/index.html) (mở bằng trình duyệt) và CSS trong [`packages/web/penguin.js`](../packages/web/penguin.js) (`.pg[data-state="..."]`) để bám nhịp và biên độ.

| Trạng thái | Kiểu | Thời lượng (ms) | Property của view model | Khi nào dùng / nét chính |
| --- | --- | --- | --- | --- |
| `idle` | lặp | 2800 | `mood` = 0 | Mặc định: thở nhẹ, chớp mắt |
| `think` | lặp | 3000 | `mood` = 1 | Chờ người học trả lời (bong bóng “?”) |
| `sleep` | lặp | 3000 | `mood` = 2 | Lâu không học (Zzz, nhắm mắt) |
| `dance` | lặp | 1600 | `mood` = 3 | Vui vẻ, phần thưởng |
| `walk` | lặp | 1800 | `mood` = 4 | Chuyển màn, loading |
| `talk` | lặp | 640 | `mood` = 5 | Đọc hướng dẫn, phát âm |
| `wave` | một lần | 2000 | trigger `wave` | Chào mừng, vẫy cánh |
| `happy` | một lần | 1200 | trigger `happy` | Trả lời đúng (nhảy 2 lần, mắt cười) |
| `celebrate` | một lần | 2600 | trigger `celebrate` | Xong bài học (pháo giấy) |
| `sad` | một lần | 2600 | trigger `sad` | Trả lời sai (rơi nước mắt) |
| `surprised` | một lần | 1400 | trigger `surprised` | Bất ngờ (dấu “!”) |
| `no` | một lần | 1200 | trigger `no` | Lắc đầu |
| `yes` | một lần | 1200 | trigger `yes` | Gật đầu |
| `love` | một lần | 2400 | trigger `love` | Cảm ơn (thả tim, mắt tim) |
| `streak` | một lần | 2400 | trigger `streak` | Giữ chuỗi ngày học (ngọn lửa) |

Cả 15 trạng thái đã có animation.

## 6. Biểu cảm và hiệu ứng

- Các lớp biểu cảm phụ ẩn mặc định (opacity 0) và được bật trong animation: `eyes_happy` (mắt cười), `eyes_closed` (nhắm mắt, ngủ), `eyes_heart` (mắt tim), `mouth` (miệng mở), `brow_*` (lông mày), `cap` (mũ, bật bằng property `cap`). Mắt tim là hai ảnh `eyes_heart_l`, `eyes_heart_r` để mỗi trái tim đập quanh tâm riêng. Khi bật `eyes_*` thì ẩn `eye_l`, `eye_r`.
- Thẻ tên (`tag`, đĩa tròn khắc chìm chữ BipBip và dấu chân) và dây `strap` lắc nhẹ cùng nhịp quanh lỗ treo: `idle` và `talk` xoay khoảng ±7° chu kỳ 2,8 giây; `happy`, `celebrate`, `love`, `yes` xoay khoảng ±14° chu kỳ 0,6 giây (theo bản web). Các trạng thái khác để yên.
- Hiệu ứng từ `fx/*.svg` là layer riêng, **ẩn mặc định**, chỉ hiện trong animation tương ứng: `flame` (streak), `hearts` (love), `zzz` (sleep), `question` (think), `exclaim` (surprised), `sparkles` (celebrate), `confetti` (celebrate), `tear` (sad), `sweat`.
- `flame` nằm **sau** nhân vật; các hiệu ứng khác nằm trước.

## 7. Ngân sách và xuất file

- File `.riv` dưới **600 KB** (hiện 534 KB). Không nhúng font: font nhúng trong file chiếm hơn 2 MB. Ảnh đã ở 3x so với kích thước hiển thị 200 px; không dùng ảnh lớn hơn.
- Xuất thành `rive/bipbip.riv` (đúng tên, đúng thư mục) rồi commit.

## 8. Kiểm tra trước khi giao

- [ ] Artboard `BipBip Plush` 200x240, state machine `Main`, view model `Mascot` gắn vào artboard, đủ property theo bảng ở mục 4 và 5.
- [ ] Tư thế nghỉ giống `penguin-plush.svg`.
- [ ] Bấm từng trigger: chạy đúng thời lượng, rồi về trạng thái lặp (`idle` nếu chưa đổi `mood`).
- [ ] Đổi `mood` từ 0 đến 5: chuyển mượt, lặp khớp đuôi với đầu.
- [ ] Bấm cùng một trigger hai lần liền: lần hai chạy lại từ đầu.
- [ ] Kích thước file dưới 600 KB.

Có file `.riv` rồi thì giai đoạn 4 (Web, React) và 5 (Flutter) kiểm chứng với file thật; trước đó code dùng đường lùi (web component, sprite sheet).
