import 'dart:async';

import 'package:flutter/widgets.dart';
import 'package:rive/rive.dart' as rive;

import 'states.dart';

/// Chờ thêm sau `durationMs` trước khi báo xong: state machine vào state của trạng thái ở khung kế tiếp sau khi bắn trigger.
/// (Rive Flutter không còn cho nghe event hay đổi state một cách công khai, nên báo xong bằng đồng hồ theo thời lượng trong spec.)
const Duration kDoneSlack = Duration(milliseconds: 100);

/// Vẽ [Mascot] bằng Rive: một artboard instance riêng cho mỗi widget, dùng chung `rive.File`.
///
/// Trạng thái lặp đặt property `mood` của view model; trạng thái một lần bắn trigger cùng tên rồi báo xong sau
/// `durationMs` của spec (file .riv chạy đúng thời lượng đó).
/// Tạm dừng khi `TickerMode` tắt (route bị che) hoặc giảm chuyển động.
class RiveMascotView extends StatefulWidget {
  const RiveMascotView({
    super.key,
    required this.file,
    required this.variant,
    required this.target,
    required this.token,
    required this.size,
    required this.reduceMotion,
    this.cap = false,
    required this.onDone,
    required this.onError,
  });

  final rive.File file;
  final MascotVariant variant;
  final MascotState target;

  /// Đổi giá trị này để phát lại [target], kể cả khi [target] không đổi.
  final int token;
  final double size;
  final bool reduceMotion;

  /// Đội mũ tốt nghiệp (property `cap` của view model).
  final bool cap;
  final void Function(MascotState state) onDone;
  final void Function(Object error) onError;

  @override
  State<RiveMascotView> createState() => _RiveMascotViewState();
}

class _RiveMascotViewState extends State<RiveMascotView> {
  rive.RiveWidgetController? _controller;
  rive.ViewModelInstanceNumber? _mood;
  rive.ViewModelInstanceBoolean? _cap;
  final Map<String, rive.ViewModelInstanceTrigger> _triggers = {};
  ({MascotState state, Timer timer})? _pending;
  bool _tickerOn = true;

  @override
  void initState() {
    super.initState();
    try {
      _setup();
    } catch (e) {
      // Báo sau khung hình hiện tại, vì không được setState của cha trong lúc build
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) widget.onError(e);
      });
      return;
    }
    _apply(widget.target);
  }

  // Điều khiển bằng view model `Mascot` (instance mặc định của artboard) theo hợp đồng trong spec.
  void _setup() {
    final c = rive.RiveWidgetController(
      widget.file,
      artboardSelector: rive.ArtboardSelector.byName(widget.variant.artboard),
      stateMachineSelector: rive.StateMachineSelector.byName(kRiveStateMachine),
    );
    _controller = c;
    final vmi = c.dataBind(rive.DataBind.auto());
    final missing = <String>[];
    _mood = vmi.number('mood');
    if (_mood == null) missing.add('mood');
    for (final s in MascotState.values.where((s) => s.isTrigger)) {
      final t = vmi.trigger(s.riveInput);
      if (t == null) {
        missing.add(s.riveInput);
      } else {
        _triggers[s.riveInput] = t;
      }
    }
    if (missing.isNotEmpty) {
      throw StateError('File .riv thiếu input: ${missing.join(', ')}');
    }
    _cap = vmi.boolean(kRiveCapInput);
    _cap?.value = widget.cap;
  }

  void _finish() {
    final p = _pending;
    if (p == null) return;
    p.timer.cancel();
    _pending = null;
    widget.onDone(p.state);
  }

  void _apply(MascotState s) {
    if (s.loop) {
      _mood?.value = s.moodValue!.toDouble();
      return;
    }
    // Giảm chuyển động: đứng yên, vẫn báo xong để màn hình không bị treo chờ
    if (widget.reduceMotion) {
      scheduleMicrotask(() {
        if (mounted) widget.onDone(s);
      });
      return;
    }
    _pending?.timer.cancel();
    _pending = (state: s, timer: Timer(s.duration + kDoneSlack, _finish));
    _triggers[s.riveInput]!.trigger();
  }

  @override
  void didUpdateWidget(RiveMascotView old) {
    super.didUpdateWidget(old);
    if (_controller == null) return;
    if (old.token != widget.token || old.target != widget.target) _apply(widget.target);
    if (old.reduceMotion != widget.reduceMotion) _syncActive();
    if (old.cap != widget.cap) _cap?.value = widget.cap;
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _tickerOn = TickerMode.of(context);
    _syncActive();
  }

  // active=false làm controller.advance trả về false nên ticker của Rive dừng hẳn
  void _syncActive() {
    final c = _controller;
    if (c == null) return;
    c.active = _tickerOn && !widget.reduceMotion;
  }

  @override
  void dispose() {
    _pending?.timer.cancel();
    final c = _controller;
    if (c != null) {
      c.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final c = _controller;
    return SizedBox(
      width: widget.size,
      height: widget.size * 1.2, // artboard 200x240
      child: c == null ? null : rive.RiveWidget(controller: c, fit: rive.Fit.contain),
    );
  }
}
