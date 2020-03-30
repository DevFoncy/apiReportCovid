require('dotenv').config();
const accountSid = process.env.ACCOUNT_SID;
const authToken = process.env.AUTH_TOKEN;

const express = require('express');
const router = express.Router();
const moment = require('moment');

const client = require('twilio')(accountSid, authToken);
const mysqlConnection = require('../database.js');

// GET An Employee
router.get('/:id', (req, res) => {
    const {id} = req.params;
    mysqlConnection.query('SELECT * FROM employee WHERE id = ?', [id], (err, rows, fields) => {
        if (!err) {
            res.json(rows[0]);
        } else {
            console.log(err);
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
        mysqlConnection.query("INSERT INTO solicitud_registro (token, code, status, celular, date_created) VALUES (?,?,?,?,?)", [token, generateCode, 0, phone, dateNow], (err, rows, fields) => {
            if (!err) {
                res.json({token: token});
            } else {
                res.json({status: 'Error al guardar en la base datos'});
            }
        });
    }, function (reason) { //error
        messageError = reason;
        res.json({status: 'Error al enviar el mensaje, numero no valido'});
    });

});


router.post('/checkNumber', (req, res) => {
    const {phone, code} = req.body;
    let token = [];
    //Get the row
    mysqlConnection.query('SELECT token FROM solicitud_registro where celular = ? and code = ? and status = 0 LIMIT 1 ', [phone, code], (err, rows, fields) => {
        if (!err) {
            token = rows[0] ? rows[0].token : [] ;
            if(token.length > 1){
                mysqlConnection.query("UPDATE solicitud_registro SET status = 1 WHERE token = ?", [token], (err, rows, fields) => {
                    if (!err) {
                        res.json({status: 'Codigo verificado'});
                    } else {
                        res.json({status: 'No pudo verificarse'});
                    }
                });
            }else{
                res.json({status: 'No se ecuentra el codigo'});
            }
        } else {
            res.json({status: 'Error de base de datos'});
        }
    });



});
 module.exports = router;
