/*!
 * Penguin Mascot — linh vật chim cánh cụt cho app học tập
 * Web Component: <penguin-mascot state="idle" size="240"></penguin-mascot>
 * Không phụ thuộc thư viện nào. Chạy trên mọi trình duyệt hiện đại.
 */
(function () {
  'use strict';

  // Trạng thái lặp vô hạn (giữ nguyên cho đến khi đổi) và trạng thái chạy một lần (xong tự về idle)
  var LOOPING = ['idle', 'think', 'sleep', 'dance', 'walk', 'talk'];
  var ONE_SHOT = {
    wave: 2000,
    happy: 1200,
    celebrate: 2600,
    sad: 2600,
    surprised: 1400,
    no: 1200,
    yes: 1200,
    love: 2400,
    streak: 2400
  };
  var STATES = LOOPING.concat(Object.keys(ONE_SHOT));

  var COLORS = {
    body: '#2B3A67',
    wing: '#1F2B52',
    belly: '#FFFFFF',
    ink: '#1B2440',
    beak: '#FFA41B',
    beakDark: '#F08A00',
    cheek: '#FF8FA3'
  };

  var heart = 'M0 6 C -14 -4 -8 -16 0 -8 C 8 -16 14 -4 0 6 Z';
  var star = 'M0 -9 L2.6 -2.6 L9 0 L2.6 2.6 L0 9 L-2.6 2.6 L-9 0 L-2.6 -2.6 Z';

  function confetti() {
    var colors = ['#58CC02', '#1CB0F6', '#FF4B4B', '#FFC800', '#CE82FF', '#FF9600'];
    var out = '';
    for (var i = 0; i < 14; i++) {
      var x = 14 + i * 13;
      var y = -6 - (i % 3) * 10;
      var rot = (i * 47) % 180;
      out += '<rect class="pg-confetti" x="' + x + '" y="' + y + '" width="7" height="11" rx="2" fill="' +
        colors[i % colors.length] + '" style="--d:' + ((i % 5) * 0.12).toFixed(2) + 's;--r:' + rot +
        'deg;--x:' + (((i % 4) - 1.5) * 10) + 'px"/>';
    }
    return out;
  }

  var SVG =
    '<svg class="pg" viewBox="0 0 200 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Chim cánh cụt">' +
    // Ngọn lửa streak (phía sau)
    '<g transform="translate(100 228) scale(1.45 1.35) translate(-100 -228)"><g class="pg-flame">' +
      '<path d="M100 18 C 128 58 176 80 170 150 C 166 200 132 228 100 228 C 68 228 34 200 30 150 C 26 104 58 92 70 52 C 80 80 90 66 100 18 Z" fill="#FF9600"/>' +
      '<path d="M100 70 C 118 100 150 116 146 160 C 143 196 124 216 100 216 C 76 216 57 196 54 160 C 52 128 74 120 80 96 C 88 112 94 100 100 70 Z" fill="#FFC800"/>' +
    '</g></g>' +
    '<ellipse class="pg-shadow" cx="100" cy="227" rx="52" ry="7" fill="rgba(0,0,0,.14)"/>' +
    '<g class="pg-root">' +
      '<ellipse class="pg-foot-l" cx="80" cy="221" rx="17" ry="8" fill="' + COLORS.beak + '"/>' +
      '<ellipse class="pg-foot-r" cx="120" cy="221" rx="17" ry="8" fill="' + COLORS.beak + '"/>' +
      '<g class="pg-bodyg">' +
        '<path class="pg-body" d="M100 40 C 150 40 172 90 172 140 C 172 195 140 222 100 222 C 60 222 28 195 28 140 C 28 90 50 40 100 40 Z" fill="' + COLORS.body + '"/>' +
        '<path class="pg-tuft" d="M93 44 C 90 30 104 22 112 29 C 105 31 102 37 105 44 Z" fill="' + COLORS.body + '"/>' +
        '<path class="pg-belly" d="M100 66 C 112 54 148 52 150 86 C 152 104 144 112 146 128 C 156 150 154 196 132 210 C 120 218 80 218 68 210 C 46 196 44 150 54 128 C 56 112 48 104 50 86 C 52 52 88 54 100 66 Z" fill="' + COLORS.belly + '"/>' +
        // Mũ tốt nghiệp (tuỳ chọn: accessory="cap")
        '<g class="pg-cap">' +
          '<path d="M76 44 L76 56 Q100 68 124 56 L124 44 Z" fill="' + COLORS.ink + '"/>' +
          '<path d="M56 42 L100 24 L144 42 L100 60 Z" fill="#26325A"/>' +
          '<path d="M100 42 L136 47 L137 64" fill="none" stroke="#FFC800" stroke-width="3" stroke-linecap="round"/>' +
          '<circle cx="137" cy="66" r="4" fill="#FFC800"/>' +
          '<circle cx="100" cy="42" r="3.5" fill="#FFC800"/>' +
        '</g>' +
        '<g class="pg-face">' +
          '<g class="pg-brows">' +
            '<path class="pg-brow-l" d="M68 70 L90 67" stroke="' + COLORS.ink + '" stroke-width="5" stroke-linecap="round"/>' +
            '<path class="pg-brow-r" d="M110 67 L132 70" stroke="' + COLORS.ink + '" stroke-width="5" stroke-linecap="round"/>' +
          '</g>' +
          '<g class="pg-eye pg-eye-l"><g class="pg-pupil">' +
            '<circle cx="80" cy="92" r="13" fill="' + COLORS.ink + '"/>' +
            '<circle cx="85" cy="87" r="4.5" fill="#fff"/><circle cx="76" cy="97" r="2" fill="#fff"/>' +
          '</g></g>' +
          '<g class="pg-eye pg-eye-r"><g class="pg-pupil">' +
            '<circle cx="120" cy="92" r="13" fill="' + COLORS.ink + '"/>' +
            '<circle cx="125" cy="87" r="4.5" fill="#fff"/><circle cx="116" cy="97" r="2" fill="#fff"/>' +
          '</g></g>' +
          '<g class="pg-eyes-happy" fill="none" stroke="' + COLORS.ink + '" stroke-width="6" stroke-linecap="round">' +
            '<path d="M68 96 Q80 80 92 96"/><path d="M108 96 Q120 80 132 96"/>' +
          '</g>' +
          '<g class="pg-eyes-closed" fill="none" stroke="' + COLORS.ink + '" stroke-width="5" stroke-linecap="round">' +
            '<path d="M68 90 Q80 101 92 90"/><path d="M108 90 Q120 101 132 90"/>' +
          '</g>' +
          '<g class="pg-eyes-heart" fill="#FF4B6E">' +
            '<g transform="translate(80 94) scale(1.5)"><path class="pg-heart-eye" d="' + heart + '"/></g>' +
            '<g transform="translate(120 94) scale(1.5)"><path class="pg-heart-eye" d="' + heart + '"/></g>' +
          '</g>' +
          '<ellipse class="pg-cheek pg-cheek-l" cx="63" cy="112" rx="9" ry="5.5" fill="' + COLORS.cheek + '"/>' +
          '<ellipse class="pg-cheek pg-cheek-r" cx="137" cy="112" rx="9" ry="5.5" fill="' + COLORS.cheek + '"/>' +
          '<ellipse class="pg-mouth" cx="100" cy="114" rx="7" ry="6" fill="#8B1E3F"/>' +
          '<path class="pg-beak-bot" d="M90 110 Q100 114 110 110 Q104 123 100 123 Q96 123 90 110 Z" fill="' + COLORS.beakDark + '"/>' +
          '<path class="pg-beak-top" d="M85 106 Q100 97 115 106 Q100 117 85 106 Z" fill="' + COLORS.beak + '"/>' +
        '</g>' +
        '<path class="pg-wing-l" d="M42 118 C 24 132 16 162 22 184 C 34 178 46 156 48 132 Z" fill="' + COLORS.wing + '"/>' +
        '<path class="pg-wing-r" d="M158 118 C 176 132 184 162 178 184 C 166 178 154 156 152 132 Z" fill="' + COLORS.wing + '"/>' +
      '</g>' +
    '</g>' +
    // Hiệu ứng
    '<g class="pg-fx">' +
      '<path class="pg-tear" d="M68 104 C 64 112 62 116 68 119 C 74 116 72 112 68 104 Z" fill="#5BC0F8"/>' +
      '<path class="pg-sweat" d="M156 52 C 150 62 148 68 156 71 C 164 68 162 62 156 52 Z" fill="#8FD3FF"/>' +
      '<g class="pg-zzz" fill="#7C8CC4" font-family="Arial Rounded MT Bold, Arial, sans-serif" font-weight="900">' +
        '<text class="pg-z" x="134" y="60" font-size="16" style="--d:0s">Z</text>' +
        '<text class="pg-z" x="134" y="60" font-size="20" style="--d:1s">Z</text>' +
        '<text class="pg-z" x="134" y="60" font-size="24" style="--d:2s">Z</text>' +
      '</g>' +
      '<g class="pg-question">' +
        '<circle cx="164" cy="34" r="17" fill="#fff" stroke="#CFD6EA" stroke-width="3"/>' +
        '<circle cx="146" cy="56" r="4" fill="#fff" stroke="#CFD6EA" stroke-width="2"/>' +
        '<text x="164" y="42" text-anchor="middle" font-size="22" font-weight="900" font-family="Arial, sans-serif" fill="#1CB0F6">?</text>' +
      '</g>' +
      '<g class="pg-exclaim">' +
        '<text x="168" y="46" text-anchor="middle" font-size="34" font-weight="900" font-family="Arial, sans-serif" fill="#FF4B4B">!</text>' +
      '</g>' +
      '<g class="pg-hearts" fill="#FF4B6E">' +
        '<g transform="translate(40 70) scale(1.2)"><path class="pg-heart" d="' + heart + '" style="--d:0s"/></g>' +
        '<g transform="translate(162 60) scale(1.5)"><path class="pg-heart" d="' + heart + '" style="--d:.4s"/></g>' +
        '<g transform="translate(150 110) scale(1)"><path class="pg-heart" d="' + heart + '" style="--d:.8s"/></g>' +
        '<g transform="translate(50 120) scale(1.3)"><path class="pg-heart" d="' + heart + '" style="--d:1.1s"/></g>' +
      '</g>' +
      '<g class="pg-sparkles" fill="#FFC800">' +
        '<g transform="translate(30 60)"><path class="pg-sparkle" d="' + star + '" style="--d:0s"/></g>' +
        '<g transform="translate(172 70) scale(1.3)"><path class="pg-sparkle" d="' + star + '" style="--d:.15s"/></g>' +
        '<g transform="translate(160 150) scale(.8)"><path class="pg-sparkle" d="' + star + '" style="--d:.3s"/></g>' +
        '<g transform="translate(36 160)"><path class="pg-sparkle" d="' + star + '" style="--d:.45s"/></g>' +
      '</g>' +
      '<g class="pg-confettis">' + confetti() + '</g>' +
    '</g>' +
    '</svg>';

  var CSS = [
    ':host{display:inline-block;width:var(--pg-size,200px);line-height:0;-webkit-tap-highlight-color:transparent}',
    '.pg{width:100%;height:auto;overflow:visible}',
    '.pg *{transform-box:view-box}',

    /* Tâm xoay của từng bộ phận (đơn vị viewBox) */
    '.pg-root{transform-origin:100px 226px}',
    '.pg-bodyg{transform-origin:100px 222px}',
    '.pg-shadow,.pg-flame{transform-origin:100px 227px}',
    '.pg-eye-l{transform-origin:80px 92px}.pg-eye-r{transform-origin:120px 92px}',
    '.pg-eye-l .pg-pupil{transform-origin:80px 92px}.pg-eye-r .pg-pupil{transform-origin:120px 92px}',
    '.pg-wing-l{transform-origin:44px 122px}.pg-wing-r{transform-origin:156px 122px}',
    '.pg-foot-l{transform-origin:80px 222px}.pg-foot-r{transform-origin:120px 222px}',
    '.pg-beak-bot,.pg-mouth{transform-origin:100px 110px}',
    '.pg-cheek-l{transform-origin:63px 112px}.pg-cheek-r{transform-origin:137px 112px}',
    '.pg-brow-l{transform-origin:79px 68px}.pg-brow-r{transform-origin:121px 68px}',
    '.pg-face{transform-origin:100px 95px}',
    '.pg-question{transform-origin:150px 56px}.pg-exclaim{transform-origin:168px 46px}',
    '.pg-cheek{opacity:.55}',

    /* Mặc định ẩn các biểu cảm phụ và hiệu ứng */
    '.pg-eyes-happy,.pg-eyes-closed,.pg-eyes-heart,.pg-brows,.pg-cap,.pg-fx>*{opacity:0}',
    '.pg-flame{transform:scale(0)}',
    '.pg-mouth{transform:scaleY(0)}',
    ':host([accessory~="cap"]) .pg-cap{opacity:1}',
    '.pg-eye{animation:pg-blink 4.2s infinite}',
    '.pg-confetti{transform-box:fill-box;transform-origin:center}',
    '.pg-heart,.pg-sparkle,.pg-heart-eye{transform-origin:0 0}',

    /* ---------- IDLE ---------- */
    '.pg[data-state="idle"] .pg-bodyg{animation:pg-breathe 2.8s ease-in-out infinite}',
    '.pg[data-state="idle"] .pg-wing-l{animation:pg-sway-l 2.8s ease-in-out infinite}',
    '.pg[data-state="idle"] .pg-wing-r{animation:pg-sway-r 2.8s ease-in-out infinite}',

    /* ---------- WAVE: vẫy tay chào ---------- */
    '.pg[data-state="wave"] .pg-wing-r{animation:pg-wave 2s ease-in-out both}',
    '.pg[data-state="wave"] .pg-bodyg{animation:pg-lean 2s ease-in-out both}',
    '.pg[data-state="wave"] .pg-mouth{animation:pg-mouth-open 2s ease-in-out both}',
    '.pg[data-state="wave"] .pg-beak-bot{animation:pg-beak-open 2s ease-in-out both}',

    /* ---------- HAPPY: trả lời đúng ---------- */
    '.pg[data-state="happy"] .pg-root{animation:pg-jump .6s ease-out 2 both}',
    '.pg[data-state="happy"] .pg-shadow{animation:pg-shadow-jump .6s ease-out 2 both}',
    '.pg[data-state="happy"] .pg-wing-l{animation:pg-flap-l .3s ease-in-out 4 alternate both}',
    '.pg[data-state="happy"] .pg-wing-r{animation:pg-flap-r .3s ease-in-out 4 alternate both}',
    '.pg[data-state="happy"] .pg-eye{opacity:0}',
    '.pg[data-state="happy"] .pg-eyes-happy{opacity:1}',
    '.pg[data-state="happy"] .pg-mouth{transform:scaleY(1)}',
    '.pg[data-state="happy"] .pg-beak-bot{transform:translateY(5px)}',
    '.pg[data-state="happy"] .pg-sparkles,.pg[data-state="celebrate"] .pg-sparkles,.pg[data-state="celebrate"] .pg-confettis,.pg[data-state="love"] .pg-hearts{opacity:1}',
    '.pg[data-state="happy"] .pg-sparkle{animation:pg-twinkle 1.2s ease-out var(--d) both}',

    /* ---------- CELEBRATE: hoàn thành bài học ---------- */
    '.pg[data-state="celebrate"] .pg-root{animation:pg-jump .65s ease-out 4 both}',
    '.pg[data-state="celebrate"] .pg-shadow{animation:pg-shadow-jump .65s ease-out 4 both}',
    '.pg[data-state="celebrate"] .pg-wing-l{animation:pg-cheer-l .3s ease-in-out infinite alternate}',
    '.pg[data-state="celebrate"] .pg-wing-r{animation:pg-cheer-r .3s ease-in-out infinite alternate}',
    '.pg[data-state="celebrate"] .pg-eye{opacity:0}',
    '.pg[data-state="celebrate"] .pg-eyes-happy{opacity:1}',
    '.pg[data-state="celebrate"] .pg-mouth{transform:scaleY(1.1)}',
    '.pg[data-state="celebrate"] .pg-beak-bot{transform:translateY(6px)}',
    '.pg[data-state="celebrate"] .pg-cheek{opacity:.9}',
    '.pg[data-state="celebrate"] .pg-confetti{animation:pg-confetti 2.2s cubic-bezier(.3,.6,.5,1) var(--d) both}',
    '.pg[data-state="celebrate"] .pg-sparkle{animation:pg-twinkle 1.1s ease-out calc(var(--d) + .3s) 2 both}',

    /* ---------- SAD: trả lời sai ---------- */
    '.pg[data-state="sad"] .pg-bodyg{animation:pg-slump 2.6s ease-in-out both}',
    '.pg[data-state="sad"] .pg-wing-l{animation:pg-droop-l 2.6s ease-in-out both}',
    '.pg[data-state="sad"] .pg-wing-r{animation:pg-droop-r 2.6s ease-in-out both}',
    '.pg[data-state="sad"] .pg-pupil{transform:translateY(4px) scale(.92)}',
    '.pg[data-state="sad"] .pg-brows{opacity:1}',
    '.pg[data-state="sad"] .pg-brow-l{transform:translateY(2px) rotate(-16deg)}',
    '.pg[data-state="sad"] .pg-brow-r{transform:translateY(2px) rotate(16deg)}',
    '.pg[data-state="sad"] .pg-tear{animation:pg-tear 1.3s ease-in .3s 2 both}',

    /* ---------- THINK: đang suy nghĩ ---------- */
    '.pg[data-state="think"] .pg-bodyg{animation:pg-ponder 3s ease-in-out infinite}',
    '.pg[data-state="think"] .pg-pupil{transform:translate(4px,-5px)}',
    '.pg[data-state="think"] .pg-brows{opacity:1}',
    '.pg[data-state="think"] .pg-brow-r{transform:translateY(-5px) rotate(-8deg)}',
    '.pg[data-state="think"] .pg-wing-r{transform:rotate(-28deg)}',
    '.pg[data-state="think"] .pg-question{animation:pg-bob 1.6s ease-in-out infinite;opacity:1}',

    /* ---------- SLEEP: ngủ / chờ lâu ---------- */
    '.pg[data-state="sleep"] .pg-bodyg{animation:pg-snore 3s ease-in-out infinite}',
    '.pg[data-state="sleep"] .pg-eye{opacity:0}',
    '.pg[data-state="sleep"] .pg-eyes-closed{opacity:1}',
    '.pg[data-state="sleep"] .pg-cheek{opacity:.85}',
    '.pg[data-state="sleep"] .pg-zzz{opacity:1}',
    '.pg[data-state="sleep"] .pg-z{opacity:0;animation:pg-z 3s ease-out var(--d) infinite}',

    /* ---------- DANCE ---------- */
    '.pg[data-state="dance"] .pg-root{animation:pg-dance .8s ease-in-out infinite}',
    '.pg[data-state="dance"] .pg-wing-l{animation:pg-flap-l .4s ease-in-out infinite alternate}',
    '.pg[data-state="dance"] .pg-wing-r{animation:pg-flap-r .4s ease-in-out .2s infinite alternate}',
    '.pg[data-state="dance"] .pg-foot-l{animation:pg-step .8s ease-in-out infinite}',
    '.pg[data-state="dance"] .pg-foot-r{animation:pg-step .8s ease-in-out .4s infinite}',
    '.pg[data-state="dance"] .pg-eye{opacity:0}',
    '.pg[data-state="dance"] .pg-eyes-happy{opacity:1}',
    '.pg[data-state="dance"] .pg-mouth{transform:scaleY(1)}',
    '.pg[data-state="dance"] .pg-beak-bot{transform:translateY(5px)}',

    /* ---------- SURPRISED: ngạc nhiên ---------- */
    '.pg[data-state="surprised"] .pg-root{animation:pg-startle 1.4s ease-out both}',
    '.pg[data-state="surprised"] .pg-pupil{animation:pg-pupil-pop 1.4s ease-out both}',
    '.pg[data-state="surprised"] .pg-brows{opacity:1}',
    '.pg[data-state="surprised"] .pg-brow-l,.pg[data-state="surprised"] .pg-brow-r{transform:translateY(-8px)}',
    '.pg[data-state="surprised"] .pg-mouth{transform:scaleY(1.2)}',
    '.pg[data-state="surprised"] .pg-beak-bot{transform:translateY(7px)}',
    '.pg[data-state="surprised"] .pg-wing-l{animation:pg-spread-l 1.4s ease-out both}',
    '.pg[data-state="surprised"] .pg-wing-r{animation:pg-spread-r 1.4s ease-out both}',
    '.pg[data-state="surprised"] .pg-exclaim{animation:pg-pop 1.4s ease-out both}',
    '.pg[data-state="surprised"] .pg-sweat{animation:pg-sweat 1.4s ease-in .2s both}',

    /* ---------- NO: lắc đầu ---------- */
    '.pg[data-state="no"] .pg-face{animation:pg-no 1.2s ease-in-out both}',
    '.pg[data-state="no"] .pg-bodyg{animation:pg-no-body 1.2s ease-in-out both}',
    '.pg[data-state="no"] .pg-brows{opacity:1}',
    '.pg[data-state="no"] .pg-brow-l{transform:rotate(10deg)}',
    '.pg[data-state="no"] .pg-brow-r{transform:rotate(-10deg)}',

    /* ---------- YES: gật đầu ---------- */
    '.pg[data-state="yes"] .pg-face{animation:pg-yes 1.2s ease-in-out both}',
    '.pg[data-state="yes"] .pg-bodyg{animation:pg-yes-body 1.2s ease-in-out both}',
    '.pg[data-state="yes"] .pg-cheek{opacity:.85}',

    /* ---------- WALK: đi lạch bạch ---------- */
    '.pg[data-state="walk"] .pg-root{animation:pg-waddle .9s ease-in-out infinite}',
    '.pg[data-state="walk"] .pg-foot-l{animation:pg-step .9s ease-in-out infinite}',
    '.pg[data-state="walk"] .pg-foot-r{animation:pg-step .9s ease-in-out .45s infinite}',
    '.pg[data-state="walk"] .pg-wing-l{animation:pg-flap-l .45s ease-in-out infinite alternate}',
    '.pg[data-state="walk"] .pg-wing-r{animation:pg-flap-r .45s ease-in-out .45s infinite alternate}',

    /* ---------- LOVE ---------- */
    '.pg[data-state="love"] .pg-bodyg{animation:pg-sway 1.2s ease-in-out 2 both}',
    '.pg[data-state="love"] .pg-eye{opacity:0}',
    '.pg[data-state="love"] .pg-eyes-heart{opacity:1}',
    '.pg[data-state="love"] .pg-heart-eye{animation:pg-heartbeat .6s ease-in-out infinite}',
    '.pg[data-state="love"] .pg-cheek{animation:pg-blush 1.2s ease-in-out 2 both}',
    '.pg[data-state="love"] .pg-heart{animation:pg-float 1.6s ease-out var(--d) both}',
    '.pg[data-state="love"] .pg-wing-l{transform:rotate(-14deg)}',
    '.pg[data-state="love"] .pg-wing-r{transform:rotate(14deg)}',

    /* ---------- STREAK: chuỗi ngày học ---------- */
    '.pg[data-state="streak"] .pg-flame{animation:pg-flame 2.4s ease-out both}',
    '.pg[data-state="streak"] .pg-root{animation:pg-jump .6s ease-out .3s 2 both}',
    '.pg[data-state="streak"] .pg-wing-l{animation:pg-cheer-l .3s ease-in-out infinite alternate}',
    '.pg[data-state="streak"] .pg-wing-r{animation:pg-cheer-r .3s ease-in-out infinite alternate}',
    '.pg[data-state="streak"] .pg-eye{opacity:0}',
    '.pg[data-state="streak"] .pg-eyes-happy{opacity:1}',
    '.pg[data-state="streak"] .pg-mouth{transform:scaleY(1)}',
    '.pg[data-state="streak"] .pg-beak-bot{transform:translateY(5px)}',

    /* ---------- TALK: đang nói ---------- */
    '.pg[data-state="talk"] .pg-beak-bot{animation:pg-talk .32s ease-in-out infinite alternate}',
    '.pg[data-state="talk"] .pg-mouth{animation:pg-talk-mouth .32s ease-in-out infinite alternate}',
    '.pg[data-state="talk"] .pg-bodyg{animation:pg-breathe 1.3s ease-in-out infinite}',
    '.pg[data-state="talk"] .pg-wing-r{animation:pg-gesture 1.3s ease-in-out infinite}',

    /* ---------- Keyframes ---------- */
    '@keyframes pg-blink{0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(.08)}}',
    '@keyframes pg-breathe{0%,100%{transform:scale(1,1)}50%{transform:scale(.99,1.025)}}',
    '@keyframes pg-sway-l{0%,100%{transform:rotate(0)}50%{transform:rotate(5deg)}}',
    '@keyframes pg-sway-r{0%,100%{transform:rotate(0)}50%{transform:rotate(-5deg)}}',
    '@keyframes pg-wave{0%{transform:rotate(0)}15%{transform:rotate(-145deg)}28%{transform:rotate(-112deg)}41%{transform:rotate(-150deg)}54%{transform:rotate(-112deg)}67%{transform:rotate(-150deg)}82%{transform:rotate(-120deg)}100%{transform:rotate(0)}}',
    '@keyframes pg-lean{0%,100%{transform:rotate(0)}15%,82%{transform:rotate(-5deg)}}',
    '@keyframes pg-mouth-open{0%,100%{transform:scaleY(0)}15%,80%{transform:scaleY(1)}}',
    '@keyframes pg-beak-open{0%,100%{transform:translateY(0)}15%,80%{transform:translateY(5px)}}',
    '@keyframes pg-jump{0%{transform:translateY(0) scale(1,1)}15%{transform:translateY(0) scale(1.1,.88)}45%{transform:translateY(-36px) scale(.94,1.07)}70%{transform:translateY(0) scale(1.08,.92)}85%{transform:translateY(0) scale(.98,1.02)}100%{transform:translateY(0) scale(1,1)}}',
    '@keyframes pg-shadow-jump{0%,15%,70%,100%{transform:scale(1);opacity:1}45%{transform:scale(.6);opacity:.5}}',
    '@keyframes pg-flap-l{from{transform:rotate(0)}to{transform:rotate(55deg)}}',
    '@keyframes pg-flap-r{from{transform:rotate(0)}to{transform:rotate(-55deg)}}',
    '@keyframes pg-cheer-l{from{transform:rotate(115deg)}to{transform:rotate(150deg)}}',
    '@keyframes pg-cheer-r{from{transform:rotate(-115deg)}to{transform:rotate(-150deg)}}',
    '@keyframes pg-twinkle{0%{opacity:0;transform:scale(0) rotate(0)}40%{opacity:1;transform:scale(1.2) rotate(45deg)}100%{opacity:0;transform:scale(.8) rotate(90deg)}}',
    '@keyframes pg-confetti{0%{opacity:0;transform:translate(0,0) rotate(0)}8%{opacity:1}100%{opacity:0;transform:translate(var(--x),250px) rotate(calc(var(--r) + 540deg))}}',
    '@keyframes pg-slump{0%{transform:scale(1,1)}20%,80%{transform:scale(1.04,.93) rotate(2deg)}100%{transform:scale(1,1)}}',
    '@keyframes pg-droop-l{0%,100%{transform:rotate(0)}20%,80%{transform:rotate(-12deg)}}',
    '@keyframes pg-droop-r{0%,100%{transform:rotate(0)}20%,80%{transform:rotate(12deg)}}',
    '@keyframes pg-tear{0%{opacity:0;transform:translateY(0) scale(.6)}20%{opacity:1;transform:translateY(0) scale(1)}100%{opacity:0;transform:translateY(40px)}}',
    '@keyframes pg-ponder{0%,100%{transform:rotate(-6deg)}50%{transform:rotate(-2deg)}}',
    '@keyframes pg-bob{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-5px) scale(1.04)}}',
    '@keyframes pg-snore{0%,100%{transform:rotate(4deg) scale(1,1)}50%{transform:rotate(4deg) scale(1.03,.97)}}',
    '@keyframes pg-z{0%{opacity:0;transform:translate(0,0) scale(.5)}25%{opacity:1}100%{opacity:0;transform:translate(26px,-46px) scale(1.15)}}',
    '@keyframes pg-dance{0%,100%{transform:translate(-7px,0) rotate(-9deg)}25%{transform:translate(0,-12px) rotate(0)}50%{transform:translate(7px,0) rotate(9deg)}75%{transform:translate(0,-12px) rotate(0)}}',
    '@keyframes pg-step{0%,50%,100%{transform:translateY(0)}25%{transform:translateY(-7px) rotate(-8deg)}}',
    '@keyframes pg-startle{0%{transform:translateY(0) scale(1)}12%{transform:translateY(-22px) scale(1.06,.96)}30%{transform:translateY(0) scale(1.05,.93)}45%{transform:scale(.98,1.03)}60%,100%{transform:scale(1)}}',
    '@keyframes pg-pupil-pop{0%{transform:scale(1)}12%,75%{transform:scale(1.25)}100%{transform:scale(1)}}',
    '@keyframes pg-spread-l{0%,100%{transform:rotate(0)}12%,70%{transform:rotate(60deg)}}',
    '@keyframes pg-spread-r{0%,100%{transform:rotate(0)}12%,70%{transform:rotate(-60deg)}}',
    '@keyframes pg-pop{0%{opacity:0;transform:scale(0)}15%{opacity:1;transform:scale(1.3)}25%,75%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(1)}}',
    '@keyframes pg-sweat{0%{opacity:0;transform:translateY(0)}20%{opacity:1}100%{opacity:0;transform:translateY(22px)}}',
    '@keyframes pg-no{0%,100%{transform:translateX(0)}14%{transform:translateX(-8px)}32%{transform:translateX(8px)}50%{transform:translateX(-8px)}68%{transform:translateX(8px)}84%{transform:translateX(0)}}',
    '@keyframes pg-no-body{0%,100%{transform:rotate(0)}14%{transform:rotate(-2deg)}32%{transform:rotate(2deg)}50%{transform:rotate(-2deg)}68%{transform:rotate(2deg)}84%{transform:rotate(0)}}',
    '@keyframes pg-yes{0%,30%,60%,100%{transform:translateY(0)}15%,45%{transform:translateY(8px)}}',
    '@keyframes pg-yes-body{0%,30%,60%,100%{transform:scale(1,1)}15%,45%{transform:scale(1.02,.97)}}',
    '@keyframes pg-waddle{0%,100%{transform:rotate(-7deg)}50%{transform:rotate(7deg)}}',
    '@keyframes pg-sway{0%,100%{transform:rotate(0)}25%{transform:rotate(-4deg)}75%{transform:rotate(4deg)}}',
    '@keyframes pg-heartbeat{0%,100%{transform:scale(1)}50%{transform:scale(1.18)}}',
    '@keyframes pg-blush{0%,100%{opacity:.55;transform:scale(1)}50%{opacity:1;transform:scale(1.35)}}',
    '@keyframes pg-float{0%{opacity:0;transform:translateY(0) scale(.3)}20%{opacity:1;transform:translateY(-8px) scale(1)}100%{opacity:0;transform:translateY(-50px) scale(1.1)}}',
    '@keyframes pg-flame{0%{transform:scale(0)}20%{transform:scale(1.12,1.18)}30%{transform:scale(1)}45%{transform:scale(1.04,.97)}60%{transform:scale(.98,1.04)}80%{transform:scale(1)}100%{transform:scale(0)}}',
    '@keyframes pg-talk{from{transform:translateY(0)}to{transform:translateY(6px)}}',
    '@keyframes pg-talk-mouth{from{transform:scaleY(0)}to{transform:scaleY(1)}}',
    '@keyframes pg-gesture{0%,100%{transform:rotate(0)}40%,60%{transform:rotate(-40deg)}}',

    '@media (prefers-reduced-motion: reduce){.pg *{animation-iteration-count:1!important;animation-duration:.01s!important}}'
  ].join('\n');

  var PenguinMascot = (typeof HTMLElement !== 'undefined') ? class extends HTMLElement {
    static get observedAttributes() { return ['state', 'size']; }

    constructor() {
      super();
      this._root = this.attachShadow({ mode: 'open' });
      this._root.innerHTML = '<style>' + CSS + '</style>' + SVG;
      this._svg = this._root.querySelector('svg');
      this._timer = null;
      this._base = 'idle';
    }

    connectedCallback() {
      this._applySize();
      this.play(this.getAttribute('state') || 'idle');
    }

    attributeChangedCallback(name, oldVal, newVal) {
      if (!this.isConnected || oldVal === newVal) return;
      if (name === 'size') this._applySize();
      if (name === 'state' && newVal !== this._svg.dataset.state) this.play(newVal || 'idle');
    }

    get state() { return this._svg.dataset.state; }
    set state(v) { this.play(v); }

    /** Danh sách tất cả các animation có sẵn */
    static get states() { return STATES.slice(); }

    /**
     * Chạy một animation.
     * Trạng thái lặp (idle, think, sleep, dance, walk, talk) sẽ giữ nguyên.
     * Trạng thái một lần (happy, sad, ...) chạy xong tự quay về trạng thái lặp gần nhất.
     * Trả về Promise resolve khi animation một lần kết thúc.
     */
    play(state) {
      var self = this;
      if (STATES.indexOf(state) === -1) {
        console.warn('[penguin-mascot] Không có animation "' + state + '". Có: ' + STATES.join(', '));
        state = 'idle';
      }
      clearTimeout(this._timer);
      // Khởi động lại animation nếu chạy lại cùng một trạng thái
      this._svg.dataset.state = '';
      void this._svg.getBoundingClientRect();
      this._svg.dataset.state = state;

      if (LOOPING.indexOf(state) !== -1) {
        this._base = state;
        this.dispatchEvent(new CustomEvent('statechange', { detail: { state: state } }));
        return Promise.resolve(state);
      }
      this.dispatchEvent(new CustomEvent('statechange', { detail: { state: state } }));
      return new Promise(function (resolve) {
        self._timer = setTimeout(function () {
          self._svg.dataset.state = self._base;
          self.dispatchEvent(new CustomEvent('animationdone', { detail: { state: state } }));
          self.dispatchEvent(new CustomEvent('statechange', { detail: { state: self._base } }));
          resolve(state);
        }, ONE_SHOT[state]);
      });
    }

    _applySize() {
      var s = this.getAttribute('size');
      if (s) this.style.setProperty('--pg-size', /^\d+$/.test(s) ? s + 'px' : s);
    }
  } : null;

  if (PenguinMascot && typeof customElements !== 'undefined' && !customElements.get('penguin-mascot')) {
    customElements.define('penguin-mascot', PenguinMascot);
  }

  var api = { SVG: SVG, CSS: CSS, STATES: STATES, LOOPING: LOOPING, ONE_SHOT: ONE_SHOT, PenguinMascot: PenguinMascot };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.PenguinMascot = api;
})();
