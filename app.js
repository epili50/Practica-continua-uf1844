// importar módulos de terceros
const { log } = require('console');
const express = require('express');
const morgan = require('morgan');


// creamos una instancia del servidor Express
const app = express();

// Tenemos que usar un nuevo middleware para indicar a Express que queremos procesar peticiones de tipo POST
app.use(express.urlencoded({ extended: true }));

// Añadimos el middleware necesario para que el client puedo hacer peticiones GET a los recursos públicos de la carpeta 'public'
app.use(express.static('public'));

// Base de datos de imágenes
const images = [];

// Especificar a Express que quiero usar EJS como motor de plantillas
app.set('view engine', 'ejs');

// Usamos el middleware morgan para loguear las peticiones del cliente
app.use(morgan('tiny'));

// Cuando nos hagan una petición GET a '/' renderizamos la home.ejs
app.get('/', (req, res) => {

    // 2. Usar en el home.ejs el forEach para iterar por todas las imágenes de la variable 'images'. Mostrar de momento solo el título 
    res.render('home', {
        images
    });
});

// Cuando nos hagan una petición GET a '/add-image-form' renderizamos 
app.get('/add-image-form', (req, res) => {
    res.render('form', {
        isImagesPosted: undefined
    });
    
});

// Cuando nos hagan una petición POST a '/add-image-form' tenemos que recibir los datos del formulario y actualizar nuestra "base de datos"
app.post('/add-image-form', (req, res) => {
    // todos los datos vienen en req.body
    // console.log(req.body);

    // 1. Actualizar el array 'images' con la información de req.body
    const { title, url_photo, date_photo } = req.body;
    const isUrlInArray = images.some(u => u.url_photo == url_photo)
    console.log('variable is in...', isUrlInArray);
    if(isUrlInArray){
        console.log('ya esta repetido');
    }else{
        images.push(req.body)
    
        
    // 3. Añadir los otros campos del formulario y sus validaciones 
    // res.send('Datos recibidos');
    res.render('form', {
        isImagesPosted: true
    });
    }
    console.log(images);
});

// en el futuro es normal que tengamos endpoints como
// app.get('/edit-image-form')

app.listen(3000, (req, res) => {
    console.log("Servidor escuchando correctamente en el puerto 3000.")
});
