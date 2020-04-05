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


router.post('/location/into', (req, res) => {
  const {usercode, placecode, action} = req.body;
  let locationFound;
  let locations = req.app.get('locationsMemory');
  locationFound = locations.find( (location => placecode === location.id) );
  if(locationFound) {
    locations.map(location => {
      if (location.id === locationFound.id) {
        if(action === "IN") {
          location.peopleNumber++;
          res.json(endPointsFormat.formatEndPointSuccess('Ingreso una persona en el location ' + location.nombre));

        }else{
          location.peopleNumber--;
          res.json(endPointsFormat.formatEndPointSuccess('Salio una persona'));
        }
      }
    });
  }
  else{
    res.json(endPointsFormat.formatEndPointFailed('No se encontro el id'));
  }
});


router.get('/location/into', (req, res) => {
  const {placecode} = req.body;
  let locations = req.app.get('locationsMemory');
  let response = locations.filter( (location) => location.id === placecode);
  if(response){
    res.json(endPointsFormat.formatEndPointSuccess('Location encontrado con exito', response));
  }else{
    res.json(endPointsFormat.formatEndPointFailed('Placecode mal ingresado'));
  }
});






module.exports = router;
