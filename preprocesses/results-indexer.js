const fs = require('fs');
const path = require('path');

/**
 * Reads a directory of JSON files and builds an array of each file's top-level properties.
 * @param {string} dir - The directory path containing the JSON files.
 * @returns {Promise<Object[]>} - A promise that resolves to an array of objects with top-level properties.
 */
async function getTopLevelProperties(dir) {
    const files = await fs.promises.readdir(dir);
    const jsonFiles = files.filter(file => path.extname(file) === '.json');

    const results = [];
    const columns = {};

    for (const filename of jsonFiles) {
        const filePath = path.join(dir, filename);
        const data = await fs.promises.readFile(filePath, 'utf-8');
        const jsonData = JSON.parse(data);
        for (let run in jsonData) {
            const topLevelProperties = {filename: filename, runkey: run};
            for (const key in jsonData[run]) {
                topLevelProperties[key] = jsonData[run][key];
                if (typeof columns[key] === "undefined") {
                    columns[key] = addColumn(topLevelProperties[key], key);
                }
            }
            results.push(topLevelProperties);
        }
    }

    // columns.sort((a, b) => a.started > b.started)

    const fieldSchema = JSON.stringify(columns, null, 2); // Pretty-print with 2-space indentation
    await fs.promises.writeFile('./src/schema.json', fieldSchema, 'utf-8');

    return results;
}


function makeLabel(fieldName) {
    if (fieldName === 'num_response') return 'Responses';

    let str = fieldName.replace("num_", "");
    str = str.replace("_id", "");
    str = str.replace("_time", "");
    const words = str.split(/(?=[A-Z])|_/);

    // Capitalize the first letter of each word and join them with spaces
    return words
        .map((word) => {
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join(" ");
}

function addColumn(val, key) {
    const column = {
        field: key,
        headerName: makeLabel(key),
        type: typeof val,
        sortable: true,
        filterable: true
    };
    if (key === 'started' || key === 'ended') {
        column.showing = false;
    }

    if (column.type === "string") {
        if (key.indexOf("_ids") > -1) {
            column.type = "array";
            column.filterable = false;
        } else if (!isNaN(Date.parse(val))) {
            column.type = "time";
            column.filterable = false;
        }
    } else {
        if (column.type !== "object") {
            column.filterable = false;
        }

        /* if (column.type === 'object') {
            column.style = {flexGrow: 1, wordBreak: 'break-word'}
        } */
    }

    return column;

}

// Usage example:
const directoryPath = './public/results';

getTopLevelProperties(directoryPath)
    .then(async (result) => {
        console.log('Top-level properties from JSON files:', result);
        const jsonString = JSON.stringify(result, null, 2); // Pretty-print with 2-space indentation
        await fs.promises.writeFile('./public/results.json', jsonString, 'utf-8');
    })
    .catch(error => {
        console.error('Error reading JSON files:', error);
    });
