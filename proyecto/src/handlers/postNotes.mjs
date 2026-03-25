import * as libreria from "../auxFunctions.mjs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Amz-Date,X-Api-Key",
  "Access-Control-Allow-Methods": "POST,OPTIONS"
};

export const handler = async (event) => {
  // Preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ""
    };
  }

  // Validación de método
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ message: `Método no permitido: ${event.httpMethod}` })
    };
  }

  console.info("Petición recibida:", event);

  // Obtener usuario (con fallback)
  let userId, email, username;
  try {
    const userClaims = event.requestContext.authorizer.claims;
    userId = userClaims.sub;
    email = userClaims.email;
    username = userClaims["cognito:username"];
  } catch (error) {
    userId = "testuser";
    email = "test@test.com";
    username = "testuser";
    console.warn("No se pudo obtener usuario autenticado, usando testuser");
  }

  // Parsear y validar body
  let noteData;
  try {
    noteData = JSON.parse(event.body);
  } catch (err) {
    console.error("Error al parsear JSON del body:", err);
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ message: "El cuerpo de la petición no es un JSON válido" })
    };
  }

  const noteId = noteData.noteId;
  const noteText = noteData.text;

  if (!noteId || !noteText) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ message: "Faltan campos obligatorios: noteId y text" })
    };
  }

  let response;
  try {
    await libreria.postNoteForUser(userId, noteId, noteText);
    response = {
      statusCode: 201,
      headers: corsHeaders,
      body: JSON.stringify({ message: "Nota creada correctamente" })
    };
  } catch (err) {
    console.error("Error al crear nota:", err);
    // Aquí podríamos diferenciar errores, pero de momento 500 genérico
    response = {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ message: "Ha habido un problema al crear la nota" })
    };
  }

  console.info(
    `Petición a ruta: ${event.path}; código de estado: ${response.statusCode}; usuario logueado: ${userId}`
  );

  return response;
};