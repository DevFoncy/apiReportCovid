const express = require('express');
const app = express();
const mysqlConnection = require('./database.js');

// Settings
app.set('port', process.env.PORT || 3000);

// Middlewares
app.use(express.json());

// Routes
app.use(require('./routes/employees'));
app.use(require('./routes/login'));
app.use(require('./routes/location'));

// Starting the server
app.listen(app.get('port'), () => {
  console.log(`Server on port ${app.get('port')}`);
});

function  result  () {
  let  locations = mysqlConnection.connectionSyncronus.query('SELECT id, nombre FROM establecimiento');
  locations.map( (location, ) => {
    location.peopleNumber = 0;
  });
  return locations;
};
app.set('locationsMemory', result());



