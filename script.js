// Wait for the DOM to be fully loaded
document.addEventListener("DOMContentLoaded", () => {
    
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
        initTechSection();
    }
});


// ==========================================
// TECHNOLOGIES SECTION — Scroll-Driven Card Stack
// ==========================================
function initTechSection() {
    const section = document.querySelector('.tech-section');
    if (!section) return;

    const canvas = document.getElementById('tech-gradient-canvas');
    const scrollingBg = section.querySelector('.tech-scrolling-bg');
    const cards = gsap.utils.toArray('.tech-stack-card');
    const totalCards = cards.length; // 3

    // ———————————————————————————————
    // THREE.JS FLUID GRADIENT (black + white + accent)
    // ———————————————————————————————
    let renderer, meshMaterial;

    // Accent colors: #5620e9 (purple), #f5b800 (gold), #00c853 (green)
    const accentColors = [
        [0.337, 0.125, 0.914],   // #5620e9 — Multimedia
        [0.961, 0.722, 0.0],     // #f5b800 — Frontend
        [0.0, 0.784, 0.325]      // #00c853 — Backend
    ];
    const currentAccent = [...accentColors[0]];

    function initThreeGradient() {
        if (typeof THREE === 'undefined' || !canvas) return;

        renderer = new THREE.WebGLRenderer({ canvas, alpha: false, antialias: false });
        renderer.setSize(canvas.parentElement.clientWidth, canvas.parentElement.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
        camera.position.z = 1;

        const geometry = new THREE.PlaneGeometry(2, 2);
        meshMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uAccent: { value: new THREE.Vector3(...currentAccent) },
                uResolution: { value: new THREE.Vector2(
                    canvas.parentElement.clientWidth,
                    canvas.parentElement.clientHeight
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

        const mesh = new THREE.Mesh(geometry, meshMaterial);
        scene.add(mesh);

        // Render loop
        function animate() {
            requestAnimationFrame(animate);
            meshMaterial.uniforms.uTime.value += 0.016;
            meshMaterial.uniforms.uAccent.value.set(
                currentAccent[0], currentAccent[1], currentAccent[2]
            );
            renderer.render(scene, camera);
        }
        animate();

        // Resize handler
        const resizeObserver = new ResizeObserver(() => {
            const w = canvas.parentElement.clientWidth;
            const h = canvas.parentElement.clientHeight;
            renderer.setSize(w, h);
            meshMaterial.uniforms.uResolution.value.set(w, h);
        });
        resizeObserver.observe(canvas.parentElement);
    }

    initThreeGradient();

    // ———————————————————————————————
    // SCROLL PROGRESS MAPPING
    // ———————————————————————————————
    // Section = 600vh, scroll distance = 500vh
    //
    // 0.00 – 0.06 : Blank phase (just section bg)
    // 0.06 – 0.14 : Marquee + gradient fade in
    // 0.14 – 0.85 : Cards appear & stack
    //     Card 0: 0.14 – 0.378
    //     Card 1: 0.378 – 0.614
    //     Card 2: 0.614 – 0.85
    //     Each card: first 30% of range = entrance, rest = settled
    // 0.85 – 1.00 : Cards settled, section scrolls away naturally

    const FADE_IN_START = 0.06;
    const FADE_IN_END   = 0.14;
    const CARDS_START    = 0.14;
    const CARDS_END      = 0.85;

    const perCard = (CARDS_END - CARDS_START) / totalCards;
    const ENTRANCE_RATIO = 0.30;

    const cardRotations = [-3.5, 2.8, -2.2];

    // ———————————————————————————————
    // MAIN SCROLL TRIGGER
    // ———————————————————————————————
    ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => {
            updateTechSection(self.progress);
        }
    });

    function updateTechSection(p) {

        // === BLANK PHASE ===
        if (p < FADE_IN_START) {
            gsap.set(scrollingBg, { opacity: 0 });
            gsap.set(canvas, { opacity: 0 });
            hideAllCards();
            return;
        }

        // === FADE IN PHASE ===
        if (p < FADE_IN_END) {
            const t = (p - FADE_IN_START) / (FADE_IN_END - FADE_IN_START);
            const eased = easeInOutCubic(t);
            gsap.set(scrollingBg, { opacity: eased });
            gsap.set(canvas, { opacity: eased * 0.85 });
            hideAllCards();
            // Pre-set accent to first card's color
            currentAccent[0] = accentColors[0][0];
            currentAccent[1] = accentColors[0][1];
            currentAccent[2] = accentColors[0][2];
            return;
        }

        // === CARDS PHASE (and post-cards) ===
        gsap.set(scrollingBg, { opacity: 1 });
        gsap.set(canvas, { opacity: 0.85 });

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
                // Entering from bottom
                const t = (p - cardStart) / (entranceEnd - cardStart);
                const eased = easeOutCubic(t);
                gsap.set(card, {
                    opacity: 1,
                    y: (1 - eased) * window.innerHeight * 1.2,
                    rotation: 0,
                    scale: 1,
                    filter: 'none',
                    zIndex: 10 + i
                });
                // Transition accent color
                const prevAccent = i > 0 ? accentColors[i - 1] : accentColors[0];
                lerpColorDirect(currentAccent, prevAccent, accentColors[i], eased);

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
                        const jEased = easeOutCubic(jt);

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
                    lerpColor(currentAccent, currentAccent, accentColors[i], 0.12);
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
