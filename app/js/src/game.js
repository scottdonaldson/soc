(function(){

var camera, scene, renderer, controls;

var unit = 100;

window.board = {};
board.tiles = [];

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
    loadGameData();
}

// ----- Camera
function setCamera() {
    camera.position.set(1000, 500, 1000);
}

// ----- Controls
function orbitControls() {

    controls = new THREE.OrbitControls( camera, renderer.domElement );

    function orbitAnimate() {
        requestAnimationFrame(orbitAnimate);
        controls.update();
    }

    controls.damping = 0.5;
    controls.minDistance = 200;
    controls.maxDistance = 2000;
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

    scene.fog = new THREE.Fog( null, 1000, 15000 );
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

    var light2 = world.light('#fff', 0.25, false);
    light2.position.set(500, 2500, -2000);
}

// ----- Ground Plane
function groundPlane() {
    var ground = world.mesh(Box(100000, 1, 100000), Material('#35a'));
    ground.y(-21);
    ground.exclude = true;
}

function hexagon(x, y, color) {

    var centerX = x,
        centerY = y,
        hexShape = new THREE.Shape(),
        offsetX = Math.sqrt(0.75 * unit * unit),
        offsetY = unit / 2,
        hexGeo,
        hexMesh,
        pos;

    hexShape.moveTo(offsetX, offsetY);
    hexShape.lineTo(0, unit);
    hexShape.lineTo(-offsetX, offsetY);
    hexShape.lineTo(-offsetX, -offsetY)
    hexShape.lineTo(0, -unit);
    hexShape.lineTo(offsetX, -offsetY);

    hexGeo = new THREE.ExtrudeGeometry(hexShape, {
        amount: 10,
        bevelEnabled: false
    });

    hexGeo.applyMatrix(new THREE.Matrix4().makeScale(0.99, 0.99, 1));

    hexMesh = world.mesh(hexGeo, Material('lambert', {
        color: color || '#fff'
    }));
    hexMesh.rotation.x = -Math.PI / 2;

    pos = position(x, y);
    hexMesh.position.set(pos.x, -20, pos.y);

    // camera target should be center hex
    if ( x === 0 && y === 2 ) {
        controls.target.set(pos.x, 0, pos.y);
    }

    hexMesh.coords = {
        x: x,
        y: y
    };

    return hexMesh;
}

function position(x, y) {
    var centerX = x,
        centerY = y,
        offsetX = Math.sqrt(0.75 * unit * unit),
        offsetY = unit / 2;

    centerX *= offsetX * 2;
    centerX += y * offsetX;

    centerY *= 1.5 * unit;

    return {
        x: centerX,
        y: centerY
    };
}

function triangulate(pt1, pt2, pt3) {

    var positions = [],
        meanX = 0,
        meanY = 0;

    [].slice.call(arguments).forEach(function(pt) {
        positions.push(position(pt.x, pt.y));
    });

    positions.forEach(function(pt) {
        meanX += 0.333 * pt.x;
        meanY += 0.333 * pt.y;
    });

    return {
        x: meanX,
        y: meanY
    };
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
            board.tiles.push(hexagon(x, y));
            // move along this row
            return drawHex(x + 1, y, index);
        } else if ( x - startX[index] === max[index] ) {
            return startRow(y + 1, index + 1);
        }
    }

    startRow(0, 0);
}

function loadGameData() {
    // dummy for now
    var resources = [
        'sheep', 'wood', 'ore', 'brick', 'wheat', 'ore', 'desert', 'ore', 'wood', 'wood', 'sheep', 'wheat', 'brick', 'sheep', 'wheat', 'brick', 'ore', 'sheep', 'wheat'
    ];

    resources.forEach(function(r, i) {
        tileColor(board.tiles[i].material, r);
    });

    city({x:1,y:3},{x:2,y:2},{x:1,y:2}, '#f00');
    settlement({x:-2,y:1},{x:-1,y:1},{x:-2,y:2}, '#0f0');
    settlement({x:0,y:3},{x:0,y:4},{x:-1,y:4}, '#ff0');

    road({x:0,y:3},{x:1,y:2});
    road({x:1,y:3},{x:1,y:2});
    road({x:1,y:3},{x:2,y:2}, '#f00');
    road({x:2,y:2},{x:1,y:2}, '#f00');
}

function tileColor(tile, resource) {
    var colors = {
        'sheep': '#0d5',
        'wheat': '#fe7',
        'brick': '#f94',
        'ore': '#999',
        'wood': '#0a3',
        'desert': '#ff0'
    };
    tile.color = new THREE.Color(colors[resource]);
}

function settlement(pt1, pt2, pt3, color) {

    var base = world.mesh(Box(30, 20, 20), Material(color || '#fff')),
        roofShape,
        roofGeo,
        roofMesh,
        pos = triangulate(pt1, pt2, pt3),
        rotation = Math.random() * 2 * Math.PI;

    roofShape = new THREE.Shape();
    roofShape.moveTo(0, 0);
    roofShape.lineTo(20, 0);
    roofShape.lineTo(10, 10);

    roofGeo = new THREE.ExtrudeGeometry(roofShape, {
        amount: 30,
        bevelEnabled: false
    });
    roofGeo.applyMatrix(new THREE.Matrix4().makeTranslation(-10, 5, -15));

    roofMesh = world.mesh(roofGeo, Material(color || '#fff'));
    roofMesh.rotation.y = rotation + (Math.PI / 2);

    roofMesh.position.x = pos.x;
    roofMesh.position.z = pos.y;

    base.position.y -= 10;
    base.position.x = pos.x;
    base.position.z = pos.y;
    base.rotation.y = rotation;
}

function city(pt1, pt2, pt3, color) {

    var base = world.mesh(Box(40, 20, 20), Material(color || '#fff')),
        middleGeo = Box(20, 15, 20),
        middleMesh,
        roofShape,
        roofGeo,
        roofMesh,
        pos = triangulate(pt1, pt2, pt3),
        rotation = Math.random() * 2 * Math.PI;

    roofShape = new THREE.Shape();
    roofShape.moveTo(0, 0);
    roofShape.lineTo(20, 0);
    roofShape.lineTo(10, 10);

    roofGeo = new THREE.ExtrudeGeometry(roofShape, {
        amount: 20,
        bevelEnabled: false
    });
    roofGeo.applyMatrix(new THREE.Matrix4().makeTranslation(0, 20, -10));

    roofMesh = world.mesh(roofGeo, Material(color || '#fff'));
    roofMesh.rotation.y = rotation;

    roofMesh.position.x = pos.x;
    roofMesh.position.z = pos.y;

    middleGeo.applyMatrix(new THREE.Matrix4().makeTranslation(10, -2.5, 0));
    middleMesh = world.mesh(middleGeo, Material(color || '#fff'))
    middleMesh.position.set(pos.x, 20, pos.y);
    middleMesh.rotation.y = rotation;

    base.position.y -= 10;
    base.position.x = pos.x;
    base.position.z = pos.y;
    base.rotation.y = rotation;
}

function road(pt1, pt2, color) {

    var pos1 = position(pt1.x, pt1.y),
        pos2 = position(pt2.x, pt2.y),
        mean = {
            x: 0.5 * (pos1.x + pos2.x),
            y: 0.5 * (pos1.y + pos2.y)
        },
        road = world.mesh(Box(10, 10, 50), Material(color || '#fff')),
        angle = Math.atan((pos2.x - pos1.x) / (pos2.y - pos1.y));

    road.position.set(mean.x, -5, mean.y);
    road.rotation.y = angle + Math.PI / 2;
}

document.addEventListener('DOMContentLoaded', init);

})();
