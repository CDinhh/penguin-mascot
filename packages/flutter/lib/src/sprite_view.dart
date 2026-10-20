import 'dart:ui' as ui;

import 'package:flutter/widgets.dart';

import 'sprite_sheets.dart';
import 'states.dart';

/// Vẽ [Mascot] bằng sprite sheet (đường lùi khi không dùng được Rive).
///
/// Chỉ giữ trong RAM sheet đang chạy và sheet của trạng thái lặp gần nhất (thường là `idle`);
/// sheet còn lại được giải phóng. Animation một lần chạy xong thì về trạng thái lặp đó.
class SpriteMascotView extends StatefulWidget {
  const SpriteMascotView({
    super.key,
    required this.base,
    required this.target,
    required this.token,
    required this.size,
    required this.reduceMotion,
    required this.onDone,
    required this.onError,
  });

  /// Thư mục asset có `manifest.json` và các sheet.
  final String base;
  final MascotState target;

  /// Đổi giá trị này để phát lại [target], kể cả khi [target] không đổi.
  final int token;
  final double size;
  final bool reduceMotion;
  final void Function(MascotState state) onDone;
  final void Function(Object error) onError;

  @override
  State<SpriteMascotView> createState() => _SpriteMascotViewState();
}

class _SpriteMascotViewState extends State<SpriteMascotView> with SingleTickerProviderStateMixin {
  // SingleTickerProviderStateMixin tôn trọng TickerMode: khuất route thì tự dừng.
  late final AnimationController _anim = AnimationController(vsync: this);
  SpriteManifest? _manifest;
  final Map<MascotState, ui.Image> _held = {};
  MascotState _base = MascotState.idle;
  MascotState _current = MascotState.idle;
  ui.Image? _shown;
  int _gen = 0;
  bool _disposed = false;

  @override
  void initState() {
    super.initState();
    _play(widget.target);
  }

  @override
  void didUpdateWidget(SpriteMascotView old) {
    super.didUpdateWidget(old);
    if (old.token != widget.token || old.target != widget.target) {
      _play(widget.target);
    } else if (old.reduceMotion != widget.reduceMotion) {
      _applyMotion();
    }
  }

  @override
  void dispose() {
    _disposed = true;
    _gen++;
    _anim.dispose();
    final m = _manifest;
    if (m != null) {
      for (final s in _held.keys) {
        MascotSpriteSheets.release(widget.base, s, m);
      }
    }
    _held.clear();
    super.dispose();
  }

  bool get _stale => _disposed || !mounted;

  Future<void> _hold(MascotState s) async {
    if (_held.containsKey(s)) return;
    final img = await MascotSpriteSheets.acquire(widget.base, s);
    if (_stale) {
      MascotSpriteSheets.release(widget.base, s, _manifest!);
      return;
    }
    _held[s] = img;
  }

  void _dropExcept(Set<MascotState> keep) {
    final m = _manifest!;
    for (final s in _held.keys.toList()) {
      if (!keep.contains(s)) {
        _held.remove(s);
        MascotSpriteSheets.release(widget.base, s, m);
      }
    }
  }

  Future<void> _play(MascotState s) async {
    final gen = ++_gen;
    try {
      _manifest ??= await MascotSpriteSheets.manifest(widget.base);
      if (_stale || gen != _gen) return;
      final info = _manifest!.of(s);
      if (info == null) throw StateError('manifest.json không có "${s.name}"');

      // Giảm chuyển động: đứng yên, animation một lần coi như xong ngay
      if (widget.reduceMotion && !s.loop) {
        Future.microtask(() {
          if (!_stale) widget.onDone(s);
        });
        return;
      }

      await _hold(s);
      if (_stale || gen != _gen) return;
      if (s.loop) _base = s;
      _current = s;
      _dropExcept({_base, _current});
      setState(() => _shown = _held[s]);
      _anim.duration = Duration(milliseconds: info.durationMs);
      _anim.stop();
      if (widget.reduceMotion) {
        _anim.value = 0;
      } else if (s.loop) {
        _anim.repeat();
      } else {
        await _anim.forward(from: 0).orCancel.catchError((_) {});
        if (_stale || gen != _gen) return;
        widget.onDone(s);
        await _returnToBase();
      }
    } catch (e) {
      if (!_stale) widget.onError(e);
    }
  }

  Future<void> _returnToBase() async {
    final gen = ++_gen;
    final info = _manifest!.of(_base)!;
    await _hold(_base);
    if (_stale || gen != _gen) return;
    _current = _base;
    _dropExcept({_base});
    setState(() => _shown = _held[_base]);
    _anim.duration = Duration(milliseconds: info.durationMs);
    if (widget.reduceMotion) {
      _anim.value = 0;
    } else {
      _anim.repeat();
    }
  }

  void _applyMotion() {
    if (_manifest == null || _shown == null) return;
    if (widget.reduceMotion) {
      _anim.stop();
      _anim.value = 0;
    } else if (_manifest!.of(_current)?.loop ?? false) {
      _anim.repeat();
    }
  }

  @override
  Widget build(BuildContext context) {
    final m = _manifest;
    final image = _shown;
    final height = m == null ? widget.size * 1.25 : widget.size * m.frameHeight / m.frameWidth;
    return SizedBox(
      width: widget.size,
      height: height,
      child: (m == null || image == null)
          ? null
          : RepaintBoundary(
              child: AnimatedBuilder(
                animation: _anim,
                builder: (context, _) {
                  final frames = m.of(_current)?.frames ?? 1;
                  final index = (_anim.value * frames).floor().clamp(0, frames - 1);
                  return CustomPaint(painter: _SpritePainter(image, m, index));
                },
              ),
            ),
    );
  }
}

class _SpritePainter extends CustomPainter {
  _SpritePainter(this.image, this.manifest, this.frame);
  final ui.Image image;
  final SpriteManifest manifest;
  final int frame;

  @override
  void paint(Canvas canvas, Size size) {
    final fw = manifest.frameWidth.toDouble();
    final fh = manifest.frameHeight.toDouble();
    final col = frame % manifest.columns;
    final row = frame ~/ manifest.columns;
    canvas.drawImageRect(
      image,
      Rect.fromLTWH(col * fw, row * fh, fw, fh),
      Offset.zero & size,
      Paint()..filterQuality = FilterQuality.medium,
    );
  }

  @override
  bool shouldRepaint(_SpritePainter old) => old.image != image || old.frame != frame || old.manifest != manifest;
}
