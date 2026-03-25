import * as libreria from "../auxFunctions.mjs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Amz-Date,X-Api-Key",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
};

export const handler = async (event) => {
  // Preflight CORS
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: corsHeaders, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ message: `Método no permitido: ${event.httpMethod}` }),
    };
  }

  const noteId = event.pathParameters?.noteId;
  if (!noteId) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ message: "noteId es obligatorio" }),
    };
  }

  // Obtener el userId desde Cognito usando el 'sub'
  let userId;
  try {
    const claims = event.requestContext.authorizer.claims;
    // Utilizamos 'sub' (UUID) como identificador principal
    userId = claims.sub;
    if (!userId) {
      throw new Error("No se encontró el claim 'sub'");
    }
    console.log("Usuario autenticado (sub):", userId);
  } catch (err) {
    console.error("Error al obtener usuario de Cognito:", err);
    return {
      statusCode: 401,
      headers: corsHeaders,
      body: JSON.stringify({ message: "No autenticado" }),
    };
  }

  // Buscar la nota en DynamoDB
  let note;
  try {
    const notes = await libreria.getNoteByUser(userId, noteId);
    if (!notes || notes.length === 0) {
      console.log(`Nota ${noteId} no encontrada para usuario ${userId}`);
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ message: "Nota no encontrada" }),
      };
    }
    note = notes[0];
    console.log("Nota encontrada:", note);
  } catch (err) {
    console.error("Error consultando nota:", err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ message: "Error interno al buscar la nota" }),
    };
  }

  // Procesar la nota
  try {
    const content = note.text || note.content || "";
    if (!content.trim()) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ message: "La nota no tiene contenido" }),
      };
    }

    console.log("Generando audio...");
    const mp3Buffer = await libreria.textToSpeech(content);

    console.log("Subiendo a S3...");
    const audioKey = `audio-${noteId}.mp3`;
    const audioUrl = await libreria.uploadToS3(mp3Buffer, audioKey);

    console.log("Traduciendo...");
    const translation = await libreria.translateNote(content, "en");

    console.log("Actualizando DynamoDB...");
    await libreria.updateNote(userId, noteId, {
      translation: translation,
      audioUrl: audioUrl,
      processed: true,
    });

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ noteId, audioUrl, translation }),
    };
  } catch (err) {
    console.error("ERROR DETALLADO:", err);
    let errorMessage = "Error al procesar la nota";
    let statusCode = 500;

    if (err.message?.includes("AccessDenied")) {
      errorMessage = "Error de permisos en servicios AWS";
      statusCode = 403;
    } else if (err.message?.includes("Bucket")) {
      errorMessage = "Error con el bucket S3";
      statusCode = 502;
    } else if (err.message?.includes("Polly") || err.message?.includes("Synthesize")) {
      errorMessage = "Error generando audio";
      statusCode = 502;
    } else if (err.message?.includes("Translate")) {
      errorMessage = "Error traduciendo el texto";
      statusCode = 502;
    }

    return {
      statusCode,
      headers: corsHeaders,
      body: JSON.stringify({ message: errorMessage, detail: err.message }),
    };
  }
};