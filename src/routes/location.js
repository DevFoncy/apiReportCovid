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




module.exports = router;
