const canvas = document.getElementById('gameCanvas');
const context = canvas.getContext('2d');

function setupCanvas() {
    canvas.width = window.innerWidth - 120;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', setupCanvas);
setupCanvas();

const map = { width: 2500, height: 2500 };

const camera = { x: 0, y: 0 };
cameraTarget = player;

const vision = {
    radius: 600
};


let grabbing = false;
let keys = 0;
let hasMasterKey = false;
let hasSword = false;
let startTime;
let endTime;
let gameState = "GAME";
let audioDesbloqueado = false;
let checkpoint = null;

let flashAlpha = 0;
let cameraShake = 0;

function startTimer() {
    startTime = new Date().getTime();
}

function stopTimer() {
    endTime = new Date().getTime();
    const timeTaken = (endTime - startTime) / 1000;
    localStorage.setItem('endTime', timeTaken);
    window.location.href = 'leaderboard.html';
}
startTimer();
const platforms = [
        { x: 250, y: 0, width: 20, height: 500, color: 'green' },
        { x: 270, y: 500, width: 500, height: 20, color: 'green' },
    { x: 2480, y: 0, width: 20, height: 190, color: 'green' }

];

   const objects = [
    { x: 110, y: 180, width: 30, height: 30, color: 'yellow', type: 'key' },
    { x: 700, y: 900, width: 30, height: 30, color: 'yellow', type: 'key' },
    { x: 250, y: 200, width: 20, height: 50, color: 'brown', type: 'door' },
    { x: 20, y: 200, width: 20, height: 50, color: 'brown', type: 'door' },

    { x: 1600, y: 820, width: 20, height: 80, color: 'purple', type: 'masterDoor' },
    { x: 1100, y: 1800, width: 30, height: 30, color: 'orange', type: 'masterKey' },
    { x: 20, y: 1300, width: 30, height: 30, color: '#7AE1FF', type: 'sword' },
    
    {
    x: 400,
    y: 600,
    width: 40,
    height: 40,
    color: "#00ff88",
    type: "checkpoint",
    activated: false
},
    {
        x: 1800,
        y: 900,
        width: 40,
        height: 40,
        color: "#00ff88",
        type: "checkpoint",
        activated: false
    }
];

const boxes = [
    { x: 20, y: 1300, width: 50, height: 50, color: 'blue', grabRange: 20 }
];

const projectiles = [];

function drawEntity(entity) {
    context.fillStyle = entity.color;
    context.fillRect(entity.x - camera.x, entity.y - camera.y, entity.width, entity.height);
}

function drawPlatforms() {
    platforms.forEach(platform => {
        context.fillStyle = platform.color;
        context.fillRect(platform.x - camera.x, platform.y - camera.y, platform.width, platform.height);
    });
}

function drawVisionDarkness(){

    const puntos = getVisionPolygon();

    context.save();

    // Oscurecer toda la pantalla
    context.fillStyle = "rgba(0,0,0,0.65)";
    context.fillRect(
        -camera.x,
        -camera.y,
        map.width,
        map.height
    );

    // Recortar la visión
    context.globalCompositeOperation = "destination-out";

    context.beginPath();

    context.moveTo(
        puntos[0].x - camera.x,
        puntos[0].y - camera.y
    );

    for(const p of puntos){

        context.lineTo(
            p.x - camera.x,
            p.y - camera.y
        );

    }

    context.closePath();
    context.fill();

    context.restore();

}

function getVisionPolygon(){

    const puntos = [];

    for(let angulo = 0; angulo < 360; angulo += 0.2){

        const punto = castRay(
            angulo * Math.PI / 180
        );

        puntos.push(punto);

    }

    return puntos;

}
function castRay(angulo){

    const px = player.x + player.width / 2;
    const py = player.y + player.height / 2;

    const alcance = vision.radius;

    let mejorX = px + Math.cos(angulo) * alcance;
    let mejorY = py + Math.sin(angulo) * alcance;

    let menorDistancia = alcance;

    for(const wall of platforms){

        const choque = rayVsRect(
            px,
            py,
            mejorX,
            mejorY,
            wall
        );

        if(!choque) continue;

        const dx = choque.x - px;
        const dy = choque.y - py;

        const distancia = Math.sqrt(dx*dx + dy*dy);

        if(distancia < menorDistancia){

            menorDistancia = distancia;
            mejorX = choque.x;
            mejorY = choque.y;

        }

    }

    return {
        x: mejorX,
        y: mejorY
    };

}
function rayVsRect(x1, y1, x2, y2, rect){

    const lados = [

        [rect.x, rect.y, rect.x + rect.width, rect.y], // arriba

        [rect.x + rect.width, rect.y,
         rect.x + rect.width, rect.y + rect.height], // derecha

        [rect.x, rect.y + rect.height,
         rect.x + rect.width, rect.y + rect.height], // abajo

        [rect.x, rect.y,
         rect.x, rect.y + rect.height] // izquierda

    ];

    let mejor = null;
    let menor = Infinity;

    for(const lado of lados){

        const choque = lineIntersection(
            x1, y1,
            x2, y2,
            lado[0], lado[1],
            lado[2], lado[3]
        );

        if(!choque) continue;

        const dx = choque.x - x1;
        const dy = choque.y - y1;

        const distancia = Math.sqrt(dx*dx + dy*dy);

        if(distancia < menor){

            menor = distancia;
            mejor = choque;

        }

    }

    return mejor;

}
function lineIntersection(
    x1, y1,
    x2, y2,
    x3, y3,
    x4, y4
){

    const den =
        (x1 - x2) * (y3 - y4) -
        (y1 - y2) * (x3 - x4);

    if (Math.abs(den) < 0.000001) {
        return null;
    }

    const t =
        ((x1 - x3) * (y3 - y4) -
         (y1 - y3) * (x3 - x4)) / den;

    const u =
        ((x1 - x3) * (y1 - y2) -
         (y1 - y3) * (x1 - x2)) / den;

    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {

        return {
            x: x1 + t * (x2 - x1),
            y: y1 + t * (y2 - y1)
        };

    }

    return null;

}

function drawProjectiles() {
    projectiles.forEach(projectile => {
        context.fillStyle = projectile.color;
        context.fillRect(projectile.x - camera.x, projectile.y - camera.y, projectile.width, projectile.height);
    });
}

function drawObjects() {
    objects.forEach(object => {
        if (object.type !== 'door' || (object.type === 'door' && !object.opened)) {
            if (dentroDeVision(object)){

    drawEntity(object);

}
        }
    });
}

function drawBoxes() {
        boxes.forEach(box => {

    if (dentroDeVision(box)){

        drawEntity(box);

    }

});
}

function update() {

    if (gameState === "CUTSCENE") {
    updateCamera();
    return;
}
    const prevX = player.x;
    player.x += joystickState.x * player.speed;

    platforms.forEach(platform => {
        if (checkCollision(player, platform)) {
            player.x = prevX;
        }
    });

    boxes.forEach(box => {
        if (checkCollision(player, box)) {
            player.x = prevX;
        }
    });
    
bosses.forEach(boss => {

    if (checkCollision(player, boss)) {
        player.x = prevX;
    }

});

    objects.forEach(object => {
        if ((object.type === "door" || object.type === "masterDoor") &&
            checkCollision(player, object)) {

            if ((object.type === "door" && keys <= 0) ||
    (object.type === "masterDoor" && !hasMasterKey)) {

                player.x = prevX;
            }
        }
    });

// Colisión de la puerta
bossRooms.forEach(room => {

    if (!room.door || !room.door.active) return;

    if (checkCollision(player, room.door)) {

        player.x = prevX;

    }

});

    const prevY = player.y;
player.y += joystickState.y * player.speed;

    platforms.forEach(platform => {
        if (checkCollision(player, platform)) {
            player.y = prevY;
        }
    });

    boxes.forEach(box => {
        if (checkCollision(player, box)) {
            player.y = prevY;
        }
    });

    objects.forEach(object => {
        if ((object.type === "door" || object.type === "masterDoor") &&
            checkCollision(player, object)) {

            if ((object.type === "door" && keys <= 0) ||
    (object.type === "masterDoor" && !hasMasterKey)) {

                player.y = prevY;
            }
        }
     });
     
     bosses.forEach(boss => {

    if (checkCollision(player, boss)) {
        player.y = prevY;
    }

});

bossRooms.forEach(room => {

    if (!room.door || !room.door.active) return;

    if (checkCollision(player, room.door)) {

        player.y = prevY;

    }

});

    if (grabbing) {
        boxes.forEach(box => {
            const prevBoxX = box.x;
            const prevBoxY = box.y;

            if (isNear(player, box)) {
box.x += joystickState.x * player.speed;
box.y += joystickState.y * player.speed;

                platforms.forEach(platform => {
                    if (checkCollision(box, platform)) {
                        box.x = prevBoxX;
                        box.y = prevBoxY;
                    }
                });

                boxes.forEach(otherBox => {
                    if (box !== otherBox && checkCollision(box, otherBox)) {
                        box.x = prevBoxX;
                        box.y = prevBoxY;
                    }
                });

                if (checkCollision(box, player)) {
                    box.x = prevBoxX;
                    box.y = prevBoxY;
                }
            }
        });
    }
  
  enemies.forEach(enemy => {

    if (
        gameState === "GAME" &&
        !enemy.dialogShown &&
        isNear(player, enemy, 300)
    ) {

        enemy.dialogShown = true;
        cameraTarget = enemy;
        mostrarDialogo(enemy);

    }

});  

bossRooms.forEach(room => {

    if (room.activated) return;

    if (playerInsideBossRoom(room)) {

        room.activated = true;
        currentBossRoom = room;

        iniciarSalaJefe(room);

    }

});


enemies.forEach(enemy => {
    updateEnemy(enemy);
});

    checkObjectCollisions();
    updateCamera();
    
    bosses.forEach(boss => {
    updateBoss(boss);
});
    
    updateProjectiles();

const masterDoor = objects.find(o => o.type === 'masterDoor');
const nearMasterDoor = masterDoor && isNear(player, masterDoor);

const warningMessage = document.getElementById('warningMessage');
warningMessage.style.display = nearMasterDoor ? 'block' : 'none';

    const box = boxes.find(b => isNear(player, b));
    const warningMessage2 = document.getElementById('warningMessage2');
    warningMessage2.style.display = box ? 'block' : 'none';
}


function checkCollision(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

function checkObjectCollisions() {

    objects.forEach(object => {

        if (checkCollision(player, object)) {

            if (object.type === "key") {

                keys++;

showItemText("Llave", "Objetos");

                objects.splice(objects.indexOf(object), 1);

            }

            else if (object.type === "masterKey") {

                hasMasterKey = true;

showItemText("Llave del jefe", "Objetos");

;

                objects.splice(objects.indexOf(object), 1);

            }

            else if (object.type === "door" && keys > 0) {

                object.opened = true;

                keys--;

                if (keys === 0) {


                }

                objects.splice(objects.indexOf(object), 1);

            }

            else if (object.type === "masterDoor" && hasMasterKey) {

                stopTimer();

            }

            else if (object.type === "sword") {

                hasSword = true;

showItemText("Espada", "Equipo");

                document.getElementById("attackButton").style.display = "block";

                objects.splice(objects.indexOf(object), 1);

            }

            else if (object.type === "checkpoint") {

                if (!object.activated) {

                    guardarCheckpoint();

                    showCheckpointText();

                    object.activated = true;

                    object.color = "#00ffff";

                }

            }

        }

    });

}



function updateProjectiles() {
    projectiles.forEach((projectile, index) => {
        projectile.x += projectile.speedX || 0;
        projectile.y += projectile.speedY || 0;

        if (projectile.x < player.x + player.width &&
            projectile.x + projectile.width > player.x &&
            projectile.y < player.y + player.height &&
            projectile.y + projectile.height > player.y) {
            projectiles.splice(index, 1);
            player.lives -= 1;
            drawLives();

            if (player.lives <= 0) {
                resetGame();
            }
        }

        if (projectile.x < 0 || projectile.x > map.width || projectile.y < 0 || projectile.y > map.height) {
            projectiles.splice(index, 1);
        }
    });
}

function attackWithSword() {

    bosses.forEach(boss => {

        if (!hasSword) return;

        if (!isNear(player, boss, 100)) return;

        if (boss.pushReady) {

            pushWave(boss, 300, 220);
            return;

        }

        if (!canDamageBoss(boss)) return;

        boss.hp -= 1000;

        playBossHit();

        updateBossBar(boss);

if (!boss.fightStarted) {

    boss.fightStarted = true;
    animateBossBar(boss);
    startBossFight();

}

        boss.hitCounter++;

        if (boss.hitCounter >= 5) {

            boss.pushReady = true;
            boss.glow = true;

        }

        if (boss.hp <= 0) {

            boss.hp = 0;
            boss.invulnerable = true;

            shakeCamera(60);
            flashScreen();

            setTimeout(() => {

                boss.x = -9999;
                boss.y = -9999;
                boss.attackCooldown = Infinity;
                
                hideBossBar(boss);

if (!quedanJefesActivos(currentBossRoom)) {
    
    currentBossRoom.door.active = false;
    showVictoryText();

    cameraTarget = player;
    currentBossRoom = null;

}

            }, 250);

        }

    });

}


function guardarCheckpoint() {

    checkpoint = {

        x: player.x,
        y: player.y,

        lives: player.lives,

        keys,
        hasMasterKey,
        hasSword,

        objects: JSON.parse(JSON.stringify(objects)),
        bosses: JSON.parse(JSON.stringify(bosses)),
        bossRooms: JSON.parse(JSON.stringify(bossRooms)),
        boxes: JSON.parse(JSON.stringify(boxes)),

    };

}

function cargarCheckpoint() {

    if (!checkpoint) return;

    player.x = checkpoint.x;
    player.y = checkpoint.y;

    player.lives = checkpoint.lives;

    keys = checkpoint.keys;
    hasMasterKey = checkpoint.hasMasterKey;
    
    hasSword = checkpoint.hasSword;
    if (hasSword) {

    document.getElementById("attackButton").style.display = "block";

} else {

    document.getElementById("attackButton").style.display = "none";

}

    drawLives();
objects.length = 0;
objects.push(...JSON.parse(JSON.stringify(checkpoint.objects)));
bosses.length = 0;
bosses.push(...JSON.parse(JSON.stringify(checkpoint.bosses)));
bossRooms.length = 0;
boxes.length = 0;
boxes.push(...JSON.parse(JSON.stringify(checkpoint.boxes)));
bossRooms.push(...JSON.parse(JSON.stringify(checkpoint.bossRooms)));
document.getElementById("bossBars").innerHTML = "";

if (hasSword) {

    document.getElementById("attackButton").style.display = "block";

} else {

    document.getElementById("attackButton").style.display = "none";

}

if (bossMusic) {

    bossMusic.pause();
    bossMusic.currentTime = 0;
    bossMusic = null;

}
// o el código que uses para detener la música

cameraTarget = player;

currentBossRoom = null;

}


function resetGame() {
    if (checkpoint) {

    cargarCheckpoint();

} else {

    window.location.reload();
}
}

function clearCanvas() {
    context.clearRect(0, 0, canvas.width, canvas.height);
}

function updateCamera() {

    const offsetX = cameraTarget.width ? cameraTarget.width / 2 : 0;
    const offsetY = cameraTarget.height ? cameraTarget.height / 2 : 0;

const visibleWidth = canvas.width * ajustes.vision;
const visibleHeight = canvas.height * ajustes.vision;

const targetX = cameraTarget.x - visibleWidth / 2 + offsetX;
const targetY = cameraTarget.y - visibleHeight / 2 + offsetY;

    camera.x += (targetX - camera.x) * 0.08;
    camera.y += (targetY - camera.y) * 0.08;
    
camera.x = Math.max(
    0,
    Math.min(map.width - visibleWidth, camera.x)
);

camera.y = Math.max(
    0,
    Math.min(map.height - visibleHeight, camera.y)
);


    if (cameraShake > 0) {

        camera.x += (Math.random() - 0.5) * cameraShake;
        camera.y += (Math.random() - 0.5) * cameraShake;

        cameraShake *= 0.95;

        if (cameraShake < 0.5) {
            cameraShake = 0;
        }
    }
}

function flashScreen() {

    flashAlpha = 1;

}
function shakeCamera(intensidad = 12) {

    cameraShake = intensidad;

}

function isNear(entity1, entity2, range = 150) {
    const dx = entity1.x + entity1.width / 2 - (entity2.x + entity2.width / 2);
    const dy = entity1.y + entity1.height / 2 - (entity2.y + entity2.height / 2);
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < range;
}
function dentroDeVision(entity){

    const cx = entity.x + entity.width / 2;
    const cy = entity.y + entity.height / 2;

    const px = player.x + player.width / 2;
    const py = player.y + player.height / 2;

    const dx = cx - px;
    const dy = cy - py;

    if(Math.sqrt(dx * dx + dy * dy) > vision.radius){
        return false;
    }

    for(const wall of platforms){

        if(lineaChocaRecta(px, py, cx, cy, wall)){
            return false;
        }

    }

    return true;

}

function lineaChocaRecta(x1, y1, x2, y2, rect){

    const pasos = 30;

    for(let i = 0; i <= pasos; i++){

        const t = i / pasos;

        const x = x1 + (x2 - x1) * t;
        const y = y1 + (y2 - y1) * t;

        if(
            x >= rect.x &&
            x <= rect.x + rect.width &&
            y >= rect.y &&
            y <= rect.y + rect.height
        ){
            return true;
        }

    }

    return false;

}

function showCheckpointText() {

    const texto = document.getElementById("checkpointText");

    texto.style.opacity = "1";

    clearTimeout(texto.timer);

    texto.timer = setTimeout(() => {

        texto.style.opacity = "0";

    }, 2000);

}

function gameLoop() {

    context.clearRect(0, 0, canvas.width, canvas.height);

    context.save();

    context.scale(1 / ajustes.vision, 1 / ajustes.vision);

drawPlatforms();

drawVisionDarkness();


drawObjects();
drawBoxes();
drawPlayer();
    
    
    enemies.forEach(enemy => {

    if (dentroDeVision(enemy)){

        drawEnemy(enemy);

    }

});

bosses.forEach(boss => {

    if (dentroDeVision(boss)){

        drawBoss(boss);

    }

});

    drawProjectiles();


    context.restore();
    
    drawBossDoors();
    

    update();

    // ...
    requestAnimationFrame(gameLoop);
}
gameLoop();


document.getElementById('grabButton').addEventListener('touchstart', () => grabbing = true);
document.getElementById('grabButton').addEventListener('touchend', () => grabbing = false);
document.getElementById('attackButton').addEventListener('touchstart', () => {
    attackWithSword();
});




