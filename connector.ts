// index.ts or wherever you set up Knex
import knex from 'knex';
import config from './knexfile'; // Adjust the path as necessary
import { CountUpdate, CurrentAndNextEntry, LeaderboardData, LeaderboardEntry, MostPushupsEntry, OvertakingStatus } from './types';
import { ensureNumber } from './helpers';

const environment = process.env.NODE_ENV || 'development';
const connectionConfig = config[environment];

const knexInstance = knex(connectionConfig);

export async function addPushups(userId: string, pushupsCount: number) {
    // Example: Inserting the pushup record into the database
    await knexInstance('pushup_records').insert({
      user_id: userId,
      count: pushupsCount,
      date: new Date(), // Assuming you want to record the current date
    });
}

export async function countPushupsWithOverTaking(userId: string): Promise<CountUpdate> {
  const totalPushups = await countTotalPushups()
  const todaysPushups = await countTodaysPushups()

  const total = findEntryAndNext(totalPushups, userId)
  const totalOvertakingStatus: OvertakingStatus = {
    user: total.current?.user_id ?? '',
    userCount: ensureNumber(total.current?.total ?? 0),
    next: total.next?.user_id ?? '',
    nextCount: ensureNumber(total.next?.total ?? 0),
  }
  
  const daily = findEntryAndNext(todaysPushups, userId)
  const dailyOvertakingStatus: OvertakingStatus = {
    user: daily.current?.user_id ?? '',
    userCount: ensureNumber(daily.current?.total ?? 0),
    next: daily.next?.user_id ?? '',
    nextCount: ensureNumber(daily.next?.total ?? 0),
  }

  return {
    totalCompetition: totalOvertakingStatus,
    dailyCompetition: dailyOvertakingStatus
  }
}

export async function countTotalPushups(): Promise<LeaderboardEntry[]>  {
  const totalPushups = await knexInstance('pushup_records')
  .select('user_id')
  .groupBy('user_id')
  .sum('count as total')
  .orderBy('total', 'desc');
  
  return totalPushups.map((entry: any): LeaderboardEntry => ({
    user_id: entry.user_id,
    total: entry.total,
  }))
}


export async function countTodaysPushups(): Promise<LeaderboardEntry[]>  {
  const todaysPushups = await knexInstance('pushup_records')
  .select('user_id')
  .where('date', new Date())
  .groupBy('user_id')
  .sum('count as total')
  .orderBy('total', 'desc');
  
  return todaysPushups.map((entry: any): LeaderboardEntry => ({
    user_id: entry.user_id,
    total: entry.total,
  }))
}




export async function fetchLeaderboardData(): Promise<LeaderboardData> {
  const totalLeaderboard: LeaderboardEntry[] = await fetchTotalLeaderboard();
  const dailyLeaderboard: LeaderboardEntry[] = await fetchDailyLeaderboard();
  const mostInADay: MostPushupsEntry = await fetchMostPushupsInADay();

  return { totalLeaderboard, dailyLeaderboard, mostInADay };
}

export async function fetchTotalLeaderboard(): Promise<LeaderboardEntry[]> {
  const totalLeaderboard = await knexInstance('pushup_records')
        .select('user_id')
        .sum('count as total')
        .groupBy('user_id')
        .orderBy('total', 'desc')
        .limit(3);

  return totalLeaderboard.map((entry: any): LeaderboardEntry => ({
    user_id: entry.user_id,
    total: entry.total,
  }));
}

export async function fetchDailyLeaderboard(): Promise<LeaderboardEntry[]> {
  const dailyLeaderboard = await knexInstance('pushup_records')
    .select('user_id')
    .sum('count as total')
    .where('date', new Date())
    .groupBy('user_id', 'date')
    .orderBy('total', 'desc')
    .limit(3);

  return dailyLeaderboard.map((entry: any): LeaderboardEntry => ({
    user_id: entry.user_id,
    total: entry.total,
  }));
}

export async function fetchMostPushupsInADay(): Promise<MostPushupsEntry> {
  const mostInADay = await knexInstance('pushup_records')
    .select('user_id', 'date')
    .sum('count as total')
    .groupBy('user_id', 'date')
    .orderBy('total', 'desc')
    .first();


  return {
    user_id: mostInADay?.user_id,
    total: mostInADay?.total,
    date: mostInADay?.date
  };
}

function findEntryAndNext(entries: LeaderboardEntry[], userId: string): CurrentAndNextEntry {
  // Find the index of the entry with the given user_id
  const index = entries.findIndex(entry => entry.user_id === userId);
  // If not found, both entries are undefined
  if (index === -1) {
    return {};
  }
  // Access the found entry and the next one using the index
  // Use undefined if the next entry does not exist
  const foundEntry = entries[index];

  let nextEntry = undefined

  if (index > 0) {
    nextEntry = entries[index - 1];
  }

  return {current: foundEntry, next: nextEntry};
}