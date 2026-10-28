const KEY = "svp-play-login-wave";

export function markLoginWave() {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(KEY, "1");
}

export function consumeLoginWave() {
  if (typeof window === "undefined") return false;
  const play = window.sessionStorage.getItem(KEY) === "1";
  if (play) window.sessionStorage.removeItem(KEY);
  return play;
}
