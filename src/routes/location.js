const express = require('express');
const router = express.Router();
const moment = require('moment');

const mysqlConnection = require('../database.js');
let endPointsFormat = require('../utils/format.js');


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

router.get('/location/all', (req, res) => {
  mysqlConnection.mysqlConnection.query('SELECT  distinct e.* FROM establecimiento e inner join  coordenada c  ON c.establecimiento_id = e.id ', (err, rows) => {
    if (!err) {
      let response = [];
      let points = [];
      rows.map((location) => {
        let resultados = mysqlConnection.connectionSyncronus.query('SELECT c.lat, c.lng FROM coordenada c WHERE c.establecimiento_id =' + location.id);
        location.points = resultados;
        response.push(location);
      });
      res.json(endPointsFormat.formatEndPointSuccess('Data traigo con exito', response));

    } else {
      res.json(endPointsFormat.formatEndPointFailed('Error al traer la informacion'));
    }
  });
});

router.get('/location/near', (req, res) => {
  const {usercode} = req.body;
  let coordenadas = mysqlConnection.connectionSyncronus.query('select latitud, longitud from usuario where id=' + "'"+ usercode + "'");
  if ( coordenadas.length > 0){
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
      ' limit 5;',[coordenadas[0].latitud, coordenadas[0].longitud], (err, rows) => {
      if (!err) {
        let response = [];
        rows.map((location) => {
          let resultados = mysqlConnection.connectionSyncronus.query('SELECT c.lat, c.lng FROM coordenada c WHERE c.establecimiento_id =' + location.id);
          location.points = resultados;
          location.aforo = 100;
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


router.get('/location/all', (req, res) => {
  mysqlConnection.mysqlConnection.query('SELECT  distinct e.* FROM establecimiento e inner join  coordenada c  ON c.establecimiento_id = e.id ', (err, rows) => {
    if (!err) {
      let response = [];
      rows.map((location) => {
        let resultados = mysqlConnection.connectionSyncronus.query('SELECT c.lat, c.lng FROM coordenada c WHERE c.establecimiento_id =' + location.id);
        location.points = resultados;
        location.aforo= 100;
        response.push(location);
      });
      res.json(endPointsFormat.formatEndPointSuccess('Data traigo con exito', response));

    } else {
      res.json(endPointsFormat.formatEndPointFailed('Error al traer la informacion'));
    }
  });
});



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
            userAvailable = location.peopleNumber;
            if(user[0].support === '1'){ //Support people
              userAvailable.push(usercode);
              location.peopleNumber = userAvailable;
              res.json(endPointsFormat.formatEndPointSuccess('Ingreso una persona en el location ' + location.nombre + 'con usercode '+ usercode));
            }else{ //Dont support
              res.json(endPointsFormat.formatEndPointSuccess('Ingreso una persona en el location pero no hace favores'));
            }
          }else{ //go out location
            userAvailable = location.peopleNumber;
            location.peopleNumber = endPointsFormat.removeElement(userAvailable, usercode);
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


router.post('/location/into/search', (req, res) => {
  const {placecode} = req.body;
  let locations = req.app.get('locationsMemory');
  let response = locations.filter( (location) => location.id === placecode);
  if(response){
    res.json(endPointsFormat.formatEndPointSuccess('Location encontrado con exito', response));
  }else{
    res.json(endPointsFormat.formatEndPointFailed('Placecode mal ingresado'));
  }
});

router.get('/location/into/all', (req, res) => {
   let locations = req.app.get('locationsMemory');
   res.json(endPointsFormat.formatEndPointSuccess('Ubicaciones del array', locations));
 });






module.exports = router;
