import 'package:flutter/material.dart';
import 'package:penguin_mascot/penguin_mascot.dart';

void main() {
  // Rive là chính. Muốn có sprite sheet dự phòng: npm run export:frames -- --out examples/flutter/assets/mascot
  // rồi bỏ comment dòng dưới (và khai thư mục trong pubspec.yaml).
  MascotConfig.riveAsset = 'assets/mascot/bipbip.riv';
  // MascotConfig.spriteAssetBase = 'assets/mascot';
  runApp(const ExampleApp());
}

class ExampleApp extends StatelessWidget {
  const ExampleApp({super.key});

  @override
  Widget build(BuildContext context) => MaterialApp(
        title: 'BipBip',
        theme: ThemeData(colorSchemeSeed: Colors.blueGrey, useMaterial3: true),
        home: const DemoPage(),
      );
}

class DemoPage extends StatefulWidget {
  const DemoPage({super.key});

  @override
  State<DemoPage> createState() => _DemoPageState();
}

class _DemoPageState extends State<DemoPage> {
  final _controller = MascotController();
  final _log = <String>[];
  String _mode = 'đang chạy';
  bool _reduce = false;
  bool _cap = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // Công tắc "giảm chuyển động" mô phỏng MediaQuery.disableAnimations của hệ điều hành
    final data = MediaQuery.of(context).copyWith(disableAnimations: _reduce || MediaQuery.disableAnimationsOf(context));
    return MediaQuery(
      data: data,
      child: Scaffold(
        appBar: AppBar(title: const Text('BipBip')),
        body: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Center(
              child: Mascot(
                controller: _controller,
                size: 220,
                cap: _cap,
                onDone: (s) => setState(() => _log.insert(0, 'xong: ${s.name}')),
                onFallback: (e) => setState(() => _mode = 'lùi về sprite sheet ($e)'),
              ),
            ),
            Text('Renderer: $_mode', textAlign: TextAlign.center),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              alignment: WrapAlignment.center,
              children: [
                for (final s in MascotState.values)
                  FilterChip(
                    label: Text(s.loop ? '${s.name} (lặp)' : s.name),
                    selected: _controller.state == s,
                    // gọi lại cùng một trạng thái một lần sẽ phát lại
                    onSelected: (_) => setState(() => _controller.play(s)),
                  ),
              ],
            ),
            SwitchListTile(
              title: const Text('Đội mũ tốt nghiệp'),
              value: _cap,
              onChanged: (v) => setState(() => _cap = v),
            ),
            SwitchListTile(
              title: const Text('Giảm chuyển động'),
              value: _reduce,
              onChanged: (v) => setState(() => _reduce = v),
            ),
            Text(_log.take(6).join(' | ')),
          ],
        ),
      ),
    );
  }
}
