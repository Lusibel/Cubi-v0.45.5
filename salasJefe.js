var bossRooms = [

    {
    id: 1,

    left: 900,
    top: 1600,

    right: 1700,
    bottom: 2100,

    cameraX: 1300,
    cameraY: 1800,

    bosses: [0, 1],

    activated: false,
    
    door: {
        
        x: 1100, 
        y: 1600, 
        width: 120, 
        height: 20,

        active: false,

        color: "#663300"
    }

    },

{
    id: 2,

    left: 0,
    top: 1800,

    right: 500,
    bottom: 2300,

    cameraX: 100,
    cameraY: 2000,

    bosses: [2],

    activated: false,

    door: {

        x: 250,
        y: 1800,
        width: 20,
        height: 120,

        active: false,

        color: "#663300"

    }

}

];


function playerInsideBossRoom(room) {

    return (
        player.x >= room.left &&
        player.x <= room.right &&
        player.y >= room.top &&
        player.y <= room.bottom
    );

}

function iniciarSalaJefe(room) {
    room.door.active = true;

    currentBossRoom = room;

    const jefeConDialogo = room.bosses
        .map(id => bosses.find(b => b.id === id))
        .find(b => b && b.dialogos && b.dialogos.length > 0);

    if (jefeConDialogo) {

        mostrarDialogo(jefeConDialogo);

    }

}

function quedanJefesActivos(room) {
    

    return room.bosses.some(id => {

        const boss = bosses.find(b => b.id === id);

        return boss && boss.hp > 0;

    });

}

function drawBossDoors() {

    bossRooms.forEach(room => {

        if (!room.door || !room.door.active) return;

        context.fillStyle = room.door.color;

        context.fillRect(
            room.door.x - camera.x,
            room.door.y - camera.y,
            room.door.width,
            room.door.height
        );

    });

}
