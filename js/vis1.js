/**
 * Vis 1 Task 1 Framework
 * Copyright (C) TU Wien
 *   Institute of Visual Computing and Human-Centered Technology
 *   Research Unit of Computer Graphics
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are not permitted.
 *
 * Main script for Vis1 exercise. Loads the volume, initializes the scene, and contains the paint function.
 *
 * @author Manuela Waldner
 * @author Laura Luidolt
 * @author Diana Schalko
 */
let renderer, camera, scene, orbitCamera;
let canvasWidth, canvasHeight = 0;
let container = null;
let volume = null;
let fileInput = null;
let rayCastingShader = null;
let histogram = null;
let cuttingPlane = null;

/**
 * Load all data and initialize UI here.
 */
function init() {
    // volume viewer
    container = document.getElementById("viewContainer");
    canvasWidth = window.innerWidth * 0.7;
    canvasHeight = window.innerHeight * 0.7;

    // WebGL renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setSize( canvasWidth, canvasHeight );
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.sortObjects = true;
    container.appendChild( renderer.domElement );

    // read and parse volume file
    fileInput = document.getElementById("upload");
    fileInput.addEventListener('change', readFile);

    // init rayCastingShader
    rayCastingShader = new RayCastingShader();


    cuttingPlane = new CuttingPlane();
    histogram = new Histogram("#tfContainer");

    const isovalueSlider = document.getElementById("isovalueSlider");
    const isovalueValue = document.getElementById("isovalueValue");
    const useIsosurfaceCheckbox = document.getElementById("useIsosurfaceCheckbox");
    const isosurfaceOptions = document.getElementById("isosurfaceOptions");
    const isosurfaceColorPicker = document.getElementById("isosurfaceColorPicker");
    const isosurfaceTransparencySlider = document.getElementById("isosurfaceTransparencySlider");
    const isosurfaceTransparencyValue = document.getElementById("isosurfaceTransparencyValue");
    
    isovalueSlider.addEventListener('input', function() {
        const value = parseFloat(this.value);
        isovalueValue.textContent = value.toFixed(2);
        if (rayCastingShader) {
            rayCastingShader.setUniform("isovalue", value);
            paint();
        }
    });

    isosurfaceColorPicker.addEventListener('input', function() {
        if (rayCastingShader) {
            const color = this.value;
            const r = parseInt(color.substr(1,2), 16) / 255;
            const g = parseInt(color.substr(3,2), 16) / 255;
            const b = parseInt(color.substr(5,2), 16) / 255;
            rayCastingShader.setUniform("isosurfaceColor", [r, g, b], "v3");
            paint();
        }
    });

    isosurfaceTransparencySlider.addEventListener('input', function() {
        const value = parseFloat(this.value);
        isosurfaceTransparencyValue.textContent = value.toFixed(2);
        if (rayCastingShader) {
            rayCastingShader.setUniform("isosurfaceTransparency", value);
            paint();
        }
    });

    useIsosurfaceCheckbox.addEventListener('change', function() {
        if (rayCastingShader) {
            rayCastingShader.setUniform("useIsosurface", this.checked);
            isosurfaceOptions.style.display = this.checked ? "block" : "none";
            paint();
        }
    });
}

/**
 * Handles the file reader. No need to change anything here.
 */
function readFile(){
    let reader = new FileReader();
    reader.onloadend = function () {
        console.log("data loaded: ");

        let data = new Uint16Array(reader.result);
        volume = new Volume(data);

        histogram.update(Array.from(volume.voxels));

        resetVis();
    };
    reader.readAsArrayBuffer(fileInput.files[0]);
}

/**
 * Construct the THREE.js scene and update histogram when a new volume is loaded by the user.
 */
async function resetVis(){
    // create new empty scene and perspective camera
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera( 75, canvasWidth / canvasHeight, 0.1, 1000 );

    const box = new THREE.BoxGeometry(volume.width, volume.height, volume.depth);

    const rayCastingMaterial = rayCastingShader.material;
    rayCastingMaterial.transparent = true;
    rayCastingMaterial.blending = THREE.NormalBlending;
    await rayCastingShader.load();

    cuttingPlane.setShader(rayCastingShader);

    const texture = new THREE.Data3DTexture(volume.voxels, volume.width, volume.height, volume.depth);
    texture.format = THREE.RedFormat;
    texture.type = THREE.FloatType;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.unpackAlignment = 1;
    texture.needsUpdate = true;

    rayCastingShader.setUniform("boxMin", [-volume.width/2, -volume.height/2, -volume.depth/2], "v3");
    rayCastingShader.setUniform("boxMax", [volume.width/2, volume.height/2, volume.depth/2], "v3");
    rayCastingShader.setUniform("volume", texture, "t3D");
    rayCastingShader.setUniform("planeRotX", 0.0);
    rayCastingShader.setUniform("planeRotY", 0.0);
    rayCastingShader.setUniform("planePos", new THREE.Vector3(0.0, 0.0, 0.0));
    rayCastingShader.setUniform("renderAbovePlane", false);

    rayCastingShader.setUniform("isovalue", 0.3);
    rayCastingShader.setUniform("useIsosurface", false);
    rayCastingShader.setUniform("isosurfaceColor", [0.8, 0.6, 0.4], "v3");
    rayCastingShader.setUniform("isosurfaceTransparency", 0.0);

    cuttingPlane.update();

    const boxMesh = new THREE.Mesh(box, rayCastingMaterial);
    scene.add(boxMesh);

    // our camera orbits around an object centered at (0,0,0)
    orbitCamera = new OrbitCamera(camera, new THREE.Vector3(0,0,0), 2*volume.max, renderer.domElement);

    // init paint loop
    requestAnimationFrame(paint);
}

/**
 * Render the scene and update all necessary shader information.
 */
function paint(){
    if (volume) {
        renderer.render(scene, camera);
    }
}
