
// ============================================
// LIGHTLESS
// VERSION 1.2 - SPRITES + SONIDOS + JUMPSCARE
// PASILLOS + ENCENDEDOR + MONSTRUO + OBJETOS
// ============================================


// ============================================
// CANVAS - 640 x 480
// ============================================

const canvas = document.getElementById("juego");
const ctx = canvas.getContext("2d");

canvas.width = 640;
canvas.height = 480;

ctx.imageSmoothingEnabled = false;

const ANCHO = 640;
const ALTO = 480;

const CENTROX = ANCHO / 2;
const CENTROY = ALTO / 2;


// ============================================
// CONFIGURACION
// ============================================

const campoVision = Math.PI / 3;

const distanciaProyeccion =
    (ANCHO / 2) / Math.tan(campoVision / 2);

const mitadAltura = ALTO / 2;


// ============================================
// CARGAR TEXTURAS
// ============================================

function cargarTextura(ruta) {

    let imagen = new Image();

    let textura = {
        imagen: imagen,
        datos: null,
        ancho: 0,
        alto: 0,
        cargada: false
    };

    imagen.onload = function() {

        let lienzo = document.createElement("canvas");

        lienzo.width = imagen.naturalWidth;
        lienzo.height = imagen.naturalHeight;

        let contexto = lienzo.getContext("2d", {
            willReadFrequently: true
        });

        contexto.drawImage(imagen, 0, 0);

        let datos = contexto.getImageData(
            0, 0,
            lienzo.width,
            lienzo.height
        );

        textura.datos = datos.data;
        textura.ancho = lienzo.width;
        textura.alto = lienzo.height;
        textura.cargada = true;

        console.log("TEXTURA CARGADA: " + ruta);

    };

    imagen.onerror = function() {
        console.error("ERROR AL CARGAR TEXTURA: " + ruta);
    };

    imagen.src = ruta;

    return textura;
}


const texturaPared = cargarTextura("texturas/pared_csoncreto.jpg");
const texturaPiso = cargarTextura("texturas/pisso.jpg");
const texturaTecho = cargarTextura("texturas/tsecho.jpg");


// ============================================
// CARGAR SPRITES
// ============================================

function cargarSprite(ruta) {

    let imagen = new Image();

    imagen.onload = function() {
        console.log("SPRITE CARGADO: " + ruta);
    };

    imagen.onerror = function() {
        console.error("ERROR AL CARGAR SPRITE: " + ruta);
    };

    imagen.src = ruta;

    return imagen;
}


const spriteObjeto = cargarSprite("sprites/item.png");
const spritePuerta = cargarSprite("sprites/puerta.png");
const spriteMonstruo = cargarSprite("sprites/monstruo.png");
const spriteJumpscare = cargarSprite("sprites/jumpscare.png");


// ============================================
// SONIDOS
// ============================================

const sonidoJumpscare = new Audio("sonidos/jumpscare1.mp3");
const sonidoPaso = new Audio("sonidos/paso.mp3");
const sonidoItem = new Audio("sonidos/item.mp3");

sonidoJumpscare.volume = 1;
sonidoPaso.volume = 0.35;
sonidoItem.volume = 0.7;


// Reproducir un sonido desde el principio

function reproducirSonido(audio) {

    audio.currentTime = 0;

    let reproduccion = audio.play();

    if (reproduccion !== undefined) {
        reproduccion.catch(error => {
            console.warn("No se pudo reproducir el sonido:", error);
        });
    }

}


// ============================================
// MAPA
// ============================================

// # = pared
// . = pasillo

let mapa = [

    "###############",
    "#...#.........#",
    "#.#.#.###.###.#",
    "#.#...#...#...#",
    "#.###.#.#.#.#.#",
    "#.....#.#...#.#",
    "#####.#.###.#.#",
    "#.....#...#...#",
    "#.###.###.###.#",
    "#...#.....#...#",
    "###.#.###.#.###",
    "#...#...#.....#",
    "#.#####.#####.#",
    "#.............#",
    "###############"

].map(fila =>
    fila.split("").map(celda => celda === "#" ? 1 : 0)
);

const MAPA_ANCHO = mapa[0].length;
const MAPA_ALTO = mapa.length;


// ============================================
// JUGADOR
// ============================================

let jugadorx = 1.5;
let jugadory = 1.5;

let angulo = 0;

const velocidad = 0.045;
const velocidadGiro = 0.035;


// ============================================
// SONIDO DE PASOS
// ============================================

let contadorPasos = 0;

const intervaloPasos = 16;


// ============================================
// OBJETOS COLECCIONABLES
// ============================================

let objetos = [

    {
        x: 3.5,
        y: 5.5,
        recogido: false
    },

    {
        x: 9.5,
        y: 7.5,
        recogido: false
    },

    {
        x: 11.5,
        y: 11.5,
        recogido: false
    }

];

const CANTIDAD_OBJETOS = objetos.length;

let objetosRecogidos = 0;


// ============================================
// SALIDA
// ============================================

const salida = {
    x: 13.5,
    y: 13.5
};


// ============================================
// MONSTRUO
// ============================================

let monstruo = {

    x: 13.5,
    y: 1.5,

    spawnX: 13.5,
    spawnY: 1.5,

    velocidad: 0.027,

    persiguiendo: false,

    tiempoPersecucion: 0,

    tiempoPatrulla: 0,

    destinoX: 13.5,
    destinoY: 1.5,

    activo: true

};


// ============================================
// ESTADO DEL JUEGO
// ============================================

let estadoJuego = "jugando";

let mensaje = "";
let tiempoMensaje = 0;

let tiempoJumpscare = 0;


// ============================================
// ENCENDEDOR
// ============================================

let intensidadEncendedor = 1;
let contadorFrames = 0;


// ============================================
// CONTROLES
// ============================================

let teclas = {};

document.addEventListener("keydown", function(evento) {

    let tecla = evento.key.toLowerCase();

    if (
        ["w", "a", "s", "d", "e", "enter"].includes(tecla)
    ) {
        evento.preventDefault();
    }

    if (!teclas[tecla]) {

        if (tecla === "e") {
            interactuar();
        }

        if (
            tecla === "enter" &&
            (estadoJuego === "derrota" || estadoJuego === "victoria")
        ) {
            reiniciarJuego();
        }

    }

    teclas[tecla] = true;

});


document.addEventListener("keyup", function(evento) {

    teclas[evento.key.toLowerCase()] = false;

});


// ============================================
// REINICIAR
// ============================================

function reiniciarJuego() {

    jugadorx = 1.5;
    jugadory = 1.5;

    angulo = 0;

    objetos.forEach(objeto => {
        objeto.recogido = false;
    });

    objetosRecogidos = 0;

    monstruo.x = monstruo.spawnX;
    monstruo.y = monstruo.spawnY;

    monstruo.persiguiendo = false;
    monstruo.tiempoPersecucion = 0;
    monstruo.tiempoPatrulla = 0;

    monstruo.destinoX = monstruo.spawnX;
    monstruo.destinoY = monstruo.spawnY;

    monstruo.activo = true;

    contadorCamino = 0;
    caminoMonstruo = [];

    contadorPasos = 0;

    tiempoJumpscare = 0;

    sonidoJumpscare.pause();
    sonidoJumpscare.currentTime = 0;

    sonidoPaso.pause();
    sonidoPaso.currentTime = 0;

    sonidoItem.pause();
    sonidoItem.currentTime = 0;

    estadoJuego = "jugando";

    mensaje = "";
    tiempoMensaje = 0;

    teclas = {};

}


// ============================================
// DETECTAR PAREDES
// ============================================

function esPared(x, y) {

    let mx = Math.floor(x);
    let my = Math.floor(y);

    if (
        my < 0 ||
        my >= MAPA_ALTO ||
        mx < 0 ||
        mx >= MAPA_ANCHO
    ) {
        return true;
    }

    return mapa[my][mx] !== 0;

}


function haypared(x, y) {

    let radio = 0.18;

    let puntos = [

        [x - radio, y - radio],
        [x + radio, y - radio],
        [x - radio, y + radio],
        [x + radio, y + radio]

    ];

    for (let punto of puntos) {

        if (esPared(punto[0], punto[1])) {
            return true;
        }

    }

    return false;

}


// ============================================
// LEER PIXEL DE TEXTURA
// ============================================

function leerPixel(textura, x, y) {

    if (!textura.cargada) return null;

    let tx = Math.floor(x * textura.ancho);
    let ty = Math.floor(y * textura.alto);

    tx = ((tx % textura.ancho) + textura.ancho) % textura.ancho;
    ty = ((ty % textura.alto) + textura.alto) % textura.alto;

    let indice = (ty * textura.ancho + tx) * 4;

    return {

        r: textura.datos[indice],
        g: textura.datos[indice + 1],
        b: textura.datos[indice + 2]

    };

}


// ============================================
// BUFFER DE IMAGEN
// ============================================

let imagenEscena = ctx.createImageData(ANCHO, ALTO);
let pixelesEscena = imagenEscena.data;


function colocarPixel(x, y, color, brillo) {

    let indice = (y * ANCHO + x) * 4;

    pixelesEscena[indice] =
        Math.max(0, Math.min(255, color.r * brillo));

    pixelesEscena[indice + 1] =
        Math.max(0, Math.min(255, color.g * brillo));

    pixelesEscena[indice + 2] =
        Math.max(0, Math.min(255, color.b * brillo));

    pixelesEscena[indice + 3] = 255;

}


// ============================================
// DIBUJAR PISO Y TECHO
// ============================================

function dibujarPisoTecho() {

    let dirX = Math.cos(angulo);
    let dirY = Math.sin(angulo);

    let planoX = -dirY * Math.tan(campoVision / 2);
    let planoY = dirX * Math.tan(campoVision / 2);

    let rayoIzqX = dirX - planoX;
    let rayoIzqY = dirY - planoY;

    let rayoDerX = dirX + planoX;
    let rayoDerY = dirY + planoY;


    for (let y = mitadAltura + 1; y < ALTO; y++) {

        let distanciaFila =
            mitadAltura / (y - mitadAltura);

        let pasoX =
            distanciaFila * (rayoDerX - rayoIzqX) / ANCHO;

        let pasoY =
            distanciaFila * (rayoDerY - rayoIzqY) / ANCHO;

        let pisoX = jugadorx + distanciaFila * rayoIzqX;
        let pisoY = jugadory + distanciaFila * rayoIzqY;

        let atenuacion = Math.max(
            0.12,
            1 - distanciaFila * 0.12
        );


        for (let x = 0; x < ANCHO; x++) {

            let u = pisoX - Math.floor(pisoX);
            let v = pisoY - Math.floor(pisoY);

            let colorPiso = leerPixel(
                texturaPiso,
                u,
                v
            );

            if (colorPiso) {

                colocarPixel(x, y, colorPiso, atenuacion);

            } else {

                colocarPixel(
                    x, y,
                    { r: 41, g: 37, b: 34 },
                    1
                );

            }


            let colorTecho = leerPixel(
                texturaTecho,
                u,
                v
            );

            let yTecho = ALTO - y - 1;

            if (colorTecho) {

                colocarPixel(
                    x,
                    yTecho,
                    colorTecho,
                    atenuacion * 0.75
                );

            } else {

                colocarPixel(
                    x,
                    yTecho,
                    { r: 16, g: 16, b: 21 },
                    1
                );

            }

            pisoX += pasoX;
            pisoY += pasoY;

        }

    }

    ctx.putImageData(imagenEscena, 0, 0);

}


// ============================================
// RAYCASTING DDA
// ============================================

function lanzarrayo(rayoAngulo) {

    let dirX = Math.cos(rayoAngulo);
    let dirY = Math.sin(rayoAngulo);

    let mapaX = Math.floor(jugadorx);
    let mapaY = Math.floor(jugadory);

    let deltaDistX = Math.abs(1 / dirX);
    let deltaDistY = Math.abs(1 / dirY);

    let pasoX;
    let pasoY;

    let distanciaX;
    let distanciaY;

    let lado = 0;
    let encontrado = false;


    if (dirX < 0) {

        pasoX = -1;

        distanciaX =
            (jugadorx - mapaX) * deltaDistX;

    } else {

        pasoX = 1;

        distanciaX =
            (mapaX + 1 - jugadorx) * deltaDistX;

    }


    if (dirY < 0) {

        pasoY = -1;

        distanciaY =
            (jugadory - mapaY) * deltaDistY;

    } else {

        pasoY = 1;

        distanciaY =
            (mapaY + 1 - jugadory) * deltaDistY;

    }


    let intentos = 0;

    while (!encontrado && intentos < 100) {

        if (distanciaX < distanciaY) {

            distanciaX += deltaDistX;
            mapaX += pasoX;
            lado = 0;

        } else {

            distanciaY += deltaDistY;
            mapaY += pasoY;
            lado = 1;

        }

        if (esPared(mapaX + 0.5, mapaY + 0.5)) {
            encontrado = true;
        }

        intentos++;

    }


    let distancia;

    if (lado === 0) {

        distancia =
            (mapaX - jugadorx + (1 - pasoX) / 2) / dirX;

    } else {

        distancia =
            (mapaY - jugadory + (1 - pasoY) / 2) / dirY;

    }

    distancia = Math.max(0.001, distancia);


    let paredX;

    if (lado === 0) {

        paredX = jugadory + distancia * dirY;

    } else {

        paredX = jugadorx + distancia * dirX;

    }

    paredX -= Math.floor(paredX);


    let texturaX = 0;

    if (texturaPared.cargada) {

        texturaX = Math.floor(
            paredX * texturaPared.ancho
        );

        if (
            (lado === 0 && dirX > 0) ||
            (lado === 1 && dirY < 0)
        ) {

            texturaX =
                texturaPared.ancho - texturaX - 1;

        }

    }


    return {

        distancia: distancia,
        lado: lado,
        texturaX: texturaX

    };

}


// ============================================
// Z BUFFER
// ============================================

let zBuffer = new Float32Array(ANCHO);


// ============================================
// DIBUJAR PAREDES
// ============================================

function dibujarParedes() {

    for (let x = 0; x < ANCHO; x++) {

        let rayoAngulo =
            angulo - campoVision / 2 +
            (x / ANCHO) * campoVision;

        let resultado = lanzarrayo(rayoAngulo);

        let distanciaCorregida =
            resultado.distancia *
            Math.cos(rayoAngulo - angulo);

        distanciaCorregida = Math.max(
            0.001,
            distanciaCorregida
        );

        zBuffer[x] = distanciaCorregida;


        let alturaPared =
            distanciaProyeccion / distanciaCorregida;

        let inicio =
            mitadAltura - alturaPared / 2;

        let fin =
            mitadAltura + alturaPared / 2;

        let inicioVisible = Math.max(0, inicio);
        let finVisible = Math.min(ALTO, fin);

        let alturaVisible = finVisible - inicioVisible;

        if (alturaVisible <= 0) continue;


        if (texturaPared.cargada) {

            let imagen = texturaPared.imagen;

            let texturaY =
                (inicioVisible - inicio) /
                alturaPared *
                imagen.naturalHeight;

            let texturaAlto =
                alturaVisible /
                alturaPared *
                imagen.naturalHeight;

            ctx.drawImage(

                imagen,

                resultado.texturaX,
                texturaY,
                1,
                texturaAlto,

                x,
                inicioVisible,
                1,
                alturaVisible

            );


            let oscuridad = Math.min(
                0.85,
                distanciaCorregida * 0.16
            );

            if (resultado.lado === 1) {
                oscuridad += 0.15;
            }

            oscuridad = Math.min(0.9, oscuridad);

            ctx.fillStyle =
                `rgba(0, 0, 0, ${oscuridad})`;

            ctx.fillRect(
                x,
                inicioVisible,
                1,
                alturaVisible
            );

        } else {

            let brillo = Math.max(
                20,
                170 - distanciaCorregida * 22
            );

            if (resultado.lado === 1) {
                brillo *= 0.7;
            }

            let color = Math.floor(brillo);

            ctx.fillStyle =
                `rgb(${color}, ${color}, ${color})`;

            ctx.fillRect(
                x,
                inicio,
                1,
                alturaPared
            );

        }

    }

}


// ============================================
// PROYECTAR SPRITES
// ============================================

function proyectarSprite(x, y, escala, imagen) {

    if (!imagen || !imagen.complete || !imagen.naturalWidth) {
        return null;
    }

    let dirX = Math.cos(angulo);
    let dirY = Math.sin(angulo);

    let planoX = -dirY * Math.tan(campoVision / 2);
    let planoY = dirX * Math.tan(campoVision / 2);

    let dx = x - jugadorx;
    let dy = y - jugadory;

    let determinante =
        planoX * dirY - dirX * planoY;

    let invDet = 1 / determinante;

    let transformX =
        invDet * (dirY * dx - dirX * dy);

    let transformY =
        invDet * (-planoY * dx + planoX * dy);


    if (transformY <= 0.1) return null;


    let screenX =
        CENTROX * (1 + transformX / transformY);

    let alto =
        Math.abs(ALTO / transformY) * escala;

    let ancho =
        alto * imagen.width / imagen.height;

    let arriba = CENTROY - alto / 2;

    return {

        imagen: imagen,
        profundidad: transformY,
        izquierda: screenX - ancho / 2,
        derecha: screenX + ancho / 2,
        arriba: arriba,
        ancho: ancho,
        alto: alto,
        screenX: screenX

    };

}


// ============================================
// DIBUJAR SPRITE CON PROFUNDIDAD
// ============================================

function dibujarSprite(proyeccion) {

    if (!proyeccion) return;

    let p = proyeccion;

    let inicio = Math.max(0, Math.floor(p.izquierda));
    let fin = Math.min(ANCHO - 1, Math.ceil(p.derecha));

    for (let x = inicio; x <= fin; x++) {

        if (p.profundidad >= zBuffer[x]) continue;

        let proporcion =
            (x - p.izquierda) / p.ancho;

        let texturaX = Math.floor(
            proporcion * p.imagen.width
        );

        texturaX = Math.max(
            0,
            Math.min(p.imagen.width - 1, texturaX)
        );


        ctx.drawImage(

            p.imagen,

            texturaX,
            0,
            1,
            p.imagen.height,

            x,
            p.arriba,
            1,
            p.alto

        );

    }

}


// ============================================
// DIBUJAR OBJETOS
// ============================================

function dibujarObjetos() {

    let visibles = [];

    for (let objeto of objetos) {

        if (objeto.recogido) continue;

        let p = proyectarSprite(
            objeto.x,
            objeto.y,
            0.30,
            spriteObjeto
        );

        if (p) visibles.push(p);

    }


    visibles.sort((a, b) => b.profundidad - a.profundidad);

    for (let p of visibles) {
        dibujarSprite(p);
    }

}


// ============================================
// DIBUJAR PUERTA
// ============================================

function dibujarPuerta() {

    let p = proyectarSprite(
        salida.x,
        salida.y,
        1.35,
        spritePuerta
    );

    if (p) {
        dibujarSprite(p);
    }

}


// ============================================
// LINEA DE VISION
// ============================================

function tieneVision(x1, y1, x2, y2) {

    let dx = x2 - x1;
    let dy = y2 - y1;

    let distancia = Math.sqrt(dx * dx + dy * dy);

    let pasos = Math.ceil(distancia * 12);

    for (let i = 1; i < pasos; i++) {

        let t = i / pasos;

        let x = x1 + dx * t;
        let y = y1 + dy * t;

        if (esPared(x, y)) {
            return false;
        }

    }

    return true;

}


// ============================================
// BUSCAR CAMINO PARA EL MONSTRUO
// ============================================

function buscarCamino(inicioX, inicioY, destinoX, destinoY) {

    let inicio = {
        x: Math.floor(inicioX),
        y: Math.floor(inicioY)
    };

    let destino = {
        x: Math.floor(destinoX),
        y: Math.floor(destinoY)
    };

    let cola = [inicio];

    let visitados = new Set();

    let padres = new Map();

    let clave = (x, y) => x + "," + y;

    visitados.add(clave(inicio.x, inicio.y));


    let direcciones = [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1]
    ];


    while (cola.length > 0) {

        let actual = cola.shift();

        if (
            actual.x === destino.x &&
            actual.y === destino.y
        ) {

            let camino = [];

            let actualClave = clave(actual.x, actual.y);

            while (padres.has(actualClave)) {

                let punto = actualClave.split(",").map(Number);

                camino.unshift({
                    x: punto[0] + 0.5,
                    y: punto[1] + 0.5
                });

                actualClave = padres.get(actualClave);

            }

            return camino;

        }


        for (let direccion of direcciones) {

            let nx = actual.x + direccion[0];
            let ny = actual.y + direccion[1];

            let siguienteClave = clave(nx, ny);

            if (visitados.has(siguienteClave)) continue;

            if (esPared(nx + 0.5, ny + 0.5)) continue;

            visitados.add(siguienteClave);

            padres.set(
                siguienteClave,
                clave(actual.x, actual.y)
            );

            cola.push({
                x: nx,
                y: ny
            });

        }

    }

    return [];

}


// ============================================
// ACTUALIZAR MONSTRUO
// ============================================

let contadorCamino = 0;
let caminoMonstruo = [];


function actualizarMonstruo() {

    if (!monstruo.activo) return;

    let dx = jugadorx - monstruo.x;
    let dy = jugadory - monstruo.y;

    let distancia = Math.sqrt(dx * dx + dy * dy);


    // DETECTAR AL JUGADOR

    if (
        distancia < 7 &&
        tieneVision(
            monstruo.x,
            monstruo.y,
            jugadorx,
            jugadory
        )
    ) {

        monstruo.persiguiendo = true;
        monstruo.tiempoPersecucion = 240;

    }


    // PERSECUCION

    if (monstruo.persiguiendo) {

        monstruo.tiempoPersecucion--;

        if (monstruo.tiempoPersecucion <= 0) {
            monstruo.persiguiendo = false;
        }

        contadorCamino++;

        if (contadorCamino >= 15) {

            caminoMonstruo = buscarCamino(
                monstruo.x,
                monstruo.y,
                jugadorx,
                jugadory
            );

            contadorCamino = 0;

        }


        if (caminoMonstruo.length > 0) {

            let destino = caminoMonstruo[0];

            let dx = destino.x - monstruo.x;
            let dy = destino.y - monstruo.y;

            let distanciaDestino = Math.sqrt(dx * dx + dy * dy);

            if (distanciaDestino < 0.12) {

                caminoMonstruo.shift();

            } else {

                let movimientoX =
                    (dx / distanciaDestino) * monstruo.velocidad;

                let movimientoY =
                    (dy / distanciaDestino) * monstruo.velocidad;

                let nuevaX = monstruo.x + movimientoX;
                let nuevaY = monstruo.y + movimientoY;

                if (!esPared(nuevaX, monstruo.y)) {
                    monstruo.x = nuevaX;
                }

                if (!esPared(monstruo.x, nuevaY)) {
                    monstruo.y = nuevaY;
                }

            }

        }

    } else {

        // PATRULLA SIMPLE

        monstruo.tiempoPatrulla++;

        if (monstruo.tiempoPatrulla > 180) {

            monstruo.tiempoPatrulla = 0;

            let opciones = [
                [13.5, 1.5],
                [9.5, 3.5],
                [9.5, 7.5],
                [11.5, 11.5]
            ];

            let destino =
                opciones[Math.floor(Math.random() * opciones.length)];

            if (!esPared(destino[0], destino[1])) {

                monstruo.destinoX = destino[0];
                monstruo.destinoY = destino[1];

            }

        }


        let dx = monstruo.destinoX - monstruo.x;
        let dy = monstruo.destinoY - monstruo.y;

        let distanciaDestino = Math.sqrt(dx * dx + dy * dy);

        if (distanciaDestino > 0.1) {

            let mx = (dx / distanciaDestino) * monstruo.velocidad * 0.5;
            let my = (dy / distanciaDestino) * monstruo.velocidad * 0.5;

            if (!esPared(monstruo.x + mx, monstruo.y)) {
                monstruo.x += mx;
            }

            if (!esPared(monstruo.x, monstruo.y + my)) {
                monstruo.y += my;
            }

        }

    }


    // DETECTAR CONTACTO

    dx = jugadorx - monstruo.x;
    dy = jugadory - monstruo.y;

    distancia = Math.sqrt(dx * dx + dy * dy);

    if (distancia < 0.45) {

        iniciarJumpscare();

    }

}


// ============================================
// INICIAR JUMPSCARE
// ============================================

function iniciarJumpscare() {

    if (estadoJuego !== "jugando") return;

    estadoJuego = "jumpscare";

    tiempoJumpscare = 90;

    teclas = {};

    contadorPasos = 0;

    sonidoPaso.pause();
    sonidoPaso.currentTime = 0;

    reproducirSonido(sonidoJumpscare);

}


// ============================================
// DIBUJAR MONSTRUO
// ============================================

function dibujarMonstruo() {

    let p = proyectarSprite(
        monstruo.x,
        monstruo.y,
        1.0,
        spriteMonstruo
    );

    if (p) {
        dibujarSprite(p);
    }

}


// ============================================
// INTERACCIONES
// ============================================

function mostrarMensaje(texto) {

    mensaje = texto;
    tiempoMensaje = 100;

}


function interactuar() {

    if (estadoJuego !== "jugando") return;


    // BUSCAR OBJETO CERCANO

    for (let objeto of objetos) {

        if (objeto.recogido) continue;

        let dx = jugadorx - objeto.x;
        let dy = jugadory - objeto.y;

        let distancia = Math.sqrt(dx * dx + dy * dy);

        if (distancia < 0.8) {

            objeto.recogido = true;

            objetosRecogidos++;

            reproducirSonido(sonidoItem);

            mostrarMensaje(
                "OBJETO ENCONTRADO: " +
                objetosRecogidos + "/" +
                CANTIDAD_OBJETOS
            );

            return;

        }

    }


    // INTERACTUAR CON SALIDA

    let dx = jugadorx - salida.x;
    let dy = jugadory - salida.y;

    let distanciaSalida = Math.sqrt(dx * dx + dy * dy);

    if (distanciaSalida < 1.2) {

        if (objetosRecogidos >= CANTIDAD_OBJETOS) {

            estadoJuego = "victoria";

        } else {

            mostrarMensaje(
                "FALTAN " +
                (CANTIDAD_OBJETOS - objetosRecogidos) +
                " OBJETOS"
            );

        }

    }

}


// ============================================
// ENCENDEDOR
// ============================================

function actualizarEncendedor() {

    contadorFrames++;

    if (contadorFrames % 8 === 0) {

        intensidadEncendedor =
            0.94 + Math.random() * 0.06;

    }

}


function dibujarLuzEncendedor() {

    ctx.save();

    let luz = ctx.createRadialGradient(

        CENTROX,
        CENTROY,
        8,

        CENTROX,
        CENTROY,
        260

    );

    luz.addColorStop(
        0,
        "rgba(255, 190, 115, 0.00)"
    );

    luz.addColorStop(
        0.20,
        "rgba(255, 165, 90, 0.02)"
    );

    luz.addColorStop(
        0.45,
        "rgba(0, 0, 0, 0.40)"
    );

    luz.addColorStop(
        1,
        `rgba(0, 0, 0, ${0.97 * intensidadEncendedor})`
    );

    ctx.fillStyle = luz;

    ctx.fillRect(0, 0, ANCHO, ALTO);

    ctx.restore();

}


// ============================================
// EFECTOS VHS
// ============================================

function dibujarVHS() {

    ctx.save();


    // SCANLINES

    ctx.fillStyle = "rgba(0, 0, 0, 0.15)";

    for (let y = 0; y < ALTO; y += 4) {

        ctx.fillRect(0, y, ANCHO, 1);

    }


    // RUIDO

    for (let i = 0; i < 180; i++) {

        let x = Math.random() * ANCHO;
        let y = Math.random() * ALTO;

        let brillo = Math.random() > 0.5 ? 255 : 0;

        ctx.fillStyle =
            `rgba(${brillo}, ${brillo}, ${brillo}, 0.12)`;

        ctx.fillRect(x, y, 2, 2);

    }


    // INTERFERENCIA

    if (Math.random() < 0.025) {

        let y = Math.random() * ALTO;

        ctx.fillStyle = "rgba(190, 190, 200, 0.18)";

        ctx.fillRect(
            0,
            y,
            ANCHO,
            Math.random() * 8 + 2
        );

    }


    // VIÑETA

    let viñeta = ctx.createRadialGradient(

        CENTROX,
        CENTROY,
        80,

        CENTROX,
        CENTROY,
        390

    );

    viñeta.addColorStop(
        0,
        "rgba(0, 0, 0, 0)"
    );

    viñeta.addColorStop(
        1,
        "rgba(0, 0, 0, 0.65)"
    );

    ctx.fillStyle = viñeta;

    ctx.fillRect(0, 0, ANCHO, ALTO);

    ctx.restore();

}


// ============================================
// INTERFAZ
// ============================================

function dibujarInterfaz() {

    ctx.save();

    ctx.font = "18px monospace";
    ctx.textAlign = "left";


    // CONTADOR

    ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
    ctx.fillRect(12, 12, 170, 32);

    ctx.fillStyle = "#d8c8a8";

    ctx.fillText(
        "OBJETOS: " +
        objetosRecogidos + "/" +
        CANTIDAD_OBJETOS,
        23,
        34
    );


    // MENSAJE

    if (tiempoMensaje > 0) {

        ctx.textAlign = "center";

        ctx.fillStyle = "rgba(0, 0, 0, 0.75)";

        ctx.fillRect(
            CENTROX - 190,
            ALTO - 60,
            380,
            35
        );

        ctx.fillStyle = "#e0d3bd";

        ctx.fillText(
            mensaje,
            CENTROX,
            ALTO - 37
        );

        tiempoMensaje--;

    }


    // INDICADOR DE INTERACCION

    let objetoCercano = false;

    for (let objeto of objetos) {

        if (objeto.recogido) continue;

        let dx = jugadorx - objeto.x;
        let dy = jugadory - objeto.y;

        if (Math.sqrt(dx * dx + dy * dy) < 0.8) {
            objetoCercano = true;
        }

    }


    let dxSalida = jugadorx - salida.x;
    let dySalida = jugadory - salida.y;

    let cercaSalida =
        Math.sqrt(dxSalida * dxSalida + dySalida * dySalida) < 1.2;


    if (objetoCercano || cercaSalida) {

        ctx.textAlign = "center";

        ctx.fillStyle = "rgba(0, 0, 0, 0.8)";

        ctx.fillRect(
            CENTROX - 105,
            ALTO - 105,
            210,
            30
        );

        ctx.fillStyle = "#eee0c5";

        ctx.fillText(
            "E - INTERACTUAR",
            CENTROX,
            ALTO - 84
        );

    }


    ctx.restore();

}


// ============================================
// PANTALLA JUMPSCARE
// ============================================

function dibujarJumpscare() {

    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, ANCHO, ALTO);

    if (
        spriteJumpscare.complete &&
        spriteJumpscare.naturalWidth > 0
    ) {

        ctx.drawImage(
            spriteJumpscare,
            0,
            0,
            ANCHO,
            ALTO
        );

    } else {

        ctx.fillStyle = "#ffffff";
        ctx.font = "28px monospace";
        ctx.textAlign = "center";

        ctx.fillText(
            "LOOK BEHIND YOU...",
            CENTROX,
            CENTROY
        );

    }

}


// ============================================
// PANTALLA FINAL
// ============================================

function dibujarPantallaFinal() {

    ctx.fillStyle = "rgba(0, 0, 0, 0.88)";
    ctx.fillRect(0, 0, ANCHO, ALTO);

    ctx.textAlign = "center";

    if (estadoJuego === "victoria") {

        ctx.fillStyle = "#d9c9a8";
        ctx.font = "42px monospace";

        ctx.fillText(
            "ESCAPASTE",
            CENTROX,
            CENTROY - 15
        );

    } else {

        ctx.fillStyle = "#9d2525";
        ctx.font = "42px monospace";

        ctx.fillText(
            "TE ENCONTRO",
            CENTROX,
            CENTROY - 15
        );

    }

    ctx.fillStyle = "#bdb5a6";
    ctx.font = "18px monospace";

    ctx.fillText(
        "PRESIONA ENTER PARA REINICIAR",
        CENTROX,
        CENTROY + 35
    );

}


// ============================================
// DIBUJAR ESCENA
// ============================================

function dibujarescena() {

    if (estadoJuego === "jumpscare") {

        dibujarJumpscare();

        return;

    }

    dibujarPisoTecho();

    dibujarParedes();

    dibujarPuerta();

    dibujarObjetos();

    dibujarMonstruo();

    dibujarLuzEncendedor();

    dibujarVHS();

    dibujarInterfaz();


    if (
        estadoJuego === "victoria" ||
        estadoJuego === "derrota"
    ) {

        dibujarPantallaFinal();

    }

}


// ============================================
// ACTUALIZAR JUGADOR
// ============================================

function actualizarJugador() {

    if (teclas.a) {
        angulo -= velocidadGiro;
    }

    if (teclas.d) {
        angulo += velocidadGiro;
    }


    let movimiento = 0;

    if (teclas.w) {
        movimiento += velocidad;
    }

    if (teclas.s) {
        movimiento -= velocidad;
    }


    let nuevaX =
        jugadorx + Math.cos(angulo) * movimiento;

    let nuevaY =
        jugadory + Math.sin(angulo) * movimiento;

    let seMovio = false;


    if (!haypared(nuevaX, jugadory)) {

        if (movimiento !== 0) {
            seMovio = true;
        }

        jugadorx = nuevaX;

    }

    if (!haypared(jugadorx, nuevaY)) {

        if (movimiento !== 0) {
            seMovio = true;
        }

        jugadory = nuevaY;

    }


    // SONIDO DE PASOS

    if (seMovio) {

        contadorPasos++;

        if (contadorPasos >= intervaloPasos) {

            reproducirSonido(sonidoPaso);

            contadorPasos = 0;

        }

    } else {

        contadorPasos = 0;

    }

}


// ============================================
// BUCLE PRINCIPAL
// ============================================

function actualizar() {

    if (estadoJuego === "jugando") {

        actualizarJugador();

        actualizarMonstruo();

        actualizarEncendedor();

    }

    else if (estadoJuego === "jumpscare") {

        tiempoJumpscare--;

        if (tiempoJumpscare <= 0) {

            sonidoJumpscare.pause();

            estadoJuego = "derrota";

        }

    }


    dibujarescena();

    requestAnimationFrame(actualizar);

}


// ============================================
// INICIAR LIGHTLESS
// ============================================

actualizar();
