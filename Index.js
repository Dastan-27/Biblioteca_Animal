const express = require("express");
const path = require("path");
const conexion = require("./BaseDatos/bd");
const multer = require("multer");

const app = express();

//   CONFIGURACIÓN MULTER
const storage = multer.diskStorage({
    destination: path.join(__dirname, "public/images/animales"),
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});
const upload = multer({ storage });

//   CONFIGURACIÓN EXPRESS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use("/styles", express.static("styles"));

//      HOME - LISTA DE ANIMALES
app.get("/", (req, res) => {
    const sql = `
        SELECT 
            a.ID, a.Nombre, a.NombreCientifico, a.Descripcion,
            c.Subtipo AS Clasificacion,
            ta.Tipo AS Alimentacion,
            img.URLImagen AS Imagen
        FROM Animales a
        JOIN Clasificaciones c ON a.Clasificacion_ID = c.ID
        JOIN TiposAlimentacion ta ON a.Alimentacion_ID = ta.ID
        LEFT JOIN imagenesanimales img ON a.ID = img.Animal_ID AND img.EsPrincipal = 1
        ORDER BY a.Nombre
    `;

    conexion.query(sql, (err, animales) => {
        if (err) return res.status(500).send("Error cargando animales");
        res.render("Home", { animales });
    });
});

//      FORMULARIO NUEVO ANIMAL
app.get("/animales/nuevo", (req, res) => {
    const sqlClasif = "SELECT * FROM Clasificaciones ORDER BY Tipo, Subtipo";
    const sqlHabitat = `
        SELECT sh.ID, th.Tipo, sh.Subtipo 
        FROM SubtiposHabitat sh 
        JOIN TiposHabitat th ON sh.TipoHabitat_ID = th.ID
        ORDER BY th.Tipo, sh.Subtipo
    `;
    const sqlClimas = "SELECT * FROM Climas ORDER BY Clima";
    const sqlAlim = "SELECT * FROM TiposAlimentacion ORDER BY Tipo";
    const sqlRepro = "SELECT * FROM TiposReproduccion ORDER BY Tipo";

    conexion.query(sqlClasif, (err, clasificaciones) => {
        conexion.query(sqlHabitat, (err, habitats) => {
            conexion.query(sqlClimas, (err, climas) => {
                conexion.query(sqlAlim, (err, alimentaciones) => {
                    conexion.query(sqlRepro, (err, reproducciones) => {
                        res.render("AgregarAn", {
                            clasificaciones,
                            habitats,
                            climas,
                            alimentaciones,
                            reproducciones
                        });
                    });
                });
            });
        });
    });
});

//      GUARDAR NUEVO ANIMAL
app.post("/animales/nuevo", upload.single("imagen"), (req, res) => {
    const {
        nombre,
        nombreCientifico,
        clasificacion_id,
        tiempoVidaMin,
        tiempoVidaMax,
        habitat_id,
        clima_id,
        alimentacion_id,
        reproduccion_id,
        descripcion
    } = req.body;

    const sql = `
        INSERT INTO Animales (
            Nombre, NombreCientifico, Clasificacion_ID,
            TiempoVidaMin, TiempoVidaMax, Habitat_ID,
            Clima_ID, Alimentacion_ID, Reproduccion_ID, Descripcion
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const valores = [
        nombre, nombreCientifico, clasificacion_id,
        tiempoVidaMin || null,
        tiempoVidaMax || null,
        habitat_id, clima_id, alimentacion_id, reproduccion_id,
        descripcion
    ];

    conexion.query(sql, valores, (err, resultado) => {
        if (err) return res.status(500).send("Error guardando animal");

        const idAnimal = resultado.insertId;

        // si no envía imagen → listo
        if (!req.file) return res.redirect(`/animales/${idAnimal}`);

        const sqlImg = `
            INSERT INTO imagenesanimales (Animal_ID, URLImagen, EsPrincipal)
            VALUES (?, ?, 1)
        `;

        conexion.query(sqlImg, [idAnimal, req.file.filename], (err2) => {
            res.redirect(`/animales/${idAnimal}`);
        });
    });
});

//      DETALLES DEL ANIMAL
app.get("/animales/:id", (req, res) => {
    const sql = `
        SELECT 
            a.*, 
            c.Subtipo AS SubtipoClasificacion,
            ta.Tipo AS TipoAlimentacion,
            img.URLImagen AS Imagen
        FROM Animales a
        JOIN Clasificaciones c ON a.Clasificacion_ID = c.ID
        JOIN TiposAlimentacion ta ON a.Alimentacion_ID = ta.ID
        LEFT JOIN imagenesanimales img ON a.ID = img.Animal_ID AND img.EsPrincipal = 1
        WHERE a.ID = ?
    `;

    conexion.query(sql, [req.params.id], (err, resultados) => {
        if (resultados.length === 0) return res.status(404).send("No encontrado");
        res.render("detalle-animal", { animal: resultados[0] });
    });
});


//      FORMULARIO EDITAR ANIMAL
app.get("/animales/editar/:id", (req, res) => {
    const sqlAnimal = "SELECT * FROM Animales WHERE ID = ?";

    conexion.query(sqlAnimal, [req.params.id], (err, result) => {
        if (result.length === 0) return res.status(404).send("Animal no encontrado");

        const animal = result[0];

        const sqlClasif = "SELECT * FROM Clasificaciones ORDER BY Tipo, Subtipo";
        const sqlHabitat = `
            SELECT sh.ID, th.Tipo, sh.Subtipo 
            FROM SubtiposHabitat sh 
            JOIN TiposHabitat th ON sh.TipoHabitat_ID = th.ID
            ORDER BY th.Tipo, sh.Subtipo
        `;
        const sqlClimas = "SELECT * FROM Climas ORDER BY Clima";
        const sqlAlim = "SELECT * FROM TiposAlimentacion ORDER BY Tipo";
        const sqlRepro = "SELECT * FROM TiposReproduccion ORDER BY Tipo";

        conexion.query(sqlClasif, (e1, clasificaciones) => {
            conexion.query(sqlHabitat, (e2, habitats) => {
                conexion.query(sqlClimas, (e3, climas) => {
                    conexion.query(sqlAlim, (e4, alimentaciones) => {
                        conexion.query(sqlRepro, (e5, reproducciones) => {
                            res.render("editarAn", {
                                animal,
                                clasificaciones,
                                habitats,
                                climas,
                                alimentaciones,
                                reproducciones
                            });
                        });
                    });
                });
            });
        });
    });
});

app.post("/animales/editar/:id", upload.single("imagen"), (req, res) => {

    const {
        nombre,
        nombreCientifico,
        clasificacion_ID,
        tiempoVidaMin,
        tiempoVidaMax,
        habitat_id,
        clima_id,
        alimentacion_ID,
        reproduccion_id,
        descripcion
    } = req.body;

    const sql = `
        UPDATE Animales SET 
            Nombre=?, NombreCientifico=?, Clasificacion_ID=?,
            TiempoVidaMin=?, TiempoVidaMax=?, Habitat_ID=?,
            Clima_ID=?, Alimentacion_ID=?, Reproduccion_ID=?, Descripcion=?
        WHERE ID=?
    `;

    const valores = [
        nombre,
        nombreCientifico,
        clasificacion_ID,
        tiempoVidaMin || null,
        tiempoVidaMax || null,
        habitat_id,
        clima_id,
        alimentacion_ID,
        reproduccion_id,
        descripcion,
        req.params.id
    ];

    // Ejecutar UPDATE
    conexion.query(sql, valores, (err) => {

        if (!req.file) {
            return res.redirect(`/animales/${req.params.id}`);
        }

        const sqlImg = `
            INSERT INTO imagenesanimales (Animal_ID, URLImagen, EsPrincipal)
            VALUES (?, ?, 1)
        `;

        conexion.query(sqlImg, [req.params.id, req.file.filename], () => {
            res.redirect(`/animales/${req.params.id}`);
        });
    });

});

// CONFIRMAR ELIMINACIÓN
app.get("/animales/eliminar/:id", (req, res) => {
    const id = req.params.id;

    const sql = "SELECT * FROM Animales WHERE ID = ?";
    conexion.query(sql, [id], (err, resultado) => {
        if (resultado.length === 0) return res.status(404).send("Animal no encontrado");

        res.render("eliminarAn", { animal: resultado[0] });
    });
});

// ELIMINAR DEFINITIVAMENTE
app.post("/animales/eliminar/:id", (req, res) => {
    const id = req.params.id;

    // Primero borrar imágenes
    const sqlImg = "DELETE FROM imagenesanimales WHERE Animal_ID = ?";
    conexion.query(sqlImg, [id], () => {

        // Luego borrar el animal
        const sqlAnimal = "DELETE FROM Animales WHERE ID = ?";

        conexion.query(sqlAnimal, [id], (err) => {
            if (err) return res.status(500).send("Error eliminando animal");
            res.redirect("/");
        });

    });
});

//      INICIAR SERVIDOR
app.listen(3000, () => {
    console.log("Servidor corriendo en http://localhost:3000");
});
