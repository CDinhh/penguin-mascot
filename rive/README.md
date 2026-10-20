# Hợp đồng rig: `bipbip.riv`

Tài liệu này cho người dựng animation trong Rive editor (bản miễn phí là đủ). Code Web, React và Flutter đọc file `rive/bipbip.riv` theo đúng tên ở đây, nên **không đổi tên** artboard, bone, state machine và input. Chỉ làm bản **plush** (đã bỏ classic).

Nguồn sự thật là [`spec/mascot.json`](../spec/mascot.json). Nếu bảng dưới lệch với spec thì spec đúng.

## 1. Chuẩn bị tài nguyên

Hình đã được tách sẵn trong [`art/plush/`](../art/plush/) (lông đã nướng vào PNG, vì Rive không có filter `feTurbulence`):

- `*.png`: từng bộ phận ở 3x, nền trong suốt. Danh sách, vị trí và tâm xoay ở [`parts.md`](../art/plush/parts.md) và `parts.json`.
- `fx/*.svg`: hiệu ứng (lửa, tim, Zzz, “?”, “!”, lấp lánh, pháo giấy, nước mắt, mồ hôi). Rive nhập được SVG.
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
| `tag`, `strap` | `body` | `tag` (đĩa gỗ tròn, mặt mờ, đường kính khoảng 32 đơn vị, thẻ treo ngay dưới cằm trên bụng) và `strap` (dây da lộn đi vòng sau cổ, **nằm dưới lớp `head`** nên đầu che phần dây đi lên cổ, chỉ ló ra dưới mép cằm; không bao giờ nằm trên mặt hay cằm trắng); cả hai lắc cùng nhịp quanh lỗ treo | 100, 148,2 |
| `eye_l`, `eye_r` | `head` | `eye_l`, `eye_r` (nhìn quanh, chớp mắt) | 64, 94 và 136, 94 |
| `wing_l`, `wing_r` | `body` | `wing_l`, `wing_r` | 41, 149 và 159, 149 |
| `foot_l`, `foot_r` | `root` | `foot_l`, `foot_r` | 71, 227 và 129, 227 |

`shadow` gắn vào `root` (co lại khi nhảy). Pivot ghi trong `parts.json` lấy từ CSS của web component, dùng làm điểm xuất phát; chỉnh lại nếu xoay thấy lệch khớp.

## 4. State machine `Main`

Một state machine tên **`Main`** trên artboard `BipBip Plush`, các input (đúng tên, đúng kiểu):

| Input | Kiểu | Ghi chú |
| --- | --- | --- |
| `mood` | Number | Trạng thái lặp, xem bảng dưới |
| `wave`, `happy`, `celebrate`, `sad`, `surprised`, `no`, `yes`, `love`, `streak` | Trigger | Mỗi trạng thái một lần một trigger cùng tên |
| `lookX`, `lookY` | Number, từ -1 đến 1 | Mắt nhìn theo con trỏ/ngón tay. Tùy chọn, làm sau |

Gợi ý dựng (tên menu có thể khác theo phiên bản editor):

1. **Layer `Mood`**: một state cho mỗi trạng thái lặp (`idle`, `think`, `sleep`, `dance`, `walk`, `talk`), mỗi state chạy một animation **Loop**. Chuyển giữa các state bằng điều kiện `mood == n` (n ở bảng dưới), từ bất kỳ state nào. State mặc định là `idle`.
2. **Layer `OneShot`** (đặt dưới `Mood`, vì layer dưới được áp dụng sau nên ghi đè được tư thế): state mặc định rỗng (không animation). Với mỗi trigger, thêm một state chạy animation **One Shot** của nó, nối từ state rỗng (hoặc Any State) bằng điều kiện trigger, và nối ngược về state rỗng khi animation chạy xong.
3. **Event `done`** (lưu ý: runtime Rive web hiện đánh dấu đọc input và nghe Rive Event ở runtime là *deprecated*, khuyên dùng data binding; hiện vẫn chạy và code đang dùng cách này, xem mục Rủi ro trong `docs/PLAN.md`): đặt một Event tên **`done`** ở khung cuối của mỗi animation một lần. Runtime nghe event này để báo cho app (`animationdone`, `onDone`). Mỗi lần chạy xong phải phát đúng một event.
4. Khi `OneShot` về trạng thái rỗng thì `Mood` đang giữ tư thế lặp hiện tại, nên nhân vật tự quay về đúng trạng thái lặp gần nhất.
5. **Phát lại**: kích lại cùng một trigger khi đang chạy (ví dụ sai hai lần liền) phải chạy lại từ đầu; kiểm tra bằng cách bấm trigger hai lần liên tiếp trong cửa sổ State Machine.

## 5. Bảng trạng thái

Thời lượng một lần là **mili-giây**, khớp với web component (`ONE_SHOT`); trạng thái lặp là độ dài một chu kỳ nên để vòng lặp khớp đuôi với đầu. Xem chuyển động mẫu ở [`examples/web/index.html`](../examples/web/index.html) (mở bằng trình duyệt) và CSS trong [`packages/web/penguin.js`](../packages/web/penguin.js) (`.pg[data-state="..."]`) để bám nhịp và biên độ.

| Trạng thái | Kiểu | Thời lượng (ms) | Input Rive | Khi nào dùng / nét chính |
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

Ưu tiên làm 9 trạng thái app đang dùng: `idle`, `wave`, `happy`, `sad`, `think`, `celebrate`, `sleep`, `surprised`, `love`. Các trạng thái còn lại làm sau, nhưng input trigger/`mood` tương ứng nên tạo sẵn để khớp spec (state rỗng cũng được).

## 6. Biểu cảm và hiệu ứng

- Các lớp biểu cảm phụ ẩn mặc định (opacity 0) và được bật trong animation: `eyes_happy` (mắt cười), `eyes_closed` (nhắm mắt, ngủ), `eyes_heart` (mắt tim), `mouth` (miệng mở), `brow_*` (lông mày), `cap` (mũ, tùy chọn). Khi bật `eyes_*` thì ẩn `eye_l`, `eye_r`.
- Thẻ tên (`tag`, đĩa tròn khắc chìm chữ BipBip và dấu chân) và dây `strap` lắc nhẹ cùng nhịp quanh lỗ treo: `idle` và `talk` xoay khoảng ±7° chu kỳ 2,8 giây; `happy`, `celebrate`, `love`, `yes` xoay khoảng ±14° chu kỳ 0,6 giây (theo bản web). Các trạng thái khác để yên.
- Hiệu ứng từ `fx/*.svg` là layer riêng, **ẩn mặc định**, chỉ hiện trong animation tương ứng: `flame` (streak), `hearts` (love), `zzz` (sleep), `question` (think), `exclaim` (surprised), `sparkles` (celebrate), `confetti` (celebrate), `tear` (sad), `sweat`.
- `flame` nằm **sau** nhân vật; các hiệu ứng khác nằm trước.

## 7. Ngân sách và xuất file

- File `.riv` dưới **600 KB**. Ảnh đã ở 3x so với kích thước hiển thị 200 px; không dùng ảnh lớn hơn.
- Xuất thành `rive/bipbip.riv` (đúng tên, đúng thư mục) rồi commit.

## 8. Kiểm tra trước khi giao

- [ ] Artboard `BipBip Plush` 200x240, state machine `Main`, đủ input theo bảng ở mục 4 và 5.
- [ ] Tư thế nghỉ giống `penguin-plush.svg`.
- [ ] Bấm từng trigger: chạy đúng thời lượng, phát event `done` một lần, rồi về trạng thái lặp (`idle` nếu chưa đổi `mood`).
- [ ] Đổi `mood` từ 0 đến 5: chuyển mượt, lặp khớp đuôi với đầu.
- [ ] Bấm cùng một trigger hai lần liền: lần hai chạy lại từ đầu.
- [ ] Kích thước file dưới 600 KB.

Có file `.riv` rồi thì giai đoạn 4 (Web, React) và 5 (Flutter) kiểm chứng với file thật; trước đó code dùng đường lùi (web component, sprite sheet).
