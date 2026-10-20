// GENERATED từ spec/mascot.json bởi tools/codegen.mjs. KHÔNG sửa tay; chạy `npm run codegen`.

/// Trạng thái animation của BipBip.
enum MascotState {
  idle(loop: true, durationMs: 2800, riveInput: 'mood', moodValue: 0),
  think(loop: true, durationMs: 3000, riveInput: 'mood', moodValue: 1),
  sleep(loop: true, durationMs: 3000, riveInput: 'mood', moodValue: 2),
  dance(loop: true, durationMs: 1600, riveInput: 'mood', moodValue: 3),
  walk(loop: true, durationMs: 1800, riveInput: 'mood', moodValue: 4),
  talk(loop: true, durationMs: 640, riveInput: 'mood', moodValue: 5),
  wave(loop: false, durationMs: 2000, riveInput: 'wave', moodValue: null),
  happy(loop: false, durationMs: 1200, riveInput: 'happy', moodValue: null),
  celebrate(loop: false, durationMs: 2600, riveInput: 'celebrate', moodValue: null),
  sad(loop: false, durationMs: 2600, riveInput: 'sad', moodValue: null),
  surprised(loop: false, durationMs: 1400, riveInput: 'surprised', moodValue: null),
  no(loop: false, durationMs: 1200, riveInput: 'no', moodValue: null),
  yes(loop: false, durationMs: 1200, riveInput: 'yes', moodValue: null),
  love(loop: false, durationMs: 2400, riveInput: 'love', moodValue: null),
  streak(loop: false, durationMs: 2400, riveInput: 'streak', moodValue: null);

  const MascotState({
    required this.loop,
    required this.durationMs,
    required this.riveInput,
    required this.moodValue,
  });

  /// true: lặp đến khi đổi trạng thái; false: chạy một lần rồi về trạng thái lặp gần nhất.
  final bool loop;
  final int durationMs;

  /// Tên input trong state machine Rive: `mood` (số) cho trạng thái lặp, hoặc trigger cùng tên.
  final String riveInput;

  /// Giá trị của `mood` với trạng thái lặp; null với trigger.
  final int? moodValue;

  Duration get duration => Duration(milliseconds: durationMs);
  bool get isTrigger => moodValue == null;
}

/// Phiên bản hình.
enum MascotVariant {
  plush(artboard: 'BipBip Plush');

  const MascotVariant({required this.artboard});
  final String artboard;
}

const String kRiveFile = 'rive/bipbip.riv';
const String kRiveStateMachine = 'Main';
const String kRiveViewModel = 'Mascot';
const List<String> kRiveDoneStates = ['idle', 'think', 'sleep_start', 'dance_start', 'walk_start', 'talk'];
const String kRiveCapInput = 'cap';
