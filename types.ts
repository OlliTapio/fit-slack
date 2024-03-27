import { SectionBlock } from "@slack/bolt";

export type LeaderboardEntry = {
    user_id: string;
    total: number;
  };
  
  export type MostPushupsEntry = LeaderboardEntry & {
    date: string;
  };
  
  export type LeaderboardData = {
    totalLeaderboard: LeaderboardEntry[];
    dailyLeaderboard: LeaderboardEntry[];
    mostInADay: MostPushupsEntry;
  };

  export type SayResponse = {
    text: string;
    blocks?: SectionBlock[];
  }

  export type UserDictionary = {
    [key: string]: string;
  };

  export type CountUpdate = {
    totalCompetition: OvertakingStatus; 
    dailyCompetition: OvertakingStatus;
  }

  export type OvertakingStatus = {
    user: string;
    userCount: number;
    next: string;
    nextCount: number;
  }

  export type CurrentAndNextEntry = {
    current?: LeaderboardEntry;
    next?: LeaderboardEntry;
  }