require('dotenv').config();

const express = require('express');
const router = express.Router();
const moment = require('moment');
const mysqlConnection = require('../database.js');
let endPointsFormat = require('../utils/format.js');

const STATUS_SERVICE_PENDING = 0;
const STATUS_SERVICE_NOTIFY = 1;
const STATUS_SERVICE_START=2;
const STATUS_SERVICE_CANCEL = 3;
const STATUS_SERVICE_FINISHED= 4;



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

router.get('/service', (req, res) => {
  let id = req.query.id;
  mysqlConnection.mysqlConnection.query('SELECT * FROM service WHERE id = ?', [id],(err, rows, fields) => {
    if (!err) {
      let response = rows[0];
      let detalle = mysqlConnection.connectionSyncronus.query('select * from service_detalle where id_service = ' + "'"+ id + "'");
      let location = mysqlConnection.connectionSyncronus.query('select * from establecimiento where id = ' + response.placecode)[0];
      response.usercode_solicita = response.usercode_solicita ?  mysqlConnection.connectionSyncronus.query('select * from usuario where id = ' + "'"+ response.usercode_solicita + "'")[0] : null;
      response.usercode_favor = response.usercode_favor ?  mysqlConnection.connectionSyncronus.query('select * from usuario where id = ' + "'"+ response.usercode_favor + "'")[0] : null;
      response.items = detalle.map( d => { return { descripcion : d.description, cantidad : d.count}});
      response.placeLocation = location;
      delete response.placecode;
      delete response.rating;
      delete response.pedido;
      res.json( endPointsFormat.formatEndPointSuccess('Servicio encontrado',response));
    } else {
      res.json( endPointsFormat.formatEndPointFailed('No se pudo  encontrar el servicio solicitado'));
    }
  });
});

module.exports = router;
