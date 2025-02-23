const AWS = require('aws-sdk');
const { google } = require('googleapis');
const axios = require('axios');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const DENIZ_BOT_TOKEN = process.env.DENIZ_BOT_TOKEN;
const DENIZ_BOT_CHATID = process.env.DENIZ_BOT_CHATID;
const TABLE_NAME = process.env.DYNAMODB_TABLE;

const dynamoDB = new AWS.DynamoDB.DocumentClient();

const sendTelegramMessage = async (chatId, text) => {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  await axios.post(url, {
      chat_id: chatId,
      text: text,
      parse_mode: 'HTML'
  });
}

const notifyDeniz = async (text) => {
  const url = `https://api.telegram.org/bot${DENIZ_BOT_TOKEN}/sendMessage`;
  await axios.post(url, {
      chat_id: DENIZ_BOT_CHATID,
      text: text,
      parse_mode: 'HTML'
  });
}

const getUserByTelegramId = async (telegramId) => {
  const params = {
    TableName: TABLE_NAME,
    Key: { id: String(telegramId) },
  };
  const result = await dynamoDB.get(params).promise();
  return result.Item;
}

const generateAuthUrl = (telegramId) => {
  const oAuth2Client = getOAuthClient();
  const state = String(telegramId); // or better: a random token stored in DB, then link them after verifying
  const url = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar','https://www.googleapis.com/auth/calendar.events'],
    prompt: 'consent', // ensure we get a refresh_token
    state: state,
    include_granted_scopes: true,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI
  });
  return url;
}

const fetchImageFromMessage = async (photo) => {

  const photoFileId = photo.slice(-1)[0].file_id;
  
  const getFileUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getFile?file_id=${photoFileId}`;
  const filePathResponse = await axios.get(getFileUrl);
  const fileData = filePathResponse.data;
  
  if (fileData.ok) {
    const filePath = fileData.result.file_path;
    const downloadUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${filePath}`;
    const imageResponse = await axios.get(downloadUrl,  {responseType: 'arraybuffer'});

    const base64Image = Buffer.from(imageResponse.data, 'binary').toString('base64');

    return base64Image;
  }
}

const getOAuthClient = () => {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

module.exports = {
  fetchImageFromMessage,
  getUserByTelegramId,
  sendTelegramMessage,
  generateAuthUrl,
  getOAuthClient,
  notifyDeniz
};
