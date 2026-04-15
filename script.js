// Wait for the DOM to be fully loaded
document.addEventListener("DOMContentLoaded", () => {
    
    console.log("Portfolio loaded!");

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
