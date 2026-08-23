async function sendFileToArduino(fileText) {
  if (!writer) {
    alert("Conectează-te mai întâi la Arduino!");
    return;
  }

  // Împărțim textul din fișier pe linii
  const lines = fileText.split("\n");

  // 1. Trimitem semnalul de start
  await writer.write("FILE_START\n");
  await new Promise(r => setTimeout(r, 100)); // o mică pauză

  // 2. Trimitem maxim 4 linii (cât încap pe ecranul LCD)
  const maxLines = Math.min(lines.length, 4);
  for (let i = 0; i < maxLines; i++) {
    let line = lines[i].trim();
    if (line.length > 0) {
      // Trimitem linia formatată
      await writer.write(`FILE_LINE:${line}\n`);
      await new Promise(r => setTimeout(r, 100)); // pauză între linii
    }
  }

  // 3. Trimitem semnalul de final
  await writer.write("FILE_END\n");
}