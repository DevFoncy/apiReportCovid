require('dotenv').config();

const express = require('express');
const router = express.Router();
const moment = require('moment');
const mysqlConnection = require('../database.js');
let endPointsFormat = require('../utils/format.js');

const STATUS_SERVICE_PENDING = 0;
const STATUS_SERVICE_START=1;
const STATUS_SERVICE_CANCEL = 2;
const STATUS_SERVICE_FINISHED= 3;


router.post('/service/create', (req, res) => {
  const {usercode_solicita, pedido} = req.body;
  let dateNow = moment().format("D/MM/YYYY h:mm:ss"); // "Sunday, February 14th 2010, 3:25:50 pm"
  //Get the row
  mysqlConnection.mysqlConnection.query('INSERT INTO service(usercode_solicita , status, date_created) values (?,?,?)',[usercode_solicita, STATUS_SERVICE_PENDING,dateNow],(err, rows, fields) => {
    if (!err) {
      pedido.map( p => {
        mysqlConnection.mysqlConnection.query("INSERT INTO service_detalle (id_service, description, count) VALUES (?,?,?)",
          [rows.insertId, p.descripcion, p.cantidad]);
      });
      let response = {
        "idServicio": rows.insertId,
        "status" : STATUS_SERVICE_START,
        "fecha_hora":dateNow
      };
      res.json( endPointsFormat.formatEndPointSuccess('Servicio de apoyo creado con exito!', response));
    } else {
      res.json( endPointsFormat.formatEndPointFailed('No se pudo registrar el servicio , ERROR en el QUERY', err));
    }
  });
});


router.put('/service/update', (req, res) => {
  const {idServicio , status, rating ,user_support} = req.body;
  mysqlConnection.mysqlConnection.query('UPDATE service set status = ? , rating = ?, usercode_favor = ?  WHERE id= ?',[status, rating, user_support,idServicio],(err, rows, fields) => {
    if (!err) {
      res.json( endPointsFormat.formatEndPointSuccess('EStado del servicio finalizado'));
    } else {
      res.json( endPointsFormat.formatEndPointFailed('No se pudo actualizar el servicio', err));
    }
  });
});



router.get('/service/all', (req, res) => {
  mysqlConnection.mysqlConnection.query('SELECT * FROM service',(err, rows, fields) => {
    if (!err) {
      res.json( endPointsFormat.formatEndPointSuccess('Lista de todos los servicios',rows));
    } else {
      res.json( endPointsFormat.formatEndPointFailed('No se pudo traer los servicios', err));
    }
  });
});

module.exports = router;
