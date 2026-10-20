import 'package:flutter/widgets.dart';
import 'package:rive/rive.dart' as rive;

import 'config.dart';
import 'controller.dart';
import 'rive_file_cache.dart';
import 'rive_view.dart';
import 'sprite_view.dart';
import 'states.dart';

enum _Backend { loading, rive, sprite, none }

/// BipBip. Dùng Rive khi có file `.riv` (xem [MascotConfig.riveAsset]); thiếu, hỏng hoặc thiếu input
/// theo spec thì lùi về sprite sheet ([MascotConfig.spriteAssetBase]).
///
/// ```dart
/// Mascot(state: MascotState.happy, size: 160, onDone: (s) => ...)
/// ```
///
/// - Đổi [state] để đổi animation. Chạy lại cùng một trạng thái một lần: đổi [replayKey] hoặc dùng [controller].
/// - [onDone] gọi khi animation một lần xong (hoặc bị bỏ qua vì giảm chuyển động), rồi mascot tự về
///   trạng thái lặp gần nhất.
/// - Giảm chuyển động theo `MediaQuery.disableAnimations`: đứng yên ở `idle`.
/// - Tạm dừng khi `TickerMode` tắt (ví dụ route bị che).
/// - Test widget: khi đang chạy dáng lặp thì dùng `tester.pump(Duration)`, không dùng `pumpAndSettle`
///   (animation lặp không bao giờ "yên").
class Mascot extends StatefulWidget {
  const Mascot({
    super.key,
    this.state = MascotState.idle,
    this.size = 200,
    this.variant = MascotVariant.plush,
    this.cap = false,
    this.onDone,
    this.replayKey,
    this.controller,
    this.riveAsset,
    this.spriteAssetBase,
    this.onFallback,
  });

  /// Trạng thái hiện tại. Bị [controller] ghi đè nếu có.
  final MascotState state;

  /// Chiều rộng (logical pixel). Chiều cao theo tỉ lệ artboard (200x240) hoặc khung sprite.
  final double size;
  final MascotVariant variant;

  /// Đội mũ tốt nghiệp (chỉ khi vẽ bằng Rive; sprite sheet không có mũ).
  final bool cap;

  /// Animation một lần đã xong.
  final ValueChanged<MascotState>? onDone;

  /// Đổi giá trị này để phát lại đúng trạng thái đang chọn (ví dụ trả lời sai hai lần liền).
  final Object? replayKey;

  /// Điều khiển bằng lời gọi `controller.play(...)` thay cho [state] và [replayKey].
  final MascotController? controller;

  /// Ghi đè [MascotConfig.riveAsset] cho widget này.
  final String? riveAsset;

  /// Ghi đè [MascotConfig.spriteAssetBase] cho widget này.
  final String? spriteAssetBase;

  /// Gọi khi không dùng được Rive và đã lùi về sprite sheet (hoặc không còn gì để vẽ), kèm lỗi.
  final void Function(Object error)? onFallback;

  @override
  State<Mascot> createState() => _MascotState();
}

class _MascotState extends State<Mascot> {
  _Backend _backend = _Backend.loading;
  rive.File? _file;
  int _token = 0;

  String? get _riveAsset => widget.riveAsset ?? MascotConfig.riveAsset;
  String? get _spriteBase => widget.spriteAssetBase ?? MascotConfig.spriteAssetBase;
  MascotState get _target => widget.controller?.state ?? widget.state;

  @override
  void initState() {
    super.initState();
    widget.controller?.addListener(_onController);
    _chooseBackend();
  }

  @override
  void didUpdateWidget(Mascot old) {
    super.didUpdateWidget(old);
    if (old.controller != widget.controller) {
      old.controller?.removeListener(_onController);
      widget.controller?.addListener(_onController);
      _token++;
    }
    if (old.state != widget.state || old.replayKey != widget.replayKey) _token++;
    if (old.variant != widget.variant || old.riveAsset != widget.riveAsset || old.spriteAssetBase != widget.spriteAssetBase) {
      _chooseBackend();
    }
  }

  @override
  void dispose() {
    widget.controller?.removeListener(_onController);
    super.dispose();
  }

  void _onController() => setState(() => _token++);

  Future<void> _chooseBackend() async {
    final asset = _riveAsset;
    if (asset == null) {
      _fallback(null);
      return;
    }
    setState(() => _backend = _Backend.loading);
    try {
      final file = await MascotRiveFiles.load(asset, factory: MascotConfig.riveFactory, bundle: MascotConfig.bundle);
      if (!mounted) return;
      setState(() {
        _file = file;
        _backend = _Backend.rive;
      });
    } catch (e) {
      if (mounted) _fallback(e);
    }
  }

  /// Lùi về sprite sheet; không có cả sprite thì không còn gì để vẽ.
  void _fallback(Object? error) {
    final hasSprite = _spriteBase != null;
    setState(() => _backend = hasSprite ? _Backend.sprite : _Backend.none);
    if (error != null) {
      widget.onFallback?.call(error);
      if (!hasSprite) {
        FlutterError.reportError(FlutterErrorDetails(
          exception: error,
          library: 'penguin_mascot',
          context: ErrorDescription('không nạp được Rive và không có sprite sheet để lùi về'),
        ));
      }
    } else if (!hasSprite) {
      debugPrint('[penguin_mascot] Chưa đặt MascotConfig.riveAsset hay spriteAssetBase: không có gì để vẽ.');
    }
  }

  void _onViewError(Object error) {
    if (_backend == _Backend.rive) {
      _fallback(error);
    } else if (_backend == _Backend.sprite) {
      setState(() => _backend = _Backend.none);
      widget.onFallback?.call(error);
    }
  }

  @override
  Widget build(BuildContext context) {
    final reduce = MediaQuery.maybeDisableAnimationsOf(context) ?? false;
    void done(MascotState s) => widget.onDone?.call(s);
    switch (_backend) {
      case _Backend.rive:
        return RiveMascotView(
          file: _file!,
          variant: widget.variant,
          target: _target,
          token: _token,
          size: widget.size,
          reduceMotion: reduce,
          cap: widget.cap,
          onDone: done,
          onError: _onViewError,
        );
      case _Backend.sprite:
        return SpriteMascotView(
          base: _spriteBase!,
          target: _target,
          token: _token,
          size: widget.size,
          reduceMotion: reduce,
          onDone: done,
          onError: _onViewError,
        );
      case _Backend.loading:
      case _Backend.none:
        return SizedBox(width: widget.size, height: widget.size * 1.2);
    }
  }
}
