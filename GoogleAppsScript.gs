/**
 * Google Apps Script - Sincronizador y API de administracion
 *
 * COPIAR / PEGAR RAPIDO (IDs activos):
 * - SCRIPT_ID: 1Z5wvoq4JWeqm8Lbe2dVH7fkYLEooqbiXNgOgvBLVA20eMg_cOvtZeYjt
 * - FOLDER_FICHAS_TECNICAS: 11NKToJKRaxnui4k09TsTG5tLltk5mqxi
 * - FOLDER_AYUDA_VENTAS: 1zEYmWECvrmgf5Ifc_UwbLVmV6OpbYE92
 * - SHEET_ID: 1TqIvMr7oR3lyNvpS3rx7qf5pRunOvm3ytG8vmN_EC7A
 * - SHEET_NAME: Hoja 1
 * - OUTPUT_FOLDER_ID (data.json): 11NKToJKRaxnui4k09TsTG5tLltk5mqxi
 * - USER_EMAIL: comertexonline@gmail.com
 *
 * Este script ahora soporta dos tipos de documentos por producto:
 * 1) Ficha tecnica
 * 2) Ayuda ventas
 *
 * Publicar como Web App para habilitar el panel de desarrolladores del frontend.
 */

// === CONFIGURACION ===
const TECHNICAL_FOLDER_ID = "11NKToJKRaxnui4k09TsTG5tLltk5mqxi";
const SALES_AID_FOLDER_ID = "1zEYmWECvrmgf5Ifc_UwbLVmV6OpbYE92";
const SHEET_ID = "1TqIvMr7oR3lyNvpS3rx7qf5pRunOvm3ytG8vmN_EC7A";
const SHEET_NAME = "Hoja 1";
const OUTPUT_FOLDER_ID = "11NKToJKRaxnui4k09TsTG5tLltk5mqxi";
const USER_EMAIL = "comertexonline@gmail.com";
const ACCESS_LOG_SHEET_NAME = "access_logs";
const DEFAULT_VIEWER_PASSWORD = "ventas2026";

// Usuario -> password y rol.
// Recomendado: mover a Script Properties para mayor seguridad.
const APP_USERS = (function() {
  const users = {
    "ventas": { password: "ventas2026", role: "viewer" },
    "developer": { password: "dev2026", role: "developer" }
  };

  const viewerEmails = [
    "eeljach@comertex.com.co",
    "pvargas@comertex.com.co",
    "jpernia@comertex.com.co",
    "cperlaza@comertex.com.co",
    "dpulgarin@comertex.com.co",
    "mpajon@comertex.com.co",
    "sgiraldo@comertex.com.co",
    "jromero@comertex.com.co",
    "cadiaz@comertex.com.co",
    "jbarrera@comertex.com.co",
    "dgomez@comertex.com.co",
    "cprieto@comertex.com.co",
    "amartinez@comertex.com.co",
    "ajimenez@comertex.com.co",
    "eamado@comertex.com.co",
    "omejia@comertex.com.co",
    "ymedellin@comertex.com.co",
    "mmedina@comertex.com.co",
    "wortiz@comertex.com.co",
    "mlopez@comertex.com.co",
    "kcifuentes@comertex.com.co",
    "orincon@comertex.com.co",
    "fgutierrez@comertex.com.co",
    "esuarez@comertex.com.co"
  ];

  viewerEmails.forEach(function(email) {
    users[email.toLowerCase()] = { password: DEFAULT_VIEWER_PASSWORD, role: "viewer" };
  });

  return users;
})();

const DOC_TYPES = {
  technical: "technical",
  salesAid: "salesAid"
};

/**
 * Endpoint GET de salud
 */
function doGet() {
  return jsonResponse({
    ok: true,
    message: "API activa",
    timestamp: new Date().toISOString()
  });
}

/**
 * Endpoint POST para el panel de desarrolladores.
 * Actions soportadas:
 * - authenticate
 * - listReferences
 * - createReference
 * - listFiles
 * - uploadReferenceDocument
 * - applyFamilyLinks
 * - deleteFile
 * - sync
 */
function doPost(e) {
  try {
    const payload = parsePayload(e);
    const action = payload.action || "";

    if (!action) {
      return jsonResponse({ ok: false, error: "Accion requerida." });
    }

    const auth = authenticate(payload.username, payload.password);
    if (!auth.ok) {
      if (action === "authenticate") {
        logAccessEvent({
          event: "login_failed",
          success: false,
          username: payload.username,
          role: "",
          action: action,
          clientInfo: payload.clientInfo || {}
        });
      }
      return jsonResponse(auth);
    }

    if (action === "authenticate") {
      logAccessEvent({
        event: "login_success",
        success: true,
        username: auth.username,
        role: auth.role,
        action: action,
        clientInfo: payload.clientInfo || {}
      });
      return jsonResponse({ ok: true, role: auth.role, username: auth.username });
    }

    if (action === "listReferences") {
      return handleListReferences(auth.role);
    }

    if (action === "createReference") {
      return handleCreateReference(auth.role, payload);
    }

    if (action === "listFiles") {
      return handleListFiles(auth.role);
    }

    if (action === "uploadReferenceDocument") {
      return handleUploadReferenceDocument(auth.role, payload);
    }

    if (action === "applyFamilyLinks") {
      return handleApplyFamilyLinks(auth.role, payload);
    }

    if (action === "deleteFile") {
      return handleDeleteFile(auth.role, payload);
    }

    if (action === "sync") {
      return handleSync(auth.role);
    }

    return jsonResponse({ ok: false, error: "Accion no soportada." });
  } catch (error) {
    return jsonResponse({ ok: false, error: error.toString() });
  }
}

function handleListFiles(role) {
  if (role !== "developer") {
    return jsonResponse({ ok: false, error: "Sin permisos para listar archivos." });
  }

  const technicalFiles = listFilesByFolder(TECHNICAL_FOLDER_ID);
  const salesAidFiles = listFilesByFolder(SALES_AID_FOLDER_ID);

  return jsonResponse({
    ok: true,
    technicalFiles: technicalFiles,
    salesAidFiles: salesAidFiles
  });
}

function handleListReferences(role) {
  if (role !== "developer" && role !== "viewer") {
    return jsonResponse({ ok: false, error: "Sin permisos para listar referencias." });
  }

  const references = getReferencesFromSheet();
  return jsonResponse({ ok: true, references: references });
}

function handleUploadReferenceDocument(role, payload) {
  if (role !== "developer") {
    return jsonResponse({ ok: false, error: "Sin permisos para subir archivos." });
  }

  const docType = payload.docType;
  const referenceRow = Number(payload.referenceRow || 0);
  const referenceSku = (payload.referenceSku || "").toString().trim();
  const referenceName = (payload.referenceName || "").toString().trim();
  const applyToColorVariants = Boolean(payload.applyToColorVariants);
  const explicitTargetRows = sanitizeExplicitTargetRows(payload.targetRows);
  const fileName = payload.fileName;
  const base64 = payload.fileContentBase64;
  const mimeType = payload.mimeType || MimeType.PDF;

  if (!docType || !fileName || !base64 || referenceRow < 2) {
    return jsonResponse({ ok: false, error: "Faltan campos requeridos para subir archivo." });
  }

  const folder = getFolderByDocType(docType);
  if (!folder) {
    return jsonResponse({ ok: false, error: "Tipo de documento invalido." });
  }

  const bytes = Utilities.base64Decode(base64);
  const normalizedDocType = docType === DOC_TYPES.salesAid ? "ayuda-ventas" : "ficha-tecnica";
  const normalizedName = sanitizeFileName((referenceSku || referenceName || "referencia") + "_" + normalizedDocType + ".pdf");
  const blob = Utilities.newBlob(bytes, mimeType, normalizedName || fileName);
  const file = folder.createFile(blob);
  const link = buildDownloadUrl(file.getId());

  const sheet = getSheetOrFail();
  const targetColumn = docType === DOC_TYPES.technical ? "C" : "D";
  const targetRows = explicitTargetRows.length
    ? explicitTargetRows
    : getTargetRowsForUpload(referenceRow, referenceName, applyToColorVariants);
  targetRows.forEach(function(row) {
    sheet.getRange(targetColumn + row).setValue(link);
  });

  regenerarDataJsonDesdeSheet();

  return jsonResponse({
    ok: true,
    file: {
      id: file.getId(),
      name: file.getName(),
      downloadUrl: link
    },
    referenceRow: referenceRow,
    updatedRows: targetRows,
    updatedColumn: targetColumn,
    updatedLink: link
  });
}

function handleCreateReference(role, payload) {
  if (role !== "developer") {
    return jsonResponse({ ok: false, error: "Sin permisos para crear referencias." });
  }

  const sku = (payload.sku || "").toString().trim();
  const name = (payload.name || "").toString().trim();

  if (!sku || !name) {
    return jsonResponse({ ok: false, error: "SKU y nombre son obligatorios." });
  }

  const sheet = getSheetOrFail();
  const row = sheet.getLastRow() + 1;
  sheet.getRange("A" + row).setValue(sku);
  sheet.getRange("B" + row).setValue(name);
  sheet.getRange("C" + row).setValue("");
  sheet.getRange("D" + row).setValue("");

  regenerarDataJsonDesdeSheet();

  return jsonResponse({
    ok: true,
    reference: {
      row: row,
      sku: sku,
      name: name,
      technicalLink: "",
      salesAidLink: ""
    }
  });
}

function handleDeleteFile(role, payload) {
  if (role !== "developer") {
    return jsonResponse({ ok: false, error: "Sin permisos para borrar archivos." });
  }

  const fileId = payload.fileId;
  if (!fileId) {
    return jsonResponse({ ok: false, error: "fileId es obligatorio." });
  }

  const file = DriveApp.getFileById(fileId);
  file.setTrashed(true);

  return jsonResponse({ ok: true, deletedFileId: fileId });
}

function handleApplyFamilyLinks(role, payload) {
  if (role !== "developer") {
    return jsonResponse({ ok: false, error: "Sin permisos para relacionar familias." });
  }

  const docType = payload.docType;
  const sourceRow = Number(payload.sourceRow || 0);
  const explicitTargetRows = sanitizeExplicitTargetRows(payload.targetRows);

  if (!docType || sourceRow < 2 || !explicitTargetRows.length) {
    return jsonResponse({ ok: false, error: "Faltan campos requeridos para relacionar familia." });
  }

  const targetColumn = docType === DOC_TYPES.technical ? "C" : (docType === DOC_TYPES.salesAid ? "D" : "");
  if (!targetColumn) {
    return jsonResponse({ ok: false, error: "Tipo de documento invalido." });
  }

  const sheet = getSheetOrFail();
  const sourceLink = (sheet.getRange(targetColumn + sourceRow).getValue() || "").toString().trim();
  if (!sourceLink) {
    return jsonResponse({ ok: false, error: "La referencia origen no tiene link para este tipo de documento." });
  }

  explicitTargetRows.forEach(function(row) {
    sheet.getRange(targetColumn + row).setValue(sourceLink);
  });

  regenerarDataJsonDesdeSheet();

  return jsonResponse({
    ok: true,
    docType: docType,
    sourceRow: sourceRow,
    updatedRows: explicitTargetRows,
    appliedLink: sourceLink
  });
}

function handleSync(role) {
  if (role !== "developer") {
    return jsonResponse({ ok: false, error: "Sin permisos para sincronizar." });
  }

  const result = sincronizarProductos();
  return jsonResponse({ ok: true, totalProducts: result.totalProducts, updates: result.updates });
}

function parsePayload(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error("Body vacio.");
  }

  return JSON.parse(e.postData.contents);
}

function authenticate(username, password) {
  const normalizedUsername = sanitizeUsername(username);
  const user = APP_USERS[normalizedUsername];
  if (!user || user.password !== password) {
    return { ok: false, error: "Credenciales invalidas." };
  }

  return { ok: true, role: user.role, username: normalizedUsername };
}

function sanitizeUsername(username) {
  return (username || "")
    .toString()
    .trim()
    .toLowerCase();
}

function logAccessEvent(entry) {
  try {
    const clientInfo = entry.clientInfo || {};
    const ip = sanitizeLogValue(clientInfo.ipAddress || clientInfo.ip || "");
    const geo = resolveGeoByIp(ip);
    const latitude = sanitizeLogValue(clientInfo.latitude || "") || sanitizeLogValue(geo.latitude);
    const longitude = sanitizeLogValue(clientInfo.longitude || "") || sanitizeLogValue(geo.longitude);
    const timezone = sanitizeLogValue(clientInfo.timezone || "") || sanitizeLogValue(geo.timezone);
    const sheet = getAccessLogSheet();

    sheet.appendRow([
      new Date(),
      sanitizeLogValue(entry.event),
      sanitizeLogValue(entry.action),
      entry.success ? "true" : "false",
      sanitizeLogValue(entry.username),
      sanitizeLogValue(entry.role),
      ip,
      sanitizeLogValue(geo.country),
      sanitizeLogValue(geo.region),
      sanitizeLogValue(geo.city),
      latitude,
      longitude,
      timezone,
      sanitizeLogValue(geo.isp),
      sanitizeLogValue(clientInfo.language),
      sanitizeLogValue(clientInfo.platform),
      sanitizeLogValue(clientInfo.userAgent)
    ]);
  } catch (error) {
    console.error("No fue posible registrar acceso: " + error.toString());
  }
}

function getAccessLogSheet() {
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  let sheet = spreadsheet.getSheetByName(ACCESS_LOG_SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(ACCESS_LOG_SHEET_NAME);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "timestamp",
      "event",
      "action",
      "success",
      "username",
      "role",
      "ip",
      "country",
      "region",
      "city",
      "latitude",
      "longitude",
      "timezone",
      "isp",
      "language",
      "platform",
      "userAgent"
    ]);
  }

  return sheet;
}

function resolveGeoByIp(ip) {
  const cleanIp = sanitizeLogValue(ip);
  if (!cleanIp) {
    return {};
  }

  try {
    const url = "https://ipwho.is/" + encodeURIComponent(cleanIp);
    const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    if (response.getResponseCode() !== 200) {
      return {};
    }

    const data = JSON.parse(response.getContentText() || "{}");
    if (!data || data.success === false) {
      return {};
    }

    return {
      country: data.country || "",
      region: data.region || "",
      city: data.city || "",
      latitude: data.latitude || "",
      longitude: data.longitude || "",
      timezone: (data.timezone && data.timezone.id) || "",
      isp: data.connection && data.connection.isp ? data.connection.isp : ""
    };
  } catch (error) {
    console.warn("No fue posible resolver geolocalizacion por IP: " + error.toString());
    return {};
  }
}

function sanitizeLogValue(value) {
  return (value === null || value === undefined)
    ? ""
    : value.toString().trim();
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function getFolderByDocType(docType) {
  if (docType === DOC_TYPES.technical) {
    return DriveApp.getFolderById(TECHNICAL_FOLDER_ID);
  }

  if (docType === DOC_TYPES.salesAid) {
    return DriveApp.getFolderById(SALES_AID_FOLDER_ID);
  }

  return null;
}

function listFilesByFolder(folderId) {
  const folder = DriveApp.getFolderById(folderId);
  const files = folder.getFilesByType(MimeType.PDF);
  const data = [];

  while (files.hasNext()) {
    const file = files.next();
    data.push({
      id: file.getId(),
      name: file.getName()
    });
  }

  data.sort(function(a, b) {
    return a.name.localeCompare(b.name);
  });

  return data;
}

/**
 * Sincroniza Drive -> Sheet -> data.json
 * Columna C: ficha tecnica
 * Columna D: ayuda ventas
 */
function sincronizarProductos() {
  try {
    console.log("Iniciando sincronizacion...");

    const technicalFiles = listFilesByFolder(TECHNICAL_FOLDER_ID);
    const salesAidFiles = listFilesByFolder(SALES_AID_FOLDER_ID);

    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    const sheet = spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.getSheets()[0];

    if (!sheet) {
      throw new Error("No se encontro ninguna hoja para procesar.");
    }

    const lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      return { totalProducts: 0, updates: 0 };
    }

    const data = sheet.getRange("A2:D" + lastRow).getValues();

    const updates = sincronizarLinks(data, technicalFiles, salesAidFiles);
    if (updates.length > 0) {
      actualizarSheet(sheet, updates);
    }

    const dataJson = generarDataJson(data, technicalFiles, salesAidFiles);
    guardarDataJsonEnDrive(dataJson);

    return {
      totalProducts: dataJson.length,
      updates: updates.length
    };
  } catch (error) {
    console.error("Error en sincronizacion: " + error.toString());
    enviarNotificacion("Error en sincronizacion", error.toString());
    throw error;
  }
}

function sincronizarLinks(data, technicalFiles, salesAidFiles) {
  const updates = [];

  data.forEach(function(row, index) {
    const rowNum = index + 2;
    const sku = valueAt(row, 0);
    const name = valueAt(row, 1);
    const techLink = valueAt(row, 2);
    const salesLink = valueAt(row, 3);

    if (!name) {
      return;
    }

    const matchedTech = findMatchingFile(sku, name, technicalFiles, DOC_TYPES.technical);
    const matchedSales = findMatchingFile(sku, name, salesAidFiles, DOC_TYPES.salesAid);

    const nextTechLink = matchedTech ? buildDownloadUrl(matchedTech.id) : "";
    const nextSalesLink = matchedSales ? buildDownloadUrl(matchedSales.id) : "";

    if (nextTechLink !== techLink || nextSalesLink !== salesLink) {
      updates.push({
        row: rowNum,
        sku: sku,
        name: name,
        technicalLink: nextTechLink,
        salesAidLink: nextSalesLink
      });
    }
  });

  return updates;
}

function actualizarSheet(sheet, updates) {
  updates.forEach(function(update) {
    sheet.getRange("C" + update.row).setValue(update.technicalLink || "");
    sheet.getRange("D" + update.row).setValue(update.salesAidLink || "");
  });
}

function getSheetOrFail() {
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  const sheet = spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.getSheets()[0];

  if (!sheet) {
    throw new Error("No se encontro ninguna hoja para procesar.");
  }

  return sheet;
}

function getReferencesFromSheet() {
  const sheet = getSheetOrFail();
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return [];
  }

  const rows = sheet.getRange("A2:D" + lastRow).getValues();
  const references = [];

  rows.forEach(function(row, index) {
    const sku = valueAt(row, 0);
    const name = valueAt(row, 1);
    const technicalLink = valueAt(row, 2);
    const salesAidLink = valueAt(row, 3);

    if (!sku && !name) {
      return;
    }

    references.push({
      row: index + 2,
      sku: sku,
      name: name,
      technicalLink: technicalLink,
      salesAidLink: salesAidLink
    });
  });

  return references;
}

function regenerarDataJsonDesdeSheet() {
  const references = getReferencesFromSheet();
  const dataJson = references.map(function(item) {
    return {
      sku: item.sku,
      name: item.name,
      pdf: item.technicalLink,
      salesAidPdf: item.salesAidLink
    };
  });

  guardarDataJsonEnDrive(dataJson);
  return dataJson;
}

function generarDataJson(data, technicalFiles, salesAidFiles) {
  const products = [];

  data.forEach(function(row) {
    const sku = valueAt(row, 0);
    const name = valueAt(row, 1);
    let technicalLink = valueAt(row, 2);
    let salesAidLink = valueAt(row, 3);

    if (!technicalLink && (name || sku)) {
      const matchTech = findMatchingFile(sku, name, technicalFiles, DOC_TYPES.technical);
      technicalLink = matchTech ? buildDownloadUrl(matchTech.id) : "";
    }

    if (!salesAidLink && (name || sku)) {
      const matchSales = findMatchingFile(sku, name, salesAidFiles, DOC_TYPES.salesAid);
      salesAidLink = matchSales ? buildDownloadUrl(matchSales.id) : "";
    }

    if (sku || name) {
      products.push({
        sku: sku,
        name: name,
        pdf: technicalLink,
        salesAidPdf: salesAidLink
      });
    }
  });

  return products;
}

function findMatchingFile(productSku, productName, files, docType) {
  const exactKeys = buildExactReferenceKeys(productSku, productName, docType);
  if (!exactKeys.length) {
    return null;
  }

  const exactLookup = {};
  exactKeys.forEach(function(key) {
    exactLookup[key] = true;
  });

  for (var i = 0; i < files.length; i++) {
    const file = files[i];
    const fileName = normalizeComparableName(removePdfExtension(file.name));

    // Regla para sincronizacion desde Drive: solo coincidencias exactas.
    if (fileName && exactLookup[fileName]) {
      return file;
    }
  }

  return null;
}

function buildExactReferenceKeys(productSku, productName, docType) {
  const keys = [];

  function addKey(value) {
    const normalized = normalizeComparableName(value);
    if (normalized && keys.indexOf(normalized) === -1) {
      keys.push(normalized);
    }
  }

  addKey(productName);
  addKey(productSku);

  // Tambien permite el formato exacto que genera la plataforma al subir PDFs.
  if (docType === DOC_TYPES.technical) {
    addKey((productSku || "") + "_ficha-tecnica");
    addKey((productName || "") + "_ficha-tecnica");
  }

  if (docType === DOC_TYPES.salesAid) {
    addKey((productSku || "") + "_ayuda-ventas");
    addKey((productName || "") + "_ayuda-ventas");
  }

  return keys;
}

function normalizeText(value) {
  return (value || "").toString().trim().toLowerCase();
}

function normalizeComparableName(value) {
  return normalizeText(value)
    .replace(/[_-]+/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractReferenceBaseName(value, relatedNames) {
  const tokens = tokenizeReferenceName(value);
  if (!tokens.length) {
    return "";
  }

  // Regla directa: si existe el token "color"/"colores", se usa lo previo como base.
  const markerIndex = findColorMarkerIndex(tokens);
  if (markerIndex > 0) {
    return tokens.slice(0, markerIndex).join(" ");
  }

  // Relacional: busca el prefijo mas largo que realmente tiene variantes debajo.
  // Ej: "camisero formal azul" y "camisero formal blanco" -> base "camisero formal".
  const peers = Array.isArray(relatedNames) ? relatedNames : [];
  const peerTokenLists = peers.map(function(name) { return tokenizeReferenceName(name); });

  for (var len = tokens.length - 1; len >= 1; len--) {
    const prefix = tokens.slice(0, len);
    const variantHeads = {};
    let candidateCount = 0;

    for (var i = 0; i < peerTokenLists.length; i++) {
      const peerTokens = peerTokenLists[i];
      if (!peerTokens.length) {
        continue;
      }

      if (!startsWithTokens(peerTokens, prefix)) {
        continue;
      }

      // Solo cuenta como variante cuando el peer tiene algo adicional luego del prefijo.
      if (peerTokens.length <= len) {
        continue;
      }

      candidateCount++;
      variantHeads[peerTokens[len]] = true;
    }

    const uniqueVariantHeads = Object.keys(variantHeads).length;
    const allowSingleWordBase = len === 1 && tokens.length === 2;
    const isStrongPrefix = len >= 2 || allowSingleWordBase;

    if (isStrongPrefix && candidateCount >= 2 && uniqueVariantHeads >= 2) {
      return prefix.join(" ");
    }
  }

  return tokens.join(" ");
}

function removePdfExtension(value) {
  return (value || "").toString().replace(/\.pdf$/i, "");
}

function tokenizeReferenceName(value) {
  return normalizeText(removePdfExtension(value))
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(function(token) { return token; });
}

function findColorMarkerIndex(tokens) {
  for (var i = 0; i < tokens.length; i++) {
    if (tokens[i] === "color" || tokens[i] === "colores") {
      return i;
    }
  }
  return -1;
}

function commonPrefixLength(aTokens, bTokens) {
  const len = Math.min(aTokens.length, bTokens.length);
  let count = 0;
  for (var i = 0; i < len; i++) {
    if (aTokens[i] !== bTokens[i]) {
      break;
    }
    count++;
  }
  return count;
}

function areBaseNamesRelated(baseA, baseB) {
  if (!baseA || !baseB) {
    return false;
  }

  if (baseA === baseB || baseA.indexOf(baseB) !== -1 || baseB.indexOf(baseA) !== -1) {
    return true;
  }

  const tokensA = tokenizeReferenceName(baseA);
  const tokensB = tokenizeReferenceName(baseB);
  const prefixLen = commonPrefixLength(tokensA, tokensB);

  if (prefixLen >= 2) {
    return true;
  }

  // Caso corto controlado para referencias de 2 tokens.
  return prefixLen === 1 && tokensA.length === 1 && tokensB.length === 1;
}

function startsWithTokens(fullTokens, prefixTokens) {
  if (prefixTokens.length > fullTokens.length) {
    return false;
  }

  for (var i = 0; i < prefixTokens.length; i++) {
    if (fullTokens[i] !== prefixTokens[i]) {
      return false;
    }
  }

  return true;
}

function getTargetRowsForUpload(referenceRow, referenceName, applyToColorVariants) {
  if (!applyToColorVariants) {
    return [referenceRow];
  }

  const references = getReferencesFromSheet();
  const names = references.map(function(item) { return item.name; });
  const baseName = extractReferenceBaseName(referenceName, names);
  if (!baseName) {
    return [referenceRow];
  }

  const matches = references
    .filter(function(item) {
      const candidateBase = extractReferenceBaseName(item.name, names);
      return areBaseNamesRelated(baseName, candidateBase);
    })
    .map(function(item) {
      return item.row;
    });

  if (matches.indexOf(referenceRow) === -1) {
    matches.push(referenceRow);
  }

  return matches;
}

function sanitizeExplicitTargetRows(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  const uniqueRows = {};
  value.forEach(function(item) {
    const row = Number(item);
    if (row >= 2 && row % 1 === 0) {
      uniqueRows[row] = true;
    }
  });

  return Object.keys(uniqueRows).map(function(key) {
    return Number(key);
  }).sort(function(a, b) { return a - b; });
}

function sanitizeFileName(value) {
  return (value || "")
    .toString()
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "_")
    .replace(/\s+/g, " ");
}

function valueAt(row, index) {
  if (index >= row.length || row[index] === null || row[index] === undefined) {
    return "";
  }

  return row[index].toString().trim();
}

function buildDownloadUrl(fileId) {
  return "https://drive.google.com/uc?export=download&id=" + fileId;
}

function guardarDataJsonEnDrive(dataJson) {
  const fileName = "data.json";
  const folder = DriveApp.getFolderById(OUTPUT_FOLDER_ID);
  const files = folder.getFilesByName(fileName);
  const content = JSON.stringify(dataJson, null, 2);

  if (files.hasNext()) {
    const file = files.next();
    file.setContent(content);
    console.log("data.json actualizado");
    return;
  }

  folder.createFile(fileName, content, MimeType.PLAIN_TEXT);
  console.log("data.json creado");
}

function enviarNotificacion(titulo, mensaje) {
  try {
    MailApp.sendEmail(USER_EMAIL, "[Sincronizador] " + titulo, mensaje);
  } catch (error) {
    console.error("No fue posible enviar notificacion: " + error.toString());
  }
}

function debug() {
  const result = sincronizarProductos();
  console.log("Debug OK. Productos: " + result.totalProducts + ", actualizaciones: " + result.updates);
}
