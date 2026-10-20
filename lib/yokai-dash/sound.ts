/**
 * Web Audio sound engine for Yōkai Dash
 * Creates Japanese traditional instruments and arcade SFX procedurally
 */

class YokaiSoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public toggleMuted(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  /** Chime chuông đền (Suzu / Furin) khi chọn đúng cổng */
  public playCorrectGate() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // Hợp âm ngũ cung Nhật Bản (Hirajōshi scale: A, B, C, E, F)
      const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);

        gain.gain.setValueAtTime(0.2, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.6);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.65);
      });
    } catch {}
  }

  /** Trống Taiko trầm vang khi va chạm hoặc mất tim */
  public playTaikoHit() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.25);

      gain.gain.setValueAtTime(0.6, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch {}
  }

  /** Tiếng lướt gió (Swoosh) khi đổi làn hoặc trượt */
  public playDash() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(580, now + 0.08);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.13);
    } catch {}
  }

  /** Tiếng nhảy bổng lên không trung (Jump) */
  public playJump() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(650, now + 0.18);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.24);
    } catch {}
  }

  /** Phách gỗ Hyoshigi đếm ngược hoặc combo cao */
  public playHyoshigiClap() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(900, now + 0.05);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.09);
    } catch {}
  }

  /** Tiếng gõ nhẹ khi chọn nút giao diện */
  public playClick() {
    this.playHyoshigiClap();
  }

  /** Khúc nhạc thắng màn rạng rỡ (Stage Clear Fanfare) */
  public playVictory() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const notes = [
        { f: 523.25, t: 0.0 },  // C5
        { f: 587.33, t: 0.12 }, // D5
        { f: 659.25, t: 0.24 }, // E5
        { f: 783.99, t: 0.36 }, // G5
        { f: 880.0,  t: 0.48 }, // A5
        { f: 1046.5, t: 0.65 }, // C6
      ];

      const now = ctx.currentTime;
      notes.forEach((note) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(note.f, now + note.t);

        gain.gain.setValueAtTime(0.25, now + note.t);
        gain.gain.exponentialRampToValueAtTime(0.001, now + note.t + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + note.t);
        osc.stop(now + note.t + 0.45);
      });
    } catch {}
  }

  /** Âm thanh thất bại (Defeat gong) */
  public playDefeat() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const freqs = [330, 293, 246]; // E4, D4, B3
      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(f, now + i * 0.2);

        gain.gain.setValueAtTime(0.18, now + i * 0.2);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.2 + 0.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + i * 0.2);
        osc.stop(now + i * 0.2 + 0.55);
      });
    } catch {}
  }

  /** Tiếng chuông ngọc (Magatama / Spirit Orb) khi nhặt vật phẩm trên đường chạy */
  public playCollectOrb() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const freqs = [880, 1318.5]; // A5 -> E6
      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(f, now + idx * 0.045);

        gain.gain.setValueAtTime(0.16, now + idx * 0.045);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.045 + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.045);
        osc.stop(now + idx * 0.045 + 0.28);
      });
    } catch {}
  }

  /** Tiếng né chuẩn xác (Perfect Dodge) - Phách gỗ kết hợp tiếng chuông ngân */
  public playPerfectDodge() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "triangle";
      osc1.frequency.setValueAtTime(659.25, now); // E5
      osc1.frequency.exponentialRampToValueAtTime(1174.66, now + 0.14); // D6

      gain1.gain.setValueAtTime(0.22, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.24);
    } catch {}
  }

  /** Tiếng tiếp đất nhẹ khi nhảy xong (Landing thud) */
  public playLandDust() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.09);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } catch {}
  }

  /** Tiếng gầm trầm của Yōkai truy đuổi phía sau khi áp sát */
  public playChaserGrowl() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(85, now);
      osc.frequency.linearRampToValueAtTime(52, now + 0.35);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.42);
    } catch {}
  }
}

export const yokaiSound = new YokaiSoundEngine();


