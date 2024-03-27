import { SectionBlock } from "@slack/bolt";
import { LeaderboardData, UserDictionary } from "./types";

export async function formatLeaderboard(leaderboardData: LeaderboardData, userNameDict: UserDictionary): Promise<SectionBlock[]> {
    const { totalLeaderboard, dailyLeaderboard, mostInADay } = leaderboardData

    const totalLeaderboardNames = await Promise.all(
        totalLeaderboard.map(async (entry) => {
          return `${userNameDict[entry.user_id]} - ${entry.total}`;
        })
      );
    
      const dailyLeaderboardNames = await Promise.all(
        dailyLeaderboard.map(async (entry) => {
          return `${userNameDict[entry.user_id]} - ${entry.total}`;
        })
      );

    const mostInADayDate = new Date(mostInADay.date)
    const formattedDate = mostInADayDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const blocks: SectionBlock[] = [
          {
            type: 'section',
            text:{
              type: 'mrkdwn',
              text: `*Total Pushups Leaderboard*\n${totalLeaderboardNames.join('\n')}`
            }
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Daily Pushups Leaderboard (Today)*\n${dailyLeaderboardNames.join('\n')}`
            }
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Most Pushups in a Single Day*\n${userNameDict[mostInADay.user_id]} - ${mostInADay.total} (${formattedDate})`
            }
          }
        ]

      return blocks
}