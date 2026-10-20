import 'dart:async';
import 'dart:convert';
import 'dart:ui' as ui;

import 'package:flutter/services.dart' show AssetBundle, rootBundle;

import 'config.dart';
import 'states.dart';

/// Một dòng trong `manifest.json` của `tools/export-frames.mjs`.
class SpriteState {
  const SpriteState({required this.file, required this.frames, required this.durationMs, required this.loop});
  final String file;
  final int frames;
  final int durationMs;
  final bool loop;
}

class SpriteManifest {
  const SpriteManifest({required this.frameWidth, required this.frameHeight, required this.columns, required this.states});
  final int frameWidth;
  final int frameHeight;
  final int columns;
  final Map<String, SpriteState> states;

  factory SpriteManifest.fromJson(Map<String, dynamic> json) {
    final states = (json['states'] as Map<String, dynamic>).map((name, v) {
      final s = v as Map<String, dynamic>;
      return MapEntry(
        name,
        SpriteState(file: s['file'] as String, frames: s['frames'] as int, durationMs: s['durationMs'] as int, loop: s['loop'] as bool),
      );
    });
    return SpriteManifest(
      frameWidth: json['frameWidth'] as int,
      frameHeight: json['frameHeight'] as int,
      columns: json['columns'] as int,
      states: states,
    );
  }

  SpriteState? of(MascotState state) => states[state.name];
}

/// Sprite sheet (đường lùi khi không dùng được Rive), dùng chung giữa các [Mascot].
///
/// Mỗi sheet giải mã tốn khoảng 15MB RAM nên chỉ giữ sheet đang có widget cầm (đếm tham chiếu);
/// hết người dùng thì `ui.Image.dispose()` ngay.
class MascotSpriteSheets {
  MascotSpriteSheets._();

  static final Map<String, Future<SpriteManifest>> _manifests = {};
  static final Map<String, _Sheet> _sheets = {};

  static AssetBundle get _bundle => MascotConfig.bundle ?? rootBundle;

  static Future<SpriteManifest> manifest(String base) {
    return _manifests.putIfAbsent(base, () async {
      try {
        final text = await _bundle.loadString('$base/manifest.json');
        return SpriteManifest.fromJson(jsonDecode(text) as Map<String, dynamic>);
      } catch (_) {
        _manifests.remove(base);
        rethrow;
      }
    });
  }

  /// Lấy sheet của [state] và tăng đếm tham chiếu; nhớ gọi [release] khi xong.
  static Future<ui.Image> acquire(String base, MascotState state) async {
    final m = await manifest(base);
    final s = m.of(state);
    if (s == null) throw StateError('manifest.json không có "${state.name}"');
    final key = '$base/${s.file}';
    final sheet = _sheets.putIfAbsent(key, () => _Sheet(_decode(key)));
    sheet.refs++;
    try {
      return await sheet.image;
    } catch (_) {
      sheet.refs--;
      if (sheet.refs <= 0) _sheets.remove(key);
      rethrow;
    }
  }

  static void release(String base, MascotState state, SpriteManifest manifest) {
    final s = manifest.of(state);
    if (s == null) return;
    final key = '$base/${s.file}';
    final sheet = _sheets[key];
    if (sheet == null) return;
    sheet.refs--;
    if (sheet.refs <= 0) {
      _sheets.remove(key);
      sheet.image.then((i) => i.dispose(), onError: (_) {});
    }
  }

  static Future<ui.Image> _decode(String key) async {
    final data = await _bundle.load(key);
    final codec = await ui.instantiateImageCodec(data.buffer.asUint8List());
    try {
      return (await codec.getNextFrame()).image;
    } finally {
      codec.dispose();
    }
  }

  /// Số sheet đang nằm trong RAM (để test và theo dõi bộ nhớ).
  static int get loadedSheets => _sheets.length;

  /// Bỏ mọi thứ đã nhớ (khi test hoặc đổi nguồn asset).
  static void reset() {
    for (final s in _sheets.values) {
      s.image.then((i) => i.dispose(), onError: (_) {});
    }
    _sheets.clear();
    _manifests.clear();
  }
}

class _Sheet {
  _Sheet(this.image);
  final Future<ui.Image> image;
  int refs = 0;
}
