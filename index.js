const { access, readFile, writeFile } = require("fs/promises");
const axios = require("axios");
const { createWriteStream } = require("fs");

const csvPath = process.argv[3] ?? "input.csv";
const key = process.argv[2];

async function run() {
    if (!key) {
        console.log("Kein account key angegben. Aufrufen mit:");
        console.log("node index.js <KEY>");
    }


    console.log("Lese Input Datei");

    if (!(await exists(csvPath))) {
        console.error("Fehler: Keine Input Datei");
        await writeFile(csvPath, "Start, Ziel\n");
        return;
    }

    const csv = await readFile(csvPath);
    const lines = csv.toString().split("\n").map(l => l.split(",").map(f => f.trim()));
    lines.splice(0, 1);
    console.log("Berechne", lines.length, "Ziele ...")

    const output = createWriteStream("output.csv");
    output.write("Start,Ziel,Status,Zeit_Formatiert,Sekunden\n")

    for (const [origin, destination] of lines) {
        const { data } = await axios.get("https://maps.googleapis.com/maps/api/directions/json", {
            params: {
                origin, destination, mode: "transit", key
            }
        });

        const duration = data.routes[0]?.legs[0].duration;

        console.log("\n", origin, "  ---", duration.text, "--->   ", destination);

        output.write([origin, destination, data.status, duration.text, duration.value].join(",") + "\n")
    }
    console.log("fertig");
}


run();

async function exists(path) {
    return access(path).then(() => true).catch(() => false);

}