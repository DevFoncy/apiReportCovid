const express = require('express');
const router = express.Router();
const moment = require('moment');

const mysqlConnection = require('../database.js');
let endPointsFormat = require('../utils/format.js');
let utils = require('./../constant.js');
const AFORO = 100;

router.post('/location/save', (req, res) => {
  const {name, department, province, district, points} = req.body;
  let location = {name, department, province, district, points};
  let dateNow = moment().format("D/MM/YYYY h:mm:ss");

  mysqlConnection.mysqlConnection.query("INSERT INTO establecimiento (departamento,provincia,distrito,nombre,fecha_creacion) VALUES (?,?,?,?,?)",
    [location.department, location.province, location.district, location.name, dateNow], (err, response) => {
      if (!err) {
        location.points.map((point) => {
          mysqlConnection.mysqlConnection.query("INSERT INTO coordenada (lat, lng, establecimiento_id) VALUES (?,?,?)",
            [point.lat, point.lng, response.insertId]);
        });
        res.json(endPointsFormat.formatEndPointSuccess('Guardado con exito'));

      } else {
        res.json(endPointsFormat.formatEndPointFailed('Error al guardar en la base datos' + err));
      }
    });
});

//Endpoint 4
router.get('/location/near', (req, res) => {
  const {usercode, lat , lng} = req.body;
  let locations = req.app.get('locationsMemory'); //array static
  let coordenadas = mysqlConnection.connectionSyncronus.query('select latitud, longitud from usuario where id=' + "'"+ usercode + "'");
  if ( coordenadas.length > 0){
    let locationFound;
    mysqlConnection.mysqlConnection.query(' \n' +
      ' SELECT *,\n' +
      '      111.045* DEGREES(ACOS(LEAST(1.0, COS(RADIANS(latpoint))\n' +
      '                 * COS(RADIANS(c.lat))\n' +
      '                 * COS(RADIANS(c.lng) - RADIANS(c.lng))\n' +
      '                 + SIN(RADIANS(latpoint))\n' +
      '                 * SIN(RADIANS(c.lat))))) AS distance_in_km\n' +
      ' FROM coordenada  c, establecimiento e\n' +
      ' JOIN ( \n' +
      '     SELECT  ?  AS latpoint,  ? AS longpoint\n' +
      '   ) AS p ON 1=1\n' +
      ' where c.establecimiento_id = e.id  and\n' +
      '       c.lat in ( select ( select lat  from coordenada tc where tc.establecimiento_id = tl.id limit 1) lat\n' +
      '       from establecimiento tl )  and\n' +
      '       c.lng in ( select ( select lng  from coordenada tc where tc.establecimiento_id = tl.id limit 1) lng\n' +
      '       from establecimiento tl)\n' +
      ' having distance_in_km < 2\n' +
      ' order by distance_in_km asc\n' +
      ' limit 5;',[lat ? lat :  coordenadas[0].latitud, lng? lng : coordenadas[0].longitud], (err, rows) => {
      if (!err) {
        let response = [];
        rows.map((location) => {
          let resultados = mysqlConnection.connectionSyncronus.query('SELECT c.lat, c.lng FROM coordenada c WHERE c.establecimiento_id =' + location.id);
          location.points = resultados;
          location.aforo = 100;
          locationFound = locations.find( l => (l.id === location.id));
          location.supportUsers = locationFound.supportUsers;
          location.peopleNumber = locationFound.peopleNumber;
          response.push(location);
        });
        res.json(endPointsFormat.formatEndPointSuccess('Data traigo con exito', response));

      } else {
        res.json(endPointsFormat.formatEndPointFailed('Error al traer las ubicaciones mas cercanas'));
      }
    });
  } else{
    res.json(endPointsFormat.formatEndPointFailed('Error al traer la informacion'));
  }

});


//Endpoint 4.1 PRIMERA CARGA
router.get('/location/all', (req, res) => {
  let locations = req.app.get('locationsMemory'); //array static
  mysqlConnection.mysqlConnection.query('SELECT  distinct e.* FROM establecimiento e inner join  coordenada c  ON c.establecimiento_id = e.id ', (err, rows) => {
    if (!err) {
      let response = [];
      let locationFound;
      rows.map((location) => {
        let resultados = mysqlConnection.connectionSyncronus.query('SELECT c.lat, c.lng FROM coordenada c WHERE c.establecimiento_id =' + location.id);
        location.points = resultados;
        location.aforo= AFORO;
        locationFound = locations.find( l => (l.id === location.id));
        location.supportUsers = locationFound.supportUsers;
        location.peopleNumber = locationFound.peopleNumber;
        location.criticality = utils.findCriticity(locationFound.peopleNumber, AFORO);
        response.push(location);
      });
      res.json(endPointsFormat.formatEndPointSuccess('Data traigo con exito', response));

    } else {
      res.json(endPointsFormat.formatEndPointFailed('Error al traer la informacion'));
    }
  });
});


//Endpoint 5
router.post('/location/into', (req, res) => {
  const {usercode, placecode, action} = req.body;
  let locationFound, userAvailable;
  
  let locations = req.app.get('locationsMemory');
  locationFound = locations.find( (location => placecode === location.id) );
  if(locationFound) {
    let user =  mysqlConnection.connectionSyncronus.query('SELECT * FROM usuario WHERE id = ' + "'" + usercode + "'" );
    if(user.length > 0) {
      locations.map(location => {
        if (location.id === locationFound.id) {
          if(action === "IN") { //enter location
            userAvailable = location.supportUsers;
            if(user[0].support === '1'){ //Support people
              userAvailable.push(usercode);
              location.supportUsers = userAvailable;
              console.log('Ingreso una persona en el location ' + location.nombre + 'con usercode '+ usercode);
            } else{ //Dont support
              console.log('Ingreso una persona en el location pero no hace favores');
            }
            location.peopleNumber++;
            res.json(endPointsFormat.formatEndPointSuccess('Ingreso una persona en el location '  + location.nombre + + 'con usercode '+ usercode));
          }else{ //go out location
            userAvailable = location.supportUsers;
            location.supportUsers = endPointsFormat.removeElement(userAvailable, usercode);
            location.peopleNumber--;
            res.json(endPointsFormat.formatEndPointSuccess('Salio una persona'));
          }
        }
      });
    }else{
      res.json(endPointsFormat.formatEndPointFailed('No se encontro el usercode'));
    }
  }
  else{
    res.json(endPointsFormat.formatEndPointFailed('No se encontro el id de la locacion'));
  }
});

//Endpoint 6
router.post('/location/into/search', (req, res) => {
  const {placecode, usercode, lat, lng} = req.body;
  let locations = req.app.get('locationsMemory');
  let response = locations.filter( (location) => location.id === placecode)[0];
  if(response){
    let coordenadas = mysqlConnection.connectionSyncronus.query('select latitud, longitud from usuario where id=' + "'"+ usercode + "'");
    mysqlConnection.mysqlConnection.query(' SELECT *,\n' +
      '      111.045* DEGREES(ACOS(LEAST(1.0, COS(RADIANS(latpoint))\n' +
      '                 * COS(RADIANS(latitud))\n' +
      '                 * COS(RADIANS(longitud) - RADIANS(longitud))\n' +
      '                 + SIN(RADIANS(latpoint))\n' +
      '                 * SIN(RADIANS(latitud))))) AS distance_in_km\n' +
      ' FROM usuario\n' +
      ' JOIN (\n' +
      '     SELECT ?  AS latpoint,   ? AS longpoint\n' +
      '   ) AS p ON 1=1\n' +
      ' where latitud <> -12.0474073 and longitud <> -76.9370903\n' +
      ' having distance_in_km < 1\n' +
      ' order by distance_in_km asc\n' +
      ' limit 5;',[lat ? lat :  coordenadas[0].latitud, lng? lng : coordenadas[0].longitud], (err, rows) => {
      if (!err) {
          let userInto = response.supportUsers; // array  support users into location
          let userNearIntoLocation = 0;
          if(userInto.length > 0) {
            rows.map( (user) => {
              if(userInto.includes(user.id)){
                userNearIntoLocation++;
              }
            });
          }
        response.numPersApoyo = userNearIntoLocation;
        response.criticality = utils.findCriticity(response.peopleNumber, AFORO);
        res.json(endPointsFormat.formatEndPointSuccess('Location encontrado con exito', response));
      } else{
        res.json(endPointsFormat.formatEndPointSuccess('Error al traer los vecinos cercanos al usuario'));
      }
    });
  }else{
    res.json(endPointsFormat.formatEndPointFailed('Placecode mal ingresado'));
  }
});


//Endpoint 8
router.get('/location/into/near/all', (req, res) => {
  const {placecode, usercode} = req.body;
  let locations = req.app.get('locationsMemory');
  let response = locations.filter( (location) => location.id === placecode)[0];
  if(response){
    let coordenadas = mysqlConnection.connectionSyncronus.query('select latitud, longitud from usuario where id=' + "'"+ usercode + "'");
    mysqlConnection.mysqlConnection.query(' SELECT *,\n' +
      '      111.045* DEGREES(ACOS(LEAST(1.0, COS(RADIANS(latpoint))\n' +
      '                 * COS(RADIANS(latitud))\n' +
      '                 * COS(RADIANS(longitud) - RADIANS(longitud))\n' +
      '                 + SIN(RADIANS(latpoint))\n' +
      '                 * SIN(RADIANS(latitud))))) AS distance_in_km\n' +
      ' FROM usuario\n' +
      ' JOIN (\n' +
      '     SELECT ?  AS latpoint,   ? AS longpoint\n' +
      '   ) AS p ON 1=1\n' +
      ' where latitud <> -12.0474073 and longitud <> -76.9370903\n' +
      ' having distance_in_km < 1\n' +
      ' order by distance_in_km asc\n' +
      ' limit 5;',[coordenadas[0].latitud,  coordenadas[0].longitud], (err, rows) => {
      if (!err) {
        let userInto = response.supportUsers; // array  support users into location
        let userNearIntoLocation = [];
        if(userInto.length > 0) {
          rows.map( (user) => {
            if(userInto.includes(user.id)){
              userNearIntoLocation.push(user);
            }
          });
        }

        res.json(endPointsFormat.formatEndPointSuccess('Location encontrado con exito',  userNearIntoLocation));
      } else{
        res.json(endPointsFormat.formatEndPointSuccess('Error al traer los vecinos cercanos al usuario'));
      }
    });
  }else{
    res.json(endPointsFormat.formatEndPointFailed('Placecode mal ingresado'));
  }
});



router.get('/location/into/all', (req, res) => {
   let locations = req.app.get('locationsMemory');
   res.json(endPointsFormat.formatEndPointSuccess('Ubicaciones del array', locations));
 });






module.exports = router;
