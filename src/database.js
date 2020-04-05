const mysql = require('mysql');
require('dotenv').config();

const mysqlConnection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  multipleStatements: true
});

const MySql = require('sync-mysql');
let connectionSyncronus = new MySql({
  host: process.env.DB_HOST,
  user: process.env.DB_USERNAME,
  password:  process.env.DB_PASSWORD,
  database:  process.env.DB_DATABASE
});

mysqlConnection.connect(function (err) {
  if (err) {
    console.error(err);
    return;
  } else {
    console.log('db is connected');
  }
});

module.exports = Object.freeze({
  mysqlConnection,
  connectionSyncronus
});
