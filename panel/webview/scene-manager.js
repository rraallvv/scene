var Async = require('async');

function enterEditMode (next) {
    Editor.remote.stashedScene = null;
    // TODO - restore selection (gizmo)
    next();
}

function testForNow () {
    for (var i = 0; i < 10; i++) {
        var sprite = new cc.Sprite('app://runtime/runtime-cocos2d-js/res/logo.png');
        sprite.x = 57 * (i + 1);
        sprite.y = cc._canvas.height / 2;
        Fire.engine.scene.addChild( sprite );
    }
}

Editor.initScene = function (callback) {
    var sceneJson = Editor.remote.stashedScene; // a remote sync method
    if (sceneJson) {
        Async.waterfall(
            [
                function (next) {
                    // Assets will be loaded by SceneWrapper.prototype.create, here we just deserialize the scene graph
                    var scene = Fire.deserialize(sceneJson);
                    next(null, scene);
                },
                function (scene, next) {
                    Fire.engine._initScene(scene, function () {
                        next(null, scene);
                    });
                },
                function (scene, next) {
                    Fire.engine._launchScene(scene);
                    next();
                },
                enterEditMode,
            ],
            callback
        );
    }
    else {
        testForNow();
        enterEditMode(callback);
    }
};


function dumpScene (next) {
    var scene = Fire.engine.getCurrentScene();
    var sceneJson = Editor.serialize(scene, {stringify: false});
    next(null, sceneJson);
}

function stashScene (jsonObj, next) {
    // TODO - including current-selection, editor-camera...
    Editor.remote.stashedScene = jsonObj;
    next();
}

function enterGameMode (next) {
    // reset scene camera
    var scene = Fire.engine.getCurrentScene();
    scene.position = Fire.Vec2.zero;
    scene.scale = Fire.Vec2.one;
    // TODO - clear selection (gizmo)
    next();
}

Editor.playScene = function (callback) {
    Async.waterfall(
        [
            dumpScene,
            stashScene,
            enterGameMode,
            function (next) {
                Fire.engine.play();
                next();
            },
        ],
        callback
    );
};

