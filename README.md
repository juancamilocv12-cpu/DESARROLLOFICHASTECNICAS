# 📋 Buscador de Fichas Técnicas

Plataforma moderna y profesional para buscar y descargar fichas técnicas de productos en PDF. Sistema completamente automatizado con sincronización desde Google Drive cada 30 minutos.

**Live Demo:** `http://localhost:8000` (desarrollo) | Producción: Tu servidor web

---

## 🔐 Acceso Rápido

### URL de desarrollo local

- Principal: `http://localhost:8000/`
- Si el puerto 8000 está ocupado: `http://localhost:8001/`

### Usuarios de la plataforma

- **Ventas (viewer)**
        - Usuario: `ventas`
        - Contraseña: `ventas2026`
- **Developer (admin)**
        - Usuario: `developer`
        - Contraseña: `dev2026`

### URL del Web App (Apps Script)

`https://script.google.com/macros/s/AKfycbwP2Wa-uoRf5H4dKd-WqbsoyOmKk7Eb3bRffweTbbuWNx4c-2oXqX-9-t7sWWvVYyxZvg/exec`

---

## 🚀 Características

✅ **Interfaz moderna SaaS** - Diseño profesional tipo Linear/Stripe/Vercel  
✅ **Búsqueda en tiempo real** - SKU, nombre de producto o URL  
✅ **Autocomplete inteligente** - Sugerencias mientras escribes  
✅ **Sincronización automática** - Cada 30 minutos desde Google Drive  
✅ **388 productos indexados** - Datos desde Google Sheets  
✅ **Animaciones exclusivas** - Gradient ring animado al escribir  
✅ **Responsive** - Diseño mobile-first  
✅ **Descarga directa de PDFs** - Desde Google Drive  

---

## 📁 Estructura del Proyecto

```
/DESARROLLOFICHASTECNICAS/
├── SRC/
│   ├── index.html          # Interfaz web (HTML + CSS + JS)
│   ├── data.json           # Base de datos de productos (388 items)
│   ├── logo.jpg            # Logo de Comertex
│   └── READ ME.MD          # Documentación anterior
├── GoogleAppsScript.gs     # Script de automatización en la nube
├── actualizar_data_json_desde_sheet.py  # Sincronizador local
├── README.md               # Esta documentación
└── .git/                   # Control de versiones
```

---

## 🏗️ Arquitectura de Datos

```
Google Drive (22 PDFs)
        ↓
Google Apps Script (cada 30 min)
        ↓
Google Sheets (99 productos + links)
        ↓
Google Drive (data.json)
        ↓
Interfaz Web (búsqueda en tiempo real)
```

**Sincronización dual:**
- ☁️ **Google Apps Script**: Corre automáticamente en la nube cada 30 minutos
- 🖥️ **LaunchAgent** (Mac): Ejecuta el sincronizador local cada 30 minutos

---

## ⚙️ Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/juancamilocv12-cpu/DESARROLLOFICHASTECNICAS.git
cd DESARROLLOFICHASTECNICAS
```

### 2. Ejecutar servidor local

```bash
cd SRC
python3 -m http.server 8000
```

Abre: `http://localhost:8000`

Si el puerto 8000 ya está en uso:

```bash
cd SRC
python3 -m http.server 8001
```

Abre: `http://localhost:8001`

---

## 🔄 Sincronización

### Opción A: Google Apps Script (Recomendado - Nube)

Ya está configurado en tu cuenta Google:

1. Abre tu Google Sheet (ID: `1TqIvMr7oR3lyNvpS3rx7qf5pRunOvm3ytG8vmN_EC7A`)
2. Ve a **Extensiones → Apps Script**
3. Busca **Triggers** (⏰ icono izquierda)
4. Verifica que existe trigger cada 30 minutos para `sincronizarProductos`

**Las actualizaciones se generan automáticamente cada 30 minutos.**

### Opción B: Local (Mac con LaunchAgent)

Para ejecutar manualmente:

```bash
python3 actualizar_data_json_desde_sheet.py
```

LaunchAgent está configurado en: `~/Library/LaunchAgents/com.comertex.actualizar_data_json.plist`

---

## 🔐 Variables Configuradas

### Google IDs

```python
DRIVE_FOLDER_ID = "11NKToJKRaxnui4k09TsTG5tLltk5mqxi"     # Carpeta con PDFs
SHEET_ID = "1TqIvMr7oR3lyNvpS3rx7qf5pRunOvm3ytG8vmN_EC7A"  # Google Sheet
```

### Email (Google Apps Script)

```
USER_EMAIL = "comertexonline@gmail.com"
```

---

## 📊 Funcionalidades de Búsqueda

### 1. Por SKU exacto
```
Buscar: 2000002184881
Resultado: DRIL AMARANTO 8 ONZ...
```

### 2. Por nombre parcial
```
Buscar: INDIGO DELTA
Resultado: 15 coincidencias
```

### 3. Por URL del PDF
```
Buscar: https://drive.google.com/uc?export=download&id=...
Resultado: Producto asociado
```

---

## 🎨 Diseño & UX

- **Tipografía:** Inter (Google Fonts)
- **Paleta:** Azul principal (#2563EB), fondos suaves (#F6F8FC)
- **Animación distintiva:** Gradient ring alrededor de la card (8s)
- **Estados:** Verde ✓ (encontrado) / Rojo ✕ (no encontrado)

---

## 🚀 Desplegar a Producción

### Opción 1: Hosting estático (Vercel, Netlify, GitHub Pages)

1. Asegúrate de que `data.json` esté actualizado:
```bash
python3 actualizar_data_json_desde_sheet.py
git add -A && git commit -m "Update data.json" && git push
```

2. Conecta tu repo a Vercel/Netlify (auto-deploy)

### Opción 2: Servidor Apache/Nginx

```bash
scp -r SRC/ usuario@servidor:/var/www/html/fichas-tecnicas/
```

Luego cron para actualizar datos cada 30 min:
```cron
*/30 * * * * cd /var/www/html/fichas-tecnicas && /usr/bin/python3 actualizar_data_json_desde_sheet.py
```

### Opción 3: Docker

```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY SRC/ /app
RUN pip install google-auth-oauthlib google-auth-httplib2 google-api-python-client
CMD ["python3", "-m", "http.server", "8000", "--directory", "/app"]
```

---

## 🔧 Configuración de Google

### Habilitar APIs

1. Google Cloud Console
2. Habilitar: **Google Drive API, Google Sheets API**
3. Crear credenciales: **OAuth 2.0 (Cuenta de servicio)**

### Compartir archivos

- **Google Drive folder:** Compartido con cuenta de servicio
- **Google Sheet:** Público (lectura)

---

## 📈 Estadísticas

| Métrica | Valor |
|---------|-------|
| Productos indexados | 388 |
| PDFs en Drive | 22 |
| Productos con link | 6 |
| Actualizaciones por día | 48 (cada 30 min) |
| Tiempo de respuesta | <100ms |

---

## 🐛 Troubleshooting

### Logo no carga
- ✅ Archivo local `SRC/logo.jpg` - Fallback automático a emoji

### Búsqueda no encuentra productos
- Verifica que `SRC/data.json` existe
- Ejecuta: `python3 actualizar_data_json_desde_sheet.py`

### Google Apps Script falla
- Revisa permisos en Google Cloud Console
- Habilita Drive API y Sheets API

---

## 📝 Cambios Recientes

**v1.0.0** - 2026-03-04
- ✨ Interfaz SaaS moderna rediseñada
- 🎨 Logo local integrado
- ⚡ Animaciones exclusivas (gradient ring)
- 🔄 Sincronización automática con LaunchAgent
- 🚀 Push a GitHub DESARROLLOFICHASTECNICAS

---

## 👨‍💻 Desarrollo

### Stack

- **Frontend:** HTML5, CSS3, JavaScript vanilla
- **Backend:** Python 3.14, Google APIs
- **Cloud:** Google Drive, Google Sheets, Google Apps Script
- **Sistema:** macOS LaunchAgent, Git

### Próximas mejoras

- [ ] Base de datos SQL (PostgreSQL)
- [ ] Admin dashboard para gestionar productos
- [ ] PWA (Progressive Web App)
- [ ] Historial de búsquedas
- [ ] Filtros avanzados

---

## 📞 Soporte

Para problemas o sugerencias:
1. Revisa este README
2. Consulta los logs: `/Users/juancamilocastellanos/.comertex_sync/sync_data_json.log`

---

## 📄 Licencia

Privado - Comertex Online

---

**Último actualizado:** 4 de marzo de 2026  
**Versión:** 1.0.0  
**Repositorio:** https://github.com/juancamilocv12-cpu/DESARROLLOFICHASTECNICAS
