# BipBip cho Godot 4.x: gắn script này vào node gốc của cảnh `bipbip.glb` (kéo file .glb vào dự án, chọn "New Inherited Scene").
# Dùng:  $BipBip.play_state("happy")   (trạng thái lặp: idle, think, sleep, dance, walk, talk)
#        await $BipBip.finished        (với trạng thái một lần: wave, happy, celebrate, sad, surprised, no, yes, love, streak)
# CHƯA chạy thử trong Godot thật (môi trường dựng không có Godot); đối chiếu với tài liệu AnimationPlayer 4.x nếu API lệch.
extends Node3D

signal finished(state: StringName)

const LOOPING := [&"idle", &"think", &"sleep", &"dance", &"walk", &"talk"]
const FADE := 0.2
const HIDE_BELOW := 0.01   # node fx_* có scale nhỏ hơn thì tắt (đỡ draw call)

@export var cap := false                       # đội mũ tốt nghiệp
@export var look := Vector2.ZERO               # hướng nhìn của mắt, -1..1 (x phải, y lên)

var base: StringName = &"idle"
var _player: AnimationPlayer
var _toggles: Array[Node3D] = []
var _eyes: Array[Node3D] = []
var _skeleton: Skeleton3D

func _ready() -> void:
	_player = find_child("AnimationPlayer", true, false)
	var skeletons := find_children("*", "Skeleton3D", true, false)
	if skeletons.size() > 0:
		_skeleton = skeletons[0] as Skeleton3D
	for n in find_children("fx_*", "Node3D", true, false):
		_toggles.append(n)
	# Godot đọc loop theo tên clip; ở đây ta đặt chế độ lặp theo danh sách trạng thái.
	for name in _player.get_animation_list():
		var a := _player.get_animation(name)
		a.loop_mode = Animation.LOOP_LINEAR if name in LOOPING else Animation.LOOP_NONE
	_player.animation_finished.connect(_on_finished)
	play_state(base)

func play_state(state: StringName) -> void:
	if not _player.has_animation(state):
		state = &"idle"
	if state in LOOPING:
		base = state
	_player.play(state, FADE)

func _on_finished(anim: StringName) -> void:
	if anim in LOOPING:
		return
	_player.play(base, FADE)
	finished.emit(anim)

func _process(_dt: float) -> void:
	for n in _toggles:
		if n.name == &"fx_cap":
			n.scale = Vector3.ONE * (1.0 if cap else 0.001)
		n.visible = n.scale.x > HIDE_BELOW
	# mắt nhìn theo: xoay xương eye_l / eye_r (clip không chạm vào xoay của hai xương này)
	if _skeleton:
		for bone_name in ["eye_l", "eye_r"]:
			var i := _skeleton.find_bone(bone_name)
			if i >= 0:
				_skeleton.set_bone_pose_rotation(i, Quaternion.from_euler(Vector3(look.y * 0.3, look.x * 0.42, 0.0)))
