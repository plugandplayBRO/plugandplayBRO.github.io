let port;
let writer;
let reader;

// Conectare la Arduino prin portul Serial din Browser (Chrome/Edge/Brave)
document.getElementById('btnConnect').addEventListener('click', async () => {
  try {
    // Deschide fereastra de selectare a portului COM/USB
    port = await navigator.serial.requestPort();
    await port.open({ baudRate: 9600 });
    
    writer = port.writable.getWriter();
    
    document.getElementById('statusText').innerHTML = "Stare: <b style='color:#00e676'>Conectat la BroOS!</b>";
    readLoop(); // Pornește citirea datelor de la Arduino
  } catch (err) {
    alert("Nu s-a putut conecta la Arduino: " + err);
  }
});

// Trimite comenzi text către Arduino
async function sendData(text) {
  if (!writer) {
    alert("Mai întâi conectează Arduino prin USB folosind butonul albastru!");
    return;
  }
  const encoder = new TextEncoder();
  await writer.write(encoder.encode(text + "\n"));
}

// Lansează o aplicație pe ecranul BroOS
function launchApp(appName) {
  sendData("CMD:" + appName);
}

// Trimite fișierul .txt pe Arduino
function sendTxtFile() {
  const fileInput = document.getElementById('txtPicker');
  const file = fileInput.files[0];
  
  if (!file) {
    alert("Selectează un fișier .txt mai întâi!");
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    const textContent = e.target.result;
    // Trimite doar primele 32 de caractere (cât încap pe 2 rânduri LCD 1602)
    sendData("TXT:" + textContent.substring(0, 32));
    alert("Fișier trimis cu succes pe BroOS!");
  };
  reader.readAsText(file);
}

// Ascultă semnalele trimise de Arduino (Joystick, Jump, Attack, Dash)
async function readLoop() {
  const textDecoder = new TextDecoderStream();
  const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
  reader = textDecoder.readable.getReader();

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      reader.releaseLock();
      break;
    }
    if (value) {
      console.log("Comandă primită de la BroOS Controller:", value.trim());
      // Aici vor fi primite comenzile "BTN:JUMP", "BTN:ATTACK", "BTN:DASH" pentru jocurile web
    }
  }
}