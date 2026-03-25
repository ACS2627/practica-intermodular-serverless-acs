import * as libreria from "../auxFunctions.mjs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Amz-Date,X-Api-Key",
  "Access-Control-Allow-Methods": "GET,OPTIONS" // Solo GET y OPTIONS
};

export const handler = async (event) => {
  // Manejo de preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ""
    };
  }

  // Validación de método (con respuesta HTTP, no excepción)
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ message: `Método no permitido: ${event.httpMethod}` })
    };
  }

  console.info("Petición recibida:", event);

  // Obtener información del usuario (con fallback a testuser)
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

  let response;
  try {
    const items = await libreria.getNotesByUser(userId);
    response = {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(items)
    };
  } catch (err) {
    console.error("Error al leer las notas:", err);
    response = {
      statusCode: 500, // Cambiado a 500 (error interno)
      headers: corsHeaders,
      body: JSON.stringify({ message: "Ha habido un problema al leer las notas" })
    };
  }

  console.info(
    `Petición a ruta: ${event.path}; código de estado: ${response.statusCode}; usuario logueado: ${userId}`
  );

  return response;
};