import 'package:flutter/foundation.dart';
import 'package:penguin_mascot/penguin_mascot.dart' show MascotState;

/// Phần của `AnimationClip` (flutter_scene) mà [MascotAnimator] dùng. Tách ra để test logic không cần GPU.
abstract class MascotClip {
  bool get playing;
  double get weight;
  set weight(double value);
  set loop(bool value);

  /// Về đầu clip và chạy.
  void replay();
  void play();
  void pause();
  void seek(double seconds);
}

/// Chọn clip theo [MascotState], trộn mượt giữa hai clip, hẹn xong với clip một lần.
///
/// Trạng thái lặp giữ nguyên đến khi đổi; trạng thái một lần chạy xong thì tự trộn về trạng thái lặp gần nhất
/// (như web component và Rive). Gọi [tick] mỗi khung hình với số giây đã trôi qua.
class MascotAnimator {
  MascotAnimator(this.clips, {this.fadeSeconds = 0.2}) {
    for (final e in clips.entries) {
      e.value
        ..loop = e.key.loop
        ..weight = 0
        ..pause();
    }
  }

  final Map<MascotState, MascotClip> clips;
  final double fadeSeconds;

  MascotState base = MascotState.idle;
  MascotState? _current;
  MascotState? _from;
  double _fade = 1;
  MascotState? _oneShot;
  VoidCallback? _onDone;
  bool _reduced = false;

  MascotState? get current => _current;
  bool get reducedMotion => _reduced;

  /// Giảm chuyển động: đứng yên ở khung đầu clip lặp; clip một lần bỏ qua và xong ngay.
  set reducedMotion(bool value) {
    if (_reduced == value) return;
    _reduced = value;
    final c = _current;
    if (c != null) {
      _current = null;
      _enter(base, restart: true, instant: true);
    }
  }

  /// Chạy [state]. [onDone] gọi khi clip một lần xong (hoặc bị bỏ qua vì giảm chuyển động); với trạng thái lặp thì không gọi.
  void play(MascotState state, {VoidCallback? onDone}) {
    final cb = _onDone;
    _onDone = null;
    _oneShot = null;
    cb?.call(); // lượt một lần trước bị thay thế: vẫn báo xong
    if (state.loop) {
      base = state;
      if (_current != state) _enter(state, restart: false);
      return;
    }
    if (_reduced) {
      if (_current == null) _enter(base, restart: true, instant: true);
      onDone?.call();
      return;
    }
    _oneShot = state;
    _onDone = onDone;
    _enter(state, restart: true);
  }

  void _enter(
    MascotState state, {
    required bool restart,
    bool instant = false,
  }) {
    final to = clips[state];
    if (to == null) return;
    instant =
        instant ||
        _reduced; // giảm chuyển động: không có khung hình để trộn, chuyển ngay
    final from = _current;
    if (from != null && from != state) {
      _from = from;
      _fade = instant ? 1 : 0;
    } else {
      _from = null;
      _fade = 1;
    }
    _current = state;
    if (restart || !to.playing) {
      if (_reduced) {
        to
          ..seek(0)
          ..pause();
      } else {
        to.replay();
      }
    }
    if (_from == null || instant) {
      to.weight = 1;
      if (_from != null) _retire();
    } else {
      to.weight = 0;
    }
  }

  void _retire() {
    final f = _from;
    if (f != null) {
      clips[f]!
        ..weight = 0
        ..pause();
    }
    _from = null;
  }

  /// Gọi mỗi khung hình.
  void tick(double dt) {
    final cur = _current;
    if (cur == null) return;
    if (_from != null) {
      _fade = (_fade + dt / fadeSeconds).clamp(0.0, 1.0);
      clips[cur]!.weight = _fade;
      clips[_from!]!.weight = 1 - _fade;
      if (_fade >= 1) _retire();
    }
    final one = _oneShot;
    if (one != null && one == cur && !clips[one]!.playing) {
      // clip một lần chạy hết (flutter_scene tự dừng ở khung cuối): trộn về trạng thái lặp
      final cb = _onDone;
      _oneShot = null;
      _onDone = null;
      _enter(base, restart: false);
      cb?.call();
    }
  }
}
