const fs = require('fs');

fetch('http://localhost:8080/instance/connect/medapp', {
  headers: { 'apikey': 'B6D711FCDE4F4FD59865FDDFA4674116' }
})
.then(r => r.json())
.then(data => {
  if (data.base64) {
    fs.writeFileSync('qr.html', `
      <html>
        <body style="display:flex; justify-content:center; align-items:center; height:100vh; background:#f0f0f0;">
          <div style="text-align:center; background:white; padding:2rem; border-radius:12px; box-shadow:0 4px 6px rgba(0,0,0,0.1);">
            <h2>Escaneá el código con tu WhatsApp</h2>
            <img src="${data.base64}" />
          </div>
        </body>
      </html>
    `);
    console.log("Archivo qr.html generado exitosamente");
  } else {
    console.log("No se pudo obtener el QR", data);
  }
})
.catch(console.error);
