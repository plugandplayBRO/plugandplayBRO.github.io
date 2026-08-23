let port;
let writer;
let peer;
let connections = [];

// 1. Conectare BroOS fizic prin USB
document.getElementById('btnConnect').addEventListener('click', async () => {
  try {
    port = await navigator.serial.requestPort();
    await port.open({ baudRate: 9600 });
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
    conn.on('data', (data) => {
      console.log("Comandă primită de la un prieten prin internet:", data);
      // Aici miști dinozaurul/caracterul prietenului pe ecranul tău!
    });
  });
}

// 3. Intrare în Camera unui prieten (Client)
function joinOnlineRoom(hostRoomCode) {
  peer = new Peer();
  peer.on('open', () => {
    let conn = peer.connect(hostRoomCode);
    connections.push(conn);
    alert("Te-ai conectat la camera prietenului!");
  });
}

// 4. Citire semnale de la Joystick-ul TĂU și trimiterea lor prin Internet
async function readLoop() {
  const textDecoder = new TextDecoderStream();
  port.readable.pipeTo(textDecoder.writable);
  const reader = textDecoder.readable.getReader();

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    if (value) {
      let command = value.trim();
      
      // Trimite comanda ta prin internet către toți prietenii din lobby!
      connections.forEach(conn => {
        conn.send({ player: peer.id, action: command });
      });
    }
  }
}