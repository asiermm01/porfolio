// Force scroll to top on every page load
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}

// ==========================================
// GLOBAL SMOOTH SCROLL
// ==========================================
// Intercepts wheel events and smoothly interpolates scroll position
// for a buttery-smooth browsing experience across the entire page.
// This is independent from the tech section's own scrub speed.
const GLOBAL_SCRUB_SPEED = 0.1;    // Tune: lower = smoother, higher = snappier

let smoothScrollTarget = 0;
let smoothScrollCurrent = 0;
let lastScrollSet = -1;

// Intercept wheel events — prevent native jump, accumulate into target
window.addEventListener('wheel', (e) => {
    e.preventDefault();
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    smoothScrollTarget = Math.max(0, Math.min(smoothScrollTarget + e.deltaY, maxScroll));
}, { passive: false });

// Sync with external scroll sources (anchor clicks, keyboard, touch, scrollbar)
window.addEventListener('scroll', () => {
    // Ignore scroll events caused by our own scrollTo calls
    if (Math.abs(window.scrollY - lastScrollSet) < 2) return;
    // External scroll source — sync our tracking
    smoothScrollTarget = window.scrollY;
    smoothScrollCurrent = window.scrollY;
}, { passive: true });

// Smooth scroll render loop
(function smoothScrollLoop() {
    const diff = smoothScrollTarget - smoothScrollCurrent;

    if (Math.abs(diff) > 0.5) {
        smoothScrollCurrent += diff * GLOBAL_SCRUB_SPEED;
        lastScrollSet = smoothScrollCurrent;
        window.scrollTo({ top: smoothScrollCurrent, behavior: 'instant' });
    }

    requestAnimationFrame(smoothScrollLoop);
})();

// Wait for the DOM to be fully loaded
document.addEventListener("DOMContentLoaded", () => {

    // Reset scroll position on load
    smoothScrollTarget = 0;
    smoothScrollCurrent = 0;
    lastScrollSet = 0;
    window.scrollTo({ top: 0, behavior: 'instant' });
    
    console.log("Portfolio loaded!");

    // ==========================================
    // NAVBAR SCROLL BEHAVIOR
    // ==========================================
    const navbar = document.getElementById("navbar");
    if (navbar) {
        let lastScrollY = window.scrollY;

        window.addEventListener("scroll", () => {
            const currentScrollY = window.scrollY;

            if (currentScrollY > 50) {
                navbar.classList.add("scrolled");
            } else {
                navbar.classList.remove("scrolled");
            }

            if (currentScrollY > lastScrollY && currentScrollY > 100) {
                navbar.classList.add("hidden");
            } else {
                navbar.classList.remove("hidden");
            }

            lastScrollY = currentScrollY;
        }, { passive: true });
    }

    // ==========================================
    // GSAP + SCROLLTRIGGER SETUP
    // ==========================================
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
        initHeroScene();
        initGlobalCanvas();
        initTechSection();
    }
});

// ==========================================
// HERO THREE.JS SCENE
// ==========================================
function initHeroScene() {
    const canvas = document.getElementById('hero-canvas');
    if (typeof THREE === 'undefined' || !canvas) return;

    // --- RENDERER ---
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x020208);

    const scene = new THREE.Scene();

    // --- CAMERA ---
    const camera = new THREE.PerspectiveCamera(
        55, window.innerWidth / window.innerHeight, 0.1, 300
    );
    camera.position.set(0, 6, 22);
    camera.lookAt(0, 0, 0);

    // ===========================
    // STARS — dramatic twinkling
    // ===========================
    const STAR_COUNT = 1200;
    const starPos = new Float32Array(STAR_COUNT * 3);
    const starSizes = new Float32Array(STAR_COUNT);
    const starPhases = new Float32Array(STAR_COUNT);
    const starSpeeds = new Float32Array(STAR_COUNT);

    for (let i = 0; i < STAR_COUNT; i++) {
        starPos[i * 3]     = (Math.random() - 0.5) * 160;
        starPos[i * 3 + 1] = Math.random() * 80 - 10;
        starPos[i * 3 + 2] = (Math.random() - 0.5) * 160;
        starSizes[i] = Math.random() * 2.5 + 0.8;
        starPhases[i] = Math.random() * Math.PI * 2;
        starSpeeds[i] = Math.random() * 0.8 + 0.4; // individual speed variation
    }

    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute('aSize', new THREE.BufferAttribute(starSizes, 1));
    starGeo.setAttribute('aPhase', new THREE.BufferAttribute(starPhases, 1));
    starGeo.setAttribute('aSpeed', new THREE.BufferAttribute(starSpeeds, 1));

    const starMat = new THREE.ShaderMaterial({
        uniforms: {
            uTime: { value: 0 },
            uPixelRatio: { value: renderer.getPixelRatio() }
        },
        vertexShader: `
            attribute float aSize;
            attribute float aPhase;
            attribute float aSpeed;
            uniform float uTime;
            uniform float uPixelRatio;
            varying float vAlpha;

            void main() {
                vec4 mv = modelViewMatrix * vec4(position, 1.0);

                // Layered wave: slow breathe × fast flicker
                float breathe = sin(uTime * 0.3 * aSpeed + aPhase) * 0.5 + 0.5;
                float flicker = sin(uTime * 1.8 * aSpeed + aPhase * 3.1) * 0.5 + 0.5;

                // Combined: stars fully vanish at breathe troughs
                float raw = breathe * flicker;
                // Sharpen: push toward 0 and 1 for dramatic on/off
                vAlpha = smoothstep(0.15, 0.55, raw);

                gl_PointSize = aSize * uPixelRatio * (180.0 / -mv.z);
                gl_Position = projectionMatrix * mv;
            }
        `,
        fragmentShader: `
            varying float vAlpha;
            void main() {
                float d = length(gl_PointCoord - vec2(0.5));
                if (d > 0.5) discard;
                float a = 1.0 - smoothstep(0.15, 0.5, d);
                gl_FragColor = vec4(1.0, 1.0, 1.0, a * vAlpha);
            }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });

    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // ===========================
    // SPHERE — cleaner wireframe
    // ===========================
    const sphereGeo = new THREE.SphereGeometry(3, 14, 10);
    const sphereMat = new THREE.MeshBasicMaterial({
        color: 0x5620e9,
        wireframe: true,
        transparent: false
    });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);

    // Wider orbit range
    const SPHERE_START = { x: -10, y: 6, z: -5 };
    const SPHERE_END   = { x: 0, y: 5, z: 20 };
    sphere.position.set(SPHERE_START.x, SPHERE_START.y, SPHERE_START.z);
    scene.add(sphere);

    // Inner glow fill for depth
    const glowGeo = new THREE.SphereGeometry(2.99, 14, 10);
    const glowMat = new THREE.MeshBasicMaterial({
        color: 0x101014,
        transparent: false,
        side: THREE.BackSide
    });
    sphere.add(new THREE.Mesh(glowGeo, glowMat));

    // ===========================
    // GRID PLANE — shader-based
    // ===========================
    const gridGeo = new THREE.PlaneGeometry(100, 100, 1, 1);
    const gridMat = new THREE.ShaderMaterial({
        uniforms: {
            uColor: { value: new THREE.Vector3(0.337, 0.125, 0.914) },
            uTime: { value: 0 }
        },
        vertexShader: `
            varying vec3 vWorldPos;
            void main() {
                vec4 wp = modelMatrix * vec4(position, 1.0);
                vWorldPos = wp.xyz;
                gl_Position = projectionMatrix * viewMatrix * wp;
            }
        `,
        fragmentShader: `
            precision highp float;
            varying vec3 vWorldPos;
            uniform vec3 uColor;
            uniform float uTime;

            void main() {
                vec2 coord = vWorldPos.xz * 0.4;

                // Anti-aliased grid
                vec2 g = abs(fract(coord - 0.5) - 0.5);
                vec2 dv = fwidth(coord);
                vec2 lines = smoothstep(dv * 0.5, dv * 1.8, g);
                float line = 1.0 - min(lines.x, lines.y);

                // Distance fade
                float dist = length(vWorldPos.xz);
                float fade = 1.0 - smoothstep(6.0, 42.0, dist);

                // Glow pulse on lines
                float pulse = sin(uTime * 0.4) * 0.08 + 0.92;

                float alpha = line * fade * 0.55 * pulse;
                gl_FragColor = vec4(uColor * (1.0 + line * 0.3), alpha);
            }
        `,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false
    });

    const grid = new THREE.Mesh(gridGeo, gridMat);
    grid.rotation.x = -Math.PI / 2;
    grid.position.y = -3;
    scene.add(grid);

    // ===========================
    // MOUSE TRACKING (for grid)
    // ===========================
    let mouseX = 0, mouseY = 0;
    const BASE_GRID_ROT_X = -Math.PI / 2;
    const BASE_GRID_POS_Z = 0;

    window.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX / window.innerWidth)  * 2 - 1;
        mouseY = (e.clientY / window.innerHeight) * 2 - 1;
    });

    // ===========================
    // SCROLL — sphere orbit (natural, no pin)
    // ===========================
    let heroScrollProgress = 0;

    ScrollTrigger.create({
        trigger: '#hero',
        pin: true,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
        onUpdate: (self) => {
            heroScrollProgress = self.progress;
        }
    });

    // ===========================
    // RENDER LOOP
    // ===========================
    let heroTime = 0;
    let currentGridRotX = BASE_GRID_ROT_X;
    let currentGridRotZ = 0;
    let currentGridPosZ = BASE_GRID_POS_Z;

    function heroAnimate() {
        requestAnimationFrame(heroAnimate);
        heroTime += 0.016;

        // Stars twinkle + faster rotation
        starMat.uniforms.uTime.value = heroTime;
        stars.rotation.y += 0.0003;

        // Grid time
        gridMat.uniforms.uTime.value = heroTime;

        // Sphere constant rotation (faster)
        sphere.rotation.y += 0.007;
        sphere.rotation.x += 0.002;

        // Sphere scroll-driven orbit (left → arc → right)
        const t = heroScrollProgress;
        const arcX = Math.sin(t * Math.PI) * 2.5;
        const arcY = Math.sin(t * Math.PI) * 2.5;
        sphere.position.x = SPHERE_START.x + (SPHERE_END.x - SPHERE_START.x) * t - arcX;
        sphere.position.y = SPHERE_START.y + (SPHERE_END.y - SPHERE_START.y) * t - arcY;
        sphere.position.z = SPHERE_START.z + (SPHERE_END.z - SPHERE_START.z) * t;

        // Grid cursor-reactive: Y-axis rotation + Z-axis position
        const targetRotX = BASE_GRID_ROT_X + mouseY * 0.035;
        const targetRotZ = mouseX * 0.025;
        const targetPosZ = mouseX * 0.8;
        currentGridRotX += (targetRotX - currentGridRotX) * 0.04;
        currentGridRotZ += (targetRotZ - currentGridRotZ) * 0.04;
        currentGridPosZ += (targetPosZ - currentGridPosZ) * 0.04;
        grid.rotation.x = currentGridRotX;
        grid.rotation.z = currentGridRotZ;
        grid.position.z = currentGridPosZ;

        renderer.render(scene, camera);
    }
    heroAnimate();

    // --- RESIZE ---
    window.addEventListener('resize', () => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    });
}



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
// TECHNOLOGIES SECTION — Scroll-Driven Card Stack
// ==========================================
function initTechSection() {
    const section = document.querySelector('.tech-section');
    if (!section) return;

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
    // 0.00 – 0.05 : Blank phase (just section bg)
    // 0.05 – 0.12 : Marquee + gradient fade in
    // 0.12 – 0.92 : Cards appear & stack
    //     Each card gets ~26.7% of this range
    //     Each card: first 60% of range = entrance, rest = settled/reading time
    // 0.92 – 1.00 : Cards settled, section scrolls away naturally

    const FADE_IN_START = 0.05;
    const FADE_IN_END   = 0.12;
    const CARDS_START    = 0.12;
    const CARDS_END      = 0.92;

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
