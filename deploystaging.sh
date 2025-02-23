#!/bin/bash

# Load environment variables from .env file
source .env

# Deploy using SAM CLI with parameters
sam deploy \
  --template-file staging-template.yaml \
  --stack-name staging-telegram-calendar-bot \
  --no-confirm-changeset \
  --parameter-overrides \
    GoogleClientSecret="$GOOGLE_CLIENT_SECRET" \
    DynamoDBTable="$STAGING_DYNAMODB_TABLE" \
    TelegramBotToken="$STAGING_TELEGRAM_BOT_TOKEN" \
    GoogleClientId="$GOOGLE_CLIENT_ID" \
    OpenAIApiKey="$OPENAI_API_KEY" \
    GoogleRedirectUri="$GOOGLE_REDIRECT_URI" \
    DenizBotToken="$DENIZ_BOT_TOKEN" \
    DenizBotChatId="$DENIZ_BOT_CHATID"