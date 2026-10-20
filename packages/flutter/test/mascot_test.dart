import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:penguin_mascot/penguin_mascot.dart';
import 'package:penguin_mascot/src/sprite_sheets.dart';

const _fw = 8;
const _fh = 10;
const _cols = 2;

/// Asset bundle giả: manifest.json và các sprite sheet nhỏ (mỗi khung một màu) sinh bằng dart:ui.
///
/// Không dùng bộ nhớ đệm của CachingAssetBundle: Future nằm trong cache được tạo trong fake-async của test này
/// sẽ không bao giờ chạy tiếp ở test sau.
class _TestBundle extends AssetBundle {
  _TestBundle(this.assets);
  final Map<String, ByteData> assets;

  @override
  Future<String> loadString(String key, {bool cache = true}) async => utf8.decode((await load(key)).buffer.asUint8List());

  @override
  Future<T> loadStructuredData<T>(String key, Future<T> Function(String value) parser) async => parser(await loadString(key));

  @override
  Future<ByteData> load(String key) async {
    final d = assets[key];
    if (d == null) throw FlutterError('Unable to load asset: "$key".');
    return d;
  }
}

Future<Uint8List> _png(int frames) async {
  final rows = (frames / _cols).ceil();
  final rec = ui.PictureRecorder();
  final canvas = Canvas(rec);
  for (var i = 0; i < frames; i++) {
    canvas.drawRect(
      Rect.fromLTWH((i % _cols) * _fw.toDouble(), (i ~/ _cols) * _fh.toDouble(), _fw.toDouble(), _fh.toDouble()),
      Paint()..color = Color(0xFF000000 | (40 * (i + 1)) << 8),
    );
  }
  final img = await rec.endRecording().toImage(_cols * _fw, rows * _fh);
  final data = await img.toByteData(format: ui.ImageByteFormat.png);
  img.dispose();
  return data!.buffer.asUint8List();
}

late _TestBundle bundle;

Future<void> _makeBundle() async {
  // idle/think lặp; wave/happy/sad một lần. Các state khác không có trong manifest.
  const states = {
    'idle': (frames: 4, ms: 400, loop: true),
    'think': (frames: 4, ms: 400, loop: true),
    'wave': (frames: 3, ms: 300, loop: false),
    'happy': (frames: 3, ms: 300, loop: false),
  };
  final assets = <String, ByteData>{};
  final manifest = {
    'variant': 'plush',
    'frameWidth': _fw,
    'frameHeight': _fh,
    'fps': 10,
    'columns': _cols,
    'states': {
      for (final e in states.entries)
        e.key: {'file': '${e.key}.webp', 'frames': e.value.frames, 'durationMs': e.value.ms, 'loop': e.value.loop},
    },
  };
  assets['sprites/manifest.json'] = ByteData.sublistView(Uint8List.fromList(utf8.encode(jsonEncode(manifest))));
  for (final e in states.entries) {
    assets['sprites/${e.key}.webp'] = ByteData.sublistView(await _png(e.value.frames));
  }
  bundle = _TestBundle(assets);
}

/// Cho codec ảnh (chạy ngoài fake async) và các Future nạp asset hoàn tất, rồi dựng lại khung hình.
/// Có [until] thì dừng ngay khi điều kiện đúng (tối đa khoảng 1 giây), không thì chờ một nhịp ngắn.
Future<void> _settle(WidgetTester tester, [bool Function()? until]) async {
  for (var i = 0; i < 50; i++) {
    await tester.runAsync(() => Future<void>.delayed(const Duration(milliseconds: 20)));
    await tester.pump();
    if (until == null ? i >= 2 : until()) return;
  }
  if (until != null) fail('điều kiện chờ không bao giờ đúng');
}

int? _frame(WidgetTester tester) {
  final paints = find.descendant(of: find.byType(Mascot), matching: find.byType(CustomPaint)).evaluate();
  for (final e in paints) {
    final painter = (e.widget as CustomPaint).painter;
    if (painter != null) return (painter as dynamic).frame as int;
  }
  return null;
}

Widget _app(Widget child, {bool reduce = false}) => Directionality(
      textDirection: TextDirection.ltr,
      child: MediaQuery(data: MediaQueryData(disableAnimations: reduce), child: Center(child: child)),
    );

/// testWidgets + gỡ widget trước khi tearDown giải phóng sheet (không thì painter còn vẽ ảnh đã dispose).
void _test(String name, Future<void> Function(WidgetTester tester) body) {
  testWidgets(name, (tester) async {
    addTearDown(() async {
      await tester.pumpWidget(const SizedBox());
      await tester.pump(const Duration(milliseconds: 50));
    });
    await body(tester);
  });
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUpAll(_makeBundle);

  setUp(() {
    MascotConfig.bundle = bundle;
    MascotConfig.riveAsset = null;
    MascotConfig.spriteAssetBase = 'sprites';
    MascotSpriteSheets.reset();
  });

  tearDown(() async {
    MascotConfig.riveAsset = null;
    MascotConfig.spriteAssetBase = null;
    MascotSpriteSheets.reset();
    await MascotRiveFiles.clear();
  });

  group('spec', () {
    test('MascotState khớp spec/mascot.json', () {
      final spec = jsonDecode(File('../../spec/mascot.json').readAsStringSync()) as Map<String, dynamic>;
      final states = spec['states'] as Map<String, dynamic>;
      expect(MascotState.values.map((s) => s.name), states.keys);
      for (final s in MascotState.values) {
        final j = states[s.name] as Map<String, dynamic>;
        expect(s.loop, j['loop'], reason: s.name);
        expect(s.durationMs, j['durationMs'], reason: s.name);
        final input = j['riveInput'] as Map<String, dynamic>;
        expect(s.riveInput, input['name'], reason: s.name);
        expect(s.moodValue, input['type'] == 'number' ? input['value'] : isNull, reason: s.name);
      }
      expect(MascotVariant.values.map((v) => v.name), spec['variants']);
    });
  });

  group('sprite sheet (đường lùi)', () {
    _test('không cấu hình gì thì không vẽ gì và không lỗi', (tester) async {
      MascotConfig.spriteAssetBase = null;
      await tester.pumpWidget(_app(const Mascot()));
      await _settle(tester);
      expect(find.byType(Mascot), findsOneWidget);
      expect(_frame(tester), isNull);
    });

    _test('dáng lặp chạy qua các khung rồi lặp lại', (tester) async {
      await tester.pumpWidget(_app(const Mascot(size: 80)));
      await _settle(tester, () => _frame(tester) != null);
      expect(_frame(tester), 0);
      await tester.pump(const Duration(milliseconds: 150));
      expect(_frame(tester), 1);
      await tester.pump(const Duration(milliseconds: 100));
      expect(_frame(tester), 2);
      await tester.pump(const Duration(milliseconds: 200)); // qua chu kỳ 400ms, quay lại đầu
      expect(_frame(tester), lessThan(2));
      expect(MascotSpriteSheets.loadedSheets, 1);
    });

    _test('animation một lần: onDone đúng một lần rồi về idle và giải phóng sheet', (tester) async {
      final done = <MascotState>[];
      Widget build(MascotState s) => _app(Mascot(state: s, onDone: done.add));
      await tester.pumpWidget(build(MascotState.idle));
      await _settle(tester, () => MascotSpriteSheets.loadedSheets == 1 && _frame(tester) != null);
      await tester.pumpWidget(build(MascotState.wave));
      await _settle(tester, () => MascotSpriteSheets.loadedSheets == 2);
      expect(MascotSpriteSheets.loadedSheets, 2, reason: 'sheet đang chạy cộng idle');
      await tester.pump(const Duration(milliseconds: 350));
      await _settle(tester, () => done.isNotEmpty);
      expect(done, [MascotState.wave]);
      await _settle(tester, () => MascotSpriteSheets.loadedSheets == 1);
      expect(MascotSpriteSheets.loadedSheets, 1, reason: 'wave đã được giải phóng, chỉ còn idle');
      await tester.pump(const Duration(milliseconds: 100));
      expect(done.length, 1);
    });

    _test('đổi replayKey phát lại cùng một trạng thái', (tester) async {
      final done = <MascotState>[];
      Widget build(int key) => _app(Mascot(state: MascotState.happy, replayKey: key, onDone: done.add));
      await tester.pumpWidget(build(0));
      await _settle(tester, () => _frame(tester) != null);
      await tester.pump(const Duration(milliseconds: 350));
      await _settle(tester, () => done.length == 1);
      expect(done, [MascotState.happy]);
      await _settle(tester, () => _frame(tester) != null);
      await tester.pumpWidget(build(1));
      await _settle(tester);
      await tester.pump(const Duration(milliseconds: 350));
      await _settle(tester, () => done.length == 2);
      expect(done, [MascotState.happy, MascotState.happy]);
    });

    _test('controller.play gọi hai lần liền thì phát lại hai lần', (tester) async {
      final c = MascotController();
      final done = <MascotState>[];
      await tester.pumpWidget(_app(Mascot(controller: c, onDone: done.add)));
      await _settle(tester, () => _frame(tester) != null);
      for (var i = 0; i < 2; i++) {
        c.play(MascotState.wave);
        await _settle(tester);
        await tester.pump(const Duration(milliseconds: 350));
        await _settle(tester, () => done.length == i + 1);
        await _settle(tester, () => _frame(tester) != null);
      }
      expect(done, [MascotState.wave, MascotState.wave]);
      c.dispose();
    });

    _test('giảm chuyển động: đứng yên ở khung đầu, một lần vẫn báo xong', (tester) async {
      final done = <MascotState>[];
      await tester.pumpWidget(_app(Mascot(onDone: done.add), reduce: true));
      await _settle(tester, () => _frame(tester) != null);
      await tester.pump(const Duration(milliseconds: 300));
      expect(_frame(tester), 0);
      await tester.pumpWidget(_app(Mascot(state: MascotState.wave, onDone: done.add), reduce: true));
      await _settle(tester, () => done.isNotEmpty);
      expect(done, [MascotState.wave]);
      expect(_frame(tester), 0);
    });

    _test('trạng thái không có trong manifest: onFallback và không còn vẽ', (tester) async {
      final errors = <Object>[];
      await tester.pumpWidget(_app(Mascot(state: MascotState.dance, onFallback: errors.add)));
      await _settle(tester, () => errors.isNotEmpty);
      expect(errors, hasLength(1));
      expect(errors.single.toString(), contains('dance'));
    });

    _test('hủy widget thì giải phóng hết sheet', (tester) async {
      await tester.pumpWidget(_app(const Mascot()));
      await _settle(tester, () => MascotSpriteSheets.loadedSheets == 1);
      await tester.pumpWidget(_app(const SizedBox()));
      await _settle(tester);
      expect(MascotSpriteSheets.loadedSheets, 0);
    });

    _test('hai mascot dùng chung một sheet', (tester) async {
      await tester.pumpWidget(_app(const Column(children: [Mascot(size: 40), Mascot(size: 40)])));
      await _settle(tester, () => _frame(tester) != null);
      expect(MascotSpriteSheets.loadedSheets, 1);
    });
  });

  group('Rive', () {
    _test('không có file .riv: lùi về sprite sheet và báo onFallback', (tester) async {
      MascotConfig.riveAsset = 'assets/mascot/missing.riv';
      final errors = <Object>[];
      await tester.pumpWidget(_app(Mascot(onFallback: errors.add)));
      await _settle(tester, () => errors.isNotEmpty && _frame(tester) != null);
      expect(errors, hasLength(1));
      expect(_frame(tester), isNotNull, reason: 'đang vẽ bằng sprite sheet');
    });

    _test('không có file .riv và không có sprite: báo lỗi, không crash', (tester) async {
      MascotConfig.riveAsset = 'assets/mascot/missing.riv';
      MascotConfig.spriteAssetBase = null;
      final errors = <Object>[];
      await tester.pumpWidget(_app(Mascot(onFallback: errors.add)));
      await _settle(tester, () => errors.isNotEmpty);
      expect(errors, hasLength(1));
      final reported = tester.takeException();
      expect(reported, isNotNull);
    });
  });
}
