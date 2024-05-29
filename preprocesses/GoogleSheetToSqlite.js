function exportSheetsToSQLite() {
  var sheets = ["Sheet1", "Sheet2"]; // Add your sheet names here
  var databaseName = "exported_database";

  // SQL statements
  var sqlStatements = [];

  sheets.forEach(function(sheetName) {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    if (!sheet) {
      throw new Error("Sheet not found: " + sheetName);
    }

    var data = sheet.getDataRange().getValues();
    var columns = data[0];

    // Create table statement
    var createTableStatement = "CREATE TABLE " + sheetName + " (";
    columns.forEach(function(columnName, index) {
      createTableStatement += columnName + " TEXT";
      if (index < columns.length - 1) {
        createTableStatement += ", ";
      }
    });
    createTableStatement += ");";
    sqlStatements.push(createTableStatement);

    // Insert data statements
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var insertStatement = "INSERT INTO " + sheetName + " VALUES (";
      row.forEach(function(cellValue, index) {
        insertStatement += "'" + cellValue.toString().replace(/'/g, "''") + "'";
        if (index < row.length - 1) {
          insertStatement += ", ";
        }
      });
      insertStatement += ");";
      sqlStatements.push(insertStatement);
    }
  });

  // Create SQL file
  var blob = Utilities.newBlob(sqlStatements.join("\n"), "application/sql", databaseName + ".sql");
  var file = DriveApp.createFile(blob);

  Logger.log("File created: " + file.getUrl());
}
