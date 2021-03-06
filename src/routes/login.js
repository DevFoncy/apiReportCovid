require('dotenv').config();
const accountSid = process.env.ACCOUNT_SID;
const authToken = process.env.AUTH_TOKEN;

const express = require('express');
const router = express.Router();
const moment = require('moment');

const client = require('twilio')(accountSid, authToken);
const mysqlConnection = require('../database.js');
let endPointsFormat = require('../utils/format.js');

// GET An Employee
router.get('/test/:id', (req, res) => {
  const {id} = req.params;
  mysqlConnection.mysqlConnection.query('SELECT * FROM employee WHERE id = ?', [id], (err, rows, fields) => {
    if (!err) {
      res.json( endPointsFormat.formatEndPointSuccess('Informacion traida con exito', rows[0]));
    } else {
      res.json( endPointsFormat.formatEndPointFailed ( 'Error al traer la informacion'));
    }
  });
});


router.post('/login', (req, res) => {
  const {phone} = req.body;
  let generateCode = Math.floor(1000 + Math.random() * 9000);
  let token = '-1';
  let messageError = '';
  client.messages.create({
    to: phone,
    from: process.env.TWILIO_NUMBER,
    body: 'Hola , tu codigo de 4 digitos es :' + generateCode
  }).then(function (message) { //success
    token = message.sid;
    let dateNow = moment().format("D/MM/YYYY h:mm:ss"); // "Sunday, February 14th 2010, 3:25:50 pm"
    mysqlConnection.mysqlConnection.query("INSERT INTO solicitud_registro (token, code, status, celular, date_created) VALUES (?,?,?,?,?)", [token, generateCode, 0, phone, dateNow], (err, rows, fields) => {
      if (!err) {
        res.json(  endPointsFormat.formatEndPointSuccess('El token fue enviado', token));
      } else {
        res.json(  endPointsFormat.formatEndPointFailed('Error al guardar en la base datos'));
      }
    });
  }, function (reason) { //error
    messageError = reason;
    res.json( endPointsFormat.formatEndPointFailed ( 'Error al enviar el mensaje, numero no valido'));
  });

});


router.post('/checkNumber', (req, res) => {
  const {phone, code} = req.body;
  let token = [];
  //Get the row
  mysqlConnection.mysqlConnection.query('SELECT token FROM solicitud_registro where celular = ? and code = ? and status = 0 LIMIT 1 ', [phone, code], (err, rows, fields) => {
    if (!err) {
      token = rows[0] ? rows[0].token : [] ;
      if(token.length > 1){
        mysqlConnection.mysqlConnection.query("UPDATE solicitud_registro SET status = 1 WHERE token = ?", [token], (err, rows, fields) => {
          if (!err) {
            res.json( endPointsFormat.formatEndPointSuccess('Se valido la cuenta con exito'));
          } else {
            res.json( endPointsFormat.formatEndPointFailed('No pudo verificarse'));
          }
        });
      }else{
        res.json( endPointsFormat.formatEndPointFailed( 'No se ecuentra el codigo'));
      }
    } else {
      res.json( endPointsFormat.formatEndPointFailed('Error de base de datos'));
    }
  });
});

router.post('/user/support', (req, res) => {
  const {usercode, enable} = req.body;
  //Get the row
  mysqlConnection.mysqlConnection.query('UPDATE usuario set support = ? WHERE id =  ? ', [enable, usercode], (err, rows, fields) => {
    if (!err) {
        res.json( endPointsFormat.formatEndPointSuccess('Se ha habilitado el apoyo del usuario'));
    } else {
      res.json( endPointsFormat.formatEndPointFailed('No pudo habilitarse el apoyo', err));
    }
  });
});



module.exports = router;
