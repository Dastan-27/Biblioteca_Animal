const express = require("express");
const path = require("path");
const conexion = require("./BaseDatos/bd");
const app = express();
const multer = require('multer');
const fs = require('fs');

// --- CONFIGURACIÓN DE MULTER (SUBIDA DE IMÁGENES) ---
const storage = multer.diskStorage({
    destination: path.join(__dirname, 'public/images/animales'),
    filename: (req, file, cb) => {
        // Nombre único: fecha + nombre original
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// --- CONFIGURACIÓN DEL SERVIDOR ---
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use('/styles', express.static('styles'));

// ---------------------------------------------------------
// 1. HOME - LISTA DE ANIMALES
// ---------------------------------------------------------
app.get("/", (req, res) => {
    const sql = `
        SELECT 
            a.ID, a.Nombre, a.NombreCientifico, a.Descripcion,
            c.Subtipo as Clasificacion,
            ta.Tipo as Alimentacion,
            img.URLImagen as Imagen
        FROM Animales a
        JOIN Clasificaciones c ON a.Clasificacion_ID = c.ID
        JOIN TiposAlimentacion ta ON a.Alimentacion_ID = ta.ID
        LEFT JOIN imagenesanimales img ON a.ID = img.Animal_ID AND img.EsPrincipal = 1
        ORDER BY a.Nombre
    `;
    
    conexion.query(sql, (err, resultados) => {
        if (err) {
            console.error('Error al obtener animales:', err);
            return res.status(500).send('Error del servidor');
        }
        res.render("Home", { animales: resultados });
    });
});

// ---------------------------------------------------------
// 3. AGREGAR NUEVO (GET y POST)
// ---------------------------------------------------------

app.get("/animales/nuevo", (req, res) => {
    // Traer todos los selects necesarios
    conexion.query("SELECT * FROM Clasificaciones ORDER BY Tipo, Subtipo", (e1, clasificaciones) => {
        if (e1) throw e1;

        conexion.query("SELECT sh.ID, th.Tipo, sh.Subtipo FROM SubtiposHabitat sh JOIN TiposHabitat th ON sh.TipoHabitat_ID = th.ID ORDER BY th.Tipo, sh.Subtipo", (e2, habitats) => {
            if (e2) throw e2;

            conexion.query("SELECT * FROM Climas ORDER BY Clima", (e3, climas) => {
                if (e3) throw e3;

                conexion.query("SELECT * FROM TiposAlimentacion ORDER BY Tipo", (e4, alimentaciones) => {
                    if (e4) throw e4;

                    conexion.query("SELECT * FROM TiposReproduccion ORDER BY Tipo", (e5, reproducciones) => {
                        if (e5) throw e5;

                        // Renderizamos la vista con los datos para los selects
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
// ---------------------------------------------------------
// PROCESAR NUEVO ANIMAL (POST)
// ---------------------------------------------------------
app.post("/animales/nuevo", upload.single('imagen'), (req, res) => {
    // 1. Extraemos los datos del formulario (req.body)
    const { 
        nombre, 
        nombreCientifico, 
        clasificacion_id, 
        habitat_id, 
        clima_id, 
        alimentacion_id, 
        reproduccion_id, 
        tiempoVidaMin, 
        tiempoVidaMax, 
        descripcion 
    } = req.body;

    // 2. Consulta SQL para insertar en la tabla 'Animales'
    const sqlAnimal = `
        INSERT INTO Animales 
        (Nombre, NombreCientifico, Clasificacion_ID, Habitat_ID, Clima_ID, Alimentacion_ID, Reproduccion_ID, TiempoVidaMin, TiempoVidaMax, Descripcion) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // Valores ordenados según los signos de interrogación (?)
    const valoresAnimal = [
        nombre, 
        nombreCientifico, 
        clasificacion_id, 
        habitat_id, 
        clima_id, 
        alimentacion_id, 
        reproduccion_id, 
        tiempoVidaMin || null, // Si viene vacío, enviamos null
        tiempoVidaMax || null, 
        descripcion
    ];

    // 3. Ejecutamos la consulta
    conexion.query(sqlAnimal, valoresAnimal, (err, result) => {
        if (err) {
            console.error("Error al guardar animal:", err);
            return res.status(500).send("Error al guardar el animal en la base de datos.");
        }

        // El animal ya se guardó. 'result.insertId' es el ID del nuevo animal.
        const nuevoAnimalID = result.insertId;

        // 4. Si se subió una imagen, la guardamos en la tabla 'imagenesanimales'
        if (req.file) {
            const sqlImagen = `
                INSERT INTO imagenesanimales (Animal_ID, URLImagen, EsPrincipal) 
                VALUES (?, ?, 1)
            `;
            
            conexion.query(sqlImagen, [nuevoAnimalID, req.file.filename], (errImg) => {
                if (errImg) {
                    console.error("Error al guardar imagen:", errImg);
                    // No detenemos el flujo, el animal ya se creó, aunque falle la imagen.
                }
                res.redirect("/"); // Volver al inicio
            });
        } else {
            // Si no hubo imagen, simplemente redirigimos
            res.redirect("/");
        }
    });
});

// ---------------------------------------------------------
// 2. DETALLE DE ANIMAL
// ---------------------------------------------------------
app.get("/animales/:id", (req, res) => {
    // Validamos que sea un ID numérico para evitar conflictos con rutas como 'nuevo' o 'editar'
    if (isNaN(req.params.id)) return next();

    const sql = `
        SELECT 
            a.*,
            c.Tipo AS TipoClasificacion, c.Subtipo AS SubtipoClasificacion,
            th.Tipo AS TipoHabitat, sh.Subtipo AS SubtipoHabitat,
            cl.Clima,
            ta.Tipo AS TipoAlimentacion,
            tr.Tipo AS TipoReproduccion,
            img.URLImagen as Imagen
        FROM Animales a
        JOIN Clasificaciones c ON a.Clasificacion_ID = c.ID
        JOIN SubtiposHabitat sh ON a.Habitat_ID = sh.ID
        JOIN TiposHabitat th ON sh.TipoHabitat_ID = th.ID
        JOIN Climas cl ON a.Clima_ID = cl.ID
        JOIN TiposAlimentacion ta ON a.Alimentacion_ID = ta.ID
        JOIN TiposReproduccion tr ON a.Reproduccion_ID = tr.ID
        LEFT JOIN imagenesanimales img ON a.ID = img.Animal_ID AND img.EsPrincipal = 1
        WHERE a.ID = ?
    `;
    
    conexion.query(sql, [req.params.id], (err, resultados) => {
        if (err) return res.status(500).send('Error del servidor');
        if (resultados.length === 0) return res.status(404).send('Animal no encontrado');
        
        res.render("detalle-animal", { animal: resultados[0] });
    });
});



// ---------------------------------------------------------
// 4. EDITAR ANIMAL (GET y POST) - APLICADO LO SOLICITADO
// ---------------------------------------------------------
app.get("/animales/editar/:id", (req, res) => {
    // CORRECCIÓN CLAVE: Agregamos el LEFT JOIN para traer la imagen actual y que el EJS no falle.
    const sqlAnimal = `
        SELECT a.*, img.URLImagen as Imagen 
        FROM Animales a 
        LEFT JOIN imagenesanimales img ON a.ID = img.Animal_ID AND img.EsPrincipal = 1 
        WHERE a.ID = ?
    `;
    
    conexion.query(sqlAnimal, [req.params.id], (err, animalResult) => {
        if (err || animalResult.length === 0) return res.status(404).send('Animal no encontrado');
        
        const animal = animalResult[0];

        // Cargamos todos los dropdowns para que el formulario funcione
        conexion.query("SELECT * FROM Clasificaciones ORDER BY Tipo, Subtipo", (e1, clasificaciones) => {
            conexion.query("SELECT sh.ID, th.Tipo, sh.Subtipo FROM SubtiposHabitat sh JOIN TiposHabitat th ON sh.TipoHabitat_ID = th.ID ORDER BY th.Tipo, sh.Subtipo", (e2, habitats) => {
                conexion.query("SELECT * FROM Climas ORDER BY Clima", (e3, climas) => {
                    conexion.query("SELECT * FROM TiposAlimentacion ORDER BY Tipo", (e4, alimentaciones) => {
                        conexion.query("SELECT * FROM TiposReproduccion ORDER BY Tipo", (e5, reproducciones) => {
                            // Renderizamos la vista 'editarAn'
                            res.render("editarAn", {
                                animal, clasificaciones, habitats, climas, alimentaciones, reproducciones
                            });
                        });
                    });
                });
            });
        });
    });
});

app.post("/animales/editar/:id", upload.single('imagen'), (req, res) => {
    const { nombre, nombreCientifico, clasificacion_id, tiempoVidaMin, tiempoVidaMax, habitat_id, clima_id, alimentacion_id, reproduccion_id, descripcion, imagen_actual } = req.body;
    
    // 1. Actualizar Datos
    const sqlUpdate = `
        UPDATE Animales SET Nombre=?, NombreCientifico=?, Clasificacion_ID=?, TiempoVidaMin=?, TiempoVidaMax=?, Habitat_ID=?, Clima_ID=?, Alimentacion_ID=?, Reproduccion_ID=?, Descripcion=? WHERE ID=?
    `;
    const valores = [nombre, nombreCientifico, clasificacion_id, tiempoVidaMin, tiempoVidaMax, habitat_id, clima_id, alimentacion_id, reproduccion_id, descripcion, req.params.id];

    conexion.query(sqlUpdate, valores, (err) => {
        if (err) return res.status(500).send("Error al actualizar");

        // 2. Manejo de Imagen (Solo si se subió una nueva)
        if (req.file) {
            // Borrar vieja del disco
            if (imagen_actual) {
                const oldPath = path.join(__dirname, 'public/images/animales', imagen_actual);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }
            
            // Actualizar o Insertar en BD
            const sqlCheck = "SELECT * FROM imagenesanimales WHERE Animal_ID = ? AND EsPrincipal = 1";
            conexion.query(sqlCheck, [req.params.id], (err, result) => {
                if (result.length > 0) {
                    conexion.query("UPDATE imagenesanimales SET URLImagen = ? WHERE Animal_ID = ? AND EsPrincipal = 1", [req.file.filename, req.params.id]);
                } else {
                    conexion.query("INSERT INTO imagenesanimales (Animal_ID, URLImagen, EsPrincipal) VALUES (?, ?, 1)", [req.params.id, req.file.filename]);
                }
            });
        }
        res.redirect(`/animales/${req.params.id}`);
    });
});

// ---------------------------------------------------------
// 5. ELIMINAR ANIMAL
// ---------------------------------------------------------
app.post("/animales/eliminar/:id", (req, res) => {
    const sqlImg = "SELECT URLImagen FROM imagenesanimales WHERE Animal_ID = ? AND EsPrincipal = 1";
    
    conexion.query(sqlImg, [req.params.id], (err, resultados) => {
        // Borramos archivo físico
        if (!err && resultados.length > 0 && resultados[0].URLImagen) {
            const ruta = path.join(__dirname, 'public/images/animales', resultados[0].URLImagen);
            if (fs.existsSync(ruta)) fs.unlinkSync(ruta);
        }
        
        // Borramos registro (Cascade debería borrar la imagen de la BD también)
        conexion.query("DELETE FROM Animales WHERE ID = ?", [req.params.id], () => {
            res.redirect("/");
        });
    });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Corriendo en http://localhost:${PORT}`));