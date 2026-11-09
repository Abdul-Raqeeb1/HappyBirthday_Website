// Personalize the entire surprise from this one block. Leave video/music paths empty to use built-in fallbacks.
const birthdayConfig = {
  name: "Alex",
  birthday: new Date().toISOString().slice(0, 10),
  password: "birthday",
  birthdayMessage: "Happy Birthday to the most special person! ❤️\n\nYou are one of those beautiful people who make the world brighter just by being in it.\n\nMay every dream of yours come true.\n\nMay your smile never fade.\n\nAnd may this new year of your life bring endless happiness, love, and unforgettable memories.\n\nToday is your day. Enjoy every second of it. 💖",
  gallery: [
    { image: "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=900&q=82", alt: "A colorful party with bright balloons", caption: "the days that sparkle" },
    { image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=82", alt: "Friends celebrating together beneath party lights", caption: "your favorite people" },
    { image: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=900&q=82", alt: "A birthday cake ready for candles and wishes", caption: "one more reason to celebrate" },
  ],
  backgroundVideo: "",
  surpriseVideo: "",
  music: "",
  theme: { pink: "#e65d88", purple: "#a85bd1", gold: "#f0bf5b" },
  answerMessages: {
    special: "You make ordinary days feel like something worth remembering. Never forget that. 💗",
    tellMore: "You're kind, one of a kind, and loved more than this little page could ever say. 🥹",
    ready: "That's the energy! Your surprise is about to get delightfully dramatic. 💖",
    curious: "Curiosity suits you. A tiny bit of magic is just around the corner. 🎁",
  },
};

const DEFAULT_NAME = birthdayConfig.name;
const DEFAULT_BIRTHDAY = birthdayConfig.birthday;
const MUSIC_URL = birthdayConfig.music;
const birthdayMessage = birthdayConfig.birthdayMessage;
const letterMessage = birthdayConfig.birthdayMessage;

const nameNodes = document.querySelectorAll("[data-person-name]");
const personInput = document.querySelector("#person-input");
const birthdayInput = document.querySelector("#birthday-input");
const detailsDialog = document.querySelector("#details-dialog");
const wishDialog = document.querySelector("#wish-dialog");
const lightboxDialog = document.querySelector("#lightbox-dialog");
const messageNode = document.querySelector("#birthday-message");
const confettiLayer = document.querySelector("#confetti-layer");
const toast = document.querySelector("#toast");
const galleryCards = [...document.querySelectorAll(".memory-card")];

const query = new URLSearchParams(window.location.search);
const storedName = safeLoad("birthday-name");
const storedBirthday = safeLoad("birthday-date");
let personName = query.get("name") || storedName || DEFAULT_NAME;
let birthday = query.get("birthday") || storedBirthday || DEFAULT_BIRTHDAY;
let messageTimer = null;
let toastTimer = null;
let galleryIndex = 0;
let galleryTimer = null;
let galleryPaused = false;
let musicPlaying = false;
let audioContext = null;
let melodyTimer = null;
let externalAudio = null;
let noteIndex = 0;
let messageStarted = false;
let letterTypingTimer = null;
let threeCake = null;
let threeFireworks = null;
let threeAnimationFrame = null;
let lastFireworkAt = 0;
let prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

document.documentElement.style.setProperty("--pink", birthdayConfig.theme.pink);
document.documentElement.style.setProperty("--purple", birthdayConfig.theme.purple);
document.documentElement.style.setProperty("--gold", birthdayConfig.theme.gold);

function showGateScreen(name) {
  document.querySelectorAll("[data-gate-screen]").forEach((screen) => {
    if (window.gsap) {
      window.gsap.killTweensOf(screen);
      window.gsap.set(screen, { clearProps: "opacity,transform" });
    }
    const active = screen.dataset.gateScreen === name;
    screen.classList.toggle("is-active", active);
    screen.setAttribute("aria-hidden", String(!active));
    if (active && window.gsap && !prefersReducedMotion) {
      window.gsap.fromTo(screen, { opacity: 0, scale: 0.96, y: 18 }, {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 0.62,
        ease: "power3.out",
        onComplete: () => window.gsap.set(screen, { clearProps: "opacity,transform" }),
      });
    }
  });
}

function playUnlockSound() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    audioContext ||= new AudioContextClass();
    audioContext.resume();
    [659.25, 880, 1318.5].forEach((frequency, index) => {
      const start = audioContext.currentTime + index * 0.11;
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.12, start + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.35);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.36);
    });
  } catch {
    showToast("Sound is unavailable, but the surprise is still yours.");
  }
}

function unlockGallery() {
  const gate = document.querySelector("#gate-flow");
  playUnlockSound();
  launchConfetti(100);
  gate.classList.add("is-leaving");
  document.body.classList.remove("is-locked");
  window.setTimeout(() => {
    gate.hidden = true;
    document.querySelector("#memories").scrollIntoView({ behavior: "smooth", block: "start" });
  }, 520);
}

document.querySelector("#gate-open").addEventListener("click", () => showGateScreen("day-question"));

document.querySelectorAll("[data-day-answer]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelector("#day-feedback").textContent = button.dataset.dayAnswer === "yes"
      ? birthdayConfig.answerMessages.special
      : birthdayConfig.answerMessages.tellMore;
    document.querySelector("#day-feedback").classList.add("is-visible");
    launchConfetti(24);
    window.setTimeout(() => showGateScreen("ready-question"), 1750);
  });
});

document.querySelectorAll("[data-ready-answer]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelector("#ready-feedback").textContent = button.dataset.readyAnswer === "yes"
      ? birthdayConfig.answerMessages.ready
      : birthdayConfig.answerMessages.curious;
    document.querySelector("#ready-feedback").classList.add("is-visible");
    launchConfetti(34);
    window.setTimeout(() => showGateScreen("gift"), 1750);
  });
});

document.querySelector("#open-gift").addEventListener("click", (event) => {
  const button = event.currentTarget;
  const giftScreen = button.closest(".gift-screen");
  button.disabled = true;
  giftScreen.classList.add("is-opening");
  document.querySelector("#gift-feedback").textContent = "A little magic, coming right up... ✨";
  playUnlockSound();
  launchConfetti(110);
  window.setTimeout(() => {
    giftScreen.classList.remove("is-opening");
    button.disabled = false;
    showGateScreen("password");
  }, 1050);
});

document.querySelector("#password-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const input = document.querySelector("#secret-password");
  const lock = document.querySelector("#lock-icon");
  const error = document.querySelector("#password-error");
  if (input.value.trim() === birthdayConfig.password) {
    error.textContent = "";
    lock.textContent = "🔓";
    lock.classList.add("is-unlocked");
    window.setTimeout(unlockGallery, 420);
    return;
  }

  lock.classList.remove("is-shaking");
  void lock.offsetWidth;
  lock.classList.add("is-shaking");
  error.textContent = "Oops! Wrong password 😜 Try again!";
  input.select();
});

document.querySelectorAll(".memory-image-wrap img").forEach((image) => {
  image.tabIndex = 0;
  image.setAttribute("role", "button");
  image.setAttribute("aria-label", `Open photo: ${image.alt}`);
  const openPhoto = () => {
    const caption = image.closest("figure").querySelector("figcaption span").textContent;
    document.querySelector("#lightbox-image").src = image.currentSrc || image.src;
    document.querySelector("#lightbox-image").alt = image.alt;
    document.querySelector("#lightbox-caption").textContent = caption;
    lightboxDialog.showModal();
  };
  image.addEventListener("click", openPhoto);
  image.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openPhoto();
    }
  });
});

document.querySelector("#lightbox-close").addEventListener("click", () => lightboxDialog.close());
lightboxDialog.addEventListener("click", (event) => {
  if (event.target === lightboxDialog) lightboxDialog.close();
});

function configureGallery() {
  galleryCards.forEach((card, index) => {
    const photo = birthdayConfig.gallery[index];
    if (!photo) return;
    const image = card.querySelector("img");
    image.src = photo.image;
    image.alt = photo.alt;
    const caption = card.querySelector("figcaption span:first-child");
    caption.textContent = photo.caption;
    image.addEventListener("error", () => {
      card.querySelector(".memory-image-wrap").classList.add("is-empty");
      image.hidden = true;
    }, { once: true });
  });
}

function configureVideos() {
  const backgroundVideo = document.querySelector("#birthday-background");
  if (birthdayConfig.backgroundVideo) {
    backgroundVideo.src = birthdayConfig.backgroundVideo;
    backgroundVideo.load();
    backgroundVideo.addEventListener("error", () => showToast("The background video could not be loaded."), { once: true });
  }

  const surpriseVideo = document.querySelector("#surprise-video");
  if (!birthdayConfig.surpriseVideo) return;
  const frame = document.querySelector("#video-frame");
  surpriseVideo.src = birthdayConfig.surpriseVideo;
  surpriseVideo.load();
  frame.classList.add("has-video");
  document.querySelector("#video-controls").hidden = false;
  surpriseVideo.addEventListener("error", () => {
    frame.classList.remove("has-video");
    document.querySelector("#video-controls").hidden = true;
    showToast("The birthday video could not be loaded. Check its file path.");
  }, { once: true });
}

function typeLetter() {
  const node = document.querySelector("#letter-message");
  window.clearInterval(letterTypingTimer);
  node.textContent = "";
  if (prefersReducedMotion) {
    node.textContent = letterMessage;
    return;
  }
  let index = 0;
  letterTypingTimer = window.setInterval(() => {
    node.textContent += letterMessage[index] || "";
    index += 1;
    if (index >= letterMessage.length) window.clearInterval(letterTypingTimer);
  }, prefersReducedMotion ? 0 : 20);
}

document.querySelector("#open-letter").addEventListener("click", (event) => {
  const stage = document.querySelector(".letter-stage");
  if (stage.classList.contains("is-open")) return;
  stage.classList.add("is-open");
  event.currentTarget.setAttribute("aria-expanded", "true");
  document.querySelector("#letter-paper").setAttribute("aria-hidden", "false");
  typeLetter();
  launchConfetti(24);
});

const surpriseVideo = document.querySelector("#surprise-video");
document.querySelector("#video-play").addEventListener("click", async () => {
  if (surpriseVideo.paused) {
    try {
      await surpriseVideo.play();
      document.querySelector("#video-play").textContent = "Ⅱ";
      document.querySelector("#video-play").setAttribute("aria-label", "Pause video");
    } catch {
      showToast("The video could not be played. Check the file path.");
    }
  } else {
    surpriseVideo.pause();
    document.querySelector("#video-play").textContent = "▶";
    document.querySelector("#video-play").setAttribute("aria-label", "Play video");
  }
});
document.querySelector("#video-sound").addEventListener("click", (event) => {
  surpriseVideo.muted = !surpriseVideo.muted;
  event.currentTarget.textContent = surpriseVideo.muted ? "Sound off" : "Sound on";
  event.currentTarget.setAttribute("aria-pressed", String(!surpriseVideo.muted));
  event.currentTarget.setAttribute("aria-label", surpriseVideo.muted ? "Unmute video" : "Mute video");
});
document.querySelector("#video-fullscreen").addEventListener("click", () => {
  const frame = document.querySelector("#video-frame");
  if (document.fullscreenElement) document.exitFullscreen();
  else frame.requestFullscreen?.();
});

function createScene(canvas, section, cameraPosition) {
  if (!window.THREE || !canvas) return null;
  try {
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "low-power" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.outputEncoding = THREE.sRGBEncoding;
    const canvasWidth = canvas.clientWidth || section.clientWidth;
    const canvasHeight = canvas.clientHeight || section.clientHeight;
    renderer.setSize(canvasWidth, canvasHeight, false);
    renderer.shadowMap.enabled = true;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, canvasWidth / canvasHeight, 0.1, 100);
    camera.position.set(...cameraPosition);
    camera.lookAt(0, 0, 0);
    const resizeObserver = new ResizeObserver(() => {
      const width = canvas.clientWidth || section.clientWidth;
      const height = canvas.clientHeight || section.clientHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    });
    resizeObserver.observe(canvas);
    return { renderer, scene, camera };
  } catch {
    return null;
  }
}

function createThreeCake() {
  const section = document.querySelector("#wish");
  const setup = createScene(document.querySelector("#cake-canvas"), section, [0, 3.3, 8.5]);
  if (!setup) return;
  section.classList.add("has-3d-cake");
  const { scene, camera, renderer } = setup;
  scene.add(new THREE.AmbientLight(0xffe6f4, 0.32));
  const keyLight = new THREE.DirectionalLight(0xffd18a, 0.9);
  keyLight.position.set(-4, 8, 6);
  scene.add(keyLight);
  const fillLight = new THREE.PointLight(0xe787ff, 3.5, 20);
  fillLight.position.set(4, 2, 2);
  scene.add(fillLight);

  const cake = new THREE.Group();
  scene.add(cake);
  const cakeShadow = new THREE.Mesh(new THREE.CircleGeometry(1.95, 48), new THREE.MeshBasicMaterial({ color: 0x321427, transparent: true, opacity: 0.22, depthWrite: false }));
  cakeShadow.rotation.x = -Math.PI / 2;
  cakeShadow.scale.set(1, 0.7, 1);
  cakeShadow.position.y = -1.14;
  cake.add(cakeShadow);
  const layers = [
    { radius: 1.62, height: 0.7, y: -0.75, color: 0xd95386 },
    { radius: 1.26, height: 0.67, y: -0.08, color: 0xe87da8 },
    { radius: 0.89, height: 0.62, y: 0.55, color: 0xf1a9b5 },
  ];
  layers.forEach((layer) => {
    const base = new THREE.Mesh(new THREE.CylinderGeometry(layer.radius, layer.radius, layer.height, 48), new THREE.MeshStandardMaterial({ color: layer.color, roughness: 0.34 }));
    base.position.y = layer.y;
    base.castShadow = true;
    base.receiveShadow = true;
    cake.add(base);
    const icing = new THREE.Mesh(new THREE.CylinderGeometry(layer.radius + 0.045, layer.radius + 0.045, 0.13, 48), new THREE.MeshStandardMaterial({ color: 0xffe4dc, roughness: 0.32 }));
    icing.position.y = layer.y + layer.height * 0.46;
    cake.add(icing);
  });

  const flames = [];
  const candles = 5;
  for (let index = 0; index < candles; index += 1) {
    const angle = (index / candles) * Math.PI * 2;
    const x = Math.cos(angle) * 0.56;
    const z = Math.sin(angle) * 0.56;
    const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.065, 0.6, 12), new THREE.MeshStandardMaterial({ color: index % 2 ? 0xf4b0cd : 0xffdd85, roughness: 0.45 }));
    candle.position.set(x, 1.18, z);
    cake.add(candle);
    const flame = new THREE.Mesh(new THREE.SphereGeometry(0.105, 12, 12), new THREE.MeshBasicMaterial({ color: 0xffc64d }));
    flame.scale.set(0.72, 1.4, 0.72);
    flame.position.set(x, 1.56, z);
    cake.add(flame);
    flames.push(flame);
  }

  for (let index = 0; index < 8; index += 1) {
    const angle = (index / 8) * Math.PI * 2;
    const berry = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 12), new THREE.MeshStandardMaterial({ color: 0xc92f50, roughness: 0.34 }));
    berry.scale.set(0.8, 1.15, 0.8);
    berry.position.set(Math.cos(angle) * 1.05, 0.36, Math.sin(angle) * 1.05);
    cake.add(berry);
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.16, 5), new THREE.MeshStandardMaterial({ color: 0x70a96c, roughness: 0.55 }));
    leaf.position.set(berry.position.x, 0.53, berry.position.z);
    cake.add(leaf);
  }
  threeCake = { ...setup, cake, flames, smoke: [] };
  renderer.render(scene, camera);
}

function createThreeFireworks() {
  const section = document.querySelector("#finale");
  const setup = createScene(document.querySelector("#fireworks-canvas"), section, [0, 0, 12]);
  if (!setup) return;
  setup.camera.fov = 52;
  setup.camera.updateProjectionMatrix();
  sceneLights(setup.scene);
  threeFireworks = { ...setup, bursts: [] };
}

function sceneLights(scene) {
  scene.add(new THREE.AmbientLight(0xffffff, 1.2));
}

function createFireworkBurst() {
  if (!threeFireworks) return;
  const { scene } = threeFireworks;
  const count = 95;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const velocities = [];
  const color = new THREE.Color().setHSL(Math.random(), 0.82, 0.64);
  const origin = new THREE.Vector3((Math.random() - 0.5) * 9, (Math.random() - 0.5) * 4.5, (Math.random() - 0.5) * 2);
  for (let index = 0; index < count; index += 1) {
    positions[index * 3] = origin.x;
    positions[index * 3 + 1] = origin.y;
    positions[index * 3 + 2] = origin.z;
    colors[index * 3] = color.r;
    colors[index * 3 + 1] = color.g;
    colors[index * 3 + 2] = color.b;
    const direction = new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 1.3 - 0.65).normalize();
    velocities.push(direction.multiplyScalar(1.3 + Math.random() * 2.8));
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  const particles = new THREE.Points(geometry, new THREE.PointsMaterial({ size: 0.075, vertexColors: true, transparent: true, opacity: 1, blending: THREE.AdditiveBlending, depthWrite: false }));
  scene.add(particles);
  threeFireworks.bursts.push({ particles, velocities, age: 0 });
}

function updateThreeScenes(time) {
  if (document.hidden) {
    threeAnimationFrame = window.requestAnimationFrame(updateThreeScenes);
    return;
  }
  if (threeCake && document.querySelector("#wish").getBoundingClientRect().top < window.innerHeight && document.querySelector("#wish").getBoundingClientRect().bottom > 0) {
    if (!prefersReducedMotion) threeCake.cake.rotation.y += 0.004;
    threeCake.cake.position.y = prefersReducedMotion ? 0 : Math.sin(time * 0.001) * 0.055;
    threeCake.renderer.render(threeCake.scene, threeCake.camera);
    threeCake.smoke = threeCake.smoke.filter((puff) => {
      puff.life += 0.016;
      puff.mesh.position.y += 0.012;
      puff.mesh.material.opacity = Math.max(0, 0.35 - puff.life * 0.28);
      if (puff.life > 1.2) {
        threeCake.cake.remove(puff.mesh);
        puff.mesh.geometry.dispose();
        puff.mesh.material.dispose();
        return false;
      }
      return true;
    });
  }
  if (threeFireworks && document.querySelector("#finale").getBoundingClientRect().top < window.innerHeight && document.querySelector("#finale").getBoundingClientRect().bottom > 0) {
    if (!prefersReducedMotion && time - lastFireworkAt > 1450) {
      createFireworkBurst();
      lastFireworkAt = time;
    }
    threeFireworks.bursts = threeFireworks.bursts.filter((burst) => {
      burst.age += 0.016;
      const positions = burst.particles.geometry.attributes.position.array;
      burst.velocities.forEach((velocity, index) => {
        positions[index * 3] += velocity.x * 0.016;
        positions[index * 3 + 1] += velocity.y * 0.016 - burst.age * 0.0018;
        positions[index * 3 + 2] += velocity.z * 0.016;
      });
      burst.particles.geometry.attributes.position.needsUpdate = true;
      burst.particles.material.opacity = Math.max(0, 1 - burst.age / 1.5);
      if (burst.age > 1.55) {
        threeFireworks.scene.remove(burst.particles);
        burst.particles.geometry.dispose();
        burst.particles.material.dispose();
        return false;
      }
      return true;
    });
    threeFireworks.renderer.render(threeFireworks.scene, threeFireworks.camera);
  }
  threeAnimationFrame = window.requestAnimationFrame(updateThreeScenes);
}

function initializeThree() {
  if (!window.THREE) return;
  createThreeCake();
  createThreeFireworks();
  if (threeCake || threeFireworks) threeAnimationFrame = window.requestAnimationFrame(updateThreeScenes);
}

function safeSave(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    showToast("Your changes will stay for this visit.");
  }
}

function safeLoad(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function dateForInput(date) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function renderPersonalization() {
  nameNodes.forEach((node) => {
    node.textContent = personName;
  });
  personInput.value = personName;
  birthdayInput.value = birthday;
  updateCountdown();
}

function updateCountdown() {
  if (!birthdayInput.value) return;
  const [year, month, day] = birthdayInput.value.split("-").map(Number);
  const today = new Date();
  const target = new Date(today.getFullYear(), month - 1, day);
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (target < todayMidnight) target.setFullYear(today.getFullYear() + 1);

  const daysUntil = Math.round((target - todayMidnight) / 86_400_000);
  const dateLabel = new Intl.DateTimeFormat(undefined, { month: "long", day: "numeric" }).format(new Date(year, month - 1, day));
  const title = document.querySelector("#countdown-title");
  const subtitle = document.querySelector("#birthday-date-label");
  const value = document.querySelector("#countdown-value");

  subtitle.textContent = `Their special day: ${dateLabel}`;
  if (daysUntil === 0) {
    title.textContent = "It’s the big day!";
    value.textContent = "Today ✨";
  } else {
    title.textContent = `Counting down to ${personName}’s day`;
    value.textContent = `${daysUntil} ${daysUntil === 1 ? "day" : "days"}`;
  }
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 2800);
}

function launchConfetti(amount = 90) {
  if (typeof window.confetti === "function") {
    window.confetti({ particleCount: amount, spread: 78, startVelocity: 38, origin: { y: 0.64 }, colors: [birthdayConfig.theme.pink, birthdayConfig.theme.purple, birthdayConfig.theme.gold, "#fff0c1"] });
    return;
  }
  const colors = ["#e8688b", "#f2bf57", "#a9d8e6", "#c5a5e5", "#ff9b80", "#fff0c1"];
  const fragment = document.createDocumentFragment();
  for (let index = 0; index < amount; index += 1) {
    const piece = document.createElement("span");
    const angle = Math.random() * Math.PI * 2;
    const distance = 90 + Math.random() * Math.min(window.innerWidth * 0.48, 390);
    piece.className = "confetti-piece";
    piece.style.setProperty("--confetti-x", `${Math.cos(angle) * distance}px`);
    piece.style.setProperty("--confetti-y", `${Math.sin(angle) * distance + 130}px`);
    piece.style.setProperty("--confetti-spin", `${Math.random() * 900 - 450}deg`);
    piece.style.setProperty("--confetti-color", colors[Math.floor(Math.random() * colors.length)]);
    piece.style.setProperty("--confetti-duration", `${1.2 + Math.random() * 1.1}s`);
    fragment.append(piece);
  }
  confettiLayer.replaceChildren(fragment);
  window.setTimeout(() => confettiLayer.replaceChildren(), 2600);
}

function startTypingMessage() {
  window.clearInterval(messageTimer);
  messageNode.classList.remove("is-complete");
  messageNode.textContent = "";
  let characterIndex = 0;
  messageTimer = window.setInterval(() => {
    messageNode.textContent += birthdayMessage[characterIndex];
    characterIndex += 1;
    if (characterIndex >= birthdayMessage.length) {
      window.clearInterval(messageTimer);
      messageNode.classList.add("is-complete");
    }
  }, 24);
}

function openSurprise() {
  document.querySelector("#surprise").scrollIntoView({ behavior: "smooth", block: "start" });
  startTypingMessage();
  launchConfetti(100);
}

function changeGallery(direction) {
  galleryCards[galleryIndex].classList.remove("is-active");
  galleryIndex = (galleryIndex + direction + galleryCards.length) % galleryCards.length;
  galleryCards[galleryIndex].classList.add("is-active");
  document.querySelector("#gallery-current").textContent = String(galleryIndex + 1).padStart(2, "0");
}

function runGallery() {
  window.clearInterval(galleryTimer);
  galleryTimer = window.setInterval(() => {
    if (!galleryPaused && !document.hidden) changeGallery(1);
  }, 4200);
}

function setMusicButton() {
  const toggle = document.querySelector("#music-toggle");
  toggle.classList.toggle("is-playing", musicPlaying);
  toggle.setAttribute("aria-pressed", String(musicPlaying));
  toggle.title = musicPlaying ? "Pause birthday music" : "Play birthday music";
  toggle.querySelector(".music-label").textContent = musicPlaying ? "Music on" : "Music off";
}

function scheduleNote() {
  if (!audioContext || !musicPlaying) return;
  const melody = [523.25, 523.25, 587.33, 523.25, 698.46, 659.25, 523.25, 523.25, 587.33, 523.25, 783.99, 698.46];
  const frequency = melody[noteIndex % melody.length];
  const now = audioContext.currentTime;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.08, now + 0.025);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.34);

  if (noteIndex % 6 === 0) {
    const harmony = audioContext.createOscillator();
    const harmonyGain = audioContext.createGain();
    harmony.type = "sine";
    harmony.frequency.value = frequency / 2;
    harmonyGain.gain.setValueAtTime(0.0001, now);
    harmonyGain.gain.exponentialRampToValueAtTime(0.018, now + 0.06);
    harmonyGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.46);
    harmony.connect(harmonyGain);
    harmonyGain.connect(audioContext.destination);
    harmony.start(now);
    harmony.stop(now + 0.48);
  }
  noteIndex += 1;
}

async function toggleMusic() {
  if (musicPlaying) {
    musicPlaying = false;
    window.clearInterval(melodyTimer);
    if (externalAudio) externalAudio.pause();
    if (audioContext?.state === "running") await audioContext.suspend();
    setMusicButton();
    return;
  }

  try {
    if (MUSIC_URL) {
      externalAudio ||= new Audio(MUSIC_URL);
      externalAudio.loop = true;
      await externalAudio.play();
    } else {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) throw new Error("Audio is not supported in this browser.");
      audioContext ||= new AudioContextClass();
      await audioContext.resume();
      noteIndex = 0;
      scheduleNote();
      melodyTimer = window.setInterval(scheduleNote, 390);
    }
    musicPlaying = true;
    setMusicButton();
  } catch {
    musicPlaying = false;
    setMusicButton();
    showToast("Birthday music could not be played in this browser.");
  }
}

function updateShareUrl() {
  const url = new URL(window.location.href);
  url.searchParams.set("name", personName);
  url.searchParams.set("birthday", birthday);
  return url.toString();
}

async function shareSurprise() {
  const shareData = { title: `Happy Birthday, ${personName}!`, text: "A little birthday surprise, made just for you.", url: updateShareUrl() };
  try {
    if (navigator.share) {
      await navigator.share(shareData);
    } else if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(shareData.url);
      showToast("Your personalized surprise link is copied.");
    } else {
      showToast("Copy the address bar to share this surprise.");
    }
  } catch (error) {
    if (error.name !== "AbortError") showToast("This surprise is ready to share from the address bar.");
  }
}

function setCandlesLit(lit) {
  document.querySelectorAll(".flame, .wish-flame").forEach((flame) => {
    flame.style.opacity = lit ? "1" : "0";
    flame.style.transform = lit ? "scale(1)" : "scale(.2)";
  });
  document.querySelector(".wish-cake").classList.toggle("is-out", !lit);
  if (threeCake) {
    threeCake.flames.forEach((flame) => { flame.visible = lit; });
    if (!lit) {
      threeCake.flames.forEach((flame) => {
        const puff = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), new THREE.MeshBasicMaterial({ color: 0xe9d7e8, transparent: true, opacity: 0.35 }));
        puff.position.set(flame.position.x, 1.77, flame.position.z);
        threeCake.cake.add(puff);
        threeCake.smoke.push({ mesh: puff, life: 0 });
      });
    }
  }
}

document.querySelector("#open-surprise").addEventListener("click", openSurprise);
document.querySelector("#edit-details").addEventListener("click", () => {
  personInput.value = personName;
  birthdayInput.value = birthday;
  detailsDialog.showModal();
});

document.querySelector("#details-form").addEventListener("submit", (event) => {
  event.preventDefault();
  personName = personInput.value.trim() || DEFAULT_NAME;
  birthday = birthdayInput.value || DEFAULT_BIRTHDAY;
  safeSave("birthday-name", personName);
  safeSave("birthday-date", birthday);
  renderPersonalization();
  detailsDialog.close();
  showToast(`Made with love for ${personName}.`);
});

document.querySelectorAll("[data-close-dialog]").forEach((button) => {
  button.addEventListener("click", () => button.closest("dialog").close());
});

document.querySelector("#wish-button").addEventListener("click", () => wishDialog.showModal());
document.querySelector("#make-cake-wish").addEventListener("click", () => {
  document.querySelector("#wish").classList.add("is-glowing");
  window.setTimeout(() => document.querySelector("#wish").classList.remove("is-glowing"), 950);
  launchConfetti(38);
  wishDialog.showModal();
});
document.querySelector("#wish-done").addEventListener("click", () => {
  wishDialog.close();
  showToast("Your wish is on its way. ✨");
  launchConfetti(45);
});

document.querySelector("#blow-candles").addEventListener("click", (event) => {
  setCandlesLit(false);
  document.querySelector("#wish").classList.add("is-glowing");
  window.setTimeout(() => document.querySelector("#wish").classList.remove("is-glowing"), 950);
  event.currentTarget.disabled = true;
  event.currentTarget.innerHTML = "Wish made <span aria-hidden=\"true\">♡</span>";
  document.querySelector("#wish-result").textContent = "Your wish will come true! ✨";
  launchConfetti(110);
});

document.querySelector("#finale-button").addEventListener("click", () => {
  document.querySelector("#finale").scrollIntoView({ behavior: "smooth", block: "start" });
  launchConfetti(130);
  if (!prefersReducedMotion) createFireworkBurst();
});

document.querySelector("#finale-video-button").addEventListener("click", () => {
  document.querySelector("#video-surprise").scrollIntoView({ behavior: "smooth", block: "start" });
});

document.querySelector("#video-next").addEventListener("click", () => {
  document.querySelector("#final-screen").scrollIntoView({ behavior: "smooth", block: "start" });
  launchConfetti(80);
});

document.querySelector("#restart-button").addEventListener("click", () => {
  surpriseVideo.pause();
  surpriseVideo.currentTime = 0;
  surpriseVideo.muted = true;
  document.querySelector("#video-play").textContent = "▶";
  document.querySelector("#video-play").setAttribute("aria-label", "Play video");
  document.querySelector("#video-sound").textContent = "Sound off";
  document.querySelector("#video-sound").setAttribute("aria-pressed", "false");
  setCandlesLit(true);
  const candleButton = document.querySelector("#blow-candles");
  candleButton.disabled = false;
  candleButton.innerHTML = "Blow the candles <span aria-hidden=\"true\">🎂</span>";
  document.querySelector("#wish-result").textContent = "";
  messageNode.textContent = "";
  messageNode.classList.remove("is-complete");
  detailsDialog.close();
  wishDialog.close();
  document.querySelector(".letter-stage").classList.remove("is-open");
  document.querySelector("#open-letter").setAttribute("aria-expanded", "false");
  document.querySelector("#letter-paper").setAttribute("aria-hidden", "true");
  document.querySelector("#letter-message").textContent = "";
  window.clearInterval(letterTypingTimer);
  messageStarted = false;
  document.querySelector("#day-feedback").textContent = "";
  document.querySelector("#day-feedback").classList.remove("is-visible");
  document.querySelector("#ready-feedback").textContent = "";
  document.querySelector("#ready-feedback").classList.remove("is-visible");
  document.querySelector("#gift-feedback").textContent = "";
  document.querySelector(".gift-screen").classList.remove("is-opening");
  document.querySelector("#lock-icon").textContent = "🔐";
  document.querySelector("#lock-icon").classList.remove("is-unlocked", "is-shaking");
  document.querySelector("#password-error").textContent = "";
  document.querySelector("#secret-password").value = "";
  document.querySelector("#gate-flow").hidden = false;
  document.querySelector("#gate-flow").classList.remove("is-leaving");
  showGateScreen("intro");
  document.body.classList.add("is-locked");
  revealObserver.observe(document.querySelector(".message-panel"));
  window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
});

document.querySelector("#music-toggle").addEventListener("click", toggleMusic);
document.querySelector("#share-button").addEventListener("click", shareSurprise);
document.querySelector("#gallery-previous").addEventListener("click", () => changeGallery(-1));
document.querySelector("#gallery-next").addEventListener("click", () => changeGallery(1));
document.querySelector("#gallery-pause").addEventListener("click", (event) => {
  galleryPaused = !galleryPaused;
  event.currentTarget.textContent = galleryPaused ? "▶" : "Ⅱ";
  event.currentTarget.setAttribute("aria-label", galleryPaused ? "Resume slideshow" : "Pause slideshow");
  event.currentTarget.title = galleryPaused ? "Resume slideshow" : "Pause slideshow";
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
      if (entry.target.matches(".message-panel") && !messageStarted) {
        messageStarted = true;
        startTypingMessage();
      }
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll(".reveal-on-scroll").forEach((element) => revealObserver.observe(element));

window.addEventListener("pagehide", () => {
  window.clearInterval(messageTimer);
  window.clearInterval(galleryTimer);
  window.clearInterval(melodyTimer);
  externalAudio?.pause();
  if (audioContext?.state === "running") audioContext.close();
});

renderPersonalization();
configureGallery();
configureVideos();
initializeThree();
runGallery();
setMusicButton();