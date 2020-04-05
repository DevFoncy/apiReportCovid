const mysqlConnection = require('./../database.js');

function  getAllLocationsBd ()  {
  let  locations = mysqlConnection.connectionSyncronus.query('SELECT id, nombre FROM establecimiento');
  locations.map( (location, index) => {
    location.peopleNumber = 0;
  });
  console.log('locationsssss',locations);
  return locations;
};

