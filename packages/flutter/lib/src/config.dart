import 'package:flutter/services.dart' show AssetBundle;
import 'package:rive/rive.dart' as rive;

/// Cấu hình chung cho mọi [Mascot], đặt một lần (thường trong `main()`), để các màn hình chỉ cần
/// `Mascot(state: MascotState.happy)`.
///
/// ```dart
/// MascotConfig.riveAsset = 'assets/mascot/bipbip.riv';       // dùng Rive
/// MascotConfig.spriteAssetBase = 'assets/mascot';            // đường lùi (sprite sheet từ export-frames)
/// ```
///
/// Không đặt gì thì không có gì để vẽ. Đặt cả hai thì Rive là chính, sprite sheet là đường lùi khi
/// file `.riv` thiếu, hỏng hoặc thiếu input theo spec.
class MascotConfig {
  MascotConfig._();

  /// Khóa asset của file `.riv` (ví dụ `assets/mascot/bipbip.riv`). Null: không dùng Rive.
  static String? riveAsset;

  /// Thư mục asset chứa `manifest.json` và `<trạng thái>.webp` do `tools/export-frames.mjs` xuất.
  /// Null: không có đường lùi sprite sheet.
  static String? spriteAssetBase;

  /// Bộ vẽ của Rive. Mặc định renderer của Flutter (chạy mọi nơi, kể cả Impeller và test);
  /// đổi sang `Factory.rive` nếu muốn renderer của Rive.
  static rive.Factory riveFactory = rive.Factory.flutter;

  /// Nơi nạp asset; mặc định `rootBundle`. Chủ yếu để test.
  static AssetBundle? bundle;
}
