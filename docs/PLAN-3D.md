# Plan: bản 3D của BipBip (web, app, game)

Bản 3D **bổ sung** cho bản 2D, không thay thế. Mọi thứ 2D (web component SVG, Rive, sprite sheet, Flutter widget)
giữ nguyên và vẫn là đường lùi mặc định. Làm theo giai đoạn, mỗi giai đoạn một PR.

## 1. Mục tiêu

- **Một model chung** `bipbip.glb` (glTF 2.0 nhị phân) có rig xương và đủ 15 animation clip, tên và thời lượng
  lấy từ `spec/mascot.json` (cùng nguồn sự thật với 2D).
- Dùng được ở: **web** (three.js, `<model-viewer>`), **app Flutter**, **game** (Unity, Godot, mọi engine đọc glTF).
- **60 FPS** trên điện thoại tầm trung: ngân sách cứng, có LOD, có test kiểm ngân sách.
- Dựng **bằng script, tái tạo được** (không cần Blender): `npm run build:3d`.

## 2. Quyết định kỹ thuật

| Chủ đề | Quyết định | Lý do |
| --- | --- | --- |
| Định dạng | glTF 2.0 / GLB, không extension bắt buộc | Unity (glTFast), Godot (nhập thẳng), three.js, Flutter đều đọc được |
| Dựng model | Script Node thuần, không phụ thuộc: `tools/model3d/` | Tái tạo được, chạy trong CI, không cần Blender |
| Rig | 1 skin, 12 xương, mỗi bộ phận gắn cứng vào 1 xương (kiểu thú bông) | Rẻ: skinning 1 xương/đỉnh |
| Biểu cảm | Các mesh nhỏ (mắt cười, tim, lông mày, miệng, mũ, hiệu ứng) là node con, `scale = 0` lúc nghỉ, clip bật lên | Chạy giống nhau ở mọi engine, không cần morph target |
| Lông plush | Normal map + albedo nhiễu lông (256 px, dùng chung) + `KHR_materials_sheen` (viền lông mờ). Web có thêm lớp shell fur tùy chọn | Gần như miễn phí; engine không hỗ trợ sheen vẫn đẹp vì có normal map |
| Thẻ BipBip | Đĩa caramel, vân dệt và chữ khắc BipBip trong texture 256 px, dây da lộn khaki | Giống bản 2D |
| Clip | 30 FPS lấy mẫu, nén bớt khóa thừa, mọi clip có cùng tập kênh | Trộn clip (crossfade) không bị dính trạng thái của clip trước |
| Mắt nhìn theo | Xương `eye_l/eye_r` không bị clip xoay: runtime tự xoay theo `lookX/lookY` | Giống input `lookX/lookY` của Rive |

### Ngân sách (test tự kiểm)

| | LOD0 (gần) | LOD1 | LOD2 (xa, danh sách dài) |
| --- | --- | --- | --- |
| Tam giác | tối đa 12.000 | tối đa 5.000 | tối đa 1.800 |
| Draw call (primitive) | tối đa 12 | tối đa 12 | tối đa 12 |
| Texture | tối đa 4, tổng PNG dưới 1 MB | như LOD0 | giảm còn 1 normal map |
| Xương | 12 | 12 | 12 |
| File GLB | dưới 1,2 MB | dưới 1 MB | dưới 0,6 MB |

## 3. Giai đoạn

1. **Model + rig + 15 clip** (đã làm): generator, GLB 3 mức LOD, test ngân sách và khớp spec, ảnh preview.
2. **Web** (đã làm, PR giai đoạn 2): `packages/web-3d` (`<penguin-mascot-3d>` dùng three.js, cùng API `play()`, `state`, sự kiện `animationdone`),
   tùy chọn `renderer="3d"` cho React, hướng dẫn `<model-viewer>`.
3. **Flutter + game** (đã làm, PR giai đoạn 3): `packages/flutter_3d` (`Mascot3D`, flutter_scene), script mẫu và hướng dẫn Unity, Godot (`docs/3D-ENGINES.md`).

   Chọn `flutter_scene` (Flutter GPU, native) thay vì WebView (`model_viewer_plus`) vì cần mượt 60 FPS và chồng lên UI; vì nó đòi Flutter 3.47 nên làm gói riêng, `penguin_mascot` 2D giữ nguyên.

## 4. Hợp đồng rig (cho người dựng lại trong Blender)

Nếu sau này có họa sĩ dựng lại model bằng tay, giữ nguyên hợp đồng này để code và engine không phải đổi:

- Hệ tọa độ glTF: Y lên, nhân vật quay mặt về +Z, đơn vị mét, cao khoảng 1 m, chân chạm y = 0.
- Xương (cha → con): `root` → `body` → `head` → (`jaw`, `eye_l`, `eye_r`); `body` → `wing_l`, `wing_r`, `tag_root` → `tag`; `root` → `foot_l`, `foot_r`.
- Node bật/tắt (tên bắt đầu `fx_`): có sẵn trong file, `scale = 0` lúc nghỉ; xem `art/3d/bipbip.manifest.json`.
- Clip tên đúng như khóa trong `spec/mascot.json`; clip lặp có khung đầu bằng khung cuối.
- Không đổi tên xương; thêm xương mới thì thêm vào cuối.
