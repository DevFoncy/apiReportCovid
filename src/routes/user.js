require('dotenv').config();

const express = require('express');
const router = express.Router();
const moment = require('moment');
const mysqlConnection = require('../database.js');
let endPointsFormat = require('../utils/format.js');


router.get('/users', (req, res) => {
  //Get the row
  mysqlConnection.mysqlConnection.query('SELECT * from usuario',(err, rows, fields) => {
    if (!err) {
      res.json( endPointsFormat.formatEndPointSuccess('Usuarios traidos con exito', rows));
    } else {
      res.json( endPointsFormat.formatEndPointFailed('No se pudo traer los usuarios', err));
    }
  });
});

router.post('/user/location', (req, res) => {
  const {usercode, lat, lng} = req.body;
  //Get the row
  mysqlConnection.mysqlConnection.query('UPDATE usuario set  latitud = ? , longitud = ? WHERE id =  ? ', [lat, lng ,usercode], (err, rows, fields) => {
    if (!err && rows.affectedRows > 0) {
      res.json( endPointsFormat.formatEndPointSuccess('Se ha registrado la latitud y longitud'));
    } else {
      res.json( endPointsFormat.formatEndPointFailed('No pudo registrar la ubicacion', err));
    }
  });
});

router.post('/user/support', (req, res) => {
  const {usercode, enable} = req.body;
  //Get the row
  mysqlConnection.mysqlConnection.query('UPDATE usuario set support = ? WHERE id =  ? ', [enable, usercode], (err, rows, fields) => {
    if (!err && rows.affectedRows > 0) {
      res.json( endPointsFormat.formatEndPointSuccess('Se ha habilitado el apoyo del usuario'));
    } else {
      res.json( endPointsFormat.formatEndPointFailed('No pudo habilitarse el apoyo', err));
    }
  });
});


router.post('/user/create', (req, res) => {
  const {usercode, dni, nombres,apellidos,email, enable , lat, lng, celular} = req.body;
  let dateNow = moment().format("D/MM/YYYY h:mm:ss"); // "Sunday, February 14th 2010, 3:25:50 pm"
  //Get the row
  mysqlConnection.mysqlConnection.query('INSERT INTO usuario(id, dni, nombres, apellidos, email, celular, support, latitud, longitud, fecha_registro) values (?,?,?,?,?,?,?,?,?,?)',[usercode, dni, nombres,apellidos,email, celular,  enable , lat, lng,dateNow],(err, rows, fields) => {
    if (!err) {
      res.json( endPointsFormat.formatEndPointSuccess('Usuario creado con exito!'));
    } else {
      res.json( endPointsFormat.formatEndPointFailed('No se pudo registrar el usuario , ERROR en el QUERY', err));
    }
  });
});



module.exports = router;
