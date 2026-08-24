let portP1 = null, portP2 = null;
let writerP1 = null, writerP2 = null;

const p1ConnectBtn = document.getElementById('p1-connect-btn');
const p2ConnectBtn = document.getElementById('p2-connect-btn');
const p1Status = document.getElementById('p1-status');
const p2Status = document.getElementById('p2-status');
const p1Log = document.getElementById('p1-log');
const p2Log = document.getElementById('p2-log');
const routerMode = document.getElementById('router-mode');

function appendLog(logElem, msg) {
    const line = document.createElement('div');
    line.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    logElem.appendChild(line);
    logElem.scrollTop = logElem.scrollHeight;
}

// Conectare Player 1
p1ConnectBtn.addEventListener('click', async () => {
    if (!("serial" in navigator)) {
        alert("Browser-ul tău nu suportă Web Serial API. Folosește Chrome sau Edge!");
        return;
    }
    try {
        portP1 = await navigator.serial.requestPort();
        await portP1.open({ baudRate: 115200 });
        
        const textEncoder = new TextEncoderStream();
        textEncoder.readable.pipeTo(portP1.writable);
        writerP1 = textEncoder.writable.getWriter();

        p1Status.textContent = "Conectat";
        p1Status.className = "status-badge connected";
        appendLog(p1Log, "Sistemul BroOS #1 s-a conectat!");
        checkRouterState();

        readSerial(portP1, p1Log, 1);
    } catch (err) {
        appendLog(p1Log, "Eroare: " + err.message);
    }
});

// Conectare Player 2
p2ConnectBtn.addEventListener('click', async () => {
    if (!("serial" in navigator)) {
        alert("Browser-ul tău nu suportă Web Serial API. Folosește Chrome sau Edge!");
        return;
    }
    try {
        portP2 = await navigator.serial.requestPort();
        await portP2.open({ baudRate: 115200 });

        const textEncoder = new TextEncoderStream();
        textEncoder.readable.pipeTo(portP2.writable);
        writerP2 = textEncoder.writable.getWriter();

        p2Status.textContent = "Conectat";
        p2Status.className = "status-badge connected";
        appendLog(p2Log, "Sistemul BroOS #2 s-a conectat!");
        checkRouterState();

        readSerial(portP2, p2Log, 2);
    } catch (err) {
        appendLog(p2Log, "Eroare: " + err.message);
    }
});

// Citire date de la Serial și retransmitere automată (Routing)
async function readSerial(port, logElem, playerNumber) {
    const textDecoder = new TextDecoderStream();
    port.readable.pipeTo(textDecoder.writable);
    const reader = textDecoder.readable.getReader();

    let buffer = "";

    try {
        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            
            buffer += value;
            let lines = buffer.split('\n');
            buffer = lines.pop(); 

            for (let line of lines) {
                line = line.trim();
                if (line.length > 0) {
                    appendLog(logElem, "RX: " + line);
                    routePacket(line, playerNumber);
                }
            }
        }
    } catch (err) {
        appendLog(logElem, "Deconectat/Eroare: " + err.message);
    }
}

// Trimite comenzile de la o placă la cealaltă
async function routePacket(data, sourcePlayer) {
    if (sourcePlayer === 1 && writerP2) {
        // Redirecționează pachetul de la P1 la P2
        let translatedData = data;
        if(data === "P:JUMP") translatedData = "NET_IN:DINO2_JUMP";
        
        await writerP2.write(translatedData + "\n");
        appendLog(p2Log, "TX (Router): " + translatedData);
    } 
    else if (sourcePlayer === 2 && writerP1) {
        // Redirecționează pachetul de la P2 la P1
        let translatedData = data;
        if(data === "P:JUMP") translatedData = "NET_IN:DINO2_JUMP";

        await writerP1.write(translatedData + "\n");
        appendLog(p1Log, "TX (Router): " + translatedData);
    }
}

function checkRouterState() {
    if (writerP1 && writerP2) {
        routerMode.textContent = "ACTIV! Routerul redirecționează datele între P1 și P2.";
        routerMode.style.color = "#00e676";
    } else if (writerP1 || writerP2) {
        routerMode.textContent = "Așteptare conectare pentru al doilea jucător...";
        routerMode.style.color = "#ffb300";
    }
}