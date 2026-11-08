# penguin_mascot_3d

BipBip 3D cho Flutter: model glTF có rig và đủ 15 clip, vẽ bằng **Flutter GPU** qua [`flutter_scene`](https://pub.dev/packages/flutter_scene)
(native, không WebView, theo nhịp khung hình của Flutter). Cùng API với `Mascot` 2D của `penguin_mascot`: `MascotState`, `MascotController`,
`onDone`, `replayKey`. **Bản 2D không bị thay thế**; đây là gói riêng để app không dùng 3D không phải nâng Flutter lên 3.47.

## Vì sao tách gói và chọn flutter_scene

| Lựa chọn | Nhận xét |
| --- | --- |
| `flutter_scene` (chọn) | Native Flutter GPU (Impeller), đọc glTF trực tiếp, skeletal animation có trộn clip, `KHR_materials_sheen` và unlit, LOD; chạy iOS, Android, desktop, web |
| `model_viewer_plus`, `flutter_3d_controller` | Chạy trong WebView (three.js/model-viewer): trễ khởi động, khó đạt nhịp 60 FPS ổn định, khó chồng lên UI, mỗi mascot một WebView |
| `three_js` (Dart) | Đường GL cũ, không đi qua Impeller |

`flutter_scene` cần Flutter ≥ 3.47 và Dart ^3.10 (vì vậy là gói riêng, còn `penguin_mascot` giữ `^3.6`).

## Cài đặt

```yaml
dependencies:
  penguin_mascot:    { git: { url: <url repo>, path: packages/flutter,    ref: v1.0.0 } }
  penguin_mascot_3d: { git: { url: <url repo>, path: packages/flutter_3d, ref: v1.0.0 } }
```

Bật Flutter GPU một lần cho từng nền tảng (xem [tài liệu flutter_scene](https://pub.dev/packages/flutter_scene)): lúc phát triển `flutter run --enable-flutter-gpu`;
để cố định, iOS và macOS thêm `FLTEnableFlutterGPU` vào `Info.plist`, Android thêm
`<meta-data android:name="io.flutter.embedding.android.EnableFlutterGPU" android:value="true" />` vào `AndroidManifest.xml`. Web không cần.

## Dùng

```dart
import 'package:penguin_mascot/penguin_mascot.dart';
import 'package:penguin_mascot_3d/penguin_mascot_3d.dart';

Mascot3D(
  state: MascotState.happy,
  size: 200,
  cap: true,
  lookX: 0.3,               // mắt nhìn theo, -1..1
  onDone: (s) => debugPrint('xong $s'),
  // Không có Flutter GPU hoặc không nạp được model thì vẽ bản 2D:
  fallbackBuilder: (_) => Mascot(size: 200),
  onFallback: (e) => debugPrint('lùi về 2D: $e'),
)
```

- Đổi `state`, hoặc dùng `MascotController.play(...)`; chạy lại cùng trạng thái một lần: đổi `replayKey` hoặc gọi `controller.play` lần nữa.
- Trạng thái một lần chạy xong thì trộn về trạng thái lặp gần nhất (`idle`, `think`, `sleep`, `dance`, `walk`, `talk`).
- Giảm chuyển động (`MediaQuery.disableAnimations`): đứng yên ở tư thế đầu clip, clip một lần xong ngay, không tốn khung hình.
- Tạm dừng khi `TickerMode` tắt. `maxFrameRate: 30` để tiết kiệm pin khi mascot nhỏ.

## Hiệu năng

- LOD tự chọn theo pixel thật (`Mascot3DConfig.lodForPixels`): trên 260 px dùng LOD0 (7.116 tam giác), 111..260 px LOD1 (2.634), còn lại LOD2 (1.446). Ép bằng `lod:`.
- 11 draw call lúc nghỉ, 12 xương, skinning 1 xương mỗi đỉnh; node hiệu ứng `fx_*` tắt hẳn khi scale gần 0.
- Model đi kèm gói (`assets/mascot/`, khai báo sẵn trong pubspec); muốn tự host: `Mascot3DConfig.modelAssets = [...]`.

## Đã kiểm chứng và chưa kiểm chứng

- `flutter analyze` sạch; `flutter test` qua (logic trộn clip, giảm chuyển động, đường lùi khi không có Flutter GPU).
- Importer chính thức của flutter_scene (`dart run flutter_scene:import`) nhận cả 3 file GLB, gồm animation và skin.
- **Chưa chạy trên thiết bị hoặc giả lập thật** (môi trường dựng không có GPU): hình ảnh và FPS trên máy thật cần được xem trước khi phát hành.
  Hai điểm dễ lệch là chiều nhìn (flutter_scene đổi tay hệ tọa độ khi nạp glTF, nên có thể phải đổi vị trí camera trong `mascot3d.dart`)
  và dấu của `lookX`/`lookY`.
