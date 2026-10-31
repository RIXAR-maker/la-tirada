# La Tirada

Web app del club de petanca **La Tirada** (Madrid). Primera versión: mapa de las canchas de petanca públicas del municipio de Madrid, optimizado para iPhone (se puede añadir a la pantalla de inicio desde Safari).

## Qué incluye

- Mapa con todas las canchas de la fuente municipal: parques públicos (bola amarilla) y clubes (bola blanca discontinua). El número de cada bola son las pistas.
- Filtros por tipo y distrito, buscador y orden por distancia a tu ubicación.
- Ficha de cada cancha: pistas, dirección, metro, equipamiento, acceso y enlaces para llegar con Apple Maps o Google Maps.
- Funciona sin conexión una vez abierta (excepto el mapa base).

## Datos

`data/canchas.geojson` sale del conjunto **Instalaciones deportivas básicas** de los datos abiertos del Ayuntamiento de Madrid (`datos.madrid.es`, dataset 200215), filtrando las instalaciones con pistas de petanca. Generado el 31-10-2026.

- 64 instalaciones, 177 pistas. 62 en parques públicos y 2 clubes.
- Iluminación, sombra, bancos, fuente, tipo de suelo y si se juega a menudo aparecen como *Por verificar*: la fuente municipal no los recoge. Se rellenan editando el GeoJSON (`true` / `false` / texto).
- Faltan canchas que no son instalaciones deportivas municipales (pistas sueltas en parques, centros de mayores, etc.).

Para añadir o corregir una cancha, edita `data/canchas.geojson` y conserva los mismos campos.

## Publicar en GitHub Pages

1. Crea una cuenta en github.com y un repositorio nuevo llamado `la-tirada` (público).
2. Sube todos los archivos de esta carpeta (botón **Add file → Upload files**, arrastra la carpeta entera).
3. Ve a **Settings → Pages**, en *Source* elige **Deploy from a branch**, rama `main`, carpeta `/ (root)` y guarda.
4. En un minuto estará en `https://TU-USUARIO.github.io/la-tirada/`.
5. En el iPhone: ábrela en Safari → Compartir → **Añadir a pantalla de inicio**.

## Estructura

```
index.html            página
styles.css            identidad visual y maquetación
app.js                mapa, filtros y fichas
data/canchas.geojson  canchas
assets/               logo e iconos
vendor/               Leaflet 1.9.4
sw.js, manifest       instalación como app
```

Mapa base © colaboradores de OpenStreetMap. Los servidores de teselas de OSM son para uso moderado; si la web crece, cambia a un proveedor con clave gratuita (MapTiler, Stadia) en `app.js`.
