const http = require('http');
const { printOnIp } = require('./src/utils/printer.js');

const PRINTER_IP = '192.168.1.100';

const server = http.createServer((req, res) => {
    // ✅ Header CORS standard
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // ✅ Rispondi alle richieste preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // ✅ Gestione POST /print
    if (req.method === 'POST' && req.url === '/print') {
        let body = [];

        req.on('data', chunk => body.push(chunk));
        req.on('end', async () => {
            try {
                const order = JSON.parse(Buffer.concat(body).toString());
                console.log('🧾 Ordine ricevuto:', order.id);

                await printOnIp(PRINTER_IP, order);

                res.writeHead(200);
                res.end('Printed!');
            } catch (err) {
                console.error('❌ Errore stampa:', err);
                res.writeHead(500);
                res.end('Errore stampa');
            }
        });
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

server.listen(3001, '0.0.0.0', () => {
    console.log('🖨️  Print agent in ascolto su porta 3001');
});