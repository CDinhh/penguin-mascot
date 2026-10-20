import 'package:flutter/foundation.dart';

import 'states.dart';

/// Điều khiển [Mascot] bằng lời gọi thay vì đổi `state`: gọi [play] cùng một trạng thái một lần
/// (ví dụ trả lời sai hai lần liền) sẽ phát lại animation mà không cần đổi `Key`.
class MascotController extends ChangeNotifier {
  MascotController([MascotState initial = MascotState.idle]) : _state = initial;

  MascotState _state;
  int _plays = 0;

  /// Trạng thái hiện tại.
  MascotState get state => _state;

  /// Số lần [play] đã gọi; [Mascot] so sánh số này để biết có phải phát lại.
  int get plays => _plays;

  void play(MascotState state) {
    _state = state;
    _plays++;
    notifyListeners();
  }
}
