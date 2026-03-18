# EASY-EAT API

## Descripció

L'API REST d'EASY-EAT és una aplicació backend desenvolupada amb Node.js, TypeScript i MongoDB per gestionar restaurants, clients, ressenyes, recompenses i visites. Aquesta API proporciona una plataforma completa per a aplicacions de gestió de restaurants i sistemes de fidelització de clients.

## Característiques

- **Gestió de Restaurants**: Crear, llegir, actualitzar i eliminar restaurants amb informació detallada (horaris, categories, valoracions, etc.)
- **Sistema de Clients**: Gestió completa de perfils de clients
- **Ressenyes i Valoracions**: Permet als clients deixar ressenyes als restaurants
- **Sistema de Recompenses**: Gestió de recompenses i punts de fidelització
- **Seguiment de Visites**: Registre de visites dels clients als restaurants
- **Documentació API**: Documentació interactiva amb Swagger UI
- **Validació de Dades**: Validació robusta amb Joi
- **Autenticació Segura**: Hashing de contrasenyes amb bcrypt
- **Dades de Prova**: Sistema de seeding per poblar la base de dades amb dades d'exemple

## Tecnologies Utilitzades

- **Node.js** - Entorn d'execució JavaScript
- **TypeScript** - Superset de JavaScript amb tipat estàtic
- **Express.js** - Framework web per Node.js
- **MongoDB** - Base de dades NoSQL
- **Mongoose** - ODM per MongoDB
- **Swagger/OpenAPI** - Documentació d'API
- **Joi** - Validació d'esquemes
- **bcrypt** - Hashing de contrasenyes
- **CORS** - Suport per Cross-Origin Resource Sharing

## Requisits previs

- Node.js (versió 14 o superior)
- MongoDB (local o en la núvol)
- npm o yarn

## Instal·lació

1. Clona el repositori:
```bash
git clone <url-del-repositori>
cd EA-easyeat-backend2
```

2. Instal·la les dependències:
```bash
npm install
```

3. Configura les variables d'entorn:
Crea un fitxer `.env` a l'arrel del projecte amb les següents variables:
```env
MONGO_URI=mongodb://localhost:27017/easyeat
SERVER_PORT=1337
```

4. Compila el projecte:
```bash
npm run build
```

## Ús

### Iniciar el servidor

```bash
npm start
```

El servidor s'iniciarà al port especificat (per defecte 1337) i es connectarà automàticament a MongoDB. També poblarà la base de dades amb dades d'exemple.

### Endpoints principals

- **Restaurants**: `/restaurants`
- **Ressenyes**: `/reviews`
- **Clients**: `/customer`
- **Recompenses**: `/rewards`
- **Visites**: `/visits`

### Documentació API

Accedeix a la documentació interactiva de l'API a:
```
http://localhost:1337/api
```

### Health Check

Pots verificar que el servidor estigui funcionant correctament amb:
```
GET http://localhost:1337/ping
```

## Estructura del Projecte

```
EA-easyeat-backend2/
├── src/
│   ├── config/          # Configuració de l'aplicació
│   ├── controllers/     # Controladors de l'API
│   ├── models/          # Models de Mongoose
│   ├── routes/          # Definició de rutes
│   ├── services/        # Lògica de negoci
│   ├── middleware/      # Middleware personalitzat
│   ├── utils/           # Utilitats (seeding, recomanacions, etc.)
│   ├── data/            # Dades JSON per seeding
│   ├── library/         # Utilitats compartides (logging)
│   ├── server.ts        # Punt d'entrada de l'aplicació
│   └── swagger.ts       # Configuració de Swagger
├── build/               # Fitxers compilats (generats automàticament)
├── package.json
├── tsconfig.json
└── README.md
```

## Scripts disponibles

- `npm run build` - Compila el projecte TypeScript
- `npm start` - Inicia el servidor en mode producció
- `npm run postinstall` - S'executa automàticament després de `npm install`

## Desenvolupament

Per desenvolupar amb recàrrega automàtica, pots utilitzar eines com `nodemon` o `ts-node-dev`. Assegura't de tenir MongoDB en funcionament localment o configura la URI de connexió adequada.

## Contribució

1. Fork el projecte
2. Crea una branca per la teva funcionalitat (`git checkout -b feature/nova-funcionalitat`)
3. Commit els teus canvis (`git commit -m 'Afegeix nova funcionalitat'`)
4. Push a la branca (`git push origin feature/nova-funcionalitat`)
5. Obre un Pull Request

## Llicència

Aquest projecte està sota la llicència MIT.

## Autor

Desenvolupat com a part del projecte d'Enginyeria d'Aplicacions.</content>
<parameter name="filePath">
