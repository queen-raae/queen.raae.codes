// Wires up every .log-player on the page: the home page's latest episode, an entry's own
// audio, and the Slow & Steady players that replace Transistor embeds in entries.
// `data-start` (seconds) is where the first play begins; one player plays at a time.
const pad = (n: number) => String(Math.floor(n)).padStart(2, "0");
const time = (s: number) => (isFinite(s) ? `${pad(s / 60)}:${pad(s % 60)}` : "--:--");

const all: HTMLAudioElement[] = [];

document.querySelectorAll<HTMLElement>(".log-player").forEach((player) => {
  if (player.dataset.ready) return;
  player.dataset.ready = "true";

  const src = player.dataset.src || "";
  const known = Number(player.dataset.duration) || 0;
  let position = Number(player.dataset.start) || 0;
  let loaded = false;

  const audio = new Audio();
  audio.preload = "none";
  all.push(audio);

  const button = player.querySelector<HTMLButtonElement>(".lp-play")!;
  const bar = player.querySelector<HTMLElement>(".lp-bar")!;
  const fill = player.querySelector<HTMLElement>(".lp-fill")!;
  const current = player.querySelector<HTMLElement>(".lp-current")!;
  const duration = player.querySelector<HTMLElement>(".lp-duration")!;
  const label = button.dataset.label;

  const total = () => audio.duration || known;
  const now = () => (loaded ? audio.currentTime : position);

  const render = () => {
    const length = total();
    const pct = length ? (now() / length) * 100 : 0;
    fill.style.width = `${pct}%`;
    bar.setAttribute("aria-valuenow", String(Math.round(pct)));
    current.textContent = time(now());
    if (audio.duration) duration.textContent = time(audio.duration);
  };

  const setPlaying = (playing: boolean) => {
    button.querySelector(".lp-icon-play")!.classList.toggle("hidden", playing);
    button.querySelector(".lp-icon-pause")!.classList.toggle("hidden", !playing);
    button.setAttribute("aria-label", `${playing ? "Pause" : "Play"}: ${label}`);
  };

  const load = () => {
    if (loaded) return;
    loaded = true;
    // A media fragment starts the download at the right spot, before the length is known
    audio.src = position > 0 ? `${src}#t=${Math.floor(position)}` : src;
  };

  button.addEventListener("click", () => {
    if (!audio.paused) return audio.pause();
    load();
    all.forEach((other) => other !== audio && other.pause());
    audio.play();
  });
  audio.addEventListener("play", () => setPlaying(true));
  audio.addEventListener("pause", () => setPlaying(false));
  audio.addEventListener("timeupdate", render);
  audio.addEventListener("loadedmetadata", () => {
    if (position > 0 && audio.currentTime < 1) audio.currentTime = position;
    render();
  });

  const seek = (ratio: number) => {
    const length = total();
    if (!length) return;
    const target = Math.min(Math.max(ratio, 0), 1) * length;
    if (loaded && audio.duration) audio.currentTime = target;
    else position = target;
    render();
  };

  bar.addEventListener("click", (event) => {
    const rect = bar.getBoundingClientRect();
    seek((event.clientX - rect.left) / rect.width);
  });

  bar.addEventListener("keydown", (event) => {
    const length = total();
    if (!length) return;
    if (event.key === "ArrowRight") seek((now() + 15) / length);
    if (event.key === "ArrowLeft") seek((now() - 15) / length);
  });

  render();
});
