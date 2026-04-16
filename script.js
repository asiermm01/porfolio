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

            // Adding/removing 'scrolled' class based on scroll position
            if (currentScrollY > 50) {
                navbar.classList.add("scrolled");
            } else {
                navbar.classList.remove("scrolled");
            }

            // Hiding/showing navbar based on scroll direction
            if (currentScrollY > lastScrollY && currentScrollY > 100) {
                // Scrolling down & past 100px: hide navbar
                navbar.classList.add("hidden");
            } else {
                // Scrolling up: show navbar
                navbar.classList.remove("hidden");
            }

            lastScrollY = currentScrollY;
        }, { passive: true });
    }

    // ==========================================
    // GSAP ANIMATIONS SETUP
    // ==========================================
    // Example GSAP code:
    // gsap.from(".hero-title", { duration: 1, y: 50, opacity: 0, ease: "power3.out" });


    // ==========================================
    // THREE.JS SETUP
    // ==========================================
    // Check if Three.js is loaded
    if (typeof THREE !== 'undefined') {
        console.log("Three.js is ready to use.");
        
        // Basic Three.js setup snippet for later use:
        /*
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        
        // Setup canvas
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.querySelector('.hero-bg-grid').appendChild(renderer.domElement);
        */
    }

});
