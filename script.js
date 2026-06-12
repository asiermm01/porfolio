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

            if (currentScrollY > lastScrollY && currentScrollY > 1200) {
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
        initAboutSection();
        initTechSection();
    }
});



document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener("click", async e => {
    e.preventDefault();

    const target = document.querySelector(
      link.getAttribute("href")
    );

    await transitionIn();

    window.scrollTo({
      top: target.offsetTop,
      behavior: "instant"
    });

    await transitionOut();
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

   /*  ScrollTrigger.create({
    start: 4000,
    onEnter: () => {
        gsap.to(".canvas-intro", { autoAlpha: 0 });
    },

    onLeaveBack: () => {
        gsap.to(".canvas-intro", { autoAlpha: 1 });
    }
    }); */

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
        markers: true,
        onLeave: () => {
            gsap.set(document.querySelector('.btn-cv'), { autoAlpha: 0 });           
        },
        onEnterBack: () => {
            gsap.set(document.querySelector('.btn-cv'), { autoAlpha: 1 });      
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

 // ===========================
// "Loading" screen
// ===========================
gsap.registerPlugin(ScrollToPlugin);

const durationScroll = 3;
const multiplicadorTemporal = 0.0005;
let offsetScroll = 0;

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
    console.log(tiempo);

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
    if (aboutImage) gsap.set(aboutImage, { x: '-50vw', opacity: 0 });
    if (introCard) gsap.set(introCard, { x: '50vw', opacity: 0 });

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
    if (aboutImage && introCard) {
        tl.to([aboutImage, introCard], {
            x: 0,
            opacity: 1,
            duration: 0.8,
            ease: "power2.out"
        }, "-=0.2"); // Small delay after text starts fading in
    }
}
ScrollTrigger.create({
  start: 3400,

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
