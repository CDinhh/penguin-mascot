# penguin_mascot

BipBip, linh vật chim cánh cụt (bản plush) cho Flutter. Dùng [Rive](https://rive.app) khi có file `bipbip.riv`;
chưa có hoặc nạp lỗi thì lùi về sprite sheet (xuất bằng `tools/export-frames.mjs`). Chưa publish lên pub.dev, dùng qua git tag.

Cần Dart `>=3.6`, Flutter `>=3.28` (package `rive` 0.14).

## Cài

```yaml
dependencies:
  penguin_mascot:
    git:
      url: https://github.com/CDinhh/penguin-mascot
      path: packages/flutter
      ref: v1.0.0
```

## Dùng

```dart
void main() {
  MascotConfig.spriteAssetBase = 'assets/mascot';            // thư mục có manifest.json và <trạng thái>.webp
  MascotConfig.riveAsset = 'assets/mascot/bipbip.riv';       // bỏ dòng này khi chưa có file .riv
  runApp(const MyApp());
}

// ở màn hình
Mascot(state: MascotState.happy, size: 160, onDone: (s) => print('xong ${s.name}'));
```

Khai asset trong `pubspec.yaml` của app (`assets/mascot/` và, khi có, `bipbip.riv`).

| Tham số | Ý nghĩa |
| --- | --- |
| `state` | `MascotState` (15 trạng thái, sinh từ `spec/mascot.json`) |
| `size` | Chiều rộng, mặc định 200 |
| `variant` | `MascotVariant.plush` (hiện chỉ có bản này) |
| `onDone` | Animation một lần xong (hoặc bị bỏ qua vì giảm chuyển động); sau đó tự về trạng thái lặp gần nhất |
| `replayKey` | Đổi giá trị để phát lại đúng trạng thái đang chọn |
| `controller` | `MascotController`: gọi `controller.play(MascotState.sad)` hai lần liền thì phát lại hai lần, không cần đổi `Key` |
| `riveAsset`, `spriteAssetBase` | Ghi đè `MascotConfig` cho từng widget |
| `onFallback` | Gọi khi không dùng được Rive và đã lùi về sprite sheet |

## Cách chạy

- **Rive**: một `rive.File` dùng chung cho mọi `Mascot` (`MascotRiveFiles`), mỗi widget một artboard instance. Trạng thái lặp đặt input `mood`; trạng thái một lần bắn trigger cùng tên rồi chờ event `done` (có thời gian chờ dự phòng). Hợp đồng rig ở [`rive/README.md`](../../rive/README.md). Renderer mặc định là của Flutter (`MascotConfig.riveFactory`).
- **Lùi về sprite sheet**: file `.riv` thiếu, hỏng, thiếu input theo spec, hoặc không đặt `riveAsset`. Chỉ giữ trong RAM sheet đang chạy và sheet của trạng thái lặp gần nhất; sheet còn lại được `dispose()`. Mỗi sheet giải mã khoảng 15MB.
- **Giảm chuyển động**: theo `MediaQuery.disableAnimations`, đứng yên ở khung đầu của `idle`; `onDone` vẫn được gọi cho animation một lần.
- **Tạm dừng**: khi `TickerMode` tắt (route bị che) thì dừng. Mascot cuộn ra khỏi màn hình trong `ListView` chưa được dừng riêng.

## Test widget có dùng Mascot

Animation lặp không bao giờ "yên", nên **không dùng `pumpAndSettle`** khi mascot đang chạy dáng lặp; dùng `pump(Duration)`:

```dart
await tester.pumpWidget(...);
await tester.pump(const Duration(milliseconds: 400));
```

Nạp ảnh sprite chạy ngoài fake async: bọc bằng `tester.runAsync(() => Future.delayed(...))` rồi `pump()` (xem `test/mascot_test.dart`).
Nếu test đặt `MascotConfig.riveAsset`, nhớ gọi `MascotRiveFiles.clear()` ở `tearDown`.

## Chưa kiểm chứng

Nhánh Rive thành công (nạp `.riv` thật, đổi `mood`, bắn trigger, nhận event `done`) chưa chạy được vì chưa có `bipbip.riv`; test hiện bao phủ spec, sprite sheet và đường lùi khi thiếu file. Runtime Rive đánh dấu input state machine là deprecated (khuyên dùng data binding); phần gọi gom trong `lib/src/rive_view.dart`.
