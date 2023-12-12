const mysql = require('mysql');
const express = require('express');
const util = require('util');
const app = express();
const port = 3000;
const path = require('path');

const connection = mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'laboratorio15'
});

const query = util.promisify(connection.query).bind(connection);

connection.connect((error) => {
    if (error) {
        console.error('Error al conectar a MySQL: ', error);
        return;
    }
    console.log('Conexión exitosa a MySQL');
});

app.set('view engine', 'pug');
app.set('views', './views');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

app.get('/', async (req, res) => {
    try {
        const cursos = await query('SELECT * FROM cursos');
        const alumnos = await query(`
            SELECT alumnos.id, alumnos.nombre, alumnos.edad, alumnos.telefono, alumnos.correo, cursos.nombre_curso
            FROM alumnos
            JOIN inscripciones ON alumnos.id = inscripciones.id_alumno
            JOIN cursos ON inscripciones.id_curso = cursos.id
        `);

        res.render('index', { datos: alumnos, cursos });
    } catch (error) {
        console.error('Error al obtener datos: ', error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/agregar/alumno', async (req, res) => {
    try {
        const cursos = await query('SELECT * FROM cursos');
        res.render('agregarAlumno', { cursos });
    } catch (error) {
        console.error('Error al obtener datos: ', error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/agregar/alumno', async (req, res) => {
    const nuevoDato = {
        nombre: req.body.nuevoNombre,
        edad: req.body.nuevaEdad,
        telefono: req.body.nuevoTelefono,
        correo: req.body.nuevoCorreo
    };
    const idCurso = req.body.idCurso;

    try {
        const resultAlumnos = await query('INSERT INTO alumnos SET ?', nuevoDato);
        const idAlumnoInsertado = resultAlumnos.insertId;

        await query('INSERT INTO inscripciones (id_alumno, id_curso) VALUES (?, ?)', [idAlumnoInsertado, idCurso]);

        console.log('Alumno agregado exitosamente');
        res.redirect('/');
    } catch (error) {
        console.error('Error al agregar alumno: ', error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/agregar/curso', (req, res) => {
    res.render('agregarCurso');
});

app.post('/agregar/curso', async (req, res) => {
    const nuevoCurso = {
        nombre_curso: req.body.nuevoNombreCurso,
        descripcion: req.body.nuevaDescripcionCurso
    };

    try {
        await query('INSERT INTO cursos SET ?', nuevoCurso);
        console.log('Curso agregado exitosamente');
        res.redirect('/');
    } catch (error) {
        console.error('Error al agregar curso: ', error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/editar/alumno/:id', async (req, res) => {
    const idAlumno = req.params.id;

    try {
        const [alumno] = await query(`
            SELECT alumnos.id, alumnos.nombre, alumnos.edad, alumnos.telefono, alumnos.correo, cursos.id AS id_curso
            FROM alumnos
            LEFT JOIN inscripciones ON alumnos.id = inscripciones.id_alumno
            LEFT JOIN cursos ON inscripciones.id_curso = cursos.id
            WHERE alumnos.id = ?
        `, [idAlumno]);

        const cursos = await query('SELECT * FROM cursos');

        res.render('editarAlumno', { alumno, cursos });
    } catch (error) {
        console.error('Error al obtener datos: ', error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/editar/alumno/:id', async (req, res) => {
    const idAlumno = req.params.id;
    const datosEditados = {
        nombre: req.body.editarNombre,
        edad: req.body.editarEdad,
        telefono: req.body.editarTelefono,
        correo: req.body.editarCorreo,
        idCurso: req.body.editarIdCurso
    };

    try {
        await query(`
            UPDATE alumnos
            SET nombre = ?, edad = ?, telefono = ?, correo = ?
            WHERE id = ?
        `, [datosEditados.nombre, datosEditados.edad, datosEditados.telefono, datosEditados.correo, idAlumno]);

        await query(`
            UPDATE inscripciones
            SET id_curso = ?
            WHERE id_alumno = ?
        `, [datosEditados.idCurso, idAlumno]);

        console.log('Alumno actualizado exitosamente');
        res.redirect('/');
    } catch (error) {
        console.error('Error al actualizar alumno: ', error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/eliminar/alumno/:id', async (req, res) => {
    const idAlumno = req.params.id;

    try {
        await query('DELETE FROM inscripciones WHERE id_alumno = ?', [idAlumno]);
        await query('DELETE FROM alumnos WHERE id = ?', [idAlumno]);

        console.log('Alumno eliminado exitosamente');
        res.redirect('/');
    } catch (error) {
        console.error('Error al eliminar alumno: ', error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/consultas', (req, res) => {
    res.render('consultas');
});

app.listen(port, () => {
    console.log(`Servidor en ejecución en http://localhost:${port}`);
});
