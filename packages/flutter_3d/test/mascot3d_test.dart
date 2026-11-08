import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:penguin_mascot/penguin_mascot.dart' show MascotState;
import 'package:penguin_mascot_3d/penguin_mascot_3d.dart';

void main() {
  testWidgets(
    'không có Flutter GPU (môi trường test): gọi onFallback và vẽ fallbackBuilder',
    (tester) async {
      Object? err;
      await tester.pumpWidget(
        Directionality(
          textDirection: TextDirection.ltr,
          child: Mascot3D(
            state: MascotState.happy,
            size: 120,
            onFallback: (e) => err = e,
            fallbackBuilder: (_) => const Text('2d'),
          ),
        ),
      );
      await tester.pump(const Duration(milliseconds: 100));
      await tester.runAsync(
        () => Future<void>.delayed(const Duration(milliseconds: 300)),
      );
      await tester.pump();
      expect(err, isNotNull);
      expect(find.text('2d'), findsOneWidget);
    },
  );

  test('LOD theo pixel thật', () {
    expect(Mascot3DConfig.lodForPixels(400), 0);
    expect(Mascot3DConfig.lodForPixels(200), 1);
    expect(Mascot3DConfig.lodForPixels(64), 2);
  });

  test('asset mặc định có đúng 3 LOD', () {
    expect(Mascot3DConfig.modelAssets.length, 3);
  });
}
