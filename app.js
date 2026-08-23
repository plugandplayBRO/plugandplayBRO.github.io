let port;
let writer;
let peer;
let connections = [];

// Functie ajutatoare pentru a trimite un text catre Arduino prin USB
async function sendToArduino(text) {
  if (writer) {
    const encoder = new TextEncoder();
    // Adaugam obligatoriu \n la final ca Arduino sa stie ca s-a terminat comanda
    await writer.write(encoder.encode(text + "\n"));
  }
}

// 1. Conectare BroOS fizic prin USB (BaudRate 115200!)
document.getElementById('btnConnect').addEventListener('click', async () => {
  try {
    port = await navigator.serial.requestPort();
    await port.open({ baudRate: 115200 }); // Am schimbat din 9600 in 115200
    writer = port.writable.getWriter();
    alert("BroOS Conectat la Laptop!");
    readLoop();
  } catch (err) {
    alert("Eroare conectare USB: " + err);
  }
});

// 2. Creare Cameră Online (Host)
function createOnlineRoom(roomCode) {
  peer = new Peer(roomCode);
  peer.on('open', (id) => {
    alert("Camera a fost creată! Codul tău este: " + id);
  });
  
  peer.on('connection', (conn) => {
    connections.push(conn);
    setupConnectionEvents(conn);
  });
}

// 3. Intrare în Camera unui prieten (Client)
function joinOnlineRoom(hostRoomCode) {
  peer = new Peer();
  peer.on('open', () => {
    let conn = peer.connect(hostRoomCode);
    connections.push(conn);
    setupConnectionEvents(conn);
    alert("Te-ai conectat la camera prietenului!");
  });
}

// Receptie comenzi de la prieten prin internet -> Trimis in Arduino
function setupConnectionEvents(conn) {
  conn.on('data', (data) => {
    console.log("Comandă primită de la prieten:", data);
    
    // Convertim comanda primita de la P1 in comanda pentru Opponent (P2)
    let incomingCmd = data.action;

    // --- CONVERSIE PENTRU FIGHT BROS ---
    if (incomingCmd === "P:LEFT") sendToArduino("OPP:LEFT");
    else if (incomingCmd === "P:RIGHT") sendToArduino("OPP:RIGHT");
    else if (incomingCmd === "P:JUMP") sendToArduino("OPP:JUMP");
    else if (incomingCmd === "P:ATK") sendToArduino("OPP:ATK");
    else if (incomingCmd === "P:SUPER") sendToArduino("OPP:SUPER");
    
    // --- CONVERSIE PENTRU DINO RUN ---
    else if (incomingCmd === "DINO:JUMP") sendToArduino("DINO2:JUMP");
    
    // --- CONVERSIE PENTRU BRO CHAT ---
    else if (incomingCmd.startsWith("CHAT:")) {
      let chatText = incomingCmd.substring(5);
      sendToArduino("CHAT_IN:" + chatText);
    }
  });
}

// 4. Citire semnale de la Arduino-ul TĂU și trimitere prin Internet la Prieten
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
      // Pastram ultima linie incompleta in buffer
      buffer = lines.pop();

      for (let line of lines) {
        let command = line.trim();
        if (command.length === 0) continue;

        console.log("Trimitem la prieten comanda locala:", command);

        // Trimitem comanda prin internet catre toți prietenii din camera PeerJS
        connections.forEach(conn => {
          if (conn.open) {
            conn.send({ player: peer.id, action: command });
          }
        });
      }
    }
  }
}