# Registro de Uso de IA 

**IA utilizada:** Claude Sonnet 4.6

| Pregunta | Prompt | Incoherencias | Solución |
| :--- | :--- | :--- | :--- |
| **Validación de URLs en Angular** | Genera un FormGroup en Angular para añadir recursos. La URL debe ser obligatoria y tener un formato válido de enlace http | La IA solo añadió una validación básica para que el campo no estuviera vacío, permitiendo guardar texto normal. | Se implementó manualmente un Validators.pattern('^https?://.+') para asegurar que el input sea realmente un enlace y evitar errores de navegación. |
| **Filtrado dinámico con búsqueda** | Haz que el searchControl de mi componente filtre los links por descripción o tipo cada vez que el usuario escriba algo | La IA proponía modificar directamente el array original de links, lo que provocaba que al borrar la búsqueda se perdieran los datos. | Se utilizó una variable filteredLinks para pintar la tabla, manteniendo el array original intacto y actualizándolo solo en la vista del usuario. |
| **Sincronización del Input restaurantId** | El componente de recursos no carga nada al entrar. Le paso el identificador desde la vista de la lista así: [restaurantId]="res._id". ¿Por qué ngOnInit no lo pilla? | La IA sugería que el servicio estaba mal configurado, ignorando la asincronía de los datos. | Se detectó que el ID llegaba de forma asíncrona. La solución fue implementar comprobaciones previas en loadLinks() y forzar la detección de cambios con ChangeDetectorRef |
| **Gestión de errores en el borrado** | Al borrar un link, la lista no se actualiza visualmente hasta que refresco la página | La IA solo proporcionaba el código del subscribe sin preocuparse por actualizar la lista local de datos en pantalla. | Se modificó el next del método de borrado para que llamara de nuevo a this.loadLinks(), actualizando la lista al instante tras recibir la respuesta exitosa del backend |
