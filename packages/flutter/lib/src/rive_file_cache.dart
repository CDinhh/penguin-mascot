import 'package:flutter/services.dart' show AssetBundle, rootBundle;
import 'package:rive/rive.dart' as rive;

/// Giữ một `rive.File` cho mỗi (asset, renderer) và dùng chung cho mọi [Mascot]; mỗi widget chỉ tạo
/// artboard instance riêng từ file này nên RAM không nhân theo số linh vật trên màn hình.
class MascotRiveFiles {
  MascotRiveFiles._();

  static final Map<String, Future<rive.File>> _files = {};

  /// Nạp (hoặc lấy lại) file. Lỗi nạp không được nhớ lại, lần gọi sau thử lại.
  static Future<rive.File> load(
    String asset, {
    required rive.Factory factory,
    AssetBundle? bundle,
  }) {
    final key = '${factory.runtimeType}|$asset|${identityHashCode(bundle)}';
    return _files.putIfAbsent(key, () async {
      try {
        final file = await rive.File.asset(asset, riveFactory: factory, bundle: bundle ?? rootBundle);
        if (file == null) throw StateError('Không giải mã được file Rive: $asset');
        return file;
      } catch (_) {
        _files.remove(key);
        rethrow;
      }
    });
  }

  /// Giải phóng mọi file đã nạp (gọi khi không còn [Mascot] nào dùng, ví dụ khi test).
  static Future<void> clear() async {
    final files = _files.values.toList();
    _files.clear();
    for (final f in files) {
      try {
        (await f).dispose();
      } catch (_) {}
    }
  }
}
