import * as libreria from "../auxFunctions.mjs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Amz-Date,X-Api-Key",
  "Access-Control-Allow-Methods": "PUT,OPTIONS"
};

export const handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: corsHeaders, body: "" };
  }

  const noteId = event.pathParameters?.noteId || event.pathParameters?.id;
  
  let userId;
  try {
    userId = event.requestContext.authorizer.claims.sub;
  } catch {
    userId = "testuser"; 
  }

  let body = {};
  try {
    body = JSON.parse(event.body);
  } catch (err) {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ message: "JSON inválido" }) };
  }

  // --- SOLUCIÓN AQUÍ ---
  // Tu frontend envía: {"attributes": {"text": "..."}}
  // Extraemos los datos buscando tanto en la raíz como dentro de 'attributes'
  const source = body.attributes || body; 
  
  const title = source.title || source.titulo || "Sin título"; // Fallback si no hay título
  const text = source.text || source.content || source.nota;
  const timestamp = body.timestamp || source.timestamp || Date.now();

  if (!text) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ 
        message: "No se encontró el texto de la nota",
        recibido: body 
      })
    };
  }

  try {
    // Llamamos a la función de la librería (asegúrate de que updateNote en auxFunctions use estos campos)
    await libreria.updateNote(userId, noteId, {
      title: title,
      text: text,
      timestamp: timestamp
    });

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ message: "Nota actualizada", noteId })
    };
  } catch (err) {
    console.error("Error:", err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ message: "Error al actualizar", error: err.message })
    };
  }
};