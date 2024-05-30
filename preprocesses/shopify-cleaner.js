/****
 Removes irrelevant meta data from Shopify product exports
****/

const fs = require('fs');
const csv = require('csv-parser');

function csvToJsonObject(filePath, keysToPreserve) {
    const result = [];

    return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => {
                const obj = {};
                for(let key in keysToPreserve) {
                    if (data.hasOwnProperty(key) && data[key] !== '') {
                        let newKey = key;
                        if (newKey === "Product ID") newKey = 'source_id';
                        if (newKey === "Body (HTML)") newKey = 'Description';
                        if (newKey === "Variant Price") newKey = 'Price USD $';

                        obj[newKey] = keysToPreserve[key] === 'number' ? parseInt(data[key]) : data[key];
                        if (typeof keysToPreserve[key] === 'function') {
                            obj[newKey] = keysToPreserve[key](data[key]);
                        }
                    }
                }
                result.push(obj);
            })
            .on('end', () => {
                resolve(result);
            })
            .on('error', (error) => {
                reject(error);
            });
    });
}

async function transformCsvToJson(csvFilePath, keysToPreserve) {
    try {
        const jsonObject = await csvToJsonObject(csvFilePath, keysToPreserve);
        const jsonFilePath = csvFilePath.replace('.csv', '.json');
        fs.writeFileSync(jsonFilePath, JSON.stringify(jsonObject, null, 2));
        console.log(`JSON file saved: ${jsonFilePath}`);
    } catch (error) {
        console.error('Error:', error);
    }
}


var args = process.argv.slice(2);

const csvFilePath = args[0]; // './products_export.csv';
const keysToPreserve = {
    'Product ID':'number',
    'Handle':'string',
    'Title':'string',
    'Body (HTML)':(val) => {
        return val.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ')
    },
    'Product Category':'string',
    'Type':'string',
    'Tags':'string',
    'Variant Grams':'number',
    'Variant Price':'number'
};

transformCsvToJson(csvFilePath, keysToPreserve);
