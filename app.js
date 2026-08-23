let port;
let writer;
let peer;
let connections = [];

// Funcție ajutătoare pentru trimiterea mesajelor către Arduino
async function sendToArduino(text) {
  if (writer) {
    const encoder = new TextEncoder();
    await writer.write(encoder.encode(text + "\n"));
  }
}

// 1. Conectare USB
document.getElementById('btnConnect').addEventListener('click', async () => {
  const statusText = document.getElementById('statusText');
  try {
    port = await navigator.serial.requestPort();
    await port.open({ baudRate: 115200 });
    writer = port.writable.getWriter();
    
    if (statusText) {
      statusText.innerHTML = 'Stare USB: <b style="color: #00e676;">Conectat!</b>';
    }
    
    alert("BroOS Conectat la Laptop!");
    readLoop(); // Se apelează funcția definită mai jos
  } catch (err) {
    if (statusText) {
      statusText.innerHTML = 'Stare USB: <b style="color: #ff5252;">Eroare conectare</b>';
    }
    alert("Eroare conectare USB: " + err);
  }
});

// 2. Definirea funcției readLoop (Citire din Arduino)
async function readLoop() {
  const textDecoder = new TextDecoderStream();
  port.readable.pipeTo(textDecoder.writable);
  const reader = textDecoder.readable.getReader();

  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    if (value) {
      buffer += value;
      let lines = buffer.split("\n");
      buffer = lines.pop();

      for (let line of lines) {
        let command = line.trim();
        if (command.length === 0) continue;

        console.log("Comandă primită de la Arduino:", command);

        // Dacă jocul FightBros sau Dino este deschis, executăm acțiunea
        if (typeof executeAction === 'function') {
          executeAction(command);
        }

        // Trimitem comanda prin internet către prieteni (Multiplayer)
        connections.forEach(conn => {
          if (conn.open) {
            conn.send({ player: peer ? peer.id : 'P1', action: command });
          }
        });
      }
    }
  }
}

// 3. Creare Cameră Online (PeerJS Host)
function createOnlineRoom(roomCode) {
  peer = new Peer(roomCode);
  peer.on('open', (id) => {
    alert("Cameră creată! Codul tău este: " + id);
  });
  peer.on('connection', (conn) => {
    connections.push(conn);
    setupConnectionEvents(conn);
  });
}

// 4. Intrare în Cameră Online (PeerJS Client)
function joinOnlineRoom(hostRoomCode) {
  peer = new Peer();
  peer.on('open', () => {
    let conn = peer.connect(hostRoomCode);
    connections.push(conn);
    setupConnectionEvents(conn);
    alert("Te-ai conectat la cameră!");
  });
}

// Procesare comenzi primite prin Internet
function setupConnectionEvents(conn) {
  conn.on('data', (data) => {
    let incomingCmd = data.action;

    let mappedCmd = incomingCmd;
    if (incomingCmd === "P:LEFT") mappedCmd = "OPP:LEFT";
    else if (incomingCmd === "P:RIGHT") mappedCmd = "OPP:RIGHT";
    else if (incomingCmd === "P:JUMP") mappedCmd = "OPP:JUMP";
    else if (incomingCmd === "P:ATK") mappedCmd = "OPP:ATK";
    else if (incomingCmd === "P:SUPER") mappedCmd = "OPP:SUPER";
    else if (incomingCmd === "DINO:JUMP") mappedCmd = "DINO2:JUMP";

    // Executăm în browser sau trimitem pe Arduino
    if (typeof executeAction === 'function') {
      executeAction(mappedCmd);
    }
    sendToArduino(mappedCmd);
  });
}