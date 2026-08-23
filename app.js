// 1. Conectare BroOS fizic prin USB (BaudRate 115200!)
document.getElementById('btnConnect').addEventListener('click', async () => {
  const statusText = document.getElementById('statusText');
  try {
    port = await navigator.serial.requestPort();
    await port.open({ baudRate: 115200 }); // 115200 Baud Rate!
    writer = port.writable.getWriter();
    
    // Schimbăm starea în ecran!
    if (statusText) {
      statusText.innerHTML = 'Stare USB: <b style="color: #00e676;">Conectat!</b>';
    }
    
    alert("BroOS Conectat cu succes la Laptop!");
    readLoop();
  } catch (err) {
    if (statusText) {
      statusText.innerHTML = 'Stare USB: <b style="color: #ff5252;">Eroare conectare</b>';
    }
    alert("Eroare conectare USB: " + err);
  }
});