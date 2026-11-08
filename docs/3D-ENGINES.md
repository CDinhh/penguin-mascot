# BipBip 3D trong game engine (Unity, Godot, và engine khác)

Model là glTF 2.0 chuẩn (`art/3d/bipbip.glb`, xem [`art/3d/README.md`](../art/3d/README.md)), nên engine nào đọc được glTF đều dùng được.
Dưới đây là cách nhập, cách chạy 15 trạng thái, và các lưu ý riêng của từng engine.

> **Chưa kiểm chứng trong engine thật.** Môi trường dựng chỉ có Chromium (three.js), không có Unity hay Godot. Các script mẫu viết theo
> tài liệu API của từng engine; model đã qua `gltf-validator` (0 lỗi) và chạy đúng trong three.js. Nếu chạy thử gặp lệch, báo lại để sửa.

## Chọn LOD

| File | Dùng khi | Tam giác |
| --- | --- | --- |
| `bipbip.glb` | nhân vật chính, gần camera | 7.116 |
| `bipbip_lod1.glb` | cỡ vừa (danh sách, NPC) | 2.634 |
| `bipbip_lod2.glb` | xa, nhiều nhân vật cùng lúc (1 texture) | 1.446 |

Ba file có cùng xương và cùng clip, nên đổi LOD khi chạy chỉ là đổi model và giữ nguyên tên clip. Unity có `LODGroup`, Godot có `visibility_range`.

## Hợp đồng bạn cần biết

- 12 xương: `root`, `body`, `head`, `jaw`, `eye_l`, `eye_r`, `wing_l`, `wing_r`, `tag_root`, `tag`, `foot_l`, `foot_r`. Đơn vị mét, mặt về +Z, cao ~1 m.
- 15 clip tên đúng như trạng thái: lặp `idle think sleep dance walk talk`; một lần `wave happy celebrate sad surprised no yes love streak`.
  Thời lượng nằm trong `asset.extras.bipbip.states` của file GLB (và `spec/mascot.json`).
- Biểu cảm và hiệu ứng là các node con tên `fx_*`, `scale = 0,001` lúc nghỉ, clip bật chúng lên (xem bảng ở `art/3d/README.md`).
  **Engine vẫn gửi draw call cho node scale 0**, nên mỗi khung hình hãy tắt renderer của node nào có `scale.x < 0,01` (script mẫu làm sẵn).
- Mũ tốt nghiệp là node `fx_cap`: không clip nào chạm vào, bạn tự đặt scale 1 (đội) hoặc 0,001 (bỏ).
- Mắt nhìn theo: clip không xoay `eye_l`/`eye_r`, bạn tự xoay hai xương này (quanh X lên xuống, quanh Y trái phải, tối đa khoảng 17° và 24°).

## Unity (6 trở lên, URP hoặc Built-in)

1. Cài **glTFast** (`com.unity.cloud.gltfast`) qua Package Manager, kéo `bipbip.glb` vào `Assets/`.
2. Kéo model vào cảnh. glTFast nhập clip thành **Legacy Animation** (component `Animation`), tên clip giữ nguyên.
3. Chép [`examples/engines/unity/BipBip.cs`](../examples/engines/unity/BipBip.cs) vào dự án, gắn vào GameObject gốc:
   ```csharp
   bipbip.Play("happy");                       // trộn 0,2 giây, xong tự về trạng thái lặp gần nhất
   yield return bipbip.PlayAndWait("wave");    // chờ clip một lần chạy xong
   bipbip.cap = true; bipbip.lookX = 0.5f;
   ```
4. Vật liệu: lông dùng normal map và `KHR_materials_sheen`; nếu bản glTFast của bạn không hỗ trợ sheen thì model vẫn đẹp nhờ normal map.
   Hiệu ứng `fx_*` dùng `KHR_materials_unlit` và màu đỉnh (glTFast dùng shader unlit có vertex color).
5. Hiệu năng: 11 draw call lúc nghỉ, 12 xương, skinning 1 xương mỗi đỉnh. Muốn dùng Mecanim thì chuyển clip sang Humanoid không áp dụng (rig này không phải người); dùng Generic và tự tạo Animator Controller với 15 state là đủ.
6. Lưu ý trục: glTFast đổi hệ tọa độ (đảo trục X), nên dấu `lookX` có thể ngược; đổi dấu trong script nếu mắt nhìn sai chiều.

## Godot 4.x

1. Kéo `bipbip.glb` vào dự án (Godot tự nhập glTF). Mở file, chọn **New Inherited Scene**, bật tab Import nếu muốn chỉnh.
2. Chép [`examples/engines/godot/bipbip.gd`](../examples/engines/godot/bipbip.gd), gắn vào node gốc:
   ```gdscript
   $BipBip.play_state("happy")
   await $BipBip.finished      # sau clip một lần
   $BipBip.cap = true
   $BipBip.look = Vector2(0.5, 0.2)
   ```
3. Godot không đọc `KHR_materials_sheen` nên bỏ qua phần lông mờ viền, bù lại có normal map. `KHR_materials_unlit` và màu đỉnh được hỗ trợ.
4. Chế độ lặp của clip được script đặt theo danh sách trạng thái, không phụ thuộc đuôi `-loop`.

## Engine khác (Unreal, Bevy, Defold, ...)

Đọc glTF/GLB trực tiếp (Unreal qua Interchange hoặc plugin glTFRuntime). Các điểm cần xử lý giống nhau:
nạp clip theo tên, đặt chế độ lặp theo `asset.extras.bipbip.states`, tắt node `fx_*` khi scale gần 0, tự điều khiển `eye_l`/`eye_r` và `fx_cap`.

## Dựng lại hoặc đổi model

Model sinh từ `tools/model3d/` (`npm run build:3d`). Muốn họa sĩ dựng tay trong Blender, giữ hợp đồng rig ở
[`docs/PLAN-3D.md`](PLAN-3D.md) mục 4 (tên xương, thứ tự, tên node `fx_*`, tên và thời lượng clip) rồi chạy `npm test` để kiểm tra khớp spec.
