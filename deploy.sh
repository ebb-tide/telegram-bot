#!/bin/bash

# Load environment variables from .env file
source .env

# Deploy using SAM CLI with parameters
sam deploy \
  --template-file template.yaml \
  --stack-name telegram-calendar-bot \
  --parameter-overrides \
    GoogleClientSecret="$GOOGLE_CLIENT_SECRET" \
    DynamoDBTable="$DYNAMODB_TABLE" \
    TelegramBotToken="$TELEGRAM_BOT_TOKEN" \
    GoogleClientId="$GOOGLE_CLIENT_ID" \
    OpenAIApiKey="$OPENAI_API_KEY" \
    GoogleRedirectUri="$GOOGLE_REDIRECT_URI" \
    DenizBotToken="$DENIZ_BOT_TOKEN" \
    DenizBotChatId="$DENIZ_BOT_CHATID"