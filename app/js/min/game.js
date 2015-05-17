(function(){

var camera, scene, renderer;

function init() {
    world = new T('container');

    camera = world.camera;
    scene = world.scene;
    renderer = world.renderer;

    world.render();

    setCamera();
    orbitControls();

    createSky();
    setLights();
    groundPlane();

    makeBoard();
}

// ----- Camera
function setCamera() {
    camera.x(400);
    camera.y(200);
    camera.z(400);
}

// ----- Controls
function orbitControls() {

    var controls = new THREE.OrbitControls( camera, renderer.domElement );

    function orbitAnimate() {
        requestAnimationFrame(orbitAnimate);
        controls.update();
    }

    controls.damping = 0.5;
    orbitAnimate();
}

// ----- Sky
function createSky() {
    var vertexShader = document.getElementById( 'vertexShader' ).textContent,
        fragmentShader = document.getElementById( 'fragmentShader' ).textContent;

    var uniforms = {
        topColor: 	 { type: "c", value: new THREE.Color( 0x0077ff ) },
        bottomColor: { type: "c", value: new THREE.Color( '#ccc' ) },
        offset:		 { type: "f", value: 400 },
        exponent:	 { type: "f", value: 0.6 }
    }

    scene.fog = new THREE.Fog( null, 1000, 20000 );
    scene.fog.color.copy( uniforms.bottomColor.value );

    skyGeo = new THREE.SphereGeometry( 20000, 32, 15 );
    skyMat = new THREE.ShaderMaterial( {
        uniforms: uniforms,
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        side: THREE.BackSide
    } );

    sky = new THREE.Mesh( skyGeo, skyMat );
    scene.add( sky );
}

// ----- Lights
function setLights() {
    light = world.light();
    var lightX = -500,
        lightY = 2500,
        lightZ = 2000;

    light.position.set(lightX, lightY, lightZ);
}

// ----- Ground Plane
function groundPlane() {
    var ground = world.mesh(Box(100000, 1, 100000), Material('#ccc'));
    ground.y(-1);
    ground.exclude = true;
}

function hexagon(x, y, color) {

    x = x || 0;
    y = y || 0;

    var centerX = x,
        centerY = y;

    var unit = 100,
        hexShape = new THREE.Shape();

    var offsetX = Math.sqrt(0.75 * unit * unit),
        offsetY = unit / 2;


    centerX *= offsetX * 2;
    centerX += y * offsetX;

    centerY *= 1.5 * unit;

    hexShape.moveTo(offsetX, offsetY);
    hexShape.lineTo(0, unit);
    hexShape.lineTo(-offsetX, offsetY);
    hexShape.lineTo(-offsetX, -offsetY)
    hexShape.lineTo(0, -unit);
    hexShape.lineTo(offsetX, -offsetY);

    var hexGeo = new THREE.ExtrudeGeometry(hexShape, {
        amount: 8,
        bevelEnabled: false
    });

    hexGeo.applyMatrix(new THREE.Matrix4().makeScale(0.99, 0.99, 1));

    var hexMesh = world.mesh(hexGeo, Material(color || '#fff'));
    hexMesh.rotation.x = -Math.PI / 2;
    hexMesh.position.set(centerX, 0, centerY);
}

function makeBoard() {

    var startX = [0, -1, -2, -2, -2],
        max = [3, 4, 5, 4, 3];

    function startRow(y, index) {
        var x = startX[index];
        drawHex(x, y, index);
    }

    function drawHex(x, y, index) {
        if ( x - startX[index] < max[index]) {
            hexagon(x, y);
            // move along this row
            return drawHex(x + 1, y, index);
        } else if ( x - startX[index] === max[index] ) {
            return startRow(y + 1, index + 1);
        }
    }

    startRow(0, 0);
}

document.addEventListener('DOMContentLoaded', init);

})();
