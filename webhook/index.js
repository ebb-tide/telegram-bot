const { google } = require('googleapis');

const { 
  getUserByTelegramId, 
  sendTelegramMessage, 
  generateAuthUrl, 
  getOAuthClient, 
  fetchImageFromMessage, 
  notifyDeniz, 
  selectCalendar
} = require('./utils');
const { openAIProcessText } = require('./openai-text');
const { openAIProcessImage } = require('./openai-image');
const env = process.env.ENVIRONMENT;

module.exports.handler = async (event) => {
  try {

    const body = JSON.parse(event.body);

    const message = body.message? body.message: null

    if (!message) {
      throw new Error(`[internal] No message in body`);
    }

    const chatId = message.chat.id;

    let user = await getUserByTelegramId(chatId);

    if (env === 'prod' && !user) {
      const authUrl = generateAuthUrl(chatId);

      notifyDeniz("new user!")

      await sendTelegramMessage(
        chatId,
        `Hello! To use me, please <a href="${authUrl.replace(/&/g, '&amp;')}"> connect your Google account. </a>`
      );

      return { statusCode: 200, body: "Auth link sent" };
    }

    const oAuth2Client = getOAuthClient();
    oAuth2Client.setCredentials({
      access_token: user.access_token,
      refresh_token: user.refresh_token
    });

    // await selectCalendar(oAuth2Client, chatId); 

    var eventJSON = {
      parsed: false
    }

    if (message.photo){
      const base64Image = await fetchImageFromMessage(message.photo)
      notifyDeniz("got an image")
      eventJSON = await openAIProcessImage(base64Image)
    } else if (message.text){
      notifyDeniz(message.text)
      eventJSON = await openAIProcessText(message.text)
    }

    if (eventJSON.parsed) {
      const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });
    
      await Promise.all(eventJSON.events.map(event => {
        return calendar.events.insert({
          calendarId: 'primary',
          requestBody: {
            start: {dateTime: event.start.dateTime, timeZone: 'America/Los_Angeles'},
            end: {dateTime: event.end.dateTime, timeZone: 'America/Los_Angeles'},
            summary: event.summary
          }
        });
      }));
      
      await sendTelegramMessage(
        chatId,
        eventJSON.report || "Event created on your Google Calendar!"
      );

    }else{
      await sendTelegramMessage(
        chatId,
        "Sorry, I wasn't able to create an event based on your input."
      );
      if (message.text) (
        notifyDeniz(`parse error: ${message.text}`)
      )
    }

    return { statusCode: 200, body: "OK" };
  } catch (error) {
    console.error(error);
    notifyDeniz(error)
    return { statusCode: 200, body: "Error" };
  }
};
