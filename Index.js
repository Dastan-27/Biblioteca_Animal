const express = require ("express");
const path = require ("path");
const conexion = require ("./BaseDatos/bd");
const app = express ();
const multer = require('multer');

const storage = multer.diskStorage({
    destination: path.join(__dirname, 'public/images/animales'),
    filename: (req, file, cb) => {
        // Guardamos con nombre único: fecha + nombre original
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname,"public")));
app.use('/styles', express.static('styles'));

// Página principal - Lista de animales
app.get("/", (req, res) => {
    const sql = `
        SELECT 
            a.ID, a.Nombre, a.NombreCientifico, a.Descripcion,
            c.Subtipo as Clasificacion,
            ta.Tipo as Alimentacion
        FROM Animales a
        JOIN Clasificaciones c ON a.Clasificacion_ID = c.ID
        JOIN TiposAlimentacion ta ON a.Alimentacion_ID = ta.ID
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

// Formulario para crear nuevo animal
app.get("/animales/nuevo", (req, res) => {
    const sqlClasificaciones = "SELECT * FROM Clasificaciones ORDER BY Tipo, Subtipo";
    const sqlHabitat = "SELECT sh.ID, th.Tipo, sh.Subtipo FROM SubtiposHabitat sh JOIN TiposHabitat th ON sh.TipoHabitat_ID = th.ID ORDER BY th.Tipo, sh.Subtipo";
    const sqlClimas = "SELECT * FROM Climas ORDER BY Clima";
    const sqlAlimentacion = "SELECT * FROM TiposAlimentacion ORDER BY Tipo";
    const sqlReproduccion = "SELECT * FROM TiposReproduccion ORDER BY Tipo";
    
    conexion.query(sqlClasificaciones, (err, clasificaciones) => {
        if (err) {
            console.error('Error al obtener clasificaciones:', err);
            return res.status(500).send('Error del servidor');
        }
        
        conexion.query(sqlHabitat, (err, habitats) => {
            conexion.query(sqlClimas, (err, climas) => {
                conexion.query(sqlAlimentacion, (err, alimentaciones) => {
                    conexion.query(sqlReproduccion, (err, reproducciones) => {
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

// Detalles de un animal específico
app.get("/animales/:id", (req, res) => {
    const sql = `
        SELECT 
            a.*,
            c.Tipo AS TipoClasificacion,
            c.Subtipo AS SubtipoClasificacion,
            th.Tipo AS TipoHabitat,
            sh.Subtipo AS SubtipoHabitat,
            cl.Clima,
            ta.Tipo AS TipoAlimentacion,
            tr.Tipo AS TipoReproduccion
        FROM Animales a
        JOIN Clasificaciones c ON a.Clasificacion_ID = c.ID
        JOIN SubtiposHabitat sh ON a.Habitat_ID = sh.ID
        JOIN TiposHabitat th ON sh.TipoHabitat_ID = th.ID
        JOIN Climas cl ON a.Clima_ID = cl.ID
        JOIN TiposAlimentacion ta ON a.Alimentacion_ID = ta.ID
        JOIN TiposReproduccion tr ON a.Reproduccion_ID = tr.ID
        WHERE a.ID = ?
    `;
    
    conexion.query(sql, [req.params.id], (err, resultados) => {
        if (err) {
            console.error('Error al obtener animal:', err);
            return res.status(500).send('Error del servidor');
        }
        
        if (resultados.length === 0) {
            return res.status(404).send('Animal no encontrado');
        }
        
        res.render("detalle-animal", { animal: resultados[0] });
    });
});

// Lista de animales por clasificación
app.get("/animales/clasificacion/:clasificacionId", (req, res) => {
    const sql = `
        SELECT 
            a.ID, a.Nombre, a.NombreCientifico, a.Descripcion,
            c.Subtipo as Clasificacion,
            ta.Tipo as Alimentacion
        FROM Animales a
        JOIN Clasificaciones c ON a.Clasificacion_ID = c.ID
        JOIN TiposAlimentacion ta ON a.Alimentacion_ID = ta.ID
        WHERE a.Clasificacion_ID = ?
        ORDER BY a.Nombre
    `;
    
    conexion.query(sql, [req.params.clasificacionId], (err, resultados) => {
        if (err) {
            console.error('Error al obtener animales por clasificación:', err);
            return res.status(500).send('Error del servidor');
        }
        
        // Obtener nombre de la clasificación para el título
        const sqlClasificacion = "SELECT Subtipo FROM Clasificaciones WHERE ID = ?";
        conexion.query(sqlClasificacion, [req.params.clasificacionId], (err, clasificacion) => {
            res.render("animales-por-clasificacion", {
                animales: resultados,
                clasificacion: clasificacion[0]?.Subtipo || 'Desconocida'
            });
        });
    });
});

// Búsqueda de animales
app.get("/buscar", (req, res) => {
    const termino = req.query.termino;
    
    if (!termino) {
        return res.redirect("/");
    }
    
    const sql = `
        SELECT 
            a.ID, a.Nombre, a.NombreCientifico, a.Descripcion,
            c.Subtipo as Clasificacion,
            ta.Tipo as Alimentacion
        FROM Animales a
        JOIN Clasificaciones c ON a.Clasificacion_ID = c.ID
        JOIN TiposAlimentacion ta ON a.Alimentacion_ID = ta.ID
        WHERE a.Nombre LIKE ? OR a.NombreCientifico LIKE ? OR a.Descripcion LIKE ?
        ORDER BY a.Nombre
    `;
    
    const parametroBusqueda = `%${termino}%`;
    
    conexion.query(sql, [parametroBusqueda, parametroBusqueda, parametroBusqueda], (err, resultados) => {
        if (err) {
            console.error('Error en búsqueda:', err);
            return res.status(500).send('Error del servidor');
        }
        
        res.render("busqueda", {
            animales: resultados,
            termino: termino,
            total: resultados.length
        });
    });
});

// Estadísticas de la biblioteca
app.get("/estadisticas", (req, res) => {
    const sqlEstadisticas = `
        SELECT 
            c.Subtipo as Clasificacion,
            COUNT(*) as Total,
            GROUP_CONCAT(a.Nombre SEPARATOR ', ') as Animales
        FROM Animales a
        JOIN Clasificaciones c ON a.Clasificacion_ID = c.ID
        GROUP BY c.Subtipo
        ORDER BY Total DESC
    `;
    
    const sqlTotalAnimales = "SELECT COUNT(*) as total FROM Animales";
    
    conexion.query(sqlEstadisticas, (err, estadisticas) => {
        if (err) {
            console.error('Error al obtener estadísticas:', err);
            return res.status(500).send('Error del servidor');
        }
        
        conexion.query(sqlTotalAnimales, (err, total) => {
            res.render("estadisticas", {
                estadisticas: estadisticas,
                totalAnimales: total[0].total
            });
        });
    });
});

// Formulario para editar un animal existente
app.get("/animales/editar/:id", (req, res) => {
    const sqlAnimal = `
        SELECT * FROM Animales WHERE ID = ?
    `;
    
    const sqlClasificaciones = "SELECT * FROM Clasificaciones ORDER BY Tipo, Subtipo";
    const sqlHabitat = "SELECT sh.ID, th.Tipo, sh.Subtipo FROM SubtiposHabitat sh JOIN TiposHabitat th ON sh.TipoHabitat_ID = th.ID ORDER BY th.Tipo, sh.Subtipo";
    const sqlClimas = "SELECT * FROM Climas ORDER BY Clima";
    const sqlAlimentacion = "SELECT * FROM TiposAlimentacion ORDER BY Tipo";
    const sqlReproduccion = "SELECT * FROM TiposReproduccion ORDER BY Tipo";
    
    // Obtener datos del animal
    conexion.query(sqlAnimal, [req.params.id], (err, animalResult) => {
        if (err) {
            console.error('Error al obtener animal:', err);
            return res.status(500).send('Error del servidor');
        }
        
        if (animalResult.length === 0) {
            return res.status(404).send('Animal no encontrado');
        }
        
        const animal = animalResult[0];
        
        // Obtener todas las opciones para los dropdowns
        conexion.query(sqlClasificaciones, (err, clasificaciones) => {
            if (err) {
                console.error('Error al obtener clasificaciones:', err);
                return res.status(500).send('Error del servidor');
            }
            
            conexion.query(sqlHabitat, (err, habitats) => {
                conexion.query(sqlClimas, (err, climas) => {
                    conexion.query(sqlAlimentacion, (err, alimentaciones) => {
                        conexion.query(sqlReproduccion, (err, reproducciones) => {
                            res.render("editarAn", {
                                animal: animal,
                                clasificaciones: clasificaciones,
                                habitats: habitats,
                                climas: climas,
                                alimentaciones: alimentaciones,
                                reproducciones: reproducciones
                            });
                        });
                    });
                });
            });
        });
    });
});

// Procesar la actualización del animal (POST)
app.post("/animales/editar/:id", (req, res) => {
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
        UPDATE Animales SET 
            Nombre = ?,
            NombreCientifico = ?,
            Clasificacion_ID = ?,
            TiempoVidaMin = ?,
            TiempoVidaMax = ?,
            Habitat_ID = ?,
            Clima_ID = ?,
            Alimentacion_ID = ?,
            Reproduccion_ID = ?,
            Descripcion = ?
        WHERE ID = ?
    `;
    
    const valores = [
        nombre,
        nombreCientifico,
        clasificacion_id,
        tiempoVidaMin,
        tiempoVidaMax,
        habitat_id,
        clima_id,
        alimentacion_id,
        reproduccion_id,
        descripcion,
        req.params.id
    ];
    
    conexion.query(sql, valores, (err, resultado) => {
        if (err) {
            console.error('Error al actualizar animal:', err);
            return res.status(500).send('Error del servidor');
        }
        
        if (resultado.affectedRows === 0) {
            return res.status(404).send('Animal no encontrado');
        }
        
        res.redirect(`/animales/${req.params.id}`);
    });
});

// Confirmación para eliminar un animal
app.post("/animales/eliminar/:id", (req, res) => {
    // Primero obtener la ruta de la imagen para eliminarla
    const sqlSelect = "SELECT ImagenURL FROM Animales WHERE ID = ?";
    
    conexion.query(sqlSelect, [req.params.id], (err, resultados) => {
        if (err) {
            console.error('Error al obtener animal:', err);
            return res.status(500).send('Error del servidor');
        }
        
        if (resultados.length === 0) {
            return res.status(404).send('Animal no encontrado');
        }
        
        // Eliminar la imagen si existe
        const imagenURL = resultados[0].ImagenURL;
        if (imagenURL) {
            const imagePath = path.join(__dirname, 'public', imagenURL);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }
        
        // Ahora eliminar el animal de la base de datos
        const sqlDelete = "DELETE FROM Animales WHERE ID = ?";
        conexion.query(sqlDelete, [req.params.id], (err, resultado) => {
            if (err) {
                console.error('Error al eliminar animal:', err);
                return res.status(500).send('Error del servidor');
            }
            
            res.redirect("/");
        });
    });
});

// Procesar la eliminación del animal (POST)
app.post("/animales/editar/:id", upload.single('imagen'), (req, res) => {
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
        descripcion,
        imagen_actual
    } = req.body;
    
    let imagenURL = imagen_actual; // Mantener la imagen actual por defecto
    
    // Si se subió una nueva imagen, actualizar la ruta
    if (req.file) {
        imagenURL = '/images/animales/' + req.file.filename;
        
        // Opcional: eliminar la imagen anterior si existe
        if (imagen_actual && imagen_actual !== '') {
            const oldImagePath = path.join(__dirname, 'public', imagen_actual);
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
            }
        }
    }
    
    const sql = `
        UPDATE Animales SET 
            Nombre = ?,
            NombreCientifico = ?,
            Clasificacion_ID = ?,
            TiempoVidaMin = ?,
            TiempoVidaMax = ?,
            Habitat_ID = ?,
            Clima_ID = ?,
            Alimentacion_ID = ?,
            Reproduccion_ID = ?,
            Descripcion = ?,
            ImagenURL = ?
        WHERE ID = ?
    `;
    
    const valores = [
        nombre,
        nombreCientifico,
        clasificacion_id,
        tiempoVidaMin,
        tiempoVidaMax,
        habitat_id,
        clima_id,
        alimentacion_id,
        reproduccion_id,
        descripcion,
        imagenURL,
        req.params.id
    ];
    
    conexion.query(sql, valores, (err, resultado) => {
        if (err) {
            console.error('Error al actualizar animal:', err);
            return res.status(500).send('Error del servidor');
        }
        
        res.redirect(`/animales/${req.params.id}`);
    });
});

// También necesitarás el POST para crear nuevos animales
app.post("/animales/nuevo", upload.single('imagen'),(req, res) => {
    const nombreImagen = req.file? req.file.filename: null;
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
    
    const imagenURL = req.file ? '/images/animales/' + req.file.filename : null;
    
    const sql = `
        INSERT INTO Animales (
            Nombre, NombreCientifico, Clasificacion_ID, 
            TiempoVidaMin, TiempoVidaMax, Habitat_ID, 
            Clima_ID, Alimentacion_ID, Reproduccion_ID, Descripcion, 
            Imagen  
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
const valores = [
        nombre,
        nombreCientifico,
        clasificacion_id,
        tiempoVidaMin || null,
        tiempoVidaMax || null,
        habitat_id,
        clima_id,
        alimentacion_id,
        reproduccion_id,
        descripcion,
        nombreImagen // Guardamos el nombre del archivo en la BD
    ];
    
    conexion.query(sql, valores, (err, resultado) => {
        if (err) {
            console.error('Error al crear animal:', err);
            return res.status(500).send('Error del servidor');
        }
        
        res.redirect(`/animales/${resultado.insertId}`);
    });
});

const PORT= 3000;
app.listen(PORT, () => console.log(`Corriendo en http://localhost:${PORT}`));