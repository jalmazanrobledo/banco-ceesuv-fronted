const express = require("express");

const router = express.Router();

const alumnos = [
  {
    id: 1,
    nombre: "Pedro Emilio Fragoso Larraguivel",
    grado: "5° Primaria",
    coins: 2500
  },
  {
    id: 2,
    nombre: "Ximena Hernández Medellín",
    grado: "4° Primaria",
    coins: 1800
  },
  {
    id: 3,
    nombre: "José Javier Coronado Rodríguez",
    grado: "6° Primaria",
    coins: 3200
  }
];

router.get("/", (req, res) => {
  res.json(alumnos);
});

module.exports = router;