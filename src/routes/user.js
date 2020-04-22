require('dotenv').config();

const express = require('express');
const router = express.Router();
const moment = require('moment');
const mysqlConnection = require('../database.js');
let endPointsFormat = require('../utils/format.js');


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




module.exports = router;
