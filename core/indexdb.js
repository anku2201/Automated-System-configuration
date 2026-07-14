const oracledb = require('oracledb');
const fs = require('fs');
const path = require('path');

const configFile = '../config/config.json';
var readconfigFile = fs.readFileSync(configFile, 'utf8');
const config = JSON.parse(readconfigFile);


async function performInsert(configdb) {
  for (const insertconfigdb of configdb.insert) {
    const { table, columns, values } = insertconfigdb;
    const columnsStr = columns.join(', ');
    const valuesStr = values.map(val => `'${val}'`).join(', ');

    const insertQuery = `INSERT INTO ${table} (${columnsStr}) VALUES (${eval("`"+valuesStr+"`")})`;
    console.log('insertQuery:'+ insertQuery);
    logToFile('insertQuery:'+ insertQuery);
    await executeQuery(insertQuery);
  }
}

async function performUpdate(configdb) {
  for (const updateconfigdb of configdb.update) {
    const { table, set, where } = updateconfigdb;
    const setStr = Object.entries(set).map(([column, value]) => `${column} = '${value}'`).join(', ');
    const updateQuery = `UPDATE ${table} SET ${eval("`"+setStr+"`")} WHERE ${where}`;
    console.log('updateQuery:'+ updateQuery);
    logToFile('updateQuery:'+ updateQuery);
    console.log(updateQuery);
    await executeQuery(updateQuery);
  }
}

async function performDelete(configdb) {
  for (const deleteconfigdb of configdb.delete) {
    const { table, where } = deleteconfigdb;

    const deleteQuery = `DELETE FROM ${table} WHERE ${where}`;
    console.log('deleteQuery:'+ deleteQuery);
    logToFile('deleteQuery:'+ deleteQuery);

    await executeQuery(deleteQuery);
  }
}

async function executeQuery(query) {
  try {
    const connection = await oracledb.getConnection({
      user: config.oracledb[0].user,
      password: config.oracledb[0].password,
      connectString: config.oracledb[0].connectString,
      autoCommit: true,
    });

    const result = await connection.execute(query);
    console.log('Query executed successfully:', result);
    logToFile('Query executed successfully:', result);

    await connection.commit();
    await connection.close();
  } catch (err) {
    console.error('Error executing query:', err);
    logToFile('Error executing query:'+ err);

  }
}

async function main() {
  try {
    const jsonString = fs.readFileSync('./techconfigDB.json', 'utf8');
    const configdb = JSON.parse(jsonString);

    if (configdb.insert) {
      await performInsert(configdb);
    }

    if (configdb.update) {
      await performUpdate(configdb);
    }

    if (configdb.delete) {
      await performDelete(configdb);
    }
  } catch (err) {
    console.error('Error:', err);
    logToFile ('Error:'+ err);
  }
}


// Function to get current date and time
function getCurrentDateTime() {
  const now = new Date();
  return now.toISOString(); // Adjust the date format as per your preference
}

// Function to write log messages to a file
function logToFile(message) {
  const currentDate = getCurrentDateTime().split('T')[0]; // Extract date from the current date time

  // Create the log folder if it doesn't exist
  if (!fs.existsSync(logFolder)) {
    fs.mkdirSync(logFolder);
  }

  const logFilePath = path.join(logFolder, `${currentDate}_techconfDB.log`); // Construct the log file path
  const logMessage = `${getCurrentDateTime()} - ${message}\n`; // Add date time to the log message

  fs.appendFileSync(logFilePath, logMessage); // Append the log message to the log file
}

const logFolder = "../log/"; 
main();
