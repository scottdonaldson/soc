(function(){

var camera, scene, renderer, controls, sphere;

var mouse = new THREE.Vector2();

var unit = 100;

window.board = {};
board.tiles = [];
board.settlements = [];
board.roads = [];
board.cities = [];

function init() {
    world = new T('container');

    sphere = world.mesh(new THREE.SphereGeometry(30, 20, 20), Material('basic', {
        color: '#fff',
        opacity: 0.75
    }));
    sphere.castShadow = false;
    sphere.visible = false;

    camera = world.camera;
    scene = world.scene;
    renderer = world.renderer;

    world.render();

    orbitControls();

    createSky();
    setLights();
    groundPlane();

    makeBoard();
    loadGameData();
}

// ----- Controls
function orbitControls() {

    controls = new THREE.OrbitControls( camera, renderer.domElement );

    function orbitAnimate() {
        requestAnimationFrame(orbitAnimate);
        controls.update();
    }

    controls.damping = 0.5;
    controls.minDistance = 500;
    controls.maxDistance = 2500;
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

    var fog = new THREE.Fog( null, 1000, 15000 );
    fog.color.copy( uniforms.bottomColor.value );

    var skyGeo = new THREE.SphereGeometry( 20000, 32, 15 );
    var skyMat = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        side: THREE.BackSide
    });

    world.mesh(skyGeo, skyMat).y(-10000);
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

function hexagon(x, z, color) {

    var centerX = x,
        centerZ = z,
        hexShape = new THREE.Shape(),
        offsetX = Math.sqrt(0.75 * unit * unit),
        offsetZ = unit / 2,
        hexGeo,
        hexMesh,
        pos;

    hexShape.moveTo(offsetX, offsetZ);
    hexShape.lineTo(0, unit);
    hexShape.lineTo(-offsetX, offsetZ);
    hexShape.lineTo(-offsetX, -offsetZ)
    hexShape.lineTo(0, -unit);
    hexShape.lineTo(offsetX, -offsetZ);

    hexGeo = new THREE.ExtrudeGeometry(hexShape, {
        amount: 10,
        bevelEnabled: false
    });

    hexGeo.applyMatrix(new THREE.Matrix4().makeScale(0.99, 0.99, 1));

    hexMesh = world.mesh(hexGeo, Material(color || '#fff'));
    hexMesh.rotation.x = -Math.PI / 2;

    pos = position(x, z);
    hexMesh.position.set(pos.x, -20, pos.z);

    // camera target should be center hex
    if ( x === 3 && z === 4 ) {
        controls.target.set(pos.x, 0, pos.z);
    }

    hexMesh.coords = {
        x: x,
        z: z
    };

    return hexMesh;
}

function position(x, z) {
    var centerX = x,
        centerZ = z,
        offsetX = Math.sqrt(0.75 * unit * unit),
        offsetZ = unit / 2;

    centerX *= offsetX * 2;
    centerX += z * offsetX;

    centerZ *= 1.5 * unit;

    return {
        x: centerX,
        z: centerZ
    };
}

function triangulate(pt1, pt2, pt3, noPos) {

    var positions = [],
        meanX = 0,
        meanZ = 0;

    [].slice.call(arguments).forEach(function(pt) {
        if ( !noPos ) {
            positions.push(position(pt.x, pt.z));
        } else {
            positions.push(pt);
        }
    });

    if ( noPos ) positions.pop();

    positions.forEach(function(pt) {
        meanX += 0.333 * pt.x;
        meanZ += 0.333 * pt.z;
    });

    return {
        x: meanX,
        z: meanZ
    };
}

function makeBoard() {

    var startX = [ 3, 2, 1, 0, 0, 0, 0],
        max = [4, 5, 6, 7, 6, 5, 4];

    function startRow(z, index) {
        var x = startX[index];
        drawHex(x, z, index);
    }

    function drawHex(x, z, index) {
        if ( x - startX[index] < max[index]) {

            board.tiles.push({
                coords: new THREE.Vector3(x, 0, z),
                mesh: hexagon(x, z)
            });

            // move along this row
            return drawHex(x + 1, z, index);
        } else if ( x - startX[index] === max[index] ) {
            return startRow(z + 1, index + 1);
        }
    }

    board.tiles.findTile = function(x, z) {
        for ( var i = 0; i < board.tiles.length; i++ ) {
            if ( board.tiles[i].coords.x === x && board.tiles[i].coords.z === z ) {
                return board.tiles[i];
            }
        }
        return null;
    };

    startRow(0, 0);
}

function loadGameData() {
    // dummy for now
    var resources = [
        'water', 'water', 'water', 'water',
        'water', 'sheep', 'wood', 'ore', 'water',
        'water', 'brick', 'wheat', 'ore', 'desert', 'water',
        'water', 'ore', 'wood', 'wood', 'sheep', 'wheat', 'water',
        'water', 'brick', 'sheep', 'wheat', 'brick', 'water',
        'water', 'ore', 'sheep', 'wheat', 'water',
        'water', 'water', 'water', 'water',
    ];

    resources.forEach(function(r, i) {
        tileColor(board.tiles[i].mesh, r);
    });

    city({x:1,z:3},{x:2,z:2},{x:1,z:2}, '#f00');
    settlement({x:-2,z:1},{x:-1,z:1},{x:-2,z:2}, '#0f0');
    settlement({x:0,z:3},{x:0,z:4},{x:-1,z:4}, '#ff0');

    road({x:0,z:4},{x:1,z:3});
    road({x:1,z:5},{x:1,z:4});
    road({x:1,z:3},{x:2,z:2}, '#f00');
    road({x:2,z:2},{x:1,z:2}, '#f00');
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

    if ( resource in colors ) {
        tile.material.color = new THREE.Color(colors[resource]);
    } else {
        tile.visible = false;
    }
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
    roofMesh.position.z = pos.z;

    base.position.y -= 10;
    base.position.x = pos.x;
    base.position.z = pos.z;
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
    roofMesh.position.z = pos.z;

    middleGeo.applyMatrix(new THREE.Matrix4().makeTranslation(10, -2.5, 0));
    middleMesh = world.mesh(middleGeo, Material(color || '#fff'))
    middleMesh.position.set(pos.x, 20, pos.z);
    middleMesh.rotation.y = rotation;

    base.position.y -= 10;
    base.position.x = pos.x;
    base.position.z = pos.z;
    base.rotation.y = rotation;
}

function road(pt1, pt2, color) {

    var pos1 = position(pt1.x, pt1.z),
        pos2 = position(pt2.x, pt2.z),
        mean = {
            x: 0.5 * (pos1.x + pos2.x),
            z: 0.5 * (pos1.z + pos2.z)
        },
        road = world.mesh(Box(10, 10, 50), Material(color || '#fff')),
        angle = Math.atan((pos2.x - pos1.x) / (pos2.z - pos1.z));

    road.position.set(mean.x, -5, mean.z);
    road.rotation.y = angle + Math.PI / 2;

    board.roads.push({
        pts: [pt1, pt2]
    });
}

function dist2(pt1, pt2) {
    var xDiff = pt1.x - pt2.x,
        yDiff = pt1.y - pt2.y,
        distance = Math.sqrt(xDiff * xDiff + yDiff * yDiff);

    return distance;
}

function neighborsInArray(index, arr) {

    var len = arr.length;

    return [
        arr[(len + index + 1) % len],
        arr[(len + index - 1) % len]
    ];
}

neighborsInArray.neighbors = [
    [ 1, 0 ],
    [ 1, -1 ],
    [ 0, -1 ],
    [ -1, 0 ],
    [ -1, 1 ],
    [ 0, 1 ]
];

neighborsInArray.neighbors.forEach(function(n, i) {
    neighborsInArray.neighbors[i] = new THREE.Vector3( n[0], 0, n[1] );
});

function findNeighbor( tiles ) {

    var xDiff = tiles[1].coords.x - tiles[0].coords.x,
        zDiff = tiles[1].coords.z - tiles[0].coords.z,
        vectorDiff = new THREE.Vector3( xDiff, 0, zDiff ),
        possible = [],
        closestDist = Infinity,
        closest;

    // taking tiles[0] as the origin, find the possible neighbors
    // of tiles[0] and tiles[1]
    neighborsInArray.neighbors.forEach(function(n, i) {
        if ( n.x === vectorDiff.x && n.z === vectorDiff.z ) {
            possible = neighborsInArray(i, neighborsInArray.neighbors);
        }
    });

    // add tiles[0] (since it is the origin)
    possible.forEach(function(n, i) {
        var coords = new THREE.Vector3().addVectors(n, tiles[0].coords);
        possible[i] = board.tiles.findTile(coords.x, coords.z);
    });

    // are both possibilities in the board's tiles?
    possible.forEach(function(p, i) {
        if ( p ) {
            var pos = p.mesh.position.clone().project(camera),
                dist = dist2(pos, mouse);
            if ( dist < closestDist ) {
                closestDist = dist;
                closest = p;
            }
        }
    });

    return closest;
}

function onMouseMove() {

    var closestDist = Infinity,
        closestIndices,
        closestTiles = [],
        thirdTile,
        point;

    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = -( event.clientY / window.innerHeight ) * 2 + 1;

    // order from nearest to farthest
    board.tiles.forEach(function(tile) {

        console.log(tile.mesh);

        var pos = tile.mesh.position.clone().project(camera),
            dist = dist2(pos, mouse);

        if ( dist < closestDist ) {
            closestDist = dist;
            closestTiles.unshift(tile);
        }
    });

    // if the closest is the first tile, there won't be a second, so manually
    // add it. otherwise, trim to the closest 2 tiles in order to find the
    // closest possible neighbor
    closestTiles = (closestTiles.length === 1) ?
        [board.tiles[0], board.tiles[1]] :
        closestTiles = closestTiles.splice(0, 2);

    thirdTile = findNeighbor(closestTiles);

    if ( thirdTile ) {

        point = triangulate(
            closestTiles[0].mesh.position,
            closestTiles[1].mesh.position,
            thirdTile.mesh.position,
            true
        );

        sphere.visible = true;

        sphere.position.x = point.x;
        sphere.position.y = 20;
        sphere.position.z = point.z;
    }

}

window.addEventListener('mousemove', onMouseMove, false);

document.addEventListener('DOMContentLoaded', init);

})();
