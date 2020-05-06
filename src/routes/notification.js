require('dotenv').config();

const express = require('express');
const moment = require('moment');
const router = express.Router();
const mysqlConnection = require('../database.js');
let endPointsFormat = require('../utils/format.js');
let admin = require("firebase-admin");

let serviceAccount = require("../../fbcovid");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const STATUS_SERVICE_PENDING = 0;
const STATUS_SERVICE_NOTIFY = 1;
const STATUS_SERVICE_START=2;
const STATUS_SERVICE_CANCEL = 3;
const STATUS_SERVICE_FINISHED= 4;


router.post('/service/create', (req, res) => {
  const {usercode_solicita, pedido, placecode} = req.body;
  let dateNow = moment().format("D/MM/YYYY h:mm:ss"); // "Sunday, February 14th 2010, 3:25:50 pm"
  let locations = req.app.get('locationsMemory');

  //Get the row
  mysqlConnection.mysqlConnection.query('INSERT INTO service(usercode_solicita , status, placecode, date_created) values (?,?,?,?)',[usercode_solicita, STATUS_SERVICE_PENDING,placecode,dateNow],(err, rows, fields) => {
    if (!err) {
      pedido.map( p => {
        mysqlConnection.mysqlConnection.query("INSERT INTO service_detalle (id_service, description, count) VALUES (?,?,?)",
          [rows.insertId, p.descripcion, p.cantidad]);
      });
      let idService = rows.insertId;
      let responseFinal = {
        idServicio: idService,
        status : STATUS_SERVICE_START,
        fecha_hora:dateNow
      };
      let response = locations.filter( (location) => location.id === placecode)[0];
      if(response){
        let usercode = usercode_solicita;
        let coordenadas = mysqlConnection.connectionSyncronus.query('select latitud, longitud from usuario where id=' + "'"+ usercode + "'")[0];
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
          ' limit 5;',[coordenadas.latitud,  coordenadas.longitud], (err, rows) => {
          if (!err) {
            let userInto = response.supportUsers; // array  support users into location
            let tokensAvailable = [];
            if(userInto.length > 0) {
              rows.map( (user) => {
                if(userInto.includes(user.id)){
                  user.token_notificacion ? tokensAvailable.push(user.token_notificacion) : null;
                }
              });
            }
            if(tokensAvailable.length > 0) {
              sendFireBaseMessage(tokensAvailable, idService);
              updateService(STATUS_SERVICE_NOTIFY, idService);
              res.json(endPointsFormat.formatEndPointSuccess('Se notifico del servicio a los usuario', responseFinal));

            } else{
              updateService(STATUS_SERVICE_PENDING, idService);
              res.json(endPointsFormat.formatEndPointFailed('Ningun vecino cerca', {code: '400'}));
            }
          } else{
            res.json(endPointsFormat.formatEndPointSuccess('Error al traer los vecinos cercanos al usuario'));
          }
        });

      }else{
        res.json(endPointsFormat.formatEndPointFailed('Placecode mal ingresado'));
      }
    } else {
      res.json( endPointsFormat.formatEndPointFailed('No se pudo registrar el servicio , ERROR en el QUERY', err));
    }
  });
});

function updateService( status, id){
  mysqlConnection.mysqlConnection.query('UPDATE service set status = ? WHERE id= ?',[status,id],(err, rows, fields) => {
    if (!err) {
      console.log('actualizado');
    } else {
      console.log('no actualizado' + err);
    }
  });
}


function sendFireBaseMessage ( token , idServicio){
  const registrationTokens = token;

  let message = {
    notification: {
      title : "Pedido de Apoyo",
      body: "Tiene un pedido de apoyo por aceptar"
    },
    data: {
      TYPE_LAUNCH : "NOTIFICATION",
      CLICK_ACTION : "NEW_SERVICE_REQUEST",
      id_servicio  : idServicio.toString()
    },
    tokens: registrationTokens
  };

  admin.messaging().sendMulticast(message)
    .then((response) => {
      if (response.failureCount > 0) {
        const failedTokens = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push(registrationTokens[idx]);
          }
        });
        console.log('List of tokens that caused failures: ' + failedTokens);
      }
    });

}


module.exports = router;
