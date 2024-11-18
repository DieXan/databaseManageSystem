const express = require('express');
const bodyParser = require('body-parser');
const jsonfile = require('jsonfile');
const xml2js = require('xml2js');
const XLSX = require('xlsx');
const readline = require('readline');

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Создание базы данных
app.post('/create-db', (req, res) => {
    const { dbName } = req.body;
    const data = {};
    jsonfile.writeFile(`./databases/${dbName}.json`, data, { spaces: 2 }, (err) => {
        if (err) return res.status(500).send(err);
        res.send(`Database ${dbName} created`);
    });
});

// Добавление данных
app.post('/add-data', (req, res) => {
    const { dbName, data } = req.body;
    jsonfile.readFile(`./databases/${dbName}.json`, (err, obj) => {
        if (err) return res.status(500).send(err);
        Object.assign(obj, data);
        jsonfile.writeFile(`./databases/${dbName}.json`, obj, { spaces: 2 }, (err) => {
            if (err) return res.status(500).send(err);
            res.send('Data added');
        });
    });
});

// Чтение данных
app.get('/read-data/:dbName', (req, res) => {
    const { dbName } = req.params;
    jsonfile.readFile(`./databases/${dbName}.json`, (err, obj) => {
        if (err) return res.status(500).send(err);
        res.json(obj);
    });
});

// Сохранение данных в CSV
app.get('/save-csv/:dbName', (req, res) => {
    const { dbName } = req.params;
    jsonfile.readFile(`./databases/${dbName}.json`, (err, obj) => {
        if (err) return res.status(500).send(err);
        const csv = Object.keys(obj).map(key => `${key},${obj[key]}`).join('\n');
        res.setHeader('Content-disposition', `attachment; filename=${dbName}.csv`);
        res.set('Content-Type', 'text/csv');
        res.send(csv);
    });
});

// Сохранение данных в XML
app.get('/save-xml/:dbName', (req, res) => {
    const { dbName } = req.params;
    jsonfile.readFile(`./databases/${dbName}.json`, (err, obj) => {
        if (err) return res.status(500).send(err);
        const builder = new xml2js.Builder();
        const xml = builder.buildObject(obj);
        res.setHeader('Content-disposition', `attachment; filename=${dbName}.xml`);
        res.set('Content-Type', 'text/xml');
        res.send(xml);
    });
});

// Сохранение данных в XLSX
app.get('/save-xlsx/:dbName', (req, res) => {
    const { dbName } = req.params;
    jsonfile.readFile(`./databases/${dbName}.json`, (err, obj) => {
        if (err) return res.status(500).send(err);
        const worksheet = XLSX.utils.json_to_sheet([obj]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
        XLSX.writeFile(workbook, `./databases/${dbName}.xlsx`);
        res.download(`./databases/${dbName}.xlsx`, `${dbName}.xlsx`, (err) => {
            if (err) return res.status(500).send(err);
        });
    });
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

// Консольный интерфейс
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function promptUser() {
    rl.question('Введите команду (create-db, add-data, read-data, save-csv, save-xml, save-xlsx, exit): ', (command) => {
        switch (command) {
            case 'create-db':
                rl.question('Введите имя базы данных: ', (dbName) => {
                    const data = {};
                    jsonfile.writeFile(`./databases/${dbName}.json`, data, { spaces: 2 }, (err) => {
                        if (err) console.error(`Ошибка при создании базы данных: ${err}`);
                        else console.log(`База данных ${dbName} создана`);
                        promptUser();
                    });
                });
                break;
            case 'add-data':
                rl.question('Введите имя базы данных: ', (dbName) => {
                    rl.question('Введите данные в формате JSON (например, {"key": "value"}): ', (dataStr) => {
                        try {
                            const data = JSON.parse(dataStr);
                            jsonfile.readFile(`./databases/${dbName}.json`, (err, obj) => {
                                if (err) {
                                    console.error(`Ошибка при чтении базы данных: ${err}`);
                                    promptUser();
                                    return;
                                }
                                Object.assign(obj, data);
                                jsonfile.writeFile(`./databases/${dbName}.json`, obj, { spaces: 2 }, (err) => {
                                    if (err) console.error(`Ошибка при добавлении данных: ${err}`);
                                    else console.log('Данные добавлены');
                                    promptUser();
                                });
                            });
                        } catch (e) {
                            console.error('Неверный формат JSON');
                            promptUser();
                        }
                    });
                });
                break;
            case 'read-data':
                rl.question('Введите имя базы данных: ', (dbName) => {
                    jsonfile.readFile(`./databases/${dbName}.json`, (err, obj) => {
                        if (err) console.error(`Ошибка при чтении базы данных: ${err}`);
                        else console.log('Данные:', obj);
                        promptUser();
                    });
                });
                break;
            case 'save-csv':
                rl.question('Введите имя базы данных: ', (dbName) => {
                    jsonfile.readFile(`./databases/${dbName}.json`, (err, obj) => {
                        if (err) {
                            console.error(`Ошибка при чтении базы данных: ${err}`);
                            promptUser();
                            return;
                        }
                        const csv = Object.keys(obj).map(key => `${key},${obj[key]}`).join('\n');
                        jsonfile.writeFile(`./databases/${dbName}.csv`, csv, (err) => {
                            if (err) console.error(`Ошибка при сохранении CSV: ${err}`);
                            else console.log(`Данные сохранены в ${dbName}.csv`);
                            promptUser();
                        });
                    });
                });
                break;
            case 'save-xml':
                rl.question('Введите имя базы данных: ', (dbName) => {
                    jsonfile.readFile(`./databases/${dbName}.json`, (err, obj) => {
                        if (err) {
                            console.error(`Ошибка при чтении базы данных: ${err}`);
                            promptUser();
                            return;
                        }
                        const builder = new xml2js.Builder();
                        const xml = builder.buildObject(obj);
                        jsonfile.writeFile(`./databases/${dbName}.xml`, xml, (err) => {
                            if (err) console.error(`Ошибка при сохранении XML: ${err}`);
                            else console.log(`Данные сохранены в ${dbName}.xml`);
                            promptUser();
                        });
                    });
                });
                break;
            case 'save-xlsx':
                rl.question('Введите имя базы данных: ', (dbName) => {
                    jsonfile.readFile(`./databases/${dbName}.json`, (err, obj) => {
                        if (err) {
                            console.error(`Ошибка при чтении базы данных: ${err}`);
                            promptUser();
                            return;
                        }
                        const worksheet = XLSX.utils.json_to_sheet([obj]);
                        const workbook = XLSX.utils.book_new();
                        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
                        XLSX.writeFile(workbook, `./databases/${dbName}.xlsx`);
                        console.log(`Данные сохранены в ${dbName}.xlsx`);
                        promptUser();
                    });
                });
                break;
            case 'exit':
                rl.close();
                break;
            default:
                console.log('Неизвестная команда');
                promptUser();
        }
    });
}

promptUser();