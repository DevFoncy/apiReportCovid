const express = require('express');
const router = express.Router();

const mysqlConnection  = require('../database.js');

// GET all Employees
// router.get('/', (req, res) => {
//   mysqlConnection.query('SELECT * FROM employee', (err, rows, fields) => {
//     if(!err) {
//       res.json(rows);
//     } else {
//       console.log(err);
//     }
//   });
// });
//
// // GET An Employee
// router.get('/:id', (req, res) => {
//   const { id } = req.params;
//   mysqlConnection.query('SELECT * FROM employee WHERE id = ?', [id], (err, rows, fields) => {
//     if (!err) {
//       res.json(rows[0]);
//     } else {
//       console.log(err);
//     }
//   });
// });
//
// // DELETE An Employee
// router.delete('/:id', (req, res) => {
//   const { id } = req.params;
//   mysqlConnection.query('DELETE FROM employee WHERE id = ?', [id], (err, rows, fields) => {
//     if(!err) {
//       res.json({status: 'Employee Deleted'});
//     } else {
//       console.log(err);
//     }
//   });
// });
//
// INSERT An Employee
router.post('/location/save', (req, res) => {
  const {id, name, salary} = req.body;
  let location = {
    name : "Mercado Lobaton",
    department : "Lima",
    province : "Lima",
    district : "Lince",
    points : [
      {lat : -12.086220, lng : -77.033055},
      {lat : -12.086111, lng : -77.032261},
      {lat : -12.086640, lng : -77.032173},
      {lat : -12.086765, lng : -77.032984}
    ]
  };

  const query = `
    SET @departamento = ?;
    SET @provincia = ?;
    SET @distrito = ?;
    SET @distrito = ?;
    CALL employeeAddOrEdit(@id, @name, @salary);
  `;
  mysqlConnection.query(query, [id, name, salary], (err, rows, fields) => {
    if(!err) {
      res.json({status: 'Employeed Saved'});
    } else {
      console.log(err);
    }
  });

});
//
// // INSERT An Employee
// router.post('/', (req, res) => {
//   const {id, name, salary} = req.body;
//   console.log(id, name, salary);
//   const query = `
//     SET @id = ?;
//     SET @name = ?;
//     SET @salary = ?;
//     CALL employeeAddOrEdit(@id, @name, @salary);
//   `;
//   mysqlConnection.query(query, [id, name, salary], (err, rows, fields) => {
//     if(!err) {
//       res.json({status: 'Employeed Saved'});
//     } else {
//       console.log(err);
//     }
//   });
//
// });
//
// router.put('/:id', (req, res) => {
//   const { name, salary } = req.body;
//   const { id } = req.params;
//   const query = `
//     SET @id = ?;
//     SET @name = ?;
//     SET @salary = ?;
//     CALL employeeAddOrEdit(@id, @name, @salary);
//   `;
//   mysqlConnection.query(query, [id, name, salary], (err, rows, fields) => {
//     if(!err) {
//       res.json({status: 'Employee Updated'});
//     } else {
//       console.log(err);
//     }
//   });
// });

module.exports = router;
