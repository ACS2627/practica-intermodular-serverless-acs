import * as libreria from "../auxFunctions.mjs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Amz-Date,X-Api-Key",
  "Access-Control-Allow-Methods": "DELETE,OPTIONS"
};

export const handler = async (event) => {
  // 1. Manejo de preflight OPTIONS
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ""
    };
  }

  // 2. Validar método
  if (event.httpMethod !== "DELETE") {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ message: `Método no permitido: ${event.httpMethod}` })
    };
  }

  // 3. Obtener y validar noteId
  const noteId = event.pathParameters?.noteId;
  if (!noteId || noteId.trim() === "") {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ message: "Falta el parámetro noteId o está vacío" })
    };
  }

  // 4. Obtener userId (con fallback a testuser)
  let userId;
  try {
    userId = event.requestContext.authorizer.claims.sub;
  } catch (error) {
    console.warn("No se pudo obtener usuario autenticado, usando testuser");
    userId = "testuser";
  }

  try {
    // 5. Llamar a la función de la librería
    await libreria.deleteNote(userId, noteId);

    console.info(`Nota eliminada correctamente: userId=${userId}, noteId=${noteId}`);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ message: "Nota eliminada exitosamente" })
    };
  } catch (err) {
    console.error("Error al eliminar la nota:", err);

    // 6. Diferenciar errores según el mensaje o tipo
    let statusCode = 500;
    let message = "Error interno al eliminar la nota";

    // Ajusta estas condiciones según los errores reales que lance deleteNote
    if (err.message === "Nota no encontrada") {
      statusCode = 404;
      message = "La nota no existe";
    } else if (err.message === "No autorizado") {
      statusCode = 403;
      message = "No tienes permiso para eliminar esta nota";
    }

    return {
      statusCode,
      headers: corsHeaders,
      body: JSON.stringify({ message })
    };
  }
};