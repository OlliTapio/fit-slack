import { App, SectionBlock } from '@slack/bolt';
import dotenv from 'dotenv';
import { addPushups, countPushupsWithOverTaking, fetchLeaderboardData } from './connector';
import { formatLeaderboard } from './format_messages';
import { OvertakingStatus, SayResponse, UserDictionary } from './types';
dotenv.config();

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  // Extend with app features as needed
});

app.message(async ({ message, say }) => {
  // Check if the message is in a DM
  if (message.channel_type === 'im') {
    try {
      const {text, blocks} = await processIncomingMessage(message)
      // Respond to the message
      await say({
        channel: message.channel,
        text: text,
        blocks: blocks
      });
    } catch (error) {
      console.error('Error responding to the message: ', error);
    }
  }
});

async function processIncomingMessage(event: any): Promise<SayResponse> {
  // Extract message text and user ID
  const { text, user } = event;

  // Example: Check if the message contains a pushup count
  const pushupCountMatch = text.match(/-?\d+/); // Simple regex to find numbers
  if (pushupCountMatch) {
    const pushupCount = parseInt(pushupCountMatch[0], 10);
    const {totalCompetition, dailyCompetition} = await countPushupsWithOverTaking(user)

    await addPushups(user, pushupCount)

    const blocks: SectionBlock[] = []
    const totalUpdateBlock = await respondWithUserTotal(user, dailyCompetition.userCount + pushupCount, totalCompetition.userCount + pushupCount)
    blocks.push(totalUpdateBlock)

    if (dailyCompetition.next){
      const overtakeBlocks = await respondWithOvertakeInformation(dailyCompetition, pushupCount)
      blocks.push(overtakeBlocks)
    }

    return {text: 'Pushup update', blocks: blocks}
  }

  const total = text.match(/\b(total|leaderboard)\b/i); // Simple regex to find numbers

  if (total){
    const blocks = await respondWithLeaderboard()

    return {text: 'Leaderboard', blocks: blocks}

  }
  return {text: ''}
}

async function respondWithUserTotal(user: any, todaysPushups: number, totalPushups: number): Promise<SectionBlock> {
  const message = totalPushups
    ? `You've done ${totalPushups} pushups and ${todaysPushups} today! Keep it up!`
    : "It looks like you haven't recorded any pushups yet.";

  return {
    type: 'section',
    text: {
      type: 'plain_text',
      text: message
    }
  };
}

async function respondWithLeaderboard(): Promise<SectionBlock[]> {
  const users = await app.client.users.list()

  const userNameDict: UserDictionary = {};

  users.members?.forEach(user => {
    const { id, real_name } = user;
    if (id && real_name) {
      userNameDict[id] = user.profile?.display_name ?? real_name;
    }
  });

  const leaderboardData = await fetchLeaderboardData();

  return await formatLeaderboard(leaderboardData, userNameDict)
}

async function sendOvertakeNotification(userId: string, overtakenBy: string, isDaily: boolean) {
  try {
    const userResponse = await app.client.users.info({user: overtakenBy})

    // Open a conversation with the user
    const conversation = await app.client.conversations.open({ users: userId });
    const channelId = conversation.channel?.id;
    if (channelId && userResponse.user){
    // Craft the message
    const overtakerName = userResponse.user.profile?.display_name ?? userResponse.user.real_name
    const message = isDaily ? 
      `Heads up! You've been overtaken in today's daily pushup leaderboard by ${overtakerName}.` : 
      `Alert! You've been overtaken in the overall pushup leaderboard by ${overtakerName}.`;

    // Post the message to the opened conversation
    await app.client.chat.postMessage({
      channel: channelId,
      text: message,
    });
  }
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
}

async function respondWithOvertakeInformation(dailyCompetition: OvertakingStatus, pushupCount: number): Promise<SectionBlock> {
  const dailyOvertake = (dailyCompetition.nextCount < dailyCompetition.userCount + pushupCount)

  const userResponse = await app.client.users.info({user: dailyCompetition.next})
  const overtakerName = userResponse.user?.profile?.display_name ?? userResponse.user?.real_name

  const message = dailyOvertake
  ? `You overtook ${overtakerName}! Great job!`
  : `Only ${dailyCompetition.nextCount - dailyCompetition.userCount - pushupCount} to overtake ${overtakerName}! Keep pumping!`;

  if (dailyOvertake) {
    sendOvertakeNotification(dailyCompetition.next, dailyCompetition.user, true)
  }

  return {
    type: 'section',
    text: {
      type: 'plain_text',
      text: message
    }
  };
}

(async () => {
  // Start your app
  await app.start(process.env.PORT || 3000);

  console.log('⚡️ Slack app is running!');
})();
