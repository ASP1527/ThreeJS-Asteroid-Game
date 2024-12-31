import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

$(document).ready(function(){
    // start game button
    $('#start').click(function() {
        $('#menu').css('display', 'none');
        startTimer();
        generateSpherical()
        animateSpherical()
    });
    // start game button
    $('#startx').click(function() {
        $('#menu').css('display', 'none');
        startTimer();
        generatePlanar()
        animatePlanar()
    });
    // view instructions & hide menu
    $('#instructions').click(function() {
        $('#menu').css('display', 'none');
        $('#instructions-page').css('display', 'block');
    });
    // go back to menu from instructions
    $('#back').click(function() {
        $('#menu').css('display', 'block');
        $('#instructions-page').css('display', 'none');
    });

    $('#restartGameBtn').click(function () {
        $('#gameOver').css('display', 'none');
        gameOverCount = 0;
        startTimer();
        player.spherical.set(planet.getRadius() + 0.1, Math.PI / 2, 0); // Reset player position
        player.updatePosition(); // Update player's position

        // Remove all asteroids
        asteroids.forEach((asteroid) => scene.remove(asteroid.mesh));
        asteroids = []

        animateSpherical();
    });
    
});

// Shared variables between the two maps

const textureLoader = new THREE.TextureLoader();

let controls;

const w = window.innerWidth;
const h = window.innerHeight;
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(w, h);
document.body.appendChild(renderer.domElement)

const fov = 75;
const aspect = w / h;
const near = 0.5;
const far = 10;
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
camera.position.z = 2;

const scene = new THREE.Scene();

// stop gameover from running multiple times; allows the game to be 'playable' when over
let gameOverCount = 0;

let planet;
let player;

let startTime; // time now; start time for timer
let minElement = document.getElementById('minutes'); 
let secElement = document.getElementById('seconds'); 
let timerID;

// Setup orbit controls
function createControls(camera) {
    controls = new OrbitControls(camera, renderer.domElement);
    controls.rotateSpeed = 1.0;
    controls.zoomSpeed = 1.2;
    controls.panSpeed = 0.8;

    // Set min and max distance for zoom
    controls.minDistance = 2;  // Minimum zoom distance (closer to the planet)
    controls.maxDistance = 10; // Maximum zoom distance (further away)

    controls.keys = ['KeyA', 'KeyS', 'KeyD']; // These are custom key bindings

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

// initialise controls
createControls(camera);

// class for the planet
class Planet {
    constructor(radius) {
        this.radius = radius;

        const planetTexture = textureLoader.load('mercury.jpg');

        const geometry = new THREE.SphereGeometry(radius, 32, 32);
        const material = new THREE.MeshStandardMaterial({
            map: planetTexture,
            flatShading: false, // smoother shading
        });
        this.mesh = new THREE.Mesh(geometry, material);
    }

    addToScene(scene) {
        scene.add(this.mesh);
    }

    getRadius() {
        return this.radius;
    }
}

// player class
class Player {
    constructor() {
        this.loader = new GLTFLoader();
        this.avatar = 'sphere.gltf';
        this.planet = planet; // Reference to the Planet object
        this.spherical = new THREE.Spherical();
        this.player = null;
        this.spherical.set(this.planet.getRadius() + 0.05, Math.PI / 2, 0); // Position slightly above the surface
        this.geometry1 = new THREE.BoxGeometry(0.05, 0.05, 0.05); // Create a cube geometry
        this.material1 = new THREE.MeshBasicMaterial({
            color: 0x000000, // Black color (or any other)
            transparent: true, // Enable transparency
            opacity: 0, // Make it fully invisible
        });
        this.boundingBoxCube = new THREE.Mesh(this.geometry1, this.material1)
        this.boundingBox = new THREE.Box3();
        this.boundingBox.setFromObject(this.boundingBoxCube);
        this.loader.load('sphere.gltf', (gltf) => {
            this.player = gltf.scene;
            this.player.scale.set(0.05, 0.05, 0.05);
            scene.add(this.player);
            this.updatePosition();
        });
    }

    loadModel() {
    }

    updatePosition() {
        if (this.player) {
            // Update position based on spherical coordinates
            this.player.position.setFromSpherical(this.spherical);
            this.boundingBoxCube.position.setFromSpherical(this.spherical);
            this.boundingBox.setFromObject(this.boundingBoxCube);
        }
    }

    move(direction) {
        const moveStep = 0.1; // Angular step for movement
        switch (direction) {
            case 'up':
                this.spherical.phi -= moveStep; // Allow movement beyond the poles
                break;
            case 'down':
                this.spherical.phi += moveStep; // Allow movement beyond the poles
                break;
            case 'left':
                this.spherical.theta -= moveStep / Math.sin(this.spherical.phi); // Adjust theta based on phi
                break;
            case 'right':
                this.spherical.theta += moveStep / Math.sin(this.spherical.phi); // Adjust theta based on phi
                break;
        }
        this.updatePosition();
    }
}

// Control the player with keyboard events
function keyboardControl(event) {
    switch (event.code) {
        case 'ArrowUp':
            player.move('up');
            break;
        case 'ArrowDown':
            player.move('down');
            break;
        case 'ArrowLeft':
            player.move('left');
            break;
        case 'ArrowRight':
            player.move('right');
            break;
    }
}

window.addEventListener('keydown', keyboardControl);



// asteroid class
class Asteroid {
    constructor() {
        this.mesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.1, 6, 6),
            new THREE.MeshStandardMaterial({
                color: 0x808080,
                flatShading: true, // use flatshading to make it less spherical
            })
        )
        this.speed = 0.02; // speed of the asteroid 
        this.direction = new THREE.Vector3(); // move directopm for asteroid
        this.boundingBox = new THREE.Box3();
        this.boundingBox.setFromObject(this.mesh);
        this.asteroidPosition(); // get position of sphere asteroid will crash onto
        scene.add(this.mesh);
    }

    asteroidPosition() {
        // get a phi and theta to get a position on the sphere where the asteroid will crash onto
        const phi = Math.random() * Math.PI; // angle between 0 and π
        const theta = Math.random() * 2 * Math.PI; // angle between 0 and 2π
        const distance = 6; // initial distance, asteroid spawns ~ 6 planets away

        this.mesh.position.setFromSphericalCoords(distance, phi, theta);

        // get direction toward the planet asteroid will travel in
        this.direction.copy(this.mesh.position).normalize().negate();
    }

    update() {
        // move asteroid toward planet
        this.mesh.position.addScaledVector(this.direction, this.speed);

        this.boundingBox.setFromObject(this.mesh);

        // stop moving when asteroid collides with surface (gets to distance of planets radius + asteroids radius)
        if (this.mesh.position.length() <= 1 + 0.1) {
            this.speed = 0; // stop moving
        }
    }
}

function checkCollision(player, asteroids) {
    for (let i = 0; i < asteroids.length; i++) {
        if (player.boundingBox.intersectsBox(asteroids[i].boundingBox)) {
            gameOverCount ++;
            if (gameOverCount == 1) {
                gameOver();
            }
        }
    }
}

function startTimer() {
    startTime = Date.now();
}

function resetTimer() {
    clearInterval(timerID); // Stop the timer
}

function timer() {
    let elapsed = Date.now() - startTime; // elapsed time in milliseconds
    let totalTime = Math.floor(elapsed / 1000); // total time in seconds
    let mins = Math.floor(totalTime / 60); // total mins
    let secs = totalTime % 60; // total secs after taking away mins

    // update the time
    if (mins < 10) {
        minElement.innerText = '0' + mins;
    } else {
        minElement.innerText = mins;
    }

    if (secs < 10) {
        secElement.innerText = '0' + secs;
    } else {
        secElement.innerText = secs;
    }
}

// array to hold asteroids
let asteroids = [];

// function to make an asteroid and add it to the array
function spawnAsteroid() {
    const asteroid = new Asteroid();
    asteroids.push(asteroid);
}

// update the movement of all asteroidsw
function updateAsteroids() {
    asteroids.forEach((asteroid) => asteroid.update());
}

// interval to spawn asteroids
setInterval(spawnAsteroid, 2000);


// Function to trigger Game Over
function gameOver() {
    resetTimer(); // Stop the timer
    $('#gameOver').css('display', 'block'); // Show the Game Over screen
    const elapsedTime = Math.floor((Date.now() - startTime) / 1000); // Total time in seconds
    const minutes = Math.floor(elapsedTime / 60);
    const seconds = elapsedTime % 60;

    // Display the survival time
    $('#message').text(`You survived for ${minutes} minutes and ${seconds} seconds.`);
}

function generateSpherical() {
    // create planet with radius 1
    planet = new Planet(1.0);
    // add planet to the scene
    planet.addToScene(scene);

    // add some light to the planet
    const hemiLight = new THREE.HemisphereLight(0xe6e6ed, 0xe6e6ed);
    scene.add(hemiLight);

    // add the sun
    const sunTexture = textureLoader.load('sun.jpg'); // load the texture
    const sunRadius = 2; // sun is double the planet size
    const sunGeo = new THREE.SphereGeometry(sunRadius, 32, 32);
    const sunMat = new THREE.MeshBasicMaterial({
        map: sunTexture
    });
    const sun = new THREE.Mesh(sunGeo, sunMat);

    const sunDistance = 5; // sun is 5 units away from centre of planet
    sun.position.set(0, sunDistance, 0);
    scene.add(sun);

    // add sun pointlight toward planet
    const sunLight = new THREE.PointLight(0xffff00, 4, 100); // yello sunlight toward planet
    sunLight.position.copy(sun.position);
    scene.add(sunLight);

    // add starts background for the scene
    const backgroundTexture = textureLoader.load('stars.jpg');
    scene.background = backgroundTexture;

    // load player
    player = new Player();
    player.loadModel();

    const light = new THREE.AmbientLight( 0x404040 ); // soft white ambient light
    scene.add(light);
}

function generatePlanar() {
    // create planet with radius 1
    planet = new Planet(1.0);
    // add planet to the scene
    planet.addToScene(scene);

    // add some light to the planet
    const hemiLight = new THREE.HemisphereLight(0xe6e6ed, 0xe6e6ed);
    scene.add(hemiLight);


    let sun;  // Declare the sun variable

    const fishLoader = new GLTFLoader();
    fishLoader.load('angler.gltf', (gltf) => {
        sun = gltf.scene; // This is the loaded 3D model of the sun
        sun.scale.set(0.5, 0.5, 0.5);
        // Set the position of the sun after the model is loaded
        sun.position.set(-2, 3, 0);  // Set the position
        scene.add(sun);  // Add the model to the scene

        // Optional: Add a point light that mimics the sun's light
        const sunLight = new THREE.PointLight(0xFFC0CB, 10, 100);  // Yellow light, intensity 3, range 100
        sunLight.position.copy(sun.position);  // Position the light where the sun is
        scene.add(sunLight);  // Add the light to the scene
    });

    // load player
    player = new Player();
    player.loadModel();

    const light = new THREE.AmbientLight( 0x404040 ); // soft white ambient light
    scene.add(light);
    // add starts background for the scene
    const backgroundTexture = textureLoader.load('weird-bg.jpg');
    scene.background = backgroundTexture;
}

// Animation loop
function animateSpherical() {
    requestAnimationFrame(animateSpherical);
    timerID = setInterval(timer, 1000);
    controls.update();
    updateAsteroids(); // Update asteroid positions
    checkCollision(player, asteroids, timerID);
    renderer.render(scene, camera);
}

// Animation loop
function animatePlanar() {
    requestAnimationFrame(animatePlanar);
    timerID = setInterval(timer, 1000);
    controls.update();
    updateAsteroids(); // Update asteroid positions
    checkCollision(player, asteroids, timerID);
    renderer.render(scene, camera);
}


//TODO: make the planet on the fish mode different (Maybe make it a tortoise shell?), why is bg desaturated?, add the special ball to erase the asteroids