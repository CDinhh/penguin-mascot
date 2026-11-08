# @prm393/penguin-mascot-3d

Renderer 3D cho web component `<penguin-mascot>`: model glTF `bipbip.glb` (rig xương, 15 clip theo `spec/mascot.json`) vẽ bằng three.js.
Bản 2D (SVG, Rive) vẫn là mặc định; bản 3D là tùy chọn `renderer="3d"`.

```html
<script type="module">
  import '@prm393/penguin-mascot';       // web component
  import '@prm393/penguin-mascot-3d';    // đăng ký renderer "3d"; cần cài `three` (>= 0.162)
</script>
<penguin-mascot renderer="3d" state="idle" size="200" accessory="cap" track-pointer></penguin-mascot>
```

Cùng API với bản 2D: `el.play('happy')` trả về Promise (clip một lần resolve khi xong), thuộc tính `state`, sự kiện
`statechange` và `animationdone`, `prefers-reduced-motion` (đứng yên ở tư thế đầu clip, clip một lần xong ngay).

| Thuộc tính | Ý nghĩa |
| --- | --- |
| `renderer="3d"` | dùng bản 3D |
| `size` | chiều rộng px (cao theo tỉ lệ 200:240 như bản 2D) |
| `accessory="cap"` | đội mũ tốt nghiệp (node `fx_cap`) |
| `look-x`, `look-y` | hướng nhìn của mắt, -1..1 (như `lookX/lookY` của Rive) |
| `track-pointer` | mắt tự nhìn theo con trỏ chuột |

## Vì sao nhẹ

- **Một WebGLRenderer dùng chung** cho mọi thẻ trên trang (không chạm giới hạn số WebGL context của trình duyệt); mỗi thẻ có canvas 2D nhận ảnh.
- Chỉ vẽ thẻ đang nhìn thấy; tab ẩn thì dừng; giảm chuyển động thì chỉ vẽ khi cần.
- **LOD tự chọn theo cỡ pixel thật**: trên 260 px dùng LOD0 (7.116 tam giác), 111..260 px LOD1 (2.634), từ 110 px trở xuống LOD2 (1.446, 1 texture).
- Trần độ phân giải: DPR tối đa 2, tối đa 1.024 px chiều rộng (đổi bằng `configure`).
- Bóng giả bằng 1 mặt phẳng, không bóng đổ thật. Một draw call mỗi vật liệu (11 lúc nghỉ); node hiệu ứng `fx_*` ẩn hẳn khi scale gần 0.
- Model đóng kèm gói; file được cache theo LOD, mọi thẻ dùng chung geometry và texture (`SkeletonUtils.clone`).

## Cấu hình

```js
import { configure } from '@prm393/penguin-mascot-3d';
configure({ baseUrl: '/assets/3d/' });                 // tự host file .glb
configure({ urls: ['/a.glb', '/b.glb', '/c.glb'] });   // hoặc từng LOD
configure({ maxDpr: 1.5, maxPixels: 768 });            // máy yếu
```

Không nạp được model hoặc không có WebGL thì thẻ tự lùi về SVG và phát `rendererfallback`.

## React

```tsx
<PenguinMascot renderer="3d" state="happy" size={200} cap trackPointer onDone={(s) => console.log(s)} />
```

Gói 3D và three.js chỉ được nạp khi dùng `renderer="3d"` (import động), nên app không dùng 3D không phải trả phí dung lượng.

## Dùng `<model-viewer>` (không cần gói này)

Chỉ cần xem hoặc nhúng nhanh một clip (không có API trạng thái/hiệu ứng ẩn hiện nào ngoài `animation-name`):

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@google/model-viewer@4.0.0/dist/model-viewer.min.js"></script>
<model-viewer src="bipbip.glb" animation-name="wave" autoplay camera-controls shadow-intensity="1"></model-viewer>
```

Node hiệu ứng `fx_*` hiện/ẩn bằng clip nên cũng chạy được; không có `track-pointer` và mũ.

## Kiểm tra

`test/web-3d-driver.test.mjs` kiểm tra bộ điều khiển clip bằng mixer giả. Ví dụ chạy thật: `examples/web-3d` (`npm run dev -w @prm393/example-web-3d`).
