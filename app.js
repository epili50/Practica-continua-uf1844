// importar módulos de terceros
const { log } = require('console');
const express = require('express');
const morgan = require('morgan');
const { MongoClient, ServerApiVersion } = require('mongodb');
const { getColorFromURL } = require('color-thief-node');


// creamos una instancia del servidor Express
const app = express();

// Tenemos que usar un nuevo middleware para indicar a Express que queremos procesar peticiones de tipo POST
app.use(express.urlencoded({ extended: true }));

// Añadimos el middleware necesario para que el client puedo hacer peticiones GET a los recursos públicos de la carpeta 'public'
app.use(express.static('public'));

//crear un id para las fotos
let id = 1;

//Variable para indicar en que puerte tiene que escuchar nuestra app
const PORT = process.env.PORT || 3000;

//Conexión a BBDD de MongoDB
const uri = "mongodb+srv://epili50:epili50@cluster0.uimmq6n.mongodb.net/";
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
}
);

// variable global para gestionar nuestra base de datos
let database;

// Base de datos de imágenes
const images = [];

// Especificar a Express que quiero usar EJS como motor de plantillas
app.set('view engine', 'ejs');

// Usamos el middleware morgan para loguear las peticiones del cliente
app.use(morgan('tiny'));

// Cuando nos hagan una petición GET a '/' renderizamos la home.ejs
app.get('/', async (req, res) => {
    //query a la BBDD para buscar las imagenes
    // const documents = database.collection('images');

    const query = {};

    const options = {sort: {photo_date: -1}};

    const imagesRaw = await database.collection('images').find(query, options).toArray();

    // Formatear las fechas en los documentos
    const images = imagesRaw.map(image => {
         const date = new Date(image.photo_date);
         image.photo_date = date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
         return image;
    });
 
    // 2. Usar en el home.ejs el forEach para iterar por todas las imágenes de la variable 'images'. Mostrar de momento solo el título 
    res.render('home', {
        images
    });
});

// Cuando nos hagan una petición GET a '/add-image-form' renderizamos 
app.get('/add-image-form', (req, res) => {
    res.render('form', {
        isImagesPosted: undefined,
        isImageRepeat: undefined
    });

});

//metodo para elegir color dominante
async function getColor(url) {
    const [r, g, b] = await getColorFromURL(url);
    console.log(`rgb(${r}, ${g}, ${b})`);
    return `rgb(${r}, ${g}, ${b})`;
};

// Cuando nos hagan una petición POST a '/add-image-form' tenemos que recibir los datos del formulario y actualizar nuestra "base de datos"
app.post('/add-image-form', async (req, res) => {
    // todos los datos vienen en req.body
    // console.log(req.body);

    // 1. Actualizar el array 'images' con la información de req.body
    const { title, url_photo, photo_date} = req.body;
    console.log("🚀 ~ app.post ~ url_photo:", url_photo)

    //control para que no se repitan las url
    const isUrlInArray = await database.collection('images').findOne({url_photo: url_photo}) !== null;
    //const isUrlInArray = images.some(u => u.url_photo == url_photo)

    //función para encontrar el color
    const dominateColor = await getColor(url_photo)


    if (isUrlInArray) {
        res.render('form', {
            isImageRepeat:true,
            isImagesPosted: false
        });
    } else {
        database.collection('images').insertOne({
            title,
            photo_date: new Date(photo_date),
            url_photo,
            dominateColor,
           
        })

        //Ordeno las fotos de más nueva a más vieja
    // images.sort((a , b) => new Date(b.photo_date) - new Date (a.photo_date))



        // 3. Añadir los otros campos del formulario y sus validaciones 
        // res.send('Datos recibidos');
        res.render('form', {
            isImagesPosted: true,
            isImageRepeat: false
        });
    }
    console.log('array a printar: ', images);
});

// en el futuro es normal que tengamos endpoints como
// app.get('/edit-image-form')

// Creamos un nuevo endpoint para gestionar la búsqueda 
app.get('/search', async (req, res) => {
    // Vamos a recibir algo con esta estructura http://localhost:3000/search?keyword=cat

    // 1. Coger el el valor del parámetro keyword de la query string (cat)
    // TODO 

    const searchWord = req.query.keyword;
    const regex = new RegExp(searchWord, 'i')

    // 2. Usar el método filter para filtrar el array de images por el valor de (cat)
    const filteredImages = await database.collection('images').find({title: regex}).toArray();
    // images.filter(w => w.title.toLowerCase().includes(searchWord.toLocaleLowerCase())); // TODO
    console.log("🚀 ~ app.get ~ filteredImages:", filteredImages)

    // Tema mayúsuclas-minúsuclas: dos opciones
    // 1. Pasarlo todo a mínusculas con toLowerCase
    // 2. Usar una expresión regular


    // 3. Usar res.render para renderizar la vista home.ejs y pasarle el array de imágenes filtrado
    res.render('search', {
        images: filteredImages,
        
    })
    console.log('En la vista de filtro images vale: ', images);

});


app.listen(PORT, async (req, res) => {
    console.log("Servidor escuchando correctamente en el puerto ", PORT);

    //Conexión a BBDD mongoDB al conectar el servidor
    try{
        await client.connect();
        //seleccionamos nuestra bbdd
        database = client.db('ironhack')
        // Mensaje de confirmación de que nos hemos conectado a la base de datos
        console.log("Conexión a la base de datos OK.")

    }catch(err){
        console.error(err);
    }
});
