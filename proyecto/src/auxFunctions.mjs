import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  PutCommand,
  DeleteCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { PollyClient, SynthesizeSpeechCommand } from "@aws-sdk/client-polly";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { TranslateClient, TranslateTextCommand } from "@aws-sdk/client-translate";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Clientes (sin región explícita para DynamoDB y S3)
const dynamoClient = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(dynamoClient);
const s3Client = new S3Client({});
const pollyClient = new PollyClient({ region: "us-east-1" });
const translateClient = new TranslateClient({ region: "us-east-1" });

const tableName = process.env.APP_TABLE;
const bucketName = process.env.APP_S3;

// --- Funciones ---

export async function getNotesByUser(userId) {
  const params = {
    TableName: tableName,
    KeyConditionExpression: "userId = :userId",
    ExpressionAttributeValues: { ":userId": userId },
  };
  const data = await ddbDocClient.send(new QueryCommand(params));
  return data.Items || [];
}

export async function getNoteByUser(userId, noteId) {
  const params = {
    TableName: tableName,
    KeyConditionExpression: "userId = :userId AND noteId = :noteId",
    ExpressionAttributeValues: { ":userId": userId, ":noteId": noteId },
  };
  const data = await ddbDocClient.send(new QueryCommand(params));
  return data.Items || [];
}

export async function postNoteForUser(userId, noteId, noteText) {
  const params = {
    TableName: tableName,
    Item: {
      userId: userId,
      noteId: noteId,
      text: noteText,
      timestamp: Date.now(),
    },
  };
  await ddbDocClient.send(new PutCommand(params));
}

export async function updateNote(userId, noteId, updateFields) {
  const keys = Object.keys(updateFields);
  if (keys.length === 0) return null;

  const updateExpression = [];
  const expAttributeNames = {};
  const expAttributeValues = {};

  keys.forEach((key) => {
    updateExpression.push(`#f_${key} = :v_${key}`);
    expAttributeNames[`#f_${key}`] = key;
    expAttributeValues[`:v_${key}`] = updateFields[key];
  });

  const params = {
    TableName: tableName,
    Key: { userId, noteId },
    UpdateExpression: `SET ${updateExpression.join(", ")}`,
    ConditionExpression: "attribute_exists(userId)",
    ExpressionAttributeNames: expAttributeNames,
    ExpressionAttributeValues: expAttributeValues,
    ReturnValues: "ALL_NEW",
  };

  try {
    const data = await ddbDocClient.send(new UpdateCommand(params));
    return data.Attributes;
  } catch (error) {
    console.error("Error en updateNote:", error);
    throw error;
  }
}

export async function deleteNote(userId, noteId) {
  const params = {
    TableName: tableName,
    Key: { userId, noteId },
  };
  await ddbDocClient.send(new DeleteCommand(params));
}

export async function textToSpeech(text) {
  const command = new SynthesizeSpeechCommand({
    Text: text,
    OutputFormat: "mp3",
    VoiceId: "Lucia",
    Engine: "standard",
  });
  const response = await pollyClient.send(command);
  const chunks = [];
  for await (const chunk of response.AudioStream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export async function uploadToS3(mp3Data, key) {
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: mp3Data,
    ContentType: "audio/mpeg",
  });
  await s3Client.send(command);
  const getCommand = new GetObjectCommand({ Bucket: bucketName, Key: key });
  return await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 });
}

export async function translateNote(text, targetLang = "en") {
  const command = new TranslateTextCommand({
    Text: text,
    SourceLanguageCode: "es",   // ← CORREGIDO: antes era "auto"
    TargetLanguageCode: targetLang,
  });
  const response = await translateClient.send(command);
  return response.TranslatedText;
}