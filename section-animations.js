
 // ===========================
// "Loading" screen
// ===========================
gsap.registerPlugin(ScrollToPlugin);

const durationScroll = 3;
const multiplicadorTemporal = 0.0008;
let offsetScroll = 0;

// ------------------------------
// Smooth scroll to target element with offset
// ------------------------------

function getScrollDifference(targetId) {
  const target = document.getElementById(targetId);

  if (!target) {
    throw new Error(`No existe ningún elemento con id "${targetId}"`);
  }

  const currentScroll = window.scrollY;
  const targetScroll = target.getBoundingClientRect().top + window.scrollY;
  return targetScroll - currentScroll;
}

document.querySelectorAll("[data-target]").forEach(btn => {
  btn.addEventListener("click", (e) => {

    const id = btn.dataset.target;
    const target = document.getElementById(id);
    const tiempo = Math.abs(getScrollDifference(id)) * multiplicadorTemporal;
    

    if (!target) return;
    if (id == "technologies") {
        offsetScroll = -600;
    } else {
        offsetScroll = -150;
    }
    gsap.to(window, {
      duration: tiempo,
      scrollTo: {
        y: target,
        autoKill: false,
        offsetY: offsetScroll
      },
      ease: "power2.inOut"
    });

  });
});


// Shared state for the canvas accent color — accessible by all sections
const PURPLE_ACCENT = [0.337, 0.125, 0.914]; // #5620e9
let globalAccent = [...PURPLE_ACCENT];
let globalMeshMaterial = null;

function initGlobalCanvas() {
    const canvas = document.getElementById('tech-gradient-canvas');
    if (typeof THREE === 'undefined' || !canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: false, antialias: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 1;

    const geometry = new THREE.PlaneGeometry(2, 2);
    globalMeshMaterial = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uAccent: { value: new THREE.Vector3(...globalAccent) },
            uResolution: { value: new THREE.Vector2(
                window.innerWidth,
                window.innerHeight
            )}
        },
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            precision highp float;
            uniform float uTime;
            uniform vec3 uAccent;
            uniform vec2 uResolution;
            varying vec2 vUv;

            // --- Simplex noise ---
            vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
            vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
            vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

            float snoise(vec2 v) {
                const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                                   -0.577350269189626, 0.024390243902439);
                vec2 i  = floor(v + dot(v, C.yy));
                vec2 x0 = v - i + dot(i, C.xx);
                vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
                vec4 x12 = x0.xyxy + C.xxzz;
                x12.xy -= i1;
                i = mod289(i);
                vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                         + i.x + vec3(0.0, i1.x, 1.0));
                vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
                             dot(x12.zw,x12.zw)), 0.0);
                m = m*m;
                m = m*m;
                vec3 x = 2.0 * fract(p * C.www) - 1.0;
                vec3 h = abs(x) - 0.5;
                vec3 ox = floor(x + 0.5);
                vec3 a0 = x - ox;
                m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
                vec3 g;
                g.x  = a0.x  * x0.x  + h.x  * x0.y;
                g.yz = a0.yz * x12.xz + h.yz * x12.yw;
                return 130.0 * dot(m, g);
            }

            void main() {
                vec2 uv = vUv;
                float aspect = uResolution.x / uResolution.y;
                uv.x *= aspect;

                float t = uTime;

                // --- Domain warping for organic fluid movement ---
                // Warp the UV coordinates themselves with noise
                vec2 warp = vec2(
                    snoise(uv * 0.6 + vec2(t * 0.06, 0.0)),
                    snoise(uv * 0.6 + vec2(0.0, t * 0.08) + 50.0)
                ) * 0.4;

                vec2 warpedUv = uv + warp;

                // --- Noise layers on warped coordinates ---
                float n1 = snoise(warpedUv * 1.0 + vec2(t * 0.10, t * 0.07));
                float n2 = snoise(warpedUv * 1.3 + vec2(-t * 0.08, t * 0.12) + 100.0);
                float n3 = snoise(warpedUv * 0.7 + vec2(t * 0.05, -t * 0.06) + 200.0);

                // --- Three-way blending (same level, not layered) ---
                vec3 dark   = vec3(0.063, 0.063, 0.078);
                vec3 light  = vec3(0.949, 0.957, 0.953);
                vec3 accent = uAccent;

                // Create soft weights for each color from noise
                // Each noise channel "owns" a color zone
                float w_dark   = smoothstep(-0.4, 0.4, n1);
                float w_accent = smoothstep(-0.3, 0.5, n2);
                float w_light  = smoothstep(-0.2, 0.6, n3);

                // Normalize so they sum to 1 (equal blending, no overlap)
                float total = w_dark + w_accent + w_light + 0.001;
                w_dark   /= total;
                w_accent /= total;
                w_light  /= total;

                vec3 col = dark * w_dark + accent * w_accent + light * w_light;

                // Subtle vignette
                vec2 center = vUv - 0.5;
                float vig = 1.0 - dot(center, center) * 0.3;
                col *= vig;

                gl_FragColor = vec4(col, 1.0);
            }
        `
    });

    const mesh = new THREE.Mesh(geometry, globalMeshMaterial);
    scene.add(mesh);

    // Render loop — always running
    function animate() {
        requestAnimationFrame(animate);
        globalMeshMaterial.uniforms.uTime.value += 0.016;
        globalMeshMaterial.uniforms.uAccent.value.set(
            globalAccent[0], globalAccent[1], globalAccent[2]
        );
        renderer.render(scene, camera);
    }
    animate();

    // Resize handler — tracks window size
    window.addEventListener('resize', () => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        renderer.setSize(w, h);
        globalMeshMaterial.uniforms.uResolution.value.set(w, h);
    });
}


// ==========================================
// ABOUT SECTION — Scroll Animations
// ==========================================
(function DynamicGrid() {

  const CFG = {
    color       : 0x5620e9,
    lineOpacity : 1,
    cols        : 20,
    rows        : 10,
    gridSize    : 55,
    waveAmp     : 2,
    waveSpeed   : 1,
    waveFreqX   : 0.44,
    waveFreqZ   : 0.26,
    mouseRadius : 6,
    mouseForce  : 15,
    parallax    : -3,
    camPos      : [1, 50, -15],
    camFOV      : 50,
  };

  const canvas  = document.getElementById('grid-canvas');
  const section = canvas.parentElement;   // → .about-section

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(CFG.camFOV, 1, 0.1, 500);
  camera.position.set(...CFG.camPos);
  camera.lookAt(0, 0, -3);

  const W = CFG.cols, H = CFG.rows, S = CFG.gridSize;
  const verts = [];
  for (let r = 0; r <= H; r++) {
    for (let c = 0; c <= W; c++) {
      verts.push({ x: (c / W - 0.5) * S, z: (r / H - 0.5) * S, y: 0, targetY: 0 });
    }
  }
  const vi = (c, r) => r * (W + 1) + c;

  const lineMat = new THREE.LineBasicMaterial({ color: CFG.color, transparent: true, opacity: 0, depthWrite: false });

  const hAttr = [], vAttr = [];
  for (let r = 0; r <= H; r++) {
    const attr = new THREE.BufferAttribute(new Float32Array((W + 1) * 3), 3);
    const geom = new THREE.BufferGeometry().setAttribute('position', attr);
    const line = new THREE.Line(geom, lineMat);
    line.frustumCulled = false;
    scene.add(line);
    hAttr.push(attr);
  }
  for (let c = 0; c <= W; c++) {
    const attr = new THREE.BufferAttribute(new Float32Array((H + 1) * 3), 3);
    const geom = new THREE.BufferGeometry().setAttribute('position', attr);
    const line = new THREE.Line(geom, lineMat);
    line.frustumCulled = false;
    scene.add(line);
    vAttr.push(attr);
  }

  const mouse3D = { x: 9999, z: 9999 };
  const plane   = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const rc      = new THREE.Raycaster();
  const mNDC    = new THREE.Vector2();
  const mWorld  = new THREE.Vector3();
  const camShift = { x: 0 };

  section.addEventListener('pointermove', (e) => {
    const nx = e.clientX / window.innerWidth;
    const ny = e.clientY / window.innerHeight;
    mNDC.set(nx * 2 - 1, -(ny * 2 - 1));
    rc.setFromCamera(mNDC, camera);
    if (rc.ray.intersectPlane(plane, mWorld)) { mouse3D.x = mWorld.x; mouse3D.z = mWorld.z; }
    gsap.to(camShift, { x: (nx - 0.5) * CFG.parallax, duration: 2, ease: 'power2.out' });
  });
  window.addEventListener('pointerleave', () => {
    gsap.to(mouse3D,  { x: 9999, z: 9999, duration: 1.4, ease: 'power2.out' });
    gsap.to(camShift, { x: 0,             duration: 2,   ease: 'power2.out' });
  });

  function resize() {
    const w = window.innerWidth, h = section.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(section);
  resize();

  const state = { offsetY: -3.0 };
  gsap.timeline({ defaults: { ease: 'expo.out' } })
    .to(lineMat, { opacity: CFG.lineOpacity, duration: 2.6 }, 0)
    .to(state,   { offsetY: 0,               duration: 2.4 }, 0);

  gsap.ticker.add((time) => {
    const t = time * CFG.waveSpeed;
    camera.position.x += (camShift.x - camera.position.x) * 0.04;

    for (let i = 0; i < verts.length; i++) {
      const v = verts[i];
      const dx = v.x - mouse3D.x, dz = v.z - mouse3D.z;
      const d  = Math.sqrt(dx * dx + dz * dz);
      const wave   = Math.sin(v.x * CFG.waveFreqX + t) * Math.cos(v.z * CFG.waveFreqZ + t * 0.78) * CFG.waveAmp;
      const ripple = d < CFG.mouseRadius ? Math.cos((d / CFG.mouseRadius) * (Math.PI * 0.5)) * CFG.mouseForce : 0;
      v.targetY = wave + ripple + state.offsetY;
      v.y += (v.targetY - v.y) * 0.06;
    }

    for (let r = 0; r <= H; r++) {
      const a = hAttr[r].array;
      for (let c = 0; c <= W; c++) { const v = verts[vi(c,r)]; a[c*3]=v.x; a[c*3+1]=v.y; a[c*3+2]=v.z; }
      hAttr[r].needsUpdate = true;
    }
    for (let c = 0; c <= W; c++) {
      const a = vAttr[c].array;
      for (let r = 0; r <= H; r++) { const v = verts[vi(c,r)]; a[r*3]=v.x; a[r*3+1]=v.y; a[r*3+2]=v.z; }
      vAttr[c].needsUpdate = true;
    }
    renderer.render(scene, camera);
  });

})();
function initAboutSection() {
    const aboutIntro = document.querySelector('.about-intro');
    if (!aboutIntro) return;

    const scrollingBg = document.querySelector('.about-scrolling-bg');
    const aboutImage = document.querySelector('.about-hero-image');
    const introCard = document.querySelector('.about-intro-card');

    // Set initial states
    if (scrollingBg) gsap.set(scrollingBg, { opacity: 0 });
    if (aboutImage) gsap.set(aboutImage, { x: '50vw', opacity: 0 });
    if (introCard) gsap.set(introCard, { x: '-50vw', opacity: 0 });

    // Create a timeline using the parent section as trigger
    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: '.about-section',
            start: 'top 60%', 
            end: '+=100%', // Scroll distance equal to the margin-top we added
            scrub: 1 // Smooth scrubbing
        }
    });

    // 1. Fade in the scrolling background text
    if (scrollingBg) {
        tl.to(scrollingBg, {
            opacity: 1,
            duration: 0.5
        });
    }

    // 2. Bring in the left and right content simultaneously
        tl.to([aboutImage, introCard], {
            x: 0,
            opacity: 1,
            duration: 0.8,
            ease: "power2.out"
        }, "-=0.2"); // Small delay after text starts fading in
}
ScrollTrigger.create({
  trigger: ".about-studies",
  // Compensate for the pinned hero so the fade starts when studies reach the viewport.
  start: "top -100%",

  onEnter: () => {
    gsap.to(".about-intro", { autoAlpha: 0});
    gsap.to(".about-scrolling-bg", { autoAlpha: 0 });
    gsap.to(".about-hero-image", { autoAlpha: 0 });
    gsap.to(".about-intro-card", { autoAlpha: 0 });
    gsap.to(".canvas-intro", { autoAlpha: 0 });
  },

  onLeaveBack: () => {
    gsap.to(".about-intro", { autoAlpha: 1 });
    gsap.to(".about-scrolling-bg", { autoAlpha: 1 });
    gsap.to(".about-hero-image", { autoAlpha: 1 });
    gsap.to(".about-intro-card", { autoAlpha: 1 });
    gsap.to(".canvas-intro", { autoAlpha: 1 });
  }
});

function initContactSection() {
    const contact = document.querySelector('.contact');
    if (!contact) return;

    const contactImage = document.querySelector('.contact-person-img');
    const contactCard = document.querySelector('.contact-grid');
    const scrollingBg = document.querySelector('.contact-scrolling-bg');

    // Set initial states
    if (contactImage) gsap.set(contactImage, { y: '70vh'});
    if (contactCard) gsap.set(contactCard, { y: '70vh' });
    if (scrollingBg) gsap.set(scrollingBg, { opacity: 0 });

    
    // Create a timeline using the parent section as trigger
    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: '.contact',
            start: 'top 35%', 
            end: 'bottom bottom', // Scroll distance equal to the margin-top we added
            scrub: 1 // Smooth scrubbing
        }
    });

    // 2. Bring in the left and right content simultaneously
        tl.to([contactImage, contactCard], {
            y: 0,
            duration: 1,
            ease: "power2.out"
        }); // Small delay after text starts fading in

    ScrollTrigger.create({
        trigger: '.contact',
        start: 'top 60%',
        end: '+=100%',
        onEnter: () => {
            gsap.to([scrollingBg], {
                opacity: 1,
                duration: 0.8,
                ease: "power2.out"
            });      
        },
        onLeaveBack: () => {
            gsap.to([scrollingBg], {
                opacity: 0,
                duration: 0.8,
                ease: "power2.out"
            });    
        }
    });
}

function updateContactImageScale() {
    const contactImage = document.querySelector('.contact-person-img');
    if (!contactImage) return;

    const progress = Math.min(Math.max((window.innerWidth - 1440) / (3840 - 1440), 0), 1);
    contactImage.style.scale = String(1.05 + progress * 0.25);
}

updateContactImageScale();
window.addEventListener('resize', updateContactImageScale);

// ==========================================
// TECHNOLOGIES SECTION — Scroll-Driven Card Stack
// ==========================================
function initTechSection() {
    const section = document.querySelector('.tech-section');
    if (!section) return;

    const cursorTiltEnabled = window.matchMedia(
        '(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)'
    ).matches;

    if (cursorTiltEnabled) {
        const blobs = section.querySelectorAll('.tech-stack-card-blob');
        const updateBlobTilt = (event) => {
            blobs.forEach((blob) => {
                const bounds = blob.getBoundingClientRect();
                if (!bounds.width || !bounds.height) return;

                const cursorX = Math.max(-1, Math.min(1, (event.clientX - bounds.left) / bounds.width * 2 - 1));
                const cursorY = Math.max(-1, Math.min(1, (event.clientY - bounds.top) / bounds.height * 2 - 1));

                blob.style.setProperty('--pointer-tilt-x', `${cursorX * 6}deg`);
                blob.style.setProperty('--pointer-tilt-y', `${cursorY * -6}deg`);
            });
        };

        window.addEventListener('pointermove', updateBlobTilt);
        window.addEventListener('pointerleave', () => {
            blobs.forEach((blob) => {
                blob.style.setProperty('--pointer-tilt-x', '0deg');
                blob.style.setProperty('--pointer-tilt-y', '0deg');
            });
        });
    }

    const scrollingBg = section.querySelector('.tech-scrolling-bg');
    const cards = gsap.utils.toArray('.tech-stack-card');
    const totalCards = cards.length; // 3

    // Accent colors per card: purple, gold, green
    const accentColors = [
        [0.337, 0.125, 0.914],   // #5620e9 — Multimedia
        [0.961, 0.722, 0.0],     // #f5b800 — Frontend
        [0.0, 0.784, 0.325]      // #00c853 — Backend
    ];

    // ———————————————————————————————
    // SCROLL PROGRESS MAPPING
    // ———————————————————————————————
    // Section = 600vh, scroll distance = 500vh
    //
    // 0.00 – 0.04 : Blank phase (just section bg)
    // 0.04 – 0.10 : Marquee + gradient fade in
    // 0.10 – 0.77 : Cards appear & stack
    //     Each card gets ~22.3% of this range
    //     Each card: first 60% of range = entrance, rest = settled/reading time
    // 0.77 – 1.00 : Cards settled, section stays fixed while Projects slides over

    const FADE_IN_START = 0.05;
    const FADE_IN_END = 0.11;
    const CARDS_START = 0.11;
    const CARDS_END = 0.85;

    const perCard = (CARDS_END - CARDS_START) / totalCards;
    const ENTRANCE_RATIO = 0.60;

    const cardRotations = [-3.5, 2.8, -2.2];

    // ———————————————————————————————
    // SMOOTH SCRUB INTERPOLATION
    // ———————————————————————————————
    // Instead of directly using scroll progress, we lerp toward it
    // each frame. This gives the classic buttery GSAP scrub feel.
    let targetProgress = 0;
    let smoothProgress = 0;
    const TECH_SCRUB_SPEED = 0.08; // Separate from GLOBAL_SCRUB_SPEED — tune independently

    ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => {
            targetProgress = self.progress;
        },
        onLeave: () => {
            // Keep the last card's accent (green) — the Projects section
            // will handle the swap to purple once it covers the canvas
            targetProgress = 1;
        },
        onEnterBack: () => {
            // Restore last card's accent when scrolling back into tech section
            const lastAccent = accentColors[totalCards - 1];
            globalAccent[0] = lastAccent[0];
            globalAccent[1] = lastAccent[1];
            globalAccent[2] = lastAccent[2];
        }
    });

    // Smooth animation loop
    function smoothUpdate() {
        // Lerp smoothProgress toward targetProgress
        smoothProgress += (targetProgress - smoothProgress) * TECH_SCRUB_SPEED;

        // Snap when very close to avoid infinite tiny movements
        if (Math.abs(targetProgress - smoothProgress) < 0.0001) {
            smoothProgress = targetProgress;
        }

        updateTechSection(smoothProgress);
        requestAnimationFrame(smoothUpdate);
    }
    requestAnimationFrame(smoothUpdate);

    // ———————————————————————————————
    // ACCENT COLOR SWAP — triggered by Projects section
    // ———————————————————————————————
    // Uses getBoundingClientRect for reliable detection — when the
    // Projects section top reaches the viewport top, the canvas is
    // fully hidden behind its opaque background, so the color swap
    // is invisible to the user.
    const projectsSection = document.querySelector('#projects');
    let accentIsPurple = false;
    if (projectsSection) {

        function checkAccentSwap() {
            const rect = projectsSection.getBoundingClientRect();

            if (rect.top <= 0 && !accentIsPurple) {
                // Projects covers the viewport — swap to purple
                globalAccent[0] = PURPLE_ACCENT[0];
                globalAccent[1] = PURPLE_ACCENT[1];
                globalAccent[2] = PURPLE_ACCENT[2];
                accentIsPurple = true;
            } else if (rect.top > 0 && accentIsPurple) {
                // Scrolled back up — restore last card's green accent
                const lastAccent = accentColors[totalCards - 1];
                globalAccent[0] = lastAccent[0];
                globalAccent[1] = lastAccent[1];
                globalAccent[2] = lastAccent[2];
                accentIsPurple = false;
            }

            requestAnimationFrame(checkAccentSwap);
        }
        requestAnimationFrame(checkAccentSwap);
    }

    function updateTechSection(p) {

        // === BLANK PHASE ===
        if (p < FADE_IN_START) {
            gsap.set(scrollingBg, { opacity: 0 });
            hideAllCards();
            return;
        }

        // === FADE IN PHASE ===
        if (p < FADE_IN_END) {
            const t = (p - FADE_IN_START) / (FADE_IN_END - FADE_IN_START);
            const eased = easeInOutCubic(t);
            gsap.set(scrollingBg, { opacity: eased });
            hideAllCards();
            // Pre-set accent to first card's color
            if (!accentIsPurple) {
                globalAccent[0] = accentColors[0][0];
                globalAccent[1] = accentColors[0][1];
                globalAccent[2] = accentColors[0][2];
            }
            return;
        }

        // === CARDS PHASE (and post-cards) ===
        gsap.set(scrollingBg, { opacity: 1 });

        cards.forEach((card, i) => {
            const cardStart = CARDS_START + i * perCard;
            const entranceEnd = cardStart + perCard * ENTRANCE_RATIO;

            if (p < cardStart) {
                // Not yet visible — below screen
                gsap.set(card, {
                    opacity: 0,
                    y: window.innerHeight * 1.2,
                    rotation: 0,
                    scale: 1,
                    filter: 'none',
                    zIndex: 10 + i
                });
            } else if (p < entranceEnd) {
                // Entering from bottom — gentle ease-out for soft landing
                const t = (p - cardStart) / (entranceEnd - cardStart);
                const eased = t * (2 - t); // subtle quadratic ease-out
                gsap.set(card, {
                    opacity: 1,
                    y: (1 - eased) * window.innerHeight * 1.2,
                    rotation: 0,
                    scale: 1,
                    filter: 'none',
                    zIndex: 10 + i
                });
                // Transition accent color
                if (!accentIsPurple) {
                    const prevAccent = i > 0 ? accentColors[i - 1] : accentColors[0];
                    lerpColorDirect(globalAccent, prevAccent, accentColors[i], eased);
                }

            } else {
                // Card is up — check if newer cards are on top
                let isStacked = false;
                let stackDepth = 0;

                for (let j = i + 1; j < totalCards; j++) {
                    const jStart = CARDS_START + j * perCard;
                    const jEntranceEnd = jStart + perCard * ENTRANCE_RATIO;
                    if (p >= jEntranceEnd) {
                        // Card j is fully settled on top
                        stackDepth++;
                        isStacked = true;
                    } else if (p >= jStart) {
                        // Card j is entering — transition this card to stacked
                        const jt = (p - jStart) / (jEntranceEnd - jStart);
                        const jEased = jt * (2 - jt); // subtle quadratic ease-out

                        gsap.set(card, {
                            opacity: 1,
                            y: -10 * (stackDepth + 1) * jEased,
                            rotation: cardRotations[i] * jEased,
                            scale: 1 - 0.035 * (stackDepth + 1) * jEased,
                            filter: `blur(${6 * jEased * (stackDepth + 1)}px)`,
                            zIndex: 10 + i
                        });
                        isStacked = true;
                        break;
                    }
                }

                if (isStacked && stackDepth > 0) {
                    // Fully stacked behind newer cards
                    gsap.set(card, {
                        opacity: 1,
                        y: -10 * stackDepth,
                        rotation: cardRotations[i],
                        scale: 1 - 0.035 * stackDepth,
                        filter: `blur(${6 * stackDepth}px)`,
                        zIndex: 10 + i
                    });
                } else if (!isStacked) {
                    // This card is the top card
                    gsap.set(card, {
                        opacity: 1,
                        y: 0,
                        rotation: 0,
                        scale: 1,
                        filter: 'none',
                        zIndex: 10 + i
                    });
                    // Snap accent color
                    if (!accentIsPurple) {
                        lerpColor(globalAccent, globalAccent, accentColors[i], 0.12);
                    }
                }
            }
        });
    }


    // ———————————————————————————————
    // HELPERS
    // ———————————————————————————————
    function hideAllCards() {
        cards.forEach((card, i) => {
            gsap.set(card, {
                 opacity: 0,
                y: window.innerHeight * 1.2,
                rotation: 0,
                scale: 1,
                filter: 'none',
                zIndex: 10 + i
            });
        });
    }

    function easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    function easeInOutCubic(t) {
        return t < 0.5
            ? 4 * t * t * t
            : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function lerpColor(target, from, to, speed) {
        for (let i = 0; i < 3; i++) {
            target[i] += (to[i] - target[i]) * speed;
        }
    }

    function lerpColorDirect(target, from, to, t) {
        for (let i = 0; i < 3; i++) {
            target[i] = from[i] + (to[i] - from[i]) * t;
        }
    }
}
