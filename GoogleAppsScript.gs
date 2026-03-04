/**
 * Google Apps Script - Sincronizador automático Drive → Sheets
 * Configurado para: comertexonline@gmail.com
 * 
 * INSTRUCCIONES DE INSTALACIÓN:
 * 1. Inicia sesión en Google con comertexonline@gmail.com
 * 2. Abre tu Google Sheet: https://docs.google.com/spreadsheets/d/1TqIvMr7oR3lyNvpS3rx7qf5pRunOvm3ytG8vmN_EC7A/
 * 3. Ve a Menú: Extensiones → Apps Script
 * 4. ELIMINA todo lo que esté en el editor
 * 5. Copia COMPLETO el código de este archivo
 * 6. Pégalo en el editor de Apps Script
 * 7. Presiona Ctrl+S para guardar
 * 8. Busca la función "debug()" en el código
 * 9. Haz clic en el botón ▶️ "Run" / "Ejecutar"
 * 10. Autoriza cuando lo pida
 * 11. Una vez confirmes que funciona, configura el trigger automático
 */

// === CONFIGURACIÓN PARA comertexonline@gmail.com ===
const DRIVE_FOLDER_ID = "11NKToJKRaxnui4k09TsTG5tLltk5mqxi";
const SHEET_ID = "1TqIvMr7oR3lyNvpS3rx7qf5pRunOvm3ytG8vmN_EC7A";
const SHEET_NAME = "Sheet1";
const OUTPUT_FOLDER_ID = "11NKToJKRaxnui4k09TsTG5tLltk5mqxi";
const USER_EMAIL = "comertexonline@gmail.com";

/**
 * Función principal - Sincroniza Drive → Sheet → data.json
 */
function sincronizarProductos() {
  try {
    console.log("🚀 Iniciando sincronización automática...");
    console.log("📧 Usuario: " + USER_EMAIL);
    console.log("📋 Sheet ID: " + SHEET_ID);
    
    // 1. Obtener archivos PDF del Drive
    const pdfFiles = obtenerPDFsDelDrive();
    console.log(`✓ Se encontraron ${pdfFiles.length} archivos PDF`);
    
    if (pdfFiles.length === 0) {
      console.log("⚠️  No hay PDFs en la carpeta de Drive");
      return;
    }
    
    // 2. Obtener el Spreadsheet con validación
    let spreadsheet = null;
    try {
      spreadsheet = SpreadsheetApp.openById(SHEET_ID);
      console.log("✓ Spreadsheet abierto correctamente");
    } catch (e) {
      throw new Error(`No se pudo abrir el Spreadsheet con ID ${SHEET_ID}: ${e.toString()}`);
    }
    
    // 3. Obtener la hoja
    const allSheets = spreadsheet.getSheets();
    console.log(`📊 Total de hojas en el Spreadsheet: ${allSheets.length}`);
    
    if (allSheets.length === 0) {
      throw new Error("El Spreadsheet no tiene ninguna hoja. Verifica que el Sheet sea válido.");
    }
    
    let sheet = null;
    
    // Listar todas las hojas disponibles
    console.log("📋 Hojas disponibles:");
    allSheets.forEach(function(s) { 
      console.log(`  - "${s.getName()}"`); 
    });
    
    // Intentar obtener por nombre
    try {
      sheet = spreadsheet.getSheetByName(SHEET_NAME);
      if (sheet) {
        console.log(`✓ Se encontró la hoja: "${SHEET_NAME}"`);
      } else {
        console.log(`⚠️  getSheetByName retornó null para "${SHEET_NAME}"`);
      }
    } catch (e) {
      console.log(`⚠️  Error al buscar "${SHEET_NAME}": ${e.toString()}`);
    }
    
    // Si no se encontró, usar la primera
    if (!sheet && allSheets.length > 0) {
      sheet = allSheets[0];
      console.log(`✓ Usando la primera hoja: "${sheet.getName()}"`);
    }
    
    // Verificación final
    console.log(`🔍 Sheet final: ${sheet ? sheet.getName() : "NULL"}`);
    if (!sheet) {
      throw new Error("No se pudo obtener ninguna hoja de trabajo");
    }
    
    // 4. Leer datos del Sheet
    const lastRow = sheet.getLastRow();
    console.log(`📈 Última fila con datos: ${lastRow}`);
    
    if (lastRow < 2) {
      console.log("⚠️  La hoja está vacía (no hay datos en filas 2+)");
      return;
    }
    
    const data = sheet.getRange("A2:C" + lastRow).getValues();
    console.log(`✓ Se leyeron ${data.length} filas del Sheet`);
    
    // 5. Sincronizar y generar links
    const updates = sincronizarNombresYGenerarLinks(data, pdfFiles);
    console.log(`✓ Se generaron ${updates.length} links`);
    
    // 6. Actualizar Sheet
    if (updates.length > 0) {
      actualizarSheet(sheet, updates);
      console.log(`✓ Se actualizó el Sheet con ${updates.length} filas`);
    } else {
      console.log("ℹ️  No hay nuevos links para actualizar");
    }
    
    // 7. Generar data.json
    const dataJson = generarDataJson(data, pdfFiles);
    guardarDataJsonEnDrive(dataJson);
    console.log(`✓ Se generó data.json con ${dataJson.length} productos`);
    
    console.log("============================================================");
    console.log("✅ SINCRONIZACIÓN COMPLETADA EXITOSAMENTE");
    console.log("============================================================");
    
  } catch (error) {
    console.error("❌ Error en sincronización: " + error.toString());
    console.error("📍 Stack: " + error.stack);
    enviarNotificacion("Error en sincronización", error.toString() + "\n\nStack: " + error.stack);
  }
}

/**
 * Obtiene todos los PDFs de la carpeta de Drive
 */
function obtenerPDFsDelDrive() {
  try {
    const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    const files = [];
    
    const fileIterator = folder.getFilesByType(MimeType.PDF);
    while (fileIterator.hasNext()) {
      const file = fileIterator.next();
      files.push({
        id: file.getId(),
        name: file.getName()
      });
    }
    
    return files;
  } catch (error) {
    console.error("Error al leer Drive: " + error.toString());
    return [];
  }
}

/**
 * Sincroniza nombres del Sheet con PDFs del Drive y genera links
 */
function sincronizarNombresYGenerarLinks(data, pdfFiles) {
  const updates = [];
  
  data.forEach((row, index) => {
    const rowNum = index + 2;
    const sku = row[0] ? row[0].toString().trim() : "";
    const nombre = row[1] ? row[1].toString().trim() : "";
    const linkActual = row[2] ? row[2].toString().trim() : "";
    
    if (!nombre) return;
    
    const nombreLower = nombre.toLowerCase();
    
    for (const pdf of pdfFiles) {
      const pdfNameLower = pdf.name.toLowerCase();
      
      if (nombreLower.includes(pdfNameLower) || pdfNameLower.includes(nombreLower)) {
        const newLink = "https://drive.google.com/uc?export=download&id=" + pdf.id;
        
        if (newLink !== linkActual) {
          updates.push({
            row: rowNum,
            link: newLink,
            sku: sku,
            nombre: nombre
          });
          console.log(`  → Coincidencia encontrada: ${nombre.substring(0,50)}...`);
        }
        break;
      }
    }
  });
  
  return updates;
}

/**
 * Actualiza las filas del Sheet con los links generados
 */
function actualizarSheet(sheet, updates) {
  updates.forEach(update => {
    sheet.getRange("C" + update.row).setValue(update.link);
  });
}

/**
 * Genera el array de data.json basado en los datos del Sheet
 */
function generarDataJson(data, pdfFiles) {
  const products = [];
  
  data.forEach(row => {
    const sku = row[0] ? row[0].toString().trim() : "";
    const nombre = row[1] ? row[1].toString().trim() : "";
    const link = row[2] ? row[2].toString().trim() : "";
    
    let finalLink = link;
    
    if (!finalLink && nombre) {
      const nombreLower = nombre.toLowerCase();
      for (const pdf of pdfFiles) {
        const pdfNameLower = pdf.name.toLowerCase();
        if (nombreLower.includes(pdfNameLower) || pdfNameLower.includes(nombreLower)) {
          finalLink = "https://drive.google.com/uc?export=download&id=" + pdf.id;
          break;
        }
      }
    }
    
    if (finalLink && sku && nombre) {
      products.push({
        sku: sku,
        name: nombre,
        pdf: finalLink
      });
    }
  });
  
  return products;
}

/**
 * Guarda data.json en Google Drive (en la carpeta de PDFs)
 */
function guardarDataJsonEnDrive(dataJson) {
  try {
    const fileName = "data.json";
    const folder = DriveApp.getFolderById(OUTPUT_FOLDER_ID);
    
    const files = folder.getFilesByName(fileName);
    let file;
    
    if (files.hasNext()) {
      file = files.next();
      file.setContent(JSON.stringify(dataJson, null, 2));
      console.log("✓ data.json actualizado");
    } else {
      file = folder.createFile(fileName, JSON.stringify(dataJson, null, 2), MimeType.PLAIN_TEXT);
      console.log("✓ data.json creado");
    }
    
    console.log("📄 Ubicación: " + file.getUrl());
  } catch (error) {
    console.error("Error al guardar data.json: " + error.toString());
  }
}

/**
 * Envía notificaciones por email
 */
function enviarNotificacion(titulo, mensaje) {
  try {
    MailApp.sendEmail(USER_EMAIL, "[Sincronizador Automático] " + titulo, mensaje);
  } catch (error) {
    console.error("Error al enviar email: " + error.toString());
  }
}

/**
 * Función de prueba - Ejecuta esto primero para verificar que funciona
 */
function debug() {
  console.log("🧪 Ejecutando prueba del sincronizador...");
  sincronizarProductos();
}

/**
 * ============================================================
 * CONFIGURACIÓN DE TRIGGERS AUTOMÁTICOS
 * ============================================================
 * 
 * Una vez que confirmes que debug() funciona correctamente:
 * 
 * 1. En el editor de Apps Script (donde estás ahora)
 * 2. Busca el ícono de RELOJ en la barra izquierda (Triggers)
 * 3. Haz clic en "+ Crear trigger"
 * 4. Configure así:
 *    - Función: sincronizarProductos
 *    - Eventos: Basado en el tiempo
 *    - Selecciona: Cronómetro cada 30 minutos (o cada hora)
 *    - Guardar
 * 
 * Eso es todo. A partir de ahora se sincronizará automáticamente.
 * 
 * Si quieres que se sincronice cuando cambies el Sheet:
 * 1. "+ Crear trigger"
 * 2. Función: sincronizarProductos
 * 3. Eventos: Desde Google Sheets > Al editar
 * 4. Guardar
 * ============================================================
 */
