# Plataforma de búsqueda de documentos

Este repositorio contiene una interfaz web sencilla que permite buscar un producto por **SKU** o por parte del **nombre**. Al realizar la búsqueda, se abrirá en una nueva pestaña el documento PDF asociado al artículo.

## Archivos principales

- `index.html` – Página estática con el formulario de búsqueda y un pequeño script JavaScript.
- `SRC/index.html` – mismo archivo, ya que el proyecto está bajo la carpeta `SRC`.

## Cómo funciona

1. Edita la variable `products` dentro de `index.html` y añade un objeto para cada producto con las propiedades:
   - `sku`: código del producto
   - `name`: nombre descriptivo (idealmente, **el nombre real del PDF** tal como aparece en Drive u otro almacenamiento)
   - `pdf`: URL del PDF alojado en línea
   
   Alternativamente puedes crear un archivo `data.json` en la misma carpeta con un array de objetos (ver ejemplo
   incluido) y el script cargará la lista automáticamente al abrir la página. Al utilizar enlaces de Google Drive recuerda
   escribir el título exacto del archivo dentro de la propiedad `name` para que el buscador muestre ese nombre en las sugerencias.

2. Asegúrate de que los archivos PDF estén accesibles desde una URL pública. Puedes usar GitHub Pages, Google Drive (con permisos públicos), un servidor HTTP, etc.

3. Abre `index.html` en el navegador (doble clic o mediante un servidor estático) y escribe en la barra de búsqueda el SKU o parte del nombre.
   - Si se encuentra coincidencia exacta de SKU o una cadena contenida en el nombre, el PDF se abrirá automáticamente.
   - Si no hay resultado, aparecerá un mensaje indicando que no se encontró ninguna coincidencia.

   Para alojar los PDFs puedes: usar URLs externas (Google Drive, Dropbox, servidor web) o almacenar los archivos
   directamente en el repositorio y enlazarlos usando la URL cruda de GitHub (por ejemplo `https://raw.githubusercontent.com/usuario/repo/rama/archivo.pdf`).

## Despliegue rápido

- Para uso local bastará con abrir el archivo `index.html`. Si tu navegador bloquea `fetch` desde el sistema de archivos, ejecuta un servidor estático simple:

  ```bash
  cd SRC
  python3 -m http.server 8000
  # luego visita http://localhost:8000/index.html
  ```

- Para compartirlo en Internet puedes subir el repositorio a GitHub y activar GitHub Pages en la rama `main` (o `gh-pages`).

## Recomendaciones

- Si la lista de productos crece, considera mover los datos a un archivo `data.json` y cargarlo mediante `fetch`.
- Para una solución profesional puedes desarrollar una pequeña API con Node.js, Python u otro lenguaje que devuelva el enlace del PDF según la consulta.

---
CA
_Creado el 2 de marzo de 2026._ 