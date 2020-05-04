require('dotenv').config();

const express = require('express');
const router = express.Router();
const mysqlConnection = require('../database.js');
let endPointsFormat = require('../utils/format.js');
let admin = require("firebase-admin");
// let fireBaseAdmin = admin.initializeApp();

let serviceAccount = require("../../fbcovid");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const STATUS_SERVICE_PENDING = 0;
const STATUS_SERVICE_START=1;
const STATUS_SERVICE_CANCEL = 2;
const STATUS_SERVICE_FINISHED= 3;

//fqc97pFR5ic:APA91bF371rS-k7NE9OszNLoSdxyN7YtZ1_v8eFmbAwtSYqwBW1rGFb9C_-FHBpNDKGC92vrjUkAR8hdpRruj_FtlW0crnIOTQTD6N_cVo5DCpPjpZ7cVgOZujNkRubmgNDlsZrneh3e


router.post('/service/create', (req, res) => {
  const {usercode_solicita, pedido, placecode} = req.body;
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

      //Send Notification
      mysqlConnection.mysqlConnection.query('SELECT * from usuario',(err, rows, fields) => {
        if (!err) {
          res.json( endPointsFormat.formatEndPointSuccess('Usuarios traidos con exito', rows));
        } else {
          res.json( endPointsFormat.formatEndPointFailed('No se pudo traer los usuarios', err));
        }
      });

      // res.json( endPointsFormat.formatEndPointSuccess('Servicio de apoyo creado con exito!', response));
    } else {
      res.json( endPointsFormat.formatEndPointFailed('No se pudo registrar el servicio , ERROR en el QUERY', err));
    }
  });
});


function sendFireBaseMessage ( token = []){

  const registrationTokens = [
    'YOUR_REGISTRATION_TOKEN_1',
    // …
    'YOUR_REGISTRATION_TOKEN_N',
  ];

  let message = {
    notification: {
      title: "Account Deposit",
      body: "A deposit to your savings account has just cleared."
    },
    data: {
      score: '850',
      time: '2:45'
    },
    token: registrationTokens
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
