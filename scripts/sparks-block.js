
const Scene = require('Scene');
const Patches = require('Patches');

// Use export keyword to make a symbol available in scripting debug console
export const Diagnostics = require('Diagnostics');

let bouncer = {x: 0, y: 0};
let lastPos = {x:0, y: 0};
let angle = 155;
let speed = 5;
const bounceTypes = {
    LEFT: 0,
    RIGHT: 1,
    TOP: 2,
    BOTTOM: 3
};
let gameWidth;
let gameHeight;
let lastBounce;
// Patches.outputs.getScalar('game_width').then(function (r) {
//     r.monitor().subscribe(function (value) {
//         Diagnostics.log(value.newValue);
//     });
// });
Scene.root.findFirst('sizer').then(function (r) {
    r.transform.position.x.monitor().subscribe(function (_value) {
        gameWidth = _value.newValue * 2;
    });
    r.transform.position.y.monitor().subscribe(function (_value) {
        gameHeight = _value.newValue * 2;
    });
    Scene.root.findFirst('canvas0').then(function (r) {
        const canvasBounds = r.bounds;
        Patches.inputs.setScalar('bar_top_alt', canvasBounds.height.mul(.7));
        Patches.inputs.setScalar('horizontal_center', canvasBounds.width.mul(.5));
        Patches.inputs.setScalar('vertical_center', canvasBounds.height.mul(.5));
        const barWidthRatio = .2;
        Patches.inputs.setScalar('bar_width', canvasBounds.width.mul(barWidthRatio));
        Patches.inputs.setScalar('bar_height', canvasBounds.width.mul(.1));
        Patches.inputs.setScalar('bouncer_width', canvasBounds.width.mul(.05));
        Patches.inputs.setScalar('bouncer_height', canvasBounds.width.mul(.05));
        Patches.inputs.setScalar('offset', canvasBounds.width.mul(barWidthRatio/-2));
        Scene.root.findFirst('positionTracker').then(function (result) {
            result.worldTransform.position.x.monitor().subscribe(function (value) {
                const barLeft = value.newValue;
                Patches.inputs.setScalar('bar_left', barLeft * -1000);
            });
        });
        
        Scene.root.findFirst('verticalTracker').then(function (result) {
            result.worldTransform.position.y.monitor().subscribe(function (value) {
                const barTop = value.newValue;
                Patches.inputs.setScalar('bar_top', barTop * -1000);
            });
        });
        Scene.root.findFirst('timeTracker').then(function (result) {
            result.worldTransform.rotation.x.monitor().subscribe(function (value) {
               tick(value); 
            });
        });
        Scene.root.findFirst('bouncer').then(function (result) {
            result.transform.position.x.monitor().subscribe(function (value) {
                
                if(value.newValue < 0){
                    bounce(bounceTypes.LEFT);
                }
                else if(value.newValue > gameWidth){
                    bounce(bounceTypes.RIGHT);
                }
            });
        });
        Scene.root.findFirst('bouncer').then(function (result) {
            result.transform.position.y.monitor().subscribe(function (value) {
                if(value.newValue < 0){
                    bounce(bounceTypes.TOP);
                }
                else if(value.newValue > gameHeight){
                    bounce(bounceTypes.BOTTOM);
                }
            });
        });
    });
});

function tick(value){
    bouncer.x = getOrbit(bouncer.x, speed, angle, 'cos');
    bouncer.y = getOrbit(bouncer.y, speed, angle, 'sin');
    // Diagnostics.log(bouncer);
    
    Patches.inputs.setScalar('bouncer_left', bouncer.x);
    Patches.inputs.setScalar('bouncer_top', bouncer.y);

    lastPos = {x: bouncer.x, y: bouncer.y};
    
}

function bounce(type){
    if(type != lastBounce){
        lastBounce = type;
        Diagnostics.log((angle + 360) % 360);
        const plottedNext = {x: getOrbit(bouncer.x, speed, angle, 'cos'), y: getOrbit(bouncer.y, speed, angle, 'sin')};
        switch(type){
            case bounceTypes.LEFT:{
                const xDistToLast = (bouncer.x - plottedNext.x) * 2;
                const angledNext = {x: plottedNext.x + xDistToLast, y: plottedNext.y};
                angle = getAngle(bouncer.x, bouncer.y, angledNext.x, angledNext.y);
                Diagnostics.log('LEFT');
                break;
            }
            case bounceTypes.RIGHT:{
                // const angleToLast = getAngle(bouncer.x, bouncer.y, lastPos.x, lastPos.y);
                // const xDistToLast = (bouncer.x - lastPos.x) * 2;
                const xDistToLast = (plottedNext.x - bouncer.x) * 2;
                const angledNext = {x: plottedNext.x - xDistToLast, y: plottedNext.y};
                angle = getAngle(bouncer.x, bouncer.y, angledNext.x, angledNext.y);
                
                Diagnostics.log('RIGHT');
                break;
            }
            case bounceTypes.TOP:{
                const yDistToLast = (bouncer.y - plottedNext.y) * 2;
                const angledNext = {x: plottedNext.x, y: plottedNext.y + yDistToLast};
                angle = getAngle(bouncer.x, bouncer.y, angledNext.x, angledNext.y);
                Diagnostics.log('TOP');
                break;
            }
            case bounceTypes.BOTTOM:{
                const yDistToLast = (plottedNext.y - bouncer.y) * 2;
                const angledNext = {x: plottedNext.x, y: plottedNext.y - yDistToLast};
                angle = getAngle(bouncer.x, bouncer.y, angledNext.x, angledNext.y);
                Diagnostics.log('BOTTOM');
                break;
            }
        }
    }
    
}

function getDistance(x1, y1, x2, y2) {

    var distx = x2 - x1;
    var disty = y2 - y1;
    return Math.sqrt(Math.pow(distx, 2) + Math.pow(disty, 2));
}
function getAngle(x1, y1, x2, y2) {

    var distx = x2 - x1;
    var disty = y2 - y1;
    var masterdist = getDistance(x1, y1, x2, y2);
    var primary_anglex = distx / masterdist;
    var anglex = Math.asin(primary_anglex) * 180 / Math.PI;
    var primary_angley = disty / masterdist;
    var angley = Math.asin(primary_angley) * 180 / Math.PI;
    var resultVal;
    if (disty < 0) {
        resultVal = anglex;
    }
    else if (disty >= 0 && distx >= 0) {
        resultVal = angley + 90;
    }
    else if (disty >= 0 && distx < 0) {
        resultVal = (angley * -1) - 90;
    }
    return resultVal;
}
function getOrbit(_center, _radius, _angle, orbitType) {

    var _num1 = _center;
    var _num2 = _radius;
    var _num3 = _angle;
    var theCent = _num1;
    var radius = _num2;
    var angle = _num3 - 90;
    var ot = orbitType;
    var resultVal;
    if (ot == "cos") {
        resultVal = theCent + (Math.cos((angle) * (Math.PI / 180)) * radius);
    }
    if (ot == "sin") {
        resultVal = theCent + (Math.sin((angle) * (Math.PI / 180)) * radius);
    }
    return resultVal;
}

// Enables async/await in JS [part 1]
(async function() {
    

// To use variables and functions across files, use export/import keyword
// export const animationDuration = 10;

// Use import keyword to import a symbol from another file
// import { animationDuration } from './script.js'

// To access scene objects
// const [directionalLight] = await Promise.all([
//   Scene.root.findFirst('directionalLight0')
// ]);

// To access class properties
// const directionalLightIntensity = directionalLight.intensity;

// To log messages to the console
// Diagnostics.log('Console message logged from the script.');

// Enables async/await in JS [part 2]
})();
