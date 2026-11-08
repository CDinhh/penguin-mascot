import 'package:flutter_scene/scene.dart';
import 'package:vector_math/vector_math.dart' as vm;

/// Chạy SAU khi animation ghi xong tư thế trong khung hình (component trên node con được tick sau
/// animation player của node gốc), để:
/// - tắt node hiệu ứng `fx_*` khi scale gần 0 (khỏi tốn draw call),
/// - đặt mũ `fx_cap` bật/tắt (không clip nào chạm),
/// - xoay mắt `eye_l`/`eye_r` theo hướng nhìn (clip chỉ chạm vào scale của hai xương này, để chớp mắt).
class MascotFxComponent extends Component {
  MascotFxComponent(this.model);

  /// Node gốc của model sau khi nạp.
  final Node model;

  bool cap = false;
  double lookX = 0;
  double lookY = 0;

  static const double _hideBelow = 0.01;
  late final List<Node> _toggles = _collectToggles(model);
  late final Node? _capNode = model.getChildByName('fx_cap');
  late final List<Node> _eyes = [
    for (final n in const ['eye_l', 'eye_r'])
      if (model.getChildByName(n) != null) model.getChildByName(n)!,
  ];

  static List<Node> _collectToggles(Node root) {
    final out = <Node>[];
    void walk(Node n) {
      if (n.name.startsWith('fx_')) out.add(n);
      for (final c in n.children) {
        walk(c);
      }
    }

    walk(root);
    return out;
  }

  @override
  void update(double deltaSeconds) {
    final capNode = _capNode;
    if (capNode != null) {
      _setScale(capNode, cap ? 1.0 : 0.001);
    }
    for (final n in _toggles) {
      // scale đọc từ khung hình trước (node con của node này đã được animation ghi xong)
      n.visible = n.localTransform.getMaxScaleOnAxis() > _hideBelow;
    }
    for (final e in _eyes) {
      final t = vm.Vector3.zero();
      final r = vm.Quaternion.identity();
      final sc = vm.Vector3.zero();
      e.localTransform.decompose(
        t,
        r,
        sc,
      ); // giữ scale (chớp mắt) và vị trí, chỉ thay phần xoay
      // Xoay quanh Y = nhìn trái/phải, quanh X = nhìn lên/xuống (cùng hệ như renderer web)
      e.localTransform = vm.Matrix4.compose(
        t,
        vm.Quaternion.euler(lookX * 0.42, lookY * 0.3, 0),
        sc,
      );
    }
  }

  static void _setScale(Node n, double s) {
    final t = vm.Vector3.zero();
    final r = vm.Quaternion.identity();
    final sc = vm.Vector3.zero();
    n.localTransform.decompose(t, r, sc);
    n.localTransform = vm.Matrix4.compose(t, r, vm.Vector3.all(s));
  }
}
