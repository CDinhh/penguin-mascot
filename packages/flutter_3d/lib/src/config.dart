/// Cấu hình chung cho [Mascot3D].
abstract final class Mascot3DConfig {
  /// Đường dẫn asset của LOD0, LOD1, LOD2. Mặc định là các file đi kèm gói này.
  static List<String> modelAssets = const [
    'packages/penguin_mascot_3d/assets/mascot/bipbip.glb',
    'packages/penguin_mascot_3d/assets/mascot/bipbip_lod1.glb',
    'packages/penguin_mascot_3d/assets/mascot/bipbip_lod2.glb',
  ];

  /// Chọn LOD theo số pixel thật của chiều rộng (0 = chi tiết nhất).
  static int lodForPixels(double px) => px > 260 ? 0 : (px > 110 ? 1 : 2);
}
