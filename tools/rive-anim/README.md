# Sinh keyframe Rive từ CSS của web component

Bộ này dựng animation trong `rive/bipbip.riv` cho khớp `packages/web/penguin.js` (độ dài, easing, delay, số lần lặp, chiều xoay, tâm xoay).

- `gen.mjs`: đọc một CSS animation (keyframe theo %, `cubic-bezier`, `delay`, `iteration-count`, `alternate`, `fill`) và sinh keyframe Rive 60 fps (cubic/hold/linear). Cắt vòng lặp giữa chừng thì dùng đường cong con chính xác (De Casteljau). Chỗ một vòng kết thúc khác giá trị vòng sau thì giữ giá trị cuối một khung trước chỗ nhảy.
- `model.mjs`: ánh xạ từng phần tử CSS sang đối tượng và thuộc tính Rive (id đối tượng gắn với file `.riv` hiện tại; đổi cấu trúc file thì sửa ở đây). Có bù tâm xoay/thu phóng cho hiệu ứng, và quy đổi toạ độ artboard sang toạ độ cục bộ.
- `states.mjs`: các animation của 15 trạng thái, chép lại từ CSS (`.pg[data-state="..."]` và `@keyframes`). Đổi CSS thì đổi ở đây.
- `compile.mjs`: biên dịch state thành danh sách keyframe cho từng thuộc tính.
- `expect.mjs`, `dense.mjs`: kiểm tra. `dense.mjs` phát lại keyframe đã sinh đúng như Rive nội suy, mọi khung, rồi so với mô hình CSS.
- `rive.mjs`: client gọi MCP của Rive editor đang mở (`http://127.0.0.1:9791/mcp`).

Chạy kiểm tra: `node tools/rive-anim/dense.mjs`. Việc đẩy keyframe vào editor làm qua `rive.mjs` (`call('animation_editor', { command: 'modifyKeyFrames', data: { modifyKeyFrames: {...} } })`); xem cách làm trong lịch sử phiên dựng ở `rive/PROGRESS.md`.
