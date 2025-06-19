const http = require('http');
const { printOnIp } = require('./src/utils/printer.js');

const PRINTER_IP = '192.168.1.100'; // <-- Cambia con l’IP reale della stampante

const server = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/print') {
        let body = [];

        req.on('data', chunk => {
            body.push(chunk);
        });

        req.on('end', async () => {
            try {
                const raw = Buffer.concat(body).toString();
                const order = JSON.parse(raw);

                console.log('🧾 Ordine ricevuto:', order.id);

                await printOnIp(PRINTER_IP, order);

                res.writeHead(200);
                res.end('Printed!');
            } catch (err) {
                console.error('❌ Errore stampa:', err);
                res.writeHead(500);
                res.end('Errore durante la stampa');
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