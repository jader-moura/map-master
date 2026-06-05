import { formatCountdown, type BossStatus } from "@/lib/gw2/bosses";

/** Ask the browser for notification permission. Returns the resulting state. */
export async function requestNotifyPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }
  if (Notification.permission !== "default") return Notification.permission;
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

export function notifyPermission(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission;
}

/** Short WebAudio beep — avoids shipping an audio asset. */
export function playBeep() {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = 880;
    const t = ctx.currentTime;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
    osc.start(t);
    osc.stop(t + 0.47);
    osc.onended = () => ctx.close();
  } catch {
    /* audio not available */
  }
}

/** Fire a desktop notification (if permitted) and optional sound for a spawn. */
export function fireSpawnAlert(status: BossStatus, sound: boolean) {
  if (
    typeof window !== "undefined" &&
    "Notification" in window &&
    Notification.permission === "granted"
  ) {
    new Notification(`${status.boss.name} spawning soon`, {
      body: `In ${formatCountdown(status.msUntilSpawn)} · ${status.boss.area}, ${status.boss.zone}`,
      icon: "/icon.svg",
      tag: `${status.boss.id}-${status.spawn.toISOString()}`,
    });
  }
  if (sound) playBeep();
}
