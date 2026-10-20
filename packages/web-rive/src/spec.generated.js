// GENERATED từ spec/mascot.json bởi tools/codegen.mjs. KHÔNG sửa tay; chạy `npm run codegen`.

/** Phần của spec mà runtime Rive cần. */
export const SPEC = {
  "name": "BipBip",
  "defaultVariant": "plush",
  "states": {
    "idle": {
      "loop": true,
      "durationMs": 2800,
      "riveInput": {
        "type": "number",
        "name": "mood",
        "value": 0
      }
    },
    "think": {
      "loop": true,
      "durationMs": 3000,
      "riveInput": {
        "type": "number",
        "name": "mood",
        "value": 1
      }
    },
    "sleep": {
      "loop": true,
      "durationMs": 3000,
      "riveInput": {
        "type": "number",
        "name": "mood",
        "value": 2
      }
    },
    "dance": {
      "loop": true,
      "durationMs": 1600,
      "riveInput": {
        "type": "number",
        "name": "mood",
        "value": 3
      }
    },
    "walk": {
      "loop": true,
      "durationMs": 1800,
      "riveInput": {
        "type": "number",
        "name": "mood",
        "value": 4
      }
    },
    "talk": {
      "loop": true,
      "durationMs": 640,
      "riveInput": {
        "type": "number",
        "name": "mood",
        "value": 5
      }
    },
    "wave": {
      "loop": false,
      "durationMs": 2000,
      "riveInput": {
        "type": "trigger",
        "name": "wave"
      }
    },
    "happy": {
      "loop": false,
      "durationMs": 1200,
      "riveInput": {
        "type": "trigger",
        "name": "happy"
      }
    },
    "celebrate": {
      "loop": false,
      "durationMs": 2600,
      "riveInput": {
        "type": "trigger",
        "name": "celebrate"
      }
    },
    "sad": {
      "loop": false,
      "durationMs": 2600,
      "riveInput": {
        "type": "trigger",
        "name": "sad"
      }
    },
    "surprised": {
      "loop": false,
      "durationMs": 1400,
      "riveInput": {
        "type": "trigger",
        "name": "surprised"
      }
    },
    "no": {
      "loop": false,
      "durationMs": 1200,
      "riveInput": {
        "type": "trigger",
        "name": "no"
      }
    },
    "yes": {
      "loop": false,
      "durationMs": 1200,
      "riveInput": {
        "type": "trigger",
        "name": "yes"
      }
    },
    "love": {
      "loop": false,
      "durationMs": 2400,
      "riveInput": {
        "type": "trigger",
        "name": "love"
      }
    },
    "streak": {
      "loop": false,
      "durationMs": 2400,
      "riveInput": {
        "type": "trigger",
        "name": "streak"
      }
    }
  },
  "rive": {
    "file": "rive/bipbip.riv",
    "artboards": {
      "plush": "BipBip Plush"
    },
    "stateMachine": "Main",
    "viewModel": "Mascot",
    "doneStates": [
      "idle",
      "think",
      "sleep_start",
      "dance_start",
      "walk_start",
      "talk"
    ],
    "capInput": {
      "type": "boolean",
      "name": "cap"
    },
    "extraInputs": [
      {
        "type": "number",
        "name": "lookX",
        "min": -1,
        "max": 1
      },
      {
        "type": "number",
        "name": "lookY",
        "min": -1,
        "max": 1
      }
    ]
  }
};
