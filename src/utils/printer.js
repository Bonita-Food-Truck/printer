const { ThermalPrinter, PrinterTypes, CharacterSet, BreakLine } = require("node-thermal-printer");

const paymentLabels = {
    cash: "Contanti",
    card: "Pagamento elettronico",
    justeat: "JustEat",
    deliveroo: "Deliveroo"
};

const printOnIp = async function (ip, order) {
    if (!ip) {
        return;
    }

    let printer = new ThermalPrinter({
        type: PrinterTypes.EPSON,
        interface: `tcp://${ip}:9100`,
        characterSet: CharacterSet.PC852_LATIN2,
        removeSpecialCharacters: false,
        lineCharacter: "=",
        breakLine: BreakLine.WORD,
        options: {
            timeout: 50000
        }
    });

    let isConnected = await printer.isPrinterConnected();

    if (isConnected) {
        console.log("Stampante connessa " + ip);

        // Forziamo la code page PC858 per l'€
        printer.setCharacterSet(CharacterSet.PC858_EURO);

        // --- HEADER COMMERCIALE ---
        printer.alignCenter();
        await printer.printImage("./images/logo-black.png");
        printer.setTextQuadArea();
        printer.println("SMASHBURGER & HOTDOG");
        printer.setTextNormal();
        printer.println(new Date().toLocaleString("it-IT"));
        printer.newLine(3);

        // --- INTESTAZIONE FISCALE ---
        printer.setTextQuadArea();
        printer.println("DOCUMENTO COMMERCIALE");
        printer.setTextNormal();
        printer.println("DI VENDITA O PRESTAZIONE");
        printer.newLine();
        printer.println("Bonita S.r.l.");
        printer.println("P.IVA 05112550230");
        printer.println("+39 377 4865256");
        printer.println("via Mirandola 55/B");
        printer.println("Pescantina (VR)");
        printer.newLine(2);
        printer.drawLine();

        // --- ID ORDINE ---
        printer.alignLeft();
        printer.bold(true);
        printer.println(`ID Ordine: ${order.id}`);
        printer.bold(false);
        printer.drawLine();

        // --- DETTAGLIO PRODOTTI ---
        order.productOrders.forEach(item => {
            const lineTotal = (item.price * item.quantity).toFixed(2);
            printer.println(`${item.quantity} x ${item.name}`);
            printer.alignRight();
            printer.println(`€ ${lineTotal}`);
            printer.alignLeft();
        });
        printer.drawLine();

        // --- RIEPILOGO COSTI + CALCOLO IVA ---
        const addRow = (label, value) =>
            printer.leftRight(label, `€ ${value.toFixed(2)}`);

        // Subtotale
        addRow("Subtotale", order.subTotal);

        // Supplemento (se presente)
        if (order.increase > 0) {
            addRow("Supplemento", order.increase);
        }

        // Sconto totale (discount + extraDiscount)
        const totalDiscount = order.discount + order.extraDiscount;
        if (totalDiscount > 0) {
            addRow("Sconto", -totalDiscount);
        }

        // --- TOTALE FINALE ---
        printer.bold(true);
        printer.leftRight("TOTALE", `€ ${order.total.toFixed(2)}`);
        printer.bold(false);
        // Di cui IVA 10%
        const vatRate = 10;
        const ivaAmount = parseFloat((order.total * vatRate / 100).toFixed(2));
        printer.leftRight("di cui IVA", `€ ${ivaAmount.toFixed(2)}`);
        printer.drawLine();

        // --- FOOTER E PAGAMENTO ---
        printer.newLine(2);
        printer.alignCenter();
        const metodo = paymentLabels[order.paymentMethod] || order.paymentMethod;
        printer.println(`Metodo di pagamento: ${metodo}`);
        printer.newLine(2);
        printer.println("Grazie per averci scelto!");
        printer.newLine();

        // Apertura cassetto e taglio
        printer.openCashDrawer();
        printer.cut();

        try {
            await printer.execute();
        } catch (e) {
            console.log(e);
        }
    } else {
        console.log("Stampante non connessa " + ip);
    }
}

module.exports = {
    printOnIp
}