# penguin_mascot

BipBip, linh vật chim cánh cụt (bản plush) cho Flutter. Dùng [Rive](https://rive.app) với file `rive/bipbip.riv`;
thiếu hoặc nạp lỗi thì lùi về sprite sheet (xuất bằng `tools/export-frames.mjs`). Chưa publish lên pub.dev, dùng qua git.

Cần Dart `>=3.6`, Flutter `>=3.28` (package `rive` 0.14).

## Bắt đầu nhanh (dùng Rive)

**1. Thêm package** vào `pubspec.yaml` của app. Chưa publish lên pub.dev nên dùng qua git (đổi `ref` thành tag khi có):

```yaml
dependencies:
  penguin_mascot:
    git:
      url: https://github.com/CDinhh/penguin-mascot
      path: packages/flutter
      ref: main
```

**2. Chép file animation vào app.** Lấy `rive/bipbip.riv` của repo (khoảng 530 KB), đặt vào `assets/mascot/bipbip.riv` của app rồi khai asset:

```yaml
flutter:
  assets:
    - assets/mascot/bipbip.riv
```

**3. Trỏ tới file ở `main()`**, một lần cho cả app:

```dart
import 'package:penguin_mascot/penguin_mascot.dart';

void main() {
  MascotConfig.riveAsset = 'assets/mascot/bipbip.riv';
  runApp(const MyApp());
}
```

**4. Dùng widget** ở bất kỳ màn hình nào:

```dart
Mascot(
  state: MascotState.happy,   // đổi state để đổi animation
  size: 160,                  // chiều rộng; chiều cao tự theo tỉ lệ 200:240
  cap: true,                  // đội mũ tốt nghiệp (mặc định không)
  onDone: (s) => debugPrint('xong ${s.name}'),
)
```

Ví dụ chạy được nằm ở [`examples/flutter`](../../examples/flutter): `cd examples/flutter && flutter run`.

### Hai loại trạng thái

- **Lặp** (`idle`, `think`, `sleep`, `dance`, `walk`, `talk`): chạy mãi cho tới khi bạn đổi trạng thái. `onDone` không gọi.
- **Một lần** (`wave`, `happy`, `celebrate`, `sad`, `surprised`, `no`, `yes`, `love`, `streak`): chạy hết rồi tự quay về trạng thái lặp gần nhất, và gọi `onDone(state)` một lần.

| Trạng thái | Kiểu | Dùng khi |
| --- | --- | --- |
| `idle` | lặp | Mặc định (thở, chớp mắt) |
| `think` | lặp | Chờ người học trả lời |
| `sleep` | lặp | Lâu không học |
| `dance` | lặp | Vui vẻ, phần thưởng |
| `walk` | lặp | Chuyển màn, loading |
| `talk` | lặp | Đang đọc, phát âm |
| `wave` | 2,0 s | Chào mừng |
| `happy` | 1,2 s | Trả lời đúng |
| `celebrate` | 2,6 s | Xong bài học |
| `sad` | 2,6 s | Trả lời sai |
| `surprised` | 1,4 s | Bất ngờ |
| `no`, `yes` | 1,2 s | Lắc đầu, gật đầu |
| `love` | 2,4 s | Cảm ơn |
| `streak` | 2,4 s | Giữ chuỗi ngày học |

### Các cách thường dùng

**Phát lại cùng một trạng thái** (ví dụ trả lời sai hai lần liền) dùng `MascotController`, không cần đổi `Key`:

```dart
final mascot = MascotController();           // nhớ mascot.dispose() trong State.dispose()

Mascot(controller: mascot, size: 160)

mascot.play(MascotState.sad);                // chạy
mascot.play(MascotState.sad);                // chạy lại từ đầu
```

Hoặc đổi `replayKey` (bất kỳ giá trị nào) của `Mascot(state: ..., replayKey: attempt)`.

**Nối nhiều animation** bằng `onDone`:

```dart
Mascot(
  controller: mascot,
  onDone: (s) { if (s == MascotState.happy) mascot.play(MascotState.celebrate); },
)
```

**Đổi trạng thái lặp theo màn hình**: `Mascot(state: loading ? MascotState.walk : MascotState.idle)`.

**Giảm chuyển động**: tự theo `MediaQuery.disableAnimations` của hệ điều hành. Khi bật, mascot đứng yên và `onDone` vẫn được gọi cho animation một lần (app không bị treo chờ).

### Đường lùi khi thiếu file (tùy chọn)

Nếu không đặt `riveAsset`, hoặc file thiếu/hỏng, `Mascot` lùi về sprite sheet (xuất bằng `npm run export:frames`). Đặt cả hai để có dự phòng:

```dart
MascotConfig.riveAsset = 'assets/mascot/bipbip.riv';
MascotConfig.spriteAssetBase = 'assets/mascot';   // thư mục có manifest.json và <trạng thái>.webp
```

`Mascot(onFallback: (error) => ...)` được gọi khi phải lùi, kèm lỗi để bạn ghi log.

### Gặp sự cố

- **Không thấy gì**: chưa đặt `MascotConfig.riveAsset` (hay `spriteAssetBase`), hoặc quên khai asset trong `pubspec.yaml`. Console in dòng `[penguin_mascot] Chưa đặt ...`.
- **Build lỗi liên quan `rive_native`**: package `rive` 0.14 dùng runtime native; làm theo [hướng dẫn của Rive](https://rive.app/docs/runtimes/flutter/rive-native#troubleshooting) cho nền tảng của bạn.
- **`onFallback` báo "thiếu input"**: file `.riv` không đúng hợp đồng (artboard `BipBip Plush`, state machine `Main`, view model `Mascot` có `mood` và các trigger theo spec). Dùng đúng `rive/bipbip.riv` của repo.
- **Cần sửa animation**: xem [`rive/README.md`](../../rive/README.md) (hợp đồng) và [`tools/rive-anim`](../../tools/rive-anim) (bộ sinh keyframe từ CSS của web).

### Tham số của `Mascot`

| Tham số | Ý nghĩa |
| --- | --- |
| `state` | `MascotState` (15 trạng thái, sinh từ `spec/mascot.json`) |
| `size` | Chiều rộng, mặc định 200 |
| `variant` | `MascotVariant.plush` (hiện chỉ có bản này) |
| `cap` | Đội mũ tốt nghiệp (chỉ khi vẽ bằng Rive), mặc định `false` |
| `onDone` | Animation một lần xong (hoặc bị bỏ qua vì giảm chuyển động); sau đó tự về trạng thái lặp gần nhất |
| `replayKey` | Đổi giá trị để phát lại đúng trạng thái đang chọn |
| `controller` | `MascotController`: `controller.play(MascotState.sad)` hai lần liền thì phát lại hai lần |
| `riveAsset`, `spriteAssetBase` | Ghi đè `MascotConfig` cho từng widget |
| `onFallback` | Gọi khi không dùng được Rive và đã lùi về sprite sheet |

## Cách chạy

- **Rive**: một `rive.File` dùng chung cho mọi `Mascot` (`MascotRiveFiles`), mỗi widget một artboard instance. Điều khiển bằng view model `Mascot` (data binding): trạng thái lặp đặt `mood`; trạng thái một lần bắn trigger cùng tên rồi báo xong sau `durationMs` của spec. Tham số `cap` đội mũ tốt nghiệp. Hợp đồng rig ở [`rive/README.md`](../../rive/README.md). Renderer mặc định là của Flutter (`MascotConfig.riveFactory`).
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

Nhánh Rive thành công (nạp `.riv` thật, đổi `mood`, bắn trigger, đội mũ) chưa chạy trong test Flutter vì môi trường test không có thư viện native của Rive; test hiện bao phủ spec, sprite sheet và đường lùi khi thiếu file. File `.riv` đã được kiểm với runtime web (xem `rive/PROGRESS.md`). Phần gọi Rive gom trong `lib/src/rive_view.dart`.
