import 'dart:math' as math;

import 'package:flutter/widgets.dart';
import 'package:flutter_scene/scene.dart';
import 'package:penguin_mascot/penguin_mascot.dart'
    show MascotController, MascotState;
import 'package:vector_math/vector_math.dart' as vm;

import 'animator.dart';
import 'config.dart';
import 'fx_component.dart';

class _SceneClip implements MascotClip {
  _SceneClip(this.clip);
  final AnimationClip clip;
  @override
  bool get playing => clip.playing;
  @override
  double get weight => clip.weight;
  @override
  set weight(double v) => clip.weight = v;
  @override
  set loop(bool v) => clip.loop = v;
  @override
  void replay() => clip.replay();
  @override
  void play() => clip.play();
  @override
  void pause() => clip.pause();
  @override
  void seek(double s) => clip.seek(s);
}

/// BipBip 3D (glTF) vẽ bằng Flutter GPU qua `flutter_scene`: cùng API với `Mascot` của `penguin_mascot`.
///
/// ```dart
/// Mascot3D(state: MascotState.happy, size: 200, onDone: (s) => ..., fallbackBuilder: (_) => Mascot(size: 200))
/// ```
///
/// - Cần bật Flutter GPU (xem README của gói). Không nạp được model hoặc không có Flutter GPU thì gọi [onFallback]
///   và vẽ [fallbackBuilder] (thường là `Mascot` 2D).
/// - Đổi [state] để đổi animation; chạy lại cùng trạng thái một lần: đổi [replayKey] hoặc dùng [controller].
/// - [onDone] gọi khi animation một lần xong, rồi tự về trạng thái lặp gần nhất.
/// - Giảm chuyển động theo `MediaQuery.disableAnimations`: đứng yên và không tốn khung hình.
/// - Tạm dừng khi `TickerMode` tắt (ví dụ route bị che).
class Mascot3D extends StatefulWidget {
  const Mascot3D({
    super.key,
    this.state = MascotState.idle,
    this.size = 200,
    this.cap = false,
    this.lookX = 0,
    this.lookY = 0,
    this.onDone,
    this.replayKey,
    this.controller,
    this.lod,
    this.maxFrameRate,
    this.onFallback,
    this.fallbackBuilder,
  });

  final MascotState state;

  /// Chiều rộng (logical pixel); chiều cao theo tỉ lệ 200:240 như bản 2D.
  final double size;

  /// Đội mũ tốt nghiệp.
  final bool cap;

  /// Hướng nhìn của mắt, -1..1 (như `lookX`/`lookY` của Rive).
  final double lookX;
  final double lookY;

  final ValueChanged<MascotState>? onDone;
  final Object? replayKey;
  final MascotController? controller;

  /// Ép LOD (0 chi tiết nhất); mặc định chọn theo kích thước thật.
  final int? lod;

  /// Trần số khung hình mỗi giây (mặc định: theo tần số quét màn hình). Dùng 30 để tiết kiệm pin khi mascot nhỏ.
  final double? maxFrameRate;

  final void Function(Object error)? onFallback;
  final WidgetBuilder? fallbackBuilder;

  @override
  State<Mascot3D> createState() => _Mascot3DState();
}

class _Mascot3DState extends State<Mascot3D> {
  // Tạo trong try của _load: `Scene()` ném ngay khi không có Flutter GPU / Impeller
  Scene? _scene;
  Node? _model;
  MascotAnimator? _animator;
  MascotFxComponent? _fx;
  Object? _error;
  int _token = 0;
  int _loadedLod = -1;
  int _lastPlays = 0;
  bool _reduced = false;

  static final PerspectiveCamera _camera = PerspectiveCamera(
    fovRadiansY: 23.5 * math.pi / 180,
    position: vm.Vector3(0.45, 0.98, -3.6),
    target: vm.Vector3(0, 0.7, 0),
  );

  MascotState get _wanted => widget.controller?.state ?? widget.state;

  @override
  void initState() {
    super.initState();
    widget.controller?.addListener(_onController);
    _lastPlays = widget.controller?.plays ?? 0;
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final mq = MediaQuery.maybeOf(context);
    _reduced = mq?.disableAnimations ?? false;
    _animator?.reducedMotion = _reduced;
    final dpr = mq?.devicePixelRatio ?? 1;
    final lod = widget.lod ?? Mascot3DConfig.lodForPixels(widget.size * dpr);
    if (lod != _loadedLod) _load(lod);
  }

  @override
  void didUpdateWidget(Mascot3D old) {
    super.didUpdateWidget(old);
    if (old.controller != widget.controller) {
      old.controller?.removeListener(_onController);
      widget.controller?.addListener(_onController);
      _lastPlays = widget.controller?.plays ?? 0;
    }
    _fx
      ?..cap = widget.cap
      ..lookX = widget.lookX
      ..lookY = widget.lookY;
    if (old.state != widget.state || old.replayKey != widget.replayKey)
      _apply();
    final dpr = MediaQuery.maybeOf(context)?.devicePixelRatio ?? 1;
    final lod = widget.lod ?? Mascot3DConfig.lodForPixels(widget.size * dpr);
    if (lod != _loadedLod) _load(lod);
  }

  @override
  void dispose() {
    _token++;
    widget.controller?.removeListener(_onController);
    _scene?.dispose();
    super.dispose();
  }

  void _onController() {
    final c = widget.controller!;
    if (c.plays != _lastPlays) {
      _lastPlays = c.plays;
      _apply();
    }
  }

  void _apply() {
    final s = _wanted;
    final done = widget.onDone;
    _animator?.play(s, onDone: done == null ? null : () => done(s));
  }

  Future<void> _load(int lod) async {
    final token = ++_token;
    _loadedLod = lod;
    try {
      final scene = _scene ??= Scene();
      await Scene.initializeStaticResources();
      final assets = Mascot3DConfig.modelAssets;
      final model = await Node.fromGlbAsset(
        assets[lod.clamp(0, assets.length - 1)],
      );
      if (!mounted || token != _token) return;
      final clips = <MascotState, MascotClip>{};
      for (final s in MascotState.values) {
        final a = model.findAnimationByName(s.name);
        if (a == null) throw StateError('Model thiếu clip "${s.name}"');
        clips[s] = _SceneClip(model.createAnimationClip(a));
      }
      final previous = _animator?.base ?? MascotState.idle;
      final animator = MascotAnimator(clips)..reducedMotion = _reduced;
      final fx = MascotFxComponent(model)
        ..cap = widget.cap
        ..lookX = widget.lookX
        ..lookY = widget.lookY;
      (model.getChildByName('root') ?? model).addComponent(fx);
      final old = _model;
      if (old != null) scene.remove(old);
      scene.add(model);
      setState(() {
        _model = model;
        _animator = animator;
        _fx = fx;
        _error = null;
      });
      animator.play(previous);
      _apply();
    } catch (e) {
      if (!mounted || token != _token) return;
      setState(() => _error = e);
      widget.onFallback?.call(e);
    }
  }

  @override
  Widget build(BuildContext context) {
    final box = SizedBox(width: widget.size, height: widget.size * 1.2);
    if (_error != null) return widget.fallbackBuilder?.call(context) ?? box;
    if (_model == null) return box;
    return SizedBox(
      width: widget.size,
      height: widget.size * 1.2,
      child: Semantics(
        label: 'BipBip',
        image: true,
        child: SceneView(
          _scene!,
          camera: _camera,
          autoTick: !_reduced,
          maxFrameRate: widget.maxFrameRate,
          onTick: (elapsed, dt) => _animator?.tick(dt),
        ),
      ),
    );
  }
}
