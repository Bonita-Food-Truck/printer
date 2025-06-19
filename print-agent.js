const http = require('http');
const net = require('net');

const PRINTER_IP = '192.168.1.100'; // <-- cambia con IP reale
const PRINTER_PORT = 9100;

const server = http.createServer((req, res) => {
    console.log('➡️  Richiesta ricevuta:', req.method, req.url);

    if (req.method === 'POST' && req.url === '/print') {
        let body = [];

        req.on('data', chunk => {
            console.log('📦 Chunk ricevuto:', chunk);
            body.push(chunk);
        });

        req.on('end', () => {
            const buffer = Buffer.concat(body);
            console.log('📋 Lunghezza totale payload:', buffer.length);
            console.log('🧾 Byte da stampare:', buffer);

            const printer = net.createConnection({ host: PRINTER_IP, port: PRINTER_PORT }, () => {
                console.log('✅ Connesso alla stampante!');
                printer.write(buffer);
                printer.end();
                res.writeHead(200);
                res.end('Printed!');
            });

            printer.on('error', (err) => {
                console.error('❌ Errore stampante:', err);
                res.writeHead(500);
                res.end('Printer connection failed');
            });
        });
    } else {
        res.writeHead(404);
        res.end('Not found');
    }
});

server.listen(3001, '0.0.0.0', () => {
    console.log('Print agent in ascolto sulla porta 3001 su tutte le interfacce');
});