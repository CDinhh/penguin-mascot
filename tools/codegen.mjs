// Sinh code từ spec/mascot.json, để mọi nền tảng dùng chung một danh sách trạng thái.
//
//   node tools/codegen.mjs          ghi file
//   node tools/codegen.mjs --check  chỉ so sánh, thoát mã 1 nếu file sinh ra không khớp spec (dùng trong CI)
//
// Không ai sửa tay các file sinh ra.
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const HEADER = 'GENERATED từ spec/mascot.json bởi tools/codegen.mjs. KHÔNG sửa tay; chạy `npm run codegen`.';

const pascal = (s) => s[0].toUpperCase() + s.slice(1);

function ts(spec) {
  const states = Object.entries(spec.states)
    .map(([name, s]) => `  ${name}: { loop: ${s.loop}, durationMs: ${s.durationMs}, riveInput: ${JSON.stringify(s.riveInput)} },`)
    .join('\n');
  return `// ${HEADER}

export const MASCOT_NAME = ${JSON.stringify(spec.name)};

export const MASCOT_VARIANTS = ${JSON.stringify(spec.variants)} as const;
export type MascotVariant = (typeof MASCOT_VARIANTS)[number];
export const DEFAULT_VARIANT: MascotVariant = ${JSON.stringify(spec.defaultVariant)};

export type RiveInput =
  | { type: 'number'; name: string; value: number }
  | { type: 'trigger'; name: string };

export interface MascotStateInfo {
  loop: boolean;
  durationMs: number;
  riveInput: RiveInput;
}

export const MASCOT_STATES = {
${states}
} as const satisfies Record<string, MascotStateInfo>;

export type MascotState = keyof typeof MASCOT_STATES;
export const MASCOT_STATE_NAMES = Object.keys(MASCOT_STATES) as MascotState[];

export const RIVE = ${JSON.stringify(spec.rive, null, 2)} as const;
`;
}

function dart(spec) {
  const entries = Object.entries(spec.states).map(([name, s]) => {
    const mood = s.riveInput.type === 'number' ? s.riveInput.value : 'null';
    return `  ${name}(loop: ${s.loop}, durationMs: ${s.durationMs}, riveInput: '${s.riveInput.name}', moodValue: ${mood})`;
  });
  const variants = spec.variants.map((v) => `  ${v}(artboard: '${spec.rive.artboards[v]}')`);
  return `// ${HEADER}

/// Trạng thái animation của ${spec.name}.
enum MascotState {
${entries.join(',\n')};

  const MascotState({
    required this.loop,
    required this.durationMs,
    required this.riveInput,
    required this.moodValue,
  });

  /// true: lặp đến khi đổi trạng thái; false: chạy một lần rồi về trạng thái lặp gần nhất.
  final bool loop;
  final int durationMs;

  /// Tên input trong state machine Rive: \`mood\` (số) cho trạng thái lặp, hoặc trigger cùng tên.
  final String riveInput;

  /// Giá trị của \`mood\` với trạng thái lặp; null với trigger.
  final int? moodValue;

  Duration get duration => Duration(milliseconds: durationMs);
  bool get isTrigger => moodValue == null;
}

/// Phiên bản hình.
enum MascotVariant {
${variants.join(',\n')};

  const MascotVariant({required this.artboard});
  final String artboard;
}

const String kRiveFile = '${spec.rive.file}';
const String kRiveStateMachine = '${spec.rive.stateMachine}';
const String kRiveDoneEvent = '${spec.rive.doneEvent}';
`;
}

/** Trả về { đường dẫn tương đối: nội dung } */
export function generate() {
  const spec = JSON.parse(readFileSync(join(root, 'spec', 'mascot.json'), 'utf8'));
  return {
    'packages/react/src/states.ts': ts(spec),
    'packages/flutter/lib/src/states.dart': dart(spec),
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const check = process.argv.includes('--check');
  let bad = 0;
  for (const [rel, content] of Object.entries(generate())) {
    const file = join(root, rel);
    if (check) {
      if (!existsSync(file) || readFileSync(file, 'utf8') !== content) { console.error(`Lệch spec: ${rel} (chạy npm run codegen)`); bad++; }
    } else {
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, content);
      console.log(`Đã ghi ${rel}`);
    }
  }
  process.exit(bad ? 1 : 0);
}
