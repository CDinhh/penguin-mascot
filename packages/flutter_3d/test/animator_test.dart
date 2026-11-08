import 'package:flutter_test/flutter_test.dart';
import 'package:penguin_mascot/penguin_mascot.dart' show MascotState;
import 'package:penguin_mascot_3d/penguin_mascot_3d.dart';

class FakeClip implements MascotClip {
  @override
  bool playing = false;
  @override
  double weight = -1;
  int replays = 0;
  double time = 0;

  @override
  void replay() {
    replays++;
    time = 0;
    playing = true;
  }

  @override
  void play() => playing = true;
  @override
  void pause() => playing = false;
  @override
  void seek(double s) => time = s;

  // MascotClip.loop chỉ có setter; fake giữ giá trị để kiểm tra
  @override
  set loop(bool v) => _loop = v;
  bool _loop = false;
  bool get isLoop => _loop;
}

Map<MascotState, FakeClip> _clips() => {
  for (final s in MascotState.values) s: FakeClip(),
};

void main() {
  test('khởi tạo: loop theo spec, mọi clip dừng với trọng số 0', () {
    final c = _clips();
    MascotAnimator(c);
    for (final e in c.entries) {
      expect(e.value.isLoop, e.key.loop, reason: e.key.name);
      expect(e.value.weight, 0);
      expect(e.value.playing, false);
    }
  });

  test(
    'trạng thái lặp: chạy ngay trọng số 1, đổi sang trạng thái lặp khác thì trộn rồi dừng clip cũ',
    () {
      final c = _clips();
      final a = MascotAnimator(c, fadeSeconds: 0.2);
      a.play(MascotState.idle);
      expect(c[MascotState.idle]!.weight, 1);
      expect(c[MascotState.idle]!.playing, true);
      a.play(MascotState.dance);
      expect(c[MascotState.dance]!.weight, 0);
      a.tick(0.1);
      expect(c[MascotState.dance]!.weight, closeTo(0.5, 1e-9));
      expect(c[MascotState.idle]!.weight, closeTo(0.5, 1e-9));
      a.tick(0.2);
      expect(c[MascotState.dance]!.weight, 1);
      expect(c[MascotState.idle]!.weight, 0);
      expect(c[MascotState.idle]!.playing, false);
      expect(a.base, MascotState.dance);
    },
  );

  test(
    'clip một lần: chạy lại từ đầu, xong thì gọi onDone và trộn về trạng thái lặp gần nhất',
    () {
      final c = _clips();
      final a = MascotAnimator(c);
      a.play(MascotState.walk);
      var done = 0;
      a.play(MascotState.happy, onDone: () => done++);
      expect(c[MascotState.happy]!.replays, 1);
      a.tick(0.3);
      expect(done, 0);
      c[MascotState.happy]!.playing =
          false; // flutter_scene tự dừng ở khung cuối
      a.tick(0.016);
      expect(done, 1);
      expect(a.current, MascotState.walk);
      a.tick(0.3);
      expect(c[MascotState.walk]!.weight, 1);
      expect(c[MascotState.happy]!.weight, 0);
    },
  );

  test('phát lại cùng một trạng thái một lần: replay lại clip', () {
    final c = _clips();
    final a = MascotAnimator(c);
    a.play(MascotState.no);
    a.play(MascotState.no);
    expect(c[MascotState.no]!.replays, 2);
  });

  test('một lần bị thay thế giữa chừng: onDone cũ vẫn được gọi một lần', () {
    final c = _clips();
    final a = MascotAnimator(c);
    var first = 0, second = 0;
    a.play(MascotState.celebrate, onDone: () => first++);
    a.play(MascotState.sad, onDone: () => second++);
    expect(first, 1);
    c[MascotState.sad]!.playing = false;
    a.tick(0.5);
    expect(second, 1);
    expect(first, 1);
  });

  test(
    'giảm chuyển động: clip một lần xong ngay, clip lặp đứng ở khung đầu',
    () {
      final c = _clips();
      final a = MascotAnimator(c)..reducedMotion = true;
      var done = 0;
      a.play(MascotState.celebrate, onDone: () => done++);
      expect(done, 1);
      expect(c[MascotState.celebrate]!.replays, 0);
      a.play(MascotState.dance);
      expect(c[MascotState.dance]!.playing, false);
      expect(c[MascotState.dance]!.time, 0);
      expect(c[MascotState.dance]!.weight, 1);
    },
  );
}
