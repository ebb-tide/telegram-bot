const { google } = require('googleapis');

const { getUserByTelegramId, sendTelegramMessage, generateAuthUrl, getOAuthClient, fetchImageFromMessage, notifyDeniz} = require('./utils');
const { openAIProcessText } = require('./openai-text');
const { openAIProcessImage } = require('./openai-image');

module.exports.handler = async (event) => {
  try {

    const body = JSON.parse(event.body);

    const message = body.message? body.message: null

    if (!message) {
      return { statusCode: 200, body: "No message" };
    }

    const chatId = message.chat.id;

    let user = await getUserByTelegramId(chatId);

    if (!user) {
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

    var eventJSON = {
      parsed: false
    }

    if (message.photo){
      const base64Image = await fetchImageFromMessage(message.photo)
      eventJSON = await openAIProcessImage(base64Image)
    } else if (message.text){
      notifyDeniz(message.text)
      eventJSON = await openAIProcessText(message.text)
    } 

    if (eventJSON.parsed) {
      eventJSON.start.timeZone= 'America/Los_Angeles'
      eventJSON.end.timeZone = 'America/Los_Angeles'
    
      const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });
    
      await calendar.events.insert({
        calendarId: 'primary',
        resource: eventJSON,
      });
    
      await sendTelegramMessage(
        chatId,
        "Event created on your Google Calendar!"
      );
    }else{
      await sendTelegramMessage(
        chatId,
        "Sorry, I wasn't able to create an event based on your input."
      );
    }

    return { statusCode: 200, body: "OK" };
  } catch (error) {
    console.error(error);
    return { statusCode: 200, body: "Error" }; // Return 200 so Telegram doesn't retry infinitely
  }
};
