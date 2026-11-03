// Force scroll to top on every page load
history.scrollRestoration = "manual";

function forceTop() {
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

// 1) inmediato
forceTop();

// 2) DOM listo
document.addEventListener("DOMContentLoaded", forceTop);

// 3) load
window.addEventListener("load", () => {
    const loader = document.querySelector(".loader");

    gsap.to(loader, {
        opacity: 0,
        delay: 0.3,
        duration: 1,
        ease: "power2.out",
        onComplete: () => {
            loader.style.display = "none";
        }
    });

  forceTop();

  // hack importante: esperar 1 frame más
  requestAnimationFrame(forceTop);
  requestAnimationFrame(forceTop);
});
window.addEventListener("load", () => {
  ScrollTrigger.refresh(true);
  window.scrollTo(0, 0);
});


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

    // ==========================================
    // NAVBAR SCROLL BEHAVIOR
    // ==========================================
    const navbar = document.getElementById("navbar");
    if (navbar) {
        let lastScrollY = window.scrollY;

        window.addEventListener("scroll", () => {
            const currentScrollY = window.scrollY;

            if (currentScrollY > 1300) {
                navbar.classList.add("scrolled");
            } else {
                navbar.classList.remove("scrolled");
            }

            if (currentScrollY > lastScrollY && currentScrollY > 1000) {
                navbar.classList.add("hidden");
            } else {
                navbar.classList.remove("hidden");
            }

            lastScrollY = currentScrollY;
        }, { passive: true });
    }

    // ==========================================
    // MOBILE NAVIGATION TOGGLE
    // ==========================================
    const navToggle = document.getElementById('nav-toggle');
    const mobileNavPanel = document.getElementById('mobile-nav-panel');
    const mobileNavOverlay = document.getElementById('mobile-nav-overlay');
    const mobileNavClose = document.getElementById('mobile-nav-close-menu');

    if (navToggle && mobileNavPanel && mobileNavOverlay) {
        const closeMobileMenu = () => {
            mobileNavPanel.classList.remove('active');
            mobileNavOverlay.classList.remove('active');
            navToggle.classList.remove('active');
            navToggle.setAttribute('aria-expanded', 'false');
            document.body.classList.remove('menu-open');
        };

        const openMobileMenu = () => {
            mobileNavPanel.classList.add('active');
            mobileNavOverlay.classList.add('active');
            navToggle.classList.add('active');
            navToggle.setAttribute('aria-expanded', 'true');
            document.body.classList.add('menu-open');
        };

        navToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = mobileNavPanel.classList.contains('active');
            if (isOpen) {
                closeMobileMenu();
            } else {
                openMobileMenu();
            }
        });

        if (mobileNavClose) {
            mobileNavClose.addEventListener('click', closeMobileMenu);
        }

        mobileNavOverlay.addEventListener('click', closeMobileMenu);

        mobileNavPanel.querySelectorAll('.mobile-nav-link').forEach(link => {
            link.addEventListener('click', () => closeMobileMenu());
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.nav-container') && !e.target.closest('.nav-language-menu') && !e.target.closest('.mobile-nav-panel')) {
                closeMobileMenu();
            }
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth > 1440) {
                closeMobileMenu();
            }
        });
    }

    // ==========================================
    // LANGUAGE SWITCHER
    // ==========================================
    const languageToggle = document.getElementById('language-toggle');
    const languageDropdown = document.getElementById('language-dropdown');
    const languageOptions = document.querySelectorAll('.language-option');
    const currentLanguageSpan = document.getElementById('current-language');

    if (languageToggle && languageDropdown) {
        // Toggle dropdown
        languageToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            languageDropdown.classList.toggle('active');
            languageToggle.classList.toggle('active');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.nav-language-menu')) {
                languageDropdown.classList.remove('active');
                languageToggle.classList.remove('active');
            }
        });

        // Handle language selection
        languageOptions.forEach(option => {
            option.addEventListener('click', async (e) => {
                e.preventDefault();
                const lang = option.getAttribute('data-lang');
                
                // Close dropdown
                languageDropdown.classList.remove('active');
                languageToggle.classList.remove('active');
                
                // Update button display
                const langCodes = { 'es': 'ES', 'en': 'EN', 'ca': 'CA' };
                currentLanguageSpan.textContent = langCodes[lang];
                
                // Update active option
                languageOptions.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                
                // Change language
                i18n.setLanguage(lang);
            });
        });

        // Set initial active option
        const currentLang = i18n.getLanguage();
        const langCodes = { 'es': 'ES', 'en': 'EN', 'ca': 'CA' };
        currentLanguageSpan.textContent = langCodes[currentLang] || 'ES';
        
        languageOptions.forEach(option => {
            if (option.getAttribute('data-lang') === currentLang) {
                option.classList.add('active');
            }
        });

        // Listen for language changes from i18n
        document.addEventListener('languagechange', (e) => {
            const lang = e.detail.language;
            const langCodes = { 'es': 'ES', 'en': 'EN', 'ca': 'CA' };
            currentLanguageSpan.textContent = langCodes[lang] || 'ES';
            
            languageOptions.forEach(option => {
                if (option.getAttribute('data-lang') === lang) {
                    option.classList.add('active');
                } else {
                    option.classList.remove('active');
                }
            });
        });
    }

    // ==========================================
    // GSAP + SCROLLTRIGGER SETUP
    // ==========================================
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
        initHeroScene();
        initGlobalCanvas();
        initAboutSection();
        initWorkflowCards();
        initTechSection();
        initContactSection();
    }
});

function initWorkflowCards() {
    const section = document.querySelector('.about-workflow');
    const container = section?.querySelector('.workflow-hero-container');
    const backCard = container?.querySelector('.workflow-hero-img--back');
    const frontCard = container?.querySelector('.workflow-hero-img--front');

    if (!section || !container || !backCard || !frontCard) return;

    const media = gsap.matchMedia();
    media.add({
        isMobile: '(max-width: 768px)',
        motionAllowed: '(prefers-reduced-motion: no-preference)'
    }, (context) => {
        if (!context.conditions.motionAllowed) return;

        const mobile = context.conditions.isMobile;
        const distance = mobile ? 24 : 48;

        const timeline = gsap.timeline({
            scrollTrigger: {
                trigger: section,
                start: 'top 80%',
                end: 'bottom 25%',
                scrub: 1.5
            }
        });

        timeline.fromTo(backCard, {
            rotationX: mobile ? 5 : 10,
            rotationY: mobile ? 11 : -16,
            rotationZ: mobile ? 5 : 6,
            x: 0,
            y: 0
        }, {
            rotationX: mobile ? 20 : 23,
            rotationY: mobile ? -10 : -20,
            rotationZ: mobile ? 5 : 18,
            x: distance * 0.55,
            y: -distance * 0.55,
            ease: 'none'
        }, 0);

        timeline.fromTo(frontCard, {
            rotationX: mobile ? 20 : 4,
            rotationY: mobile ? 8 : 12,
            rotationZ: mobile ? -14 : -18,
            x: 0,
            y: 0
        }, {
            rotationX: mobile ? 5 : 7,
            rotationY: mobile ? -3 : -5,
            rotationZ: mobile ? -6 : -8,
            x: -distance * 0.65,
            y: distance * 0.65,
            ease: 'none'
        }, 0);
    });
}


// Anchor links (use GSAP ScrollTo when available). Skip elements
// that also have `data-target` to avoid duplicate handlers.
document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener("click", async e => {
        if (link.hasAttribute('data-target')) return; // handled elsewhere
        e.preventDefault();

        const href = link.getAttribute('href');
        const target = document.querySelector(href);
console.log(target);
        const maybeTransitionIn = (typeof window.transitionIn === 'function') ? window.transitionIn : () => Promise.resolve();
        const maybeTransitionOut = (typeof window.transitionOut === 'function') ? window.transitionOut : () => Promise.resolve();

        await maybeTransitionIn();

        if (target) {
            if (typeof gsap !== 'undefined' && typeof ScrollToPlugin !== 'undefined') {
                gsap.to(window, { duration: 0.8, scrollTo: { y: target, autoKill: false }, ease: "power2.inOut" });
            } else {
                window.scrollTo({ top: target.offsetTop || 0, behavior: 'instant' });
                
            }
        } else {
            window.scrollTo({ top: 0, behavior: 'instant' });
        }

        await maybeTransitionOut();
    });
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

    // Wider orbit range; keep desktop behavior intact while making the
    // initial sphere position more centered on smaller screens.
    const isMobileViewport = window.innerWidth <= 768;
    const SPHERE_START = isMobileViewport
        ? { x: -1.5, y: 5.2, z: -3 }
        : { x: -10, y: 6, z: -5 };
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

                float alpha = line * fade * 0.35 * pulse;
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
    // ANIMATED SNAKE LINES — glowing paths on grid lines
    // ===========================
    class SnakeLine {
        constructor(color, speed = 0.15) {
            this.color = color;
            this.points = [];
            
            // Grid system: lines appear every 2.5 units (coord = vWorldPos.xz * 0.4)
            this.gridSpacing = 2.5;
            
            // Visible grid bounds (centered area where snakes move)
            this.gridBoundMin = -15;
            this.gridBoundMax = 15;
            
            // Current grid intersection position (snapped to grid)
            this.gridX = 0;  // Must always be multiple of 2.5
            this.gridZ = 0;  // Must always be multiple of 2.5
            
            // Direction: 0=+X, 1=+Z, 2=-X, 3=-Z (always moving along a line)
            this.direction = Math.floor(Math.random() * 4);
            
            // Smooth interpolation between grid intersections
            this.moveProgress = 0;
            this.moveSpeed = speed; // Units per frame
            this.targetGridX = this.gridX;
            this.targetGridZ = this.gridZ;
            this.nextDirectionChangeCounter = 0;
            this.directionChangeCooldown = Math.random() * 40 + 60; // Change direction every 60-100 frames
            
            this.maxSegments = 80;
            this.time = Math.random() * 6.28;
            
            // Create line geometry
            this.geometry = new THREE.BufferGeometry();
            this.positions = new Float32Array(3);
            this.positions[0] = 0;
            this.positions[1] = -3;
            this.positions[2] = 0;
            this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
            
            this.material = new THREE.LineBasicMaterial({
                color: color,
                linewidth: 10,
                transparent: true,
                fog: false,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });
            this.line = new THREE.Line(this.geometry, this.material);
            scene.add(this.line);
            
            // Glow effect
            this.glowGeometry = new THREE.BufferGeometry();
            this.glowGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(3), 3));
            this.glowMaterial = new THREE.LineBasicMaterial({
                color: color,
                linewidth: 10,
                transparent: true,
                fog: false,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                opacity: 0.3
            });
            this.glowLine = new THREE.Line(this.glowGeometry, this.glowMaterial);
            scene.add(this.glowLine);
            
            // Second glow layer (softer)
            this.glowGeometry2 = new THREE.BufferGeometry();
            this.glowGeometry2.setAttribute('position', new THREE.BufferAttribute(new Float32Array(3), 3));
            this.glowMaterial2 = new THREE.LineBasicMaterial({
                color: color,
                linewidth: 14,
                transparent: true,
                fog: false,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                opacity: 0.08
            });
            this.glowLine2 = new THREE.Line(this.glowGeometry2, this.glowMaterial2);
            scene.add(this.glowLine2);
            
            // Set initial target
            this.setNewTarget();
        }

        snapToGrid(value) {
            return Math.round(value / this.gridSpacing) * this.gridSpacing;
        }

        getValidDirections() {
            const valid = [];
            
            // 0=+X, 1=+Z, 2=-X, 3=-Z
            if (this.gridX + this.gridSpacing <= this.gridBoundMax) valid.push(0);
            if (this.gridZ + this.gridSpacing <= this.gridBoundMax) valid.push(1);
            if (this.gridX - this.gridSpacing >= this.gridBoundMin) valid.push(2);
            if (this.gridZ - this.gridSpacing >= this.gridBoundMin) valid.push(3);
            
            return valid.length > 0 ? valid : [this.direction];
        }

        getPerpendicular() {
            // Current direction is either X or Z
            const isMovingX = (this.direction === 0 || this.direction === 2);
            
            if (isMovingX) {
                // Moving along X, can turn to Z directions
                return [1, 3];
            } else {
                // Moving along Z, can turn to X directions
                return [0, 2];
            }
        }

        setNewTarget() {
            const valid = this.getValidDirections();
            const perpendicular = this.getPerpendicular().filter(d => valid.includes(d));
            
            // Prefer perpendicular (turn) 30% of the time, continue straight 70%
            let nextDir;
            if (perpendicular.length > 0 && Math.random() < 0.35) {
                nextDir = perpendicular[Math.floor(Math.random() * perpendicular.length)];
            } else {
                nextDir = valid.includes(this.direction) ? this.direction : valid[0];
            }
            
            this.direction = nextDir;
            
            // Calculate target grid intersection
            switch(this.direction) {
                case 0: // +X
                    this.targetGridX = this.gridX + this.gridSpacing;
                    this.targetGridZ = this.gridZ;
                    break;
                case 1: // +Z
                    this.targetGridX = this.gridX;
                    this.targetGridZ = this.gridZ + this.gridSpacing;
                    break;
                case 2: // -X
                    this.targetGridX = this.gridX - this.gridSpacing;
                    this.targetGridZ = this.gridZ;
                    break;
                case 3: // -Z
                    this.targetGridX = this.gridX;
                    this.targetGridZ = this.gridZ - this.gridSpacing;
                    break;
            }
            
            // Clamp to bounds
            this.targetGridX = Math.max(this.gridBoundMin, Math.min(this.gridBoundMax, this.targetGridX));
            this.targetGridZ = Math.max(this.gridBoundMin, Math.min(this.gridBoundMax, this.targetGridZ));
            
            this.moveProgress = 0;
            this.nextDirectionChangeCounter = 0;
        }

        update() {
            // Interpolate between current and target grid intersection
            const dist = Math.sqrt(
                Math.pow(this.targetGridX - this.gridX, 2) + 
                Math.pow(this.targetGridZ - this.gridZ, 2)
            );
            
            if (dist > 0) {
                this.moveProgress += this.moveSpeed;
                const t = Math.min(1, this.moveProgress / dist);
                
                const currentX = this.gridX + (this.targetGridX - this.gridX) * t;
                const currentZ = this.gridZ + (this.targetGridZ - this.gridZ) * t;
                
                // If reached target intersection
                if (t >= 1) {
                    this.gridX = this.snapToGrid(this.targetGridX);
                    this.gridZ = this.snapToGrid(this.targetGridZ);
                    this.setNewTarget();
                }
                
                // Add current position to trail
                this.points.unshift({ x: currentX, z: currentZ });
            }
            
            if (this.points.length > this.maxSegments) {
                this.points.pop();
            }
            
            // Update geometry
            if (this.points.length > 0) {
                const positions = new Float32Array(this.points.length * 3);
                for (let i = 0; i < this.points.length; i++) {
                    positions[i * 3] = this.points[i].x;
                    positions[i * 3 + 1] = -3;
                    positions[i * 3 + 2] = this.points[i].z;
                }
                
                this.geometry.dispose();
                this.geometry = new THREE.BufferGeometry();
                this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
                this.line.geometry = this.geometry;
                
                this.glowGeometry.dispose();
                this.glowGeometry = new THREE.BufferGeometry();
                this.glowGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
                this.glowLine.geometry = this.glowGeometry;
                
                this.glowGeometry2.dispose();
                this.glowGeometry2 = new THREE.BufferGeometry();
                this.glowGeometry2.setAttribute('position', new THREE.BufferAttribute(positions, 3));
                this.glowLine2.geometry = this.glowGeometry2;
            }
            
            // Subtle glow pulse
            this.time += 0.015;
            const pulse = Math.sin(this.time) * 0.3 + 0.7;
            this.material.opacity = pulse * 0.85;
            this.glowMaterial.opacity = pulse * 0.5;
            this.glowMaterial2.opacity = pulse * 0.1;
        }
    }

    // Create two snakes with accent colors
    // Green: #00c853, Gold: #f5b800
    // Slow, professional movement speeds
    const snake1 = new SnakeLine(0x00c853, 0.15); // accent-secondary (green) - slightly faster
    const snake2 = new SnakeLine(0xf5b800, 0.10);  // accent-tertiary (gold) - slightly slower

    // Grid is now static - mouse tracking removed

    // ===========================
    // SCROLL — sphere orbit (natural, no pin)
    // ===========================
    let heroScrollProgress = 0;

    const heroContent = document.querySelector('.hero-content');
    gsap.set(".canvas-intro", { display: "none", autoAlpha: 0 });
    gsap.set(".about-intro-container", { display: "none", autoAlpha: 0 });

    ScrollTrigger.create({
        trigger: '#hero',
        pin: true,
        start: 'top top',
        end: 'bottom top',
        scrub: true, 
        onUpdate: (self) => {
            heroScrollProgress = self.progress;
        },
        onLeave: () => {
            if (heroContent) gsap.to(heroContent, { autoAlpha: 0, duration: 0.2, overwrite: true });
            if (".about-intro-container") gsap.to(".about-intro-container", { display: "flex", autoAlpha: 1, duration: 0.5, overwrite: true });   
            if (".canvas-intro") gsap.to(".canvas-intro", { display: "block", autoAlpha: 1, duration: 0.5, overwrite: true });                 
        },
        onEnterBack: () => {
            if (heroContent) gsap.to(heroContent, { autoAlpha: 1, duration: 0.2, overwrite: true });
            if (".about-intro-container") gsap.to(".about-intro-container", { display: "none", autoAlpha: 0, duration: 0.5, overwrite: true });   
            if (".canvas-intro") gsap.to(".canvas-intro", { display: "none", autoAlpha: 0, duration: 0.5, overwrite: true });      
        }
    });

    ScrollTrigger.create({
        trigger: '.about-section',
        start: 'top top',
        end: '60% top',
        onLeave: () => {
            gsap.set(document.querySelector('.btn-cv'), { opacity: 0 });           
        },
        onEnterBack: () => {
            gsap.set(document.querySelector('.btn-cv'), { opacity: 1 });      
        }
    });

    // ===========================
    // RENDER LOOP
    // ===========================
    let heroTime = 0;

    function heroAnimate() {
        requestAnimationFrame(heroAnimate);
        heroTime += 0.016;

        // Stars twinkle + faster rotation
        starMat.uniforms.uTime.value = heroTime;
        stars.rotation.y += 0.0003;

        // Grid time
        gridMat.uniforms.uTime.value = heroTime;

        // Update snake lines
        snake1.update();
        snake2.update();

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

        // Grid is static (no mouse tracking)

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
