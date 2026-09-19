// Native OS notifications (Windows Action Center / Ubuntu libnotify, via the
// browser) for order events, alongside the in-app toast. Only fires while the
// app is open in a tab (foreground or background) — there is no Service
// Worker/Push subscription, so this cannot notify with the tab/browser closed.

export function ensureNotificationPermission(): void {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "default")
    void Notification.requestPermission();
}

export function showBrowserNotification(
  title: string,
  body: string,
  tag: string,
): void {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  const notification = new Notification(title, {
    body,
    tag,
    icon: "/favicon.ico",
  });
  notification.onclick = () => {
    window.focus();
    notification.close();
  };
}
