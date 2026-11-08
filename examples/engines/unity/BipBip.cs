// BipBip cho Unity (glTFast): gắn vào GameObject gốc sau khi kéo bipbip.glb vào dự án (glTFast nhập clip dạng Legacy Animation).
// Dùng:  bipbip.Play("happy");  hoặc  yield return bipbip.PlayAndWait("wave");
// CHƯA chạy thử trong Unity thật (môi trường dựng không có Unity); nếu clip nhập dạng Mecanim thì thay phần Animation bằng Animator.CrossFade.
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

[RequireComponent(typeof(Animation))]
public class BipBip : MonoBehaviour
{
    static readonly HashSet<string> Looping = new() { "idle", "think", "sleep", "dance", "walk", "talk" };
    const float Fade = 0.2f;
    const float HideBelow = 0.01f; // node fx_* có scale nhỏ hơn thì tắt renderer

    public bool cap;                                   // đội mũ tốt nghiệp
    [Range(-1, 1)] public float lookX, lookY;          // hướng nhìn của mắt
    string baseState = "idle";
    Animation anim;
    readonly List<Transform> toggles = new();
    readonly List<Transform> eyes = new();
    string pendingOneShot;

    void Awake()
    {
        anim = GetComponent<Animation>();
        foreach (AnimationState s in anim)
            s.wrapMode = Looping.Contains(s.name) ? WrapMode.Loop : WrapMode.ClampForever;
        foreach (var t in GetComponentsInChildren<Transform>(true))
        {
            if (t.name.StartsWith("fx_")) toggles.Add(t);
            if (t.name == "eye_l" || t.name == "eye_r") eyes.Add(t);
        }
        Play(baseState);
    }

    public void Play(string state)
    {
        if (anim[state] == null) state = "idle";
        if (Looping.Contains(state)) { baseState = state; pendingOneShot = null; }
        else pendingOneShot = state;
        anim.CrossFade(state, Fade);
    }

    public IEnumerator PlayAndWait(string state)
    {
        Play(state);
        if (Looping.Contains(state)) yield break;
        yield return new WaitForSeconds(anim[state].length);
        if (pendingOneShot == state) { pendingOneShot = null; anim.CrossFade(baseState, Fade); }
    }

    void LateUpdate()
    {
        if (pendingOneShot != null && !anim.IsPlaying(pendingOneShot)) { pendingOneShot = null; anim.CrossFade(baseState, Fade); }
        foreach (var t in toggles)
        {
            if (t.name == "fx_cap") t.localScale = Vector3.one * (cap ? 1f : 0.001f);
            var r = t.GetComponent<Renderer>();
            if (r) r.enabled = t.localScale.x > HideBelow;
        }
        // Clip không chạm vào xoay của eye_l/eye_r nên đặt ở LateUpdate là đủ
        foreach (var e in eyes) e.localRotation = Quaternion.Euler(lookY * 17f, lookX * 24f, 0f);
    }
}
