// imports
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'; // [3]
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';


/** 
 * set of functions to run on startup to provide menu button functionality and set up the game
 * for when the game loads and for when the game is over
 */
$(document).ready(function(){
    // hide the timer by default until game begins
    $('#timer').addClass('hidden');
    /** 
     * start space game button
     */
    $('#start-space').click(function() {
        $('#timer').removeClass('hidden');
        // hide the menu
        $('#menu').addClass('hidden');
        // set up the game
        asteroidID = setInterval(spawnAsteroid, 2000);
        startSound();
        startTimer();
        generateSpace();
        animateSpace();
    });

    /** 
     * start ocean game button
     */
    $('#start-ocean').click(function() {
        $('#timer').removeClass('hidden');
        // hide the menu
        $('#menu').addClass('hidden');
        // set up the game
        asteroidID = setInterval(spawnAsteroid, 2000);
        startSound();
        startTimer();
        generateOcean();
        animateOcean();
    });

    /** 
     * view instructions & hide menu
     */
    $('#instructions').click(function() {
        $('#menu').addClass('hidden');
        $('#instructions-page').removeClass('hidden');
    });

    /** 
     * back button from the instructions to get back to the menu
     */
    $('#back').click(function() {
        $('#menu').removeClass('hidden');
        $('#instructions-page').addClass('hidden');
    });

    /** 
     * reset game state after playing & generate the space map
     */
    $('#space').click(function () {
        // reset animations such as asteroid spawning
        cancelAnimationFrame(animationID);
        $('#timer').removeClass('hidden');
        asteroidID = setInterval(spawnAsteroid, 2000);
        resetGame();
        generateSpace();
        animateSpace();
    });

    /** 
     * reset game state after playing & generate the underwater map
     */
    $('#ocean').click(function () {
        // reset animations such as asteroid spawning
        cancelAnimationFrame(animationID);
        $('#timer').removeClass('hidden');
        asteroidID = setInterval(spawnAsteroid, 2000);
        resetGame();
        generateOcean();
        animateOcean();
    });

    /** 
     * open the instructions from the post-game menu
     * there is a separate menu and functionality to avoid setting the sound multiple times
     */
    $('#instructions-after').click(function() {
        $('#gameOver').addClass('hidden');
        $('#instructions-page-after').removeClass('hidden');
    });

    /** 
    * go back to the post-game menu from the instructions
    */
    $('#back-after').click(function() {
        $('#gameOver').removeClass('hidden');
        $('#instructions-page-after').addClass('hidden');
    });
    
});

/**
 * function to reset the game by removing everything from the scene and resetting variables
 */
function resetGame() {
    // remove the menu
    $('#gameOver').addClass('hidden');
    // remove everything in the scene
    // [16]
    while(scene.children.length > 0){ 
        scene.remove(scene.children[0]); 
    }
    // game is not over so the gamover is reset
    gameOverCount = 0;
    // restart the timer
    startTimer();
    // reset the players position
    player.spherical.set(planet.getRadius() + 0.1, Math.PI / 2, 0);
    player.updatePosition();

    // reset the list of asteroids to empty
    asteroids = []
}

// shared variables between the two maps

// so animation can be cleared when restarting the game
let animationID

// load the texture loader
const textureLoader = new THREE.TextureLoader();

// variable for controls
let controls;

// camera and renderer
const w = window.innerWidth;
const h = window.innerHeight;
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(w, h);
document.body.appendChild(renderer.domElement)

// camera field of view, aspect ratio and positioning
const fov = 90;
const aspect = w / h;
const near = 0.5;
const far = 20;
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
camera.position.z = 2;

/**
 * function to start the sound
 * it ensures that sound starts if it has been paused previously for some reason before the game was loaded
 * soundtrack will plays while the browser is open
 */
function startSound() {
    // get sound context to see if it is playing
    // [17]
    const audioContext = THREE.AudioContext.getContext();

    // resume sound at the start if it was paused, prevents an audioContext error
    if (audioContext.state === 'suspended') {
        audioContext.resume()
    }

    // add sound to camera
    // [18]
    const listener = new THREE.AudioListener();
    camera.add( listener );
    
    // load the music and play it on a loop
    const sound = new THREE.Audio( listener );
    const audioLoader = new THREE.AudioLoader();
    audioLoader.load( '../Assets/soundtrack.m4a', function( buffer ) {
        sound.setBuffer( buffer );
        sound.setLoop( true );
        sound.setVolume( 0.5 );
        sound.play();
    });
}

// create the scene
const scene = new THREE.Scene();

// stop gameover from running multiple times; allows the game to be 'playable' when over
let gameOverCount = 0;

// variable to hold the planet
let planet;
// variable to hold the player
let player;

// timer variables
let startTime;
let minElement = document.getElementById('minutes'); 
let secElement = document.getElementById('seconds'); 

// variables to hold the id's of the timer and asteroid intervals
let timerID;
let asteroidID;

/**
 * function to provide orbit (mouse) controls
 */
function createControls(camera) {
    // [4]
    controls = new OrbitControls(camera, renderer.domElement);

    // restrict zoom so players cant see nothing by zooming out too much or see inside the planet
    // [5]
    controls.minDistance = 2;
    controls.maxDistance = 10;
}

// initialise controls
createControls(camera);

/**
 * function to update the camera when the window is resized
 */
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

/** @class class for the planet */
class Planet {
    /**
     * constructor to initialise the planet
     * @param {*} radius radius of the planet
     * @param {*} texturePath the path to the file holding the texture of the planet; different for each map
     */
    constructor(radius, texturePath) {
        // [1] (was used before the planet was a class, used when the planet was a sphere with gradient hemisphere lighting)
        this.radius = radius;
        // load either mercury or the turtle shell
        const planetTexture = textureLoader.load(texturePath);

        // create planet as a sphere
        const geometry = new THREE.SphereGeometry(radius, 32, 32);
        const material = new THREE.MeshStandardMaterial({
            map: planetTexture,
            bumpMap: planetTexture, // add some bumps, more prelavent on the turtle shell
            bumpScale: 5
        });
        this.mesh = new THREE.Mesh(geometry, material);
        // add planet to the scene
        scene.add(this.mesh);
    }

    /**
     * function to return the radius of the planet
     * @returns {*} radius
     */
    getRadius() {
        return this.radius;
    }
}

/** @class player class */
class Player {
    /**
     * constructor to spawn a new player
     */
    constructor() {
        this.loader = new GLTFLoader();
        // player model
        this.avatar = '../Assets/sphere.gltf';
        // refer to planet to get the radius to work out the players position
        this.planet = planet;
        this.spherical = new THREE.Spherical();
        this.player = null;
        // set the player slightly above the planets surface
        // [9]
        this.spherical.set(this.planet.getRadius() + 0.05, Math.PI / 2, 0);
        // create an invisible cube to be a bounding box
        this.boundingBoxGeometry = new THREE.BoxGeometry(0.05, 0.05, 0.05);
        this.boundingBoxMaterial = new THREE.MeshBasicMaterial({
            transparent: true,
            opacity: 0
        });
        this.boundingBoxCube = new THREE.Mesh(this.boundingBoxGeometry, this.boundingBoxMaterial)
        // set the bounding box
        this.boundingBox = new THREE.Box3();
        this.boundingBox.setFromObject(this.boundingBoxCube);
        // load the player 
        // [10]
        this.loader.load(this.avatar, (gltf) => {
            this.player = gltf.scene;
            this.player.scale.set(0.05, 0.05, 0.05);
            scene.add(this.player);
            this.updatePosition();
        });
    }

    /**
     * update position of the player and the bounding box
     */
    updatePosition() {
        if (this.player) {
            // update position of player and bounding box based on spherical coordinates
            //[2], [13]
            this.player.position.setFromSpherical(this.spherical); 
            this.boundingBoxCube.position.setFromSpherical(this.spherical);
            this.boundingBox.setFromObject(this.boundingBoxCube);
        }
    }

    /**
     * move the player in the desired direction based on the arrow key that they pressed
     * @param {*} direction direction of the arrow key pressed
     */
    move(direction) {
        // [7], [8]
        // value of one step
        const step = 0.1;
        switch (direction) {
            // move up, subtract from phi
            case 'up':
                this.spherical.phi -= step;
                break;
            // move down, add to phi
            case 'down':
                this.spherical.phi += step;
                break;
            // move left, reduce theta
            case 'left':
                this.spherical.theta -= step / Math.sin(this.spherical.phi); 
                break;
            // move right, increase theta
            case 'right':
                this.spherical.theta += step / Math.sin(this.spherical.phi); 
                break;
        }
        // update the position when moving
        this.updatePosition();
    }
}

/**
 * get the key that the user pressed and move the user
 * @param {*} event key press event
 */
function keyboardControl(event) {
    // [6]
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

/** @class asteroid class */
class Asteroid {
    /**
     * create a new asteroid
     * @param {*} speed speed for the asteroid
     */
    constructor(speed) {
        this.mesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.1, 6, 6),
            new THREE.MeshStandardMaterial({
                color: 0x808080,
                flatShading: true, // use flatshading to make it less spherical
            })
        )
        // speed of the asteroid 
        this.speed = speed;
        // move directopm for asteroid
        this.direction = new THREE.Vector3();
        this.boundingBox = new THREE.Box3();
        this.boundingBox.setFromObject(this.mesh);
        // get position of sphere asteroid will crash onto
        this.asteroidPosition(); 
        scene.add(this.mesh);
    }

    /**
     * function that works out the position that the asteroid will travel in
     */
    asteroidPosition() {
        // get a phi and theta to get a position on the sphere where the asteroid will crash onto
        const phi = Math.random() * Math.PI; 
        const theta = Math.random() * 2 * Math.PI; 
        // initial distance, asteroid spawns ~ 6 planets away
        const distance = 6; 

        this.mesh.position.setFromSphericalCoords(distance, phi, theta);

        // get direction toward the planet asteroid will travel in
        this.direction.copy(this.mesh.position).normalize().negate();
    }

    /**
     * function to update the position of the asteroid as it moves
     */
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

/**
 * go through the list of asteroids to see if any of them have collided with the player
 * @param {*} player the player
 * @param {*} asteroids the list of asteroids
 */
function checkCollision(player, asteroids) {
    for (let i = 0; i < asteroids.length; i++) {
        // check each asteroid for a collision with the player
        // [12]
        if (player.boundingBox.intersectsBox(asteroids[i].boundingBox)) {
            // do gameover only once to stop the timer, needed since the game still works once the game is over
            gameOverCount ++;
            if (gameOverCount == 1) {
                gameOver();
            }
        }
    }
}

/**
 * function to get the time when the timer is loaded
 */
function startTimer() {
    startTime = Date.now();
}

/**
 * function to clear the timer once the game is over & reset
 */
function resetTimer() {
    clearInterval(timerID);
}

/**
 * function to update the timer every second
 */
function timer() {
    // [14], [15]
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

/**
 * function to spawn an asteroid by creating a new one and adding it to the array of asteroids
 */
function spawnAsteroid() {
    // random speed for the asteroid
    let speed = Math.random() * 0.04;
    const asteroid = new Asteroid(speed);
    asteroids.push(asteroid);
}

/**
 * function to update the asteroid movement of all asteroids on the screen
 */
function updateAsteroids() {
    asteroids.forEach((asteroid) => asteroid.update());
}


/**
 * function to get the time the player survived for and open the game over screen
 */
function gameOver() {
    // [18]
    const listener = new THREE.AudioListener();
    camera.add( listener );
    
    // load the explosion sound and play it once at a high volume
    const sound = new THREE.Audio( listener );
    const audioLoader = new THREE.AudioLoader();
    audioLoader.load( '../Assets/Explosion.m4a', function( buffer ) {
        sound.setBuffer( buffer );
        sound.setLoop( false );
        sound.setVolume( 10 );
        sound.play();
    });
    // stop the asteroids
    clearInterval(asteroidID);
    // stop the timer
    resetTimer(); 
    // show the game over screen
    $('#gameOver').removeClass('hidden');
    $('#timer').addClass('hidden');
    // normalise the time
    const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(elapsedTime / 60);
    const seconds = elapsedTime % 60;

    // display how long user survived for
    $('#message').text(`You survived for ${minutes} minutes and ${seconds} seconds.`);
}

/**
 * function to spawn some fish in the scene
 */
function spawnRandomFish() {
    let flod = new GLTFLoader();
    flod.load('../Assets/happy-fish.gltf', (gltf) => {

        let fish = gltf.scene;

        scene.add(fish);
        fish.scale.set(0.1, 0.1, 0.1);
        fish.position.set(Math.random()*4+1, 3, Math.random()*4+1); 
    })
}

/**
 * function to generate the space scene
 */
function generateSpace() {
    // create planet with radius 1
    planet = new Planet(1.0, '../Assets/mercury.jpg');

    // add some light to the planet
    const hemiLight = new THREE.HemisphereLight(0xe6e6ed, 0xe6e6ed);
    scene.add(hemiLight);

    // add the sun 
    const sunTexture = textureLoader.load('../Assets/sun.jpg'); // load the texture
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

    // load player
    player = new Player();

    // add starts background for the scene
    const backgroundTexture = textureLoader.load('../Assets/stars.jpg');
    scene.background = backgroundTexture;

    const light = new THREE.AmbientLight( 0x404040 ); // soft white ambient light
    scene.add(light);
}

/**
 * function to generate the ocean scene
 */
function generateOcean() {
    // create planet with radius 1
    planet = new Planet(1.0, '../Assets/turtle.jpg');

    // add some low light to the planet
    const hemiLight = new THREE.HemisphereLight(0xe6e6ed, 0xe6e6ed);
    scene.add(hemiLight);


    // sun in the ocean map is an angler fish
    let sun;  

    // load the fish and set it as the sun
    // [10]
    const fishLoader = new GLTFLoader();
    fishLoader.load('../Assets/angler.gltf', (gltf) => {
        sun = gltf.scene; 
        sun.scale.set(0.5, 0.5, 0.5);
        // offset position slightly so the bulb is over the planet
        sun.position.set(-2, 3, 0); 
        scene.add(sun); 

        // add some pink light from the position of the bulb on the angler fish
        let bulb = new THREE.Vector3(0, 3, 0)
        const sunLight = new THREE.PointLight(0xFFC0CB, 10, 100);
        sunLight.position.copy(bulb);
        scene.add(sunLight); 
    });

    // generate a school of fish
    for (let i = 0; i < 8; i++) {
        spawnRandomFish();
    }

    // load player
    player = new Player();

    const light = new THREE.AmbientLight( 0x404040 ); // soft white ambient light
    scene.add(light);
    // add starts background for the scene
    const backgroundTexture = textureLoader.load('../Assets/ocean.jpg');
    scene.background = backgroundTexture;
}

/**
 * animation function for the space game
 */
function animateSpace() {
    animationID = requestAnimationFrame(animateSpace);
    timerID = setInterval(timer, 1000);
    controls.update();
    updateAsteroids();
    checkCollision(player, asteroids, timerID);
    renderer.render(scene, camera);
}

/**
 * animation function for the underwater game
 */
function animateOcean() {
    animationID = requestAnimationFrame(animateOcean);
    timerID = setInterval(timer, 1000);
    controls.update();
    updateAsteroids(); 
    checkCollision(player, asteroids, timerID);
    renderer.render(scene, camera);
}

/*
References (same as in the main report)

[1] Bobby, R (2024) Getting Started with Three.js: A Beginner’s Tutorial, YouTube, Available at: https://youtu.be/XPhAR1YdD6o?si=A8u4Ry-NY77i842m

[2] prisoner849 (2018) [SOLVED] Move items around a sphere, Threejs Discourse, Available at: https://discourse.threejs.org/t/solved-move-items-around-a-sphere/1877/3 

[3] Ishu1999 (2021) Importing Orbit Controls, Threejs Discourse, Available at: https://discourse.threejs.org/t/importing-orbit-controls/33131

[4] Three.js. (n.d.) OrbitControls, Threejs Docs, Available at: https://threejs.org/docs/#examples/en/controls/OrbitControls

[5] aswzn (2021) How to limit max and min zoom in THREE.OrbitControls with THREE.OrthographicCamera, Threejs Discourse, Available at:  https://discourse.threejs.org/t/how-to-limit-max-and-min-zoom-in-three-orbitcontrols-with-three-orthographiccamera/9800

[6] Negi, A (2024) Three.js Tutorial: Move 3D Mesh with WASD and Arrow Keys for Character-Like Control, Medium, Available at: https://medium.com/javascript-alliance/three-js-tutorial-move-3d-mesh-with-wasd-and-arrow-keys-for-character-like-control-8b87b51ded61

[7] Dr. Maultsby, B (2020) Introduction to spherical coordinates, YouTube, Available at: https://www.youtube.com/watch?v=8x_UjFUySRg

[8] XYZ + RGB (2020) Spherical Coordinates 3D Animation, YouTube, Available at: https://youtu.be/Ex_g2w4E5lQ?si=aX2qtS-A4K4AceiP

[9] Three.js. (n.d.) Spherical, Threejs Docs, Available at:  https://threejs.org/docs/#api/en/math/Spherical

[10] Three.js. (n.d.) GTLFLoader, Threejs Docs, Available at:  https://threejs.org/docs/#examples/en/loaders/GLTFLoader

[11] Three.js. (n.d.) lookAt, Threejs Docs, Available at:  https://threejs.org/docs/#api/en/core/Object3D.lookAt

[12] Jain, H (2024) Exploring Collision Detection in Three.js, Medium, Available at: https://jainmanshu.medium.com/exploring-collision-detection-in-three-js-82dc95a383f4#:~:text=In%20order%20to%20detect%20collisions,occupied%20by%20a%203D%20object.&text=const%20redCubeBB%20%3D%20new%20THREE.,Vector3()%2C%20new%20THREE.

[13] Three.js. (n.d.) setFromSpherical, Threejs Docs, Available at:  https://threejs.org/docs/#api/en/math/Vector3.setFromSpherical

[14] Mark (2011) plain count up timer in javascript, Stack Overflow, Available at:  https://stackoverflow.com/questions/5517597/plain-count-up-timer-in-javascript

[15] W3 Schools (n.d.) How TO - JavaScript Countdown Timer, W3 Schools, Available at: https://www.w3schools.com/howto/howto_js_countdown.asp 

[16] ExtremelySeriousChicken (2017) How do I clear THREE.JS Scene, Stack Overflow, Available at: https://stackoverflow.com/questions/30359830/how-do-i-clear-three-js-scene 

[17] Three.js. (n.d.) AudioListener, Threejs Docs, Available at:  https://threejs.org/docs/?q=audio#api/en/audio/AudioListener

[18] Three.js. (n.d.) AudioContext, Threejs Docs, Available at:  https://threejs.org/docs/?q=audio#api/en/audio/AudioContext

[19] Krita Foundation, Krita (application) Available at: https://krita.org/en/ 

[20] Blender Foundation, Blender (application) Available at: https://www.blender.org/ 

[21] Apple, GarageBand (application) Available at: https://apps.apple.com/us/app/garageband/id408709785 

[21] Google LLC, Recorder (application) Available at: https://play.google.com/store/apps/details?id=com.google.android.apps.recorder&hl=en_GB&pli=1 

*/