/*!
 * Penguin Mascot — linh vật chim cánh cụt cho app học tập
 * Web Component: <penguin-mascot state="idle" size="240"></penguin-mascot>
 * Không phụ thuộc thư viện nào. Chạy trên mọi trình duyệt hiện đại.
 */
(function () {
  'use strict';

  // Danh sách trạng thái và thời lượng phải khớp spec/mascot.json (test/spec.test.mjs kiểm tra).
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

  var COLORS = { ink: '#1B2440' };

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

  // Mũ tốt nghiệp (tuỳ chọn: accessory="cap"). Mỗi phiên bản tự đặt mũ vào vị trí của mình.
  var CAP =
    '<g class="pg-cap">' +
      '<path d="M76 44 L76 56 Q100 68 124 56 L124 44 Z" fill="' + COLORS.ink + '"/>' +
      '<path d="M56 42 L100 24 L144 42 L100 60 Z" fill="#26325A"/>' +
      '<path d="M100 42 L136 47 L137 64" fill="none" stroke="#FFC800" stroke-width="3" stroke-linecap="round"/>' +
      '<circle cx="137" cy="66" r="4" fill="#FFC800"/>' +
      '<circle cx="100" cy="42" r="3.5" fill="#FFC800"/>' +
    '</g>';

  // Một phiên bản (variant) gồm: defs (gradient, filter), character (nội dung bên trong .pg-root),
  // css (tâm xoay riêng) và fx (dịch giọt nước mắt / mồ hôi cho khớp mặt).
  // Hiện chỉ có "plush", đăng ký ở cuối file.
  var DEFAULT_VARIANT = 'plush';
  var VARIANTS = {};
  // Renderer bổ sung (ví dụ 'rive'), đăng ký bằng registerRenderer. Mặc định vẫn là SVG + CSS.
  var RENDERERS = {};

  function fxLayer(opts) {
    var tear = (opts && opts.tear) || [0, 0];
    var sweat = (opts && opts.sweat) || [0, 0];
    return (
      '<g class="pg-fx">' +
        '<g transform="translate(' + tear[0] + ' ' + tear[1] + ')"><path class="pg-tear" d="M68 104 C 64 112 62 116 68 119 C 74 116 72 112 68 104 Z" fill="#5BC0F8"/></g>' +
        '<g transform="translate(' + sweat[0] + ' ' + sweat[1] + ')"><path class="pg-sweat" d="M156 52 C 150 62 148 68 156 71 C 164 68 162 62 156 52 Z" fill="#8FD3FF"/></g>' +
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
      '</g>'
    );
  }

  function buildSVG(v) {
    return (
      '<svg class="pg" viewBox="0 0 200 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Chim cánh cụt">' +
      (v.defs ? '<defs>' + v.defs + '</defs>' : '') +
      // Ngọn lửa streak (phía sau)
      '<g transform="translate(100 228) scale(1.45 1.35) translate(-100 -228)"><g class="pg-flame">' +
        '<path d="M100 18 C 128 58 176 80 170 150 C 166 200 132 228 100 228 C 68 228 34 200 30 150 C 26 104 58 92 70 52 C 80 80 90 66 100 18 Z" fill="#FF9600"/>' +
        '<path d="M100 70 C 118 100 150 116 146 160 C 143 196 124 216 100 216 C 76 216 57 196 54 160 C 52 128 74 120 80 96 C 88 112 94 100 100 70 Z" fill="#FFC800"/>' +
      '</g></g>' +
      '<ellipse class="pg-shadow" cx="100" cy="227" rx="52" ry="7" fill="rgba(0,0,0,.14)"/>' +
      '<g class="pg-root">' + v.character + '</g>' +
      fxLayer(v.fx) +
      '</svg>'
    );
  }

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
    // giọt nước mắt / mồ hôi nằm trong <g transform> để mỗi phiên bản dịch vị trí; tự ẩn bằng opacity của chính nó
    '.pg-fx>g:not([class]){opacity:1}.pg-tear,.pg-sweat{opacity:0}',
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

    /* ---------- thẻ tên lắc nhẹ theo nhịp ---------- */
    '.pg[data-state="idle"] .pg-tag,.pg[data-state="talk"] .pg-tag{animation:pg-tag-swing 2.8s ease-in-out infinite}',
    '.pg[data-state="happy"] .pg-tag,.pg[data-state="celebrate"] .pg-tag,.pg[data-state="love"] .pg-tag,.pg[data-state="yes"] .pg-tag{animation:pg-tag-swing-lg .6s ease-in-out infinite}',

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
    '@keyframes pg-tag-swing{0%,100%{transform:rotate(0)}30%{transform:rotate(7deg)}70%{transform:rotate(-7deg)}}',
    '@keyframes pg-tag-swing-lg{0%,100%{transform:rotate(0)}25%{transform:rotate(14deg)}75%{transform:rotate(-14deg)}}',
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
    static get observedAttributes() { return ['state', 'size', 'variant', 'renderer']; }

    constructor() {
      super();
      this._root = this.attachShadow({ mode: 'open' });
      this._timer = null;
      this._base = 'idle';
      this._current = '';
      this._seq = 0;
      this._failed = {};
      this._mountId = 0;
      this._pendingDone = null;
      this._rendererName = 'svg';
      this._renderer = null;
      this._render();
    }

    /** Vẽ lại theo thuộc tính variant và renderer, giữ nguyên animation đang chạy */
    _render() {
      this._teardownRenderer();
      var want = this._wantedRenderer();
      if (want !== 'svg' && this._mountRenderer(want)) return;
      this._renderSvg();
    }

    _renderSvg() {
      var name = this._wantedVariant();
      var v = VARIANTS[name];
      this._variant = name;
      this._rendererName = 'svg';
      this._root.innerHTML = '<style>' + CSS + '\n' + (v.css || '') + '</style>' + buildSVG(v);
      this._svg = this._root.querySelector('svg');
      if (this._current) this._svg.dataset.state = this._current;
    }

    /** Renderer đang được yêu cầu: chỉ khi đã đăng ký và chưa lỗi nạp, còn lại dùng svg */
    _wantedRenderer() {
      var r = this.getAttribute('renderer') || 'svg';
      return RENDERERS[r] && !this._failed[r] ? r : 'svg';
    }

    _mountRenderer(name) {
      var self = this;
      var token = ++this._mountId;
      this._variant = this._wantedVariant();
      this._root.innerHTML = '<style>' + CSS + '</style>';
      this._svg = null;
      var ctx = {
        host: this,
        variant: this._variant,
        // renderer gọi khi không nạp được tài nguyên: lùi về SVG
        fail: function (err) { if (self._mountId === token && self._rendererName === name) self._fallback(name, err); }
      };
      try {
        this._renderer = RENDERERS[name](this._root, ctx);
        this._rendererName = name;
        this._renderer.play(this._base);
        return true;
      } catch (err) {
        this._renderer = null;
        this._fallback(name, err);
        return true;
      }
    }

    _fallback(name, err) {
      this._failed[name] = true;
      this._teardownRenderer();
      this._renderSvg();
      this.dispatchEvent(new CustomEvent('rendererfallback', { detail: { renderer: name, error: err } }));
      // Đang chạy dở animation một lần bằng renderer cũ: SVG chạy lại nó và hẹn giờ xong, để Promise/sự kiện vẫn tới nơi
      if (this._pendingDone) {
        clearTimeout(this._timer);
        this._timer = setTimeout(this._pendingDone, ONE_SHOT[this._current]);
      }
    }

    _teardownRenderer() {
      this._mountId++;
      if (this._renderer) { try { this._renderer.destroy(); } catch (e) {} this._renderer = null; }
      this._rendererName = 'svg';
    }

    disconnectedCallback() {
      if (this._renderer) this._teardownRenderer();
    }

    /** Tên variant đang được yêu cầu; tên lạ thì dùng variant mặc định */
    _wantedVariant() {
      var name = this.getAttribute('variant');
      return VARIANTS[name] ? name : DEFAULT_VARIANT;
    }

    connectedCallback() {
      // Với thẻ viết sẵn trong HTML, constructor chạy trước khi trình duyệt gán thuộc tính,
      // còn attributeChangedCallback bị bỏ qua khi chưa isConnected, nên phải vẽ lại ở đây.
      if (this._rendererName !== this._wantedRenderer() || this._variant !== this._wantedVariant()) this._render();
      this._applySize();
      this.play(this.getAttribute('state') || 'idle');
    }

    attributeChangedCallback(name, oldVal, newVal) {
      if (!this.isConnected || oldVal === newVal) return;
      if (name === 'size') this._applySize();
      if (name === 'variant') this._render();
      if (name === 'renderer') { this._failed = {}; this._render(); }
      if (name === 'state' && newVal !== this._current) this.play(newVal || 'idle');
    }

    get state() { return this._current; }
    set state(v) { this.play(v); }

    get variant() { return this._variant; }
    set variant(v) { this.setAttribute('variant', v); }

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
      this._pendingDone = null;
      var seq = ++this._seq;
      this._current = state;
      var done = null;
      if (this._renderer) {
        // Renderer ngoài (ví dụ rive): chạy lại cùng một trạng thái cũng phải phát lại, việc đó do renderer đảm nhiệm
        done = this._renderer.play(state);
      } else {
        // Khởi động lại animation nếu chạy lại cùng một trạng thái
        this._svg.dataset.state = '';
        void this._svg.getBoundingClientRect();
        this._svg.dataset.state = state;
      }

      this.dispatchEvent(new CustomEvent('statechange', { detail: { state: state } }));
      if (LOOPING.indexOf(state) !== -1) {
        this._base = state;
        return Promise.resolve(state);
      }
      return new Promise(function (resolve) {
        var finish = function () {
          if (self._seq !== seq) return;
          self._pendingDone = null;
          clearTimeout(self._timer);
          self._current = self._base;
          // Renderer ngoài tự về trạng thái lặp (state machine); SVG thì đặt lại ở đây
          if (self._svg) self._svg.dataset.state = self._base;
          self.dispatchEvent(new CustomEvent('animationdone', { detail: { state: state } }));
          self.dispatchEvent(new CustomEvent('statechange', { detail: { state: self._base } }));
          resolve(state);
        };
        self._pendingDone = finish;
        if (done) done.then(finish, finish);
        else self._timer = setTimeout(finish, ONE_SHOT[state]);
      });
    }

    _applySize() {
      var s = this.getAttribute('size');
      if (s) this.style.setProperty('--pg-size', /^\d+$/.test(s) ? s + 'px' : s);
    }
  } : null;

  // Chỉ đăng ký thẻ sau khi đã có variant mặc định (gọi ở cuối file), để thẻ viết sẵn trong HTML vẽ đúng ngay.
  function define() {
    if (PenguinMascot && typeof customElements !== 'undefined' && !customElements.get('penguin-mascot')) {
      customElements.define('penguin-mascot', PenguinMascot);
    }
  }

  /**
   * Đăng ký thêm một phiên bản hình (variant). spec = { label, defs, character, css, fx }.
   * Các thẻ đang dùng variant này sẽ được vẽ lại ngay.
   */
  function registerVariant(name, spec) {
    VARIANTS[name] = spec;
    if (typeof document === 'undefined') return;
    var els = document.querySelectorAll('penguin-mascot');
    for (var i = 0; i < els.length; i++) if (els[i]._svg) els[i]._render();
  }

  /**
   * Đăng ký renderer khác SVG, chọn bằng thuộc tính renderer="ten".
   * factory(root, ctx) trả về { play(state) -> Promise, destroy() }:
   *   root  ShadowRoot để gắn canvas...; ctx = { host, variant, fail(err) }.
   *   play: trạng thái lặp resolve ngay; trạng thái một lần resolve khi chạy xong.
   *   fail(err): gọi khi không nạp được tài nguyên, thẻ tự lùi về SVG và phát sự kiện rendererfallback.
   * Các thẻ đang yêu cầu renderer này sẽ được vẽ lại ngay.
   */
  function registerRenderer(name, factory) {
    RENDERERS[name] = factory;
    if (typeof document === 'undefined') return;
    var els = document.querySelectorAll('penguin-mascot[renderer="' + name + '"]');
    for (var i = 0; i < els.length; i++) if (els[i]._svg || els[i]._renderer) { els[i]._failed = {}; els[i]._render(); }
  }

  var api = {
    CSS: CSS, CAP: CAP, HEART: heart, STAR: star, STATES: STATES, LOOPING: LOOPING, ONE_SHOT: ONE_SHOT,
    VARIANTS: VARIANTS, buildSVG: buildSVG, registerVariant: registerVariant, registerRenderer: registerRenderer, define: define, PenguinMascot: PenguinMascot
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.PenguinMascot = api;
})();

/* Phiên bản "plush": bé chim cánh cụt bông lông xám, mặt trắng, mỏ vàng (theo ảnh thú bông). */
(function () {
  var P = typeof window !== 'undefined' ? window.PenguinMascot : module.exports;
  var N = 'plush-';
  var INK = '#23262E';

  // ---- geometry (cubic segments, clockwise) ----
  var HEAD = [[100, 23, 148, 23, 179, 52, 179, 96], [179, 96, 179, 124, 150, 141, 100, 141],
    [100, 141, 50, 141, 21, 124, 21, 96], [21, 96, 21, 52, 52, 23, 100, 23]];
  var BODY = [[100, 120, 140, 120, 163, 136, 165, 162], [165, 162, 168, 198, 148, 224, 100, 224],
    [100, 224, 52, 224, 32, 198, 35, 162], [35, 162, 37, 136, 60, 120, 100, 120]];
  // white face mask lobes (left lobe going up/over/down, right lobe mirrored)
  var LOBE_L = [[24, 124, 28, 112, 34, 100, 37, 90], [37, 90, 40, 76, 50, 66, 62, 66],
    [62, 66, 74, 66, 82, 72, 84, 80], [84, 80, 86, 88, 86, 94, 88, 98]];
  var LOBE_R = LOBE_L.map(function (s) {
    return [200 - s[6], s[7], 200 - s[4], s[5], 200 - s[2], s[3], 200 - s[0], s[1]];
  }).reverse();

  function dPath(segs, close) {
    var d = 'M' + segs[0][0] + ' ' + segs[0][1];
    segs.forEach(function (s) { d += ' C' + s.slice(2).join(' '); });
    return d + (close ? ' Z' : '');
  }
  var HEAD_D = dPath(HEAD, 1), BODY_D = dPath(BODY, 1);
  var MASK_D = 'M100 148 L24 148 L24 124' + dPath(LOBE_L).slice(dPath(LOBE_L).indexOf(' C')) +
    ' C92 104 96 106 100 106 C104 106 108 104 112 98' + dPath(LOBE_R).slice(dPath(LOBE_R).indexOf(' C')) + ' L176 148 Z';

  // ---- deterministic fur strands ----
  var seed = 7;
  function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
  function f1(v) { return Math.round(v * 10) / 10; }
  function bez(s, t) {
    var m = 1 - t, a = m * m * m, b = 3 * m * m * t, c = 3 * m * t * t, e = t * t * t;
    var x = a * s[0] + b * s[2] + c * s[4] + e * s[6], y = a * s[1] + b * s[3] + c * s[5] + e * s[7];
    var dx = 3 * m * m * (s[2] - s[0]) + 6 * m * t * (s[4] - s[2]) + 3 * t * t * (s[6] - s[4]);
    var dy = 3 * m * m * (s[3] - s[1]) + 6 * m * t * (s[5] - s[3]) + 3 * t * t * (s[7] - s[5]);
    var l = Math.sqrt(dx * dx + dy * dy) || 1;
    return [x, y, dx / l, dy / l];
  }
  // strands along an outline: n per segment, pointing outward, length lo..lo+span
  function fringe(segs, n, lo, span, filter) {
    var d = '';
    segs.forEach(function (s) {
      for (var k = 0; k < n; k++) {
        var q = bez(s, (k + 0.2 + rnd() * 0.6) / n), nx = q[3], ny = -q[2];
        if (filter && !filter(q[0], q[1])) continue;
        var L = lo + rnd() * span, j = (rnd() - 0.5) * 2.4;
        d += 'M' + f1(q[0] - nx * 1.5) + ' ' + f1(q[1] - ny * 1.5) + 'l' + f1(nx * (L + 1.5) + q[2] * j) + ' ' + f1(ny * (L + 1.5) + q[3] * j);
      }
    });
    return d;
  }
  // short strands scattered in an ellipse, flowing away from (ox, oy)
  function tex(cx, cy, rx, ry, n, ox, oy, len, keep) {
    var d = '';
    for (var i = 0; i < n; i++) {
      var a = rnd() * 6.283, r = Math.sqrt(rnd()), x = cx + Math.cos(a) * rx * r, y = cy + Math.sin(a) * ry * r;
      if (keep && !keep(x, y)) continue;
      var vx = x - ox, vy = y - oy, l = Math.sqrt(vx * vx + vy * vy) || 1, L = len * (0.6 + rnd() * 0.8);
      d += 'M' + f1(x) + ' ' + f1(y) + 'l' + f1(vx / l * L + (rnd() - 0.5)) + ' ' + f1(vy / l * L);
    }
    return d;
  }
  function strands(d, color, w, op) {
    return '<path d="' + d + '" fill="none" stroke="' + color + '" stroke-width="' + w + '" stroke-linecap="round"' +
      (op ? ' opacity="' + op + '"' : '') + '/>';
  }
  function inWhite(x, y) {
    var l = Math.pow((x - 61) / 22, 2) + Math.pow((y - 98) / 29, 2), r = Math.pow((x - 139) / 22, 2) + Math.pow((y - 98) / 29, 2);
    return l < 0.8 || r < 0.8 || (y > 112 && Math.pow((x - 100) / 74, 2) + Math.pow((y - 96) / 42, 2) < 0.9);
  }

  function rg(id, cx, cy, r, stops) {
    var s = '<radialGradient id="' + N + id + '" cx="' + cx + '" cy="' + cy + '" r="' + r + '">';
    stops.forEach(function (st) {
      s += '<stop offset="' + st[0] + '" stop-color="' + st[1] + '"' + (st[2] != null ? ' stop-opacity="' + st[2] + '"' : '') + '/>';
    });
    return s + '</radialGradient>';
  }
  function u(id) { return 'url(#' + N + id + ')'; }
  function blob(cx, cy, rx, ry, fill) {
    return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="' + u(fill) + '"/>';
  }

  var defs =
    // fur: fine fractal noise displaces the edges (fluffy outline) and adds light/dark fibre flecks inside
    '<filter id="' + N + 'fuzz" x="-8%" y="-8%" width="116%" height="116%" color-interpolation-filters="sRGB">' +
      '<feTurbulence type="fractalNoise" baseFrequency="0.62" numOctaves="2" seed="4" result="n"/>' +
      '<feDisplacementMap in="SourceGraphic" in2="n" scale="4" xChannelSelector="R" yChannelSelector="G" result="d"/>' +
      '<feTurbulence type="fractalNoise" baseFrequency=".95 .28" numOctaves="1" seed="2" result="f"/>' +
      '<feColorMatrix in="f" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 1.4 0 0 0 -.86" result="h"/>' +
      '<feColorMatrix in="f" values="0 0 0 0 .22 0 0 0 0 .25 0 0 0 0 .32 0 -1.3 0 0 .45" result="l"/>' +
      '<feComposite in="h" in2="d" operator="in" result="h2"/>' +
      '<feComposite in="l" in2="d" operator="in" result="l2"/>' +
      '<feMerge><feMergeNode in="d"/><feMergeNode in="l2"/><feMergeNode in="h2"/></feMerge>' +
    '</filter>' +
    '<filter id="' + N + 'fuzz-s" x="-15%" y="-15%" width="130%" height="130%" color-interpolation-filters="sRGB">' +
      '<feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="1" seed="9" result="n"/>' +
      '<feDisplacementMap in="SourceGraphic" in2="n" scale="3" xChannelSelector="R" yChannelSelector="G"/>' +
    '</filter>' +
    '<clipPath id="' + N + 'headclip"><path d="' + HEAD_D + '"/></clipPath>' +
    rg('head', '50%', '20%', '80%', [[0, '#606A7B'], [0.45, '#6E798A'], [0.82, '#7C8798'], [1, '#768193']]) +
    rg('mask', '50%', '42%', '62%', [[0, '#F7F7F4'], [0.68, '#F1F1EE'], [1, '#DDE0E4']]) +
    rg('body', '50%', '38%', '64%', [[0, '#BEC7D3'], [0.62, '#AEB8C6'], [1, '#97A2B3']]) +
    rg('belly', '50%', '50%', '50%', [[0, '#D2D9E2'], [0.6, '#C9D1DC', 0.8], [1, '#C9D1DC', 0]]) +
    rg('shade', '50%', '50%', '50%', [[0, '#3E4757', 0.42], [1, '#3E4757', 0]]) +
    rg('dark', '50%', '50%', '50%', [[0, '#525C6D', 0.55], [1, '#525C6D', 0]]) +
    rg('light', '50%', '50%', '50%', [[0, '#8C97A8', 0.65], [1, '#8C97A8', 0]]) +
    rg('mot', '50%', '50%', '50%', [[0, '#DCE2EA', 0.55], [1, '#DCE2EA', 0]]) +
    rg('wing', '45%', '20%', '85%', [[0, '#B7C0CD'], [0.7, '#A8B2C0'], [1, '#949FB0']]) +
    rg('foot', '42%', '30%', '75%', [[0, '#F8E38F'], [0.55, '#F2D46B'], [1, '#DDB547']]) +
    rg('eye', '38%', '35%', '70%', [[0, '#3B3D45'], [1, '#0B0C0F']]) +
    rg('blush', '50%', '50%', '50%', [[0, '#F59AAE'], [1, '#F59AAE', 0]]) +
    '<linearGradient id="' + N + 'beak" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#F7DE80"/><stop offset=".55" stop-color="#F2D46B"/><stop offset="1" stop-color="#E9C95E"/>' +
    '</linearGradient>' +
    '<clipPath id="' + N + 'tagclip"><circle cx="100" cy="163.6" r="15.4"/></clipPath>' +
    '<linearGradient id="' + N + 'beakb" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#EACB60"/><stop offset="1" stop-color="#E3BE4F"/>' +
    '</linearGradient>';

  // Bead eye: everything inside .pg-pupil so look/scale moves the whole bead
  function eye(side, cx, cy) {
    return '<g class="pg-eye pg-eye-' + side + '"><g class="pg-pupil">' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="6.6" fill="' + u('eye') + '"/>' +
      '<circle cx="' + (cx + 2.3) + '" cy="' + (cy - 2.4) + '" r="2.1" fill="#fff"/>' +
      '<circle cx="' + (cx - 2.2) + '" cy="' + (cy + 2.6) + '" r=".9" fill="#fff" opacity=".7"/>' +
    '</g></g>';
  }

  // Stubby flipper hanging from shoulder pivot (px, py), tilted a deg outward (sign = side)
  var WSEGS = [[0, -21, 9, -21, 15, -10, 15, 2], [15, 2, 15, 15, 8, 22, 0, 22], [0, 22, -8, 22, -15, 15, -15, 2], [-15, 2, -15, -10, -9, -21, 0, -21]];
  function wing(side, px, py, a) {
    var r = a * Math.PI / 180, cx = f1(px - Math.sin(r) * 13), cy = f1(py + Math.cos(r) * 13);
    return '<g class="pg-wing-' + side + '"><g transform="translate(' + cx + ' ' + cy + ') rotate(' + a + ')" filter="' + u('fuzz') + '">' +
      '<ellipse cx="' + (a > 0 ? 3.5 : -3.5) + '" cy="4" rx="14" ry="20" fill="#3E4757" opacity=".28"/>' +
      '<path d="' + dPath(WSEGS, 1) + '" fill="' + u('wing') + '"/>' +
      strands(fringe(WSEGS, 12, 0.6, 1.8), '#A3ADBC', 1.2) +
    '</g></g>';
  }

  function foot(side, cx) {
    var d = side === 'l' ? -1 : 1;
    return '<g class="pg-foot-' + side + '"><g filter="' + u('fuzz-s') + '">' +
      '<path d="M' + (cx - 18) + ' 218 C' + (cx - 19) + ' 208 ' + (cx - 10) + ' 202 ' + cx + ' 202 C' + (cx + 10) + ' 202 ' + (cx + 19) + ' 208 ' + (cx + 18) + ' 218 ' +
        'C' + (cx + 17) + ' 225 ' + (cx + 9) + ' 227 ' + cx + ' 227 C' + (cx - 9) + ' 227 ' + (cx - 17) + ' 225 ' + (cx - 18) + ' 218 Z" fill="' + u('foot') + '"/>' +
      '<path d="M' + (cx - 6.5) + ' 227 q1 -4 0 -6 M' + (cx + 6.5) + ' 227 q-1 -4 0 -6" fill="none" stroke="#D8B044" stroke-width="1.4" stroke-linecap="round" opacity=".8"/>' +
      '<ellipse cx="' + (cx + d * -4) + '" cy="208" rx="7" ry="3" fill="#FFF6C8" opacity=".45"/>' +
    '</g></g>';
  }

  var tufts = 'M95 30 C90 24 90 17 95 13 C95 19 98 24 101 28 Z M100 28 C100 21 103 15 110 14 C106 19 105 24 107 30 Z' +
    'M88 32 C83 29 81 24 83 19 C85 24 89 27 94 29 Z M106 30 C110 26 115 24 119 25 C115 27 112 30 111 33 Z';

  // Dấu chân thú: một đệm lớn và bốn ngón, vẽ quanh gốc (0 0), dùng khắc chìm lên thẻ
  var TAG_PAW = '<g fill="#6A3A1A" opacity=".85">' +
    '<ellipse cx="0" cy="1.6" rx="3" ry="2.4"/>' +
    '<circle cx="-3.6" cy="-1.6" r="1.25"/><circle cx="-1.25" cy="-3.2" r="1.25"/>' +
    '<circle cx="1.25" cy="-3.2" r="1.25"/><circle cx="3.6" cy="-1.6" r="1.25"/></g>';

  var character =
    '<g class="pg-bodyg">' +
      // body
      '<g filter="' + u('fuzz') + '">' +
        '<path d="' + BODY_D + '" fill="' + u('body') + '"/>' +
        blob(100, 186, 46, 36, 'belly') +
        blob(78, 200, 14, 10, 'mot') + blob(121, 176, 12, 9, 'mot') + blob(106, 212, 16, 7, 'mot') +
        strands(fringe(BODY, 34, 0.8, 2), '#A9B3C1', 1.2) +
        blob(100, 142, 64, 13, 'shade') +
      '</g>' +
      // head
      '<g filter="' + u('fuzz') + '">' +
        '<path d="' + HEAD_D + '" fill="' + u('head') + '"/>' +
        '<g clip-path="' + u('headclip') + '">' +
          blob(100, 46, 58, 26, 'dark') + blob(100, 74, 20, 26, 'dark') +
          blob(32, 104, 14, 26, 'light') + blob(168, 104, 14, 26, 'light') +
        '</g>' +
        strands(fringe(HEAD, 40, 0.8, 2.2, function (x, y) { return y < 121; }), '#6C778A', 1.2) +
        '<g clip-path="' + u('headclip') + '">' +
          '<path d="' + MASK_D + '" fill="' + u('mask') + '"/>' +
          strands(fringe(LOBE_L, 16, 0.6, 2) + fringe(LOBE_R, 16, 0.6, 2), '#EFEFEC', 1.2) +
        '</g>' +
        strands(fringe(HEAD.slice(1, 3), 40, 0.6, 2, function (x, y) { return y >= 121; }), '#E9EAE8', 1.2) +
        '<g transform="translate(0 4)"><path d="' + tufts + '" fill="#5A6475"/>' +
        strands('M97 29l-4 -10M101 28l1 -11M104 30l5 -9M92 31l-7 -6', '#5A6475', 1.6) + '</g>' +
      '</g>' +
      // thẻ tên gỗ tròn, mặt mờ (không bóng), khắc chìm; quai da lộn rất ngắn luồn qua lỗ ở đỉnh, thẻ sát cằm; lắc quanh lỗ (100 145.6)
      '<g class="pg-tag"><g transform="translate(0 -5.6)">' +
        '<ellipse cx="101.4" cy="165.4" rx="16.3" ry="16" fill="#3E4757" opacity=".15"/>' +
        '<g fill="none" stroke="#6E4724" stroke-width="2.4" stroke-linecap="round">' +
          '<path d="M99.3 151.4 C97.3 149.2 97.9 146.6 100.4 145.2"/>' +
          '<path d="M100.7 151.4 C102.7 149.2 102.1 146.6 99.6 145.2"/>' +
        '</g>' +
        '<circle cx="100" cy="164" r="16.2" fill="#7A4520"/>' +
        '<circle cx="100" cy="163.6" r="15.4" fill="#B07846"/>' +
        // vân gỗ rất nhẹ
        '<g clip-path="' + u('tagclip') + '" fill="none" stroke="#8A5528" stroke-width=".5" opacity=".2">' +
          '<path d="M82 154 Q100 151.6 118 154.4"/><path d="M82 157.6 Q100 155.6 118 158"/><path d="M82 161.4 Q100 159.8 118 161.8"/>' +
          '<path d="M82 165.4 Q100 164 118 165.6"/><path d="M82 169.2 Q100 168 118 169.4"/><path d="M82 173 Q100 172 118 173"/>' +
        '</g>' +
        // vòng viền chìm sát mép
        '<circle cx="100" cy="163.6" r="13.2" fill="none" stroke="#7E4A25" stroke-width=".9" opacity=".85"/>' +
        '<circle cx="100" cy="151.2" r="1.7" fill="#4A2A12"/>' +
        // họa tiết dấu chân và chữ khắc chìm
        '<g transform="translate(107.4 156.2) rotate(14) scale(.5)">' + TAG_PAW + '</g>' +
        '<g transform="translate(94.6 173.6) rotate(-16) scale(.62)">' + TAG_PAW + '</g>' +
        '<g transform="rotate(-18 100 164.2)" font-family="Brush Script MT, Segoe Script, Georgia, Times New Roman, serif" font-style="italic" font-weight="700" font-size="8" text-anchor="middle">' +
          '<text x="100" y="164.5" fill="#6A3A1A">BipBip</text>' +
        '</g>' +
      '</g></g>' +
      '<g transform="translate(100 33) rotate(-6) scale(1.1) translate(-100 -44)">' + P.CAP + '</g>' +
      '<g class="pg-face">' +
        '<g class="pg-brows" fill="none" stroke="' + INK + '" stroke-width="3.2" stroke-linecap="round">' +
          '<path class="pg-brow-l" d="M57.5 83.5 Q64 81 70.5 83"/>' +
          '<path class="pg-brow-r" d="M129.5 83 Q136 81 142.5 83.5"/>' +
        '</g>' +
        eye('l', 64, 94) + eye('r', 136, 94) +
        '<g class="pg-eyes-happy" fill="none" stroke="' + INK + '" stroke-width="3.4" stroke-linecap="round">' +
          '<path d="M57 97 Q64 87 71 97"/><path d="M129 97 Q136 87 143 97"/>' +
        '</g>' +
        '<g class="pg-eyes-closed" fill="none" stroke="' + INK + '" stroke-width="3" stroke-linecap="round">' +
          '<path d="M57 93 Q64 100 71 93"/><path d="M129 93 Q136 100 143 93"/>' +
        '</g>' +
        '<g class="pg-eyes-heart" fill="#FF4B6E">' +
          '<g transform="translate(64 95) scale(.78)"><path class="pg-heart-eye" d="' + P.HEART + '"/></g>' +
          '<g transform="translate(136 95) scale(.78)"><path class="pg-heart-eye" d="' + P.HEART + '"/></g>' +
        '</g>' +
        '<ellipse class="pg-cheek pg-cheek-l" cx="54" cy="109" rx="9" ry="5.5" fill="' + u('blush') + '"/>' +
        '<ellipse class="pg-cheek pg-cheek-r" cx="146" cy="109" rx="9" ry="5.5" fill="' + u('blush') + '"/>' +
        '<ellipse class="pg-mouth" cx="100" cy="112" rx="9" ry="6" fill="#8B1E3F"/>' +
        '<path class="pg-beak-bot" d="M85 103 C92 107.5 108 107.5 115 103 C114.5 112 108 118.5 100 118.5 C92 118.5 85.5 112 85 103 Z" fill="' + u('beakb') + '"/>' +
        '<g class="pg-beak-top">' +
          '<path d="M78 94.5 C78 88.8 90 88 100 88 C110 88 122 88.8 122 94.5 C122 102 111 108 100 109.5 C89 108 78 102 78 94.5 Z" fill="' + u('beak') + '"/>' +
          '<ellipse cx="97" cy="93" rx="13" ry="3.6" fill="#FFF3B8" opacity=".45"/>' +
        '</g>' +
      '</g>' +
      wing('l', 41, 149, 38) + wing('r', 159, 149, -38) +
    '</g>' +
    foot('l', 71) + foot('r', 129);

  var css =
    '.pg-root{transform-origin:100px 226px}' +
    '.pg-bodyg{transform-origin:100px 224px}' +
    '.pg-eye-l{transform-origin:64px 94px}.pg-eye-r{transform-origin:136px 94px}' +
    '.pg-eye-l .pg-pupil{transform-origin:64px 94px}.pg-eye-r .pg-pupil{transform-origin:136px 94px}' +
    '.pg-wing-l{transform-origin:41px 149px}.pg-wing-r{transform-origin:159px 149px}' +
    '.pg-foot-l{transform-origin:71px 227px}.pg-foot-r{transform-origin:129px 227px}' +
    '.pg-beak-bot,.pg-mouth{transform-origin:100px 107px}' +
    '.pg-cheek-l{transform-origin:54px 109px}.pg-cheek-r{transform-origin:146px 109px}' +
    '.pg-brow-l{transform-origin:64px 83px}.pg-brow-r{transform-origin:136px 83px}' +
    '.pg-face{transform-origin:100px 100px}' +
    '.pg-tag{transform-origin:100px 145.6px}';

  P.registerVariant('plush', {
    label: 'Plush',
    defs: defs,
    character: character,
    css: css,
    fx: { tear: [-9, -3], sweat: [4, -2] }
  });
  P.define();
})();
