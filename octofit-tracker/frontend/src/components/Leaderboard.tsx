import ApiList from './ApiList.js';

type Entry = { teamName: string; totalPoints: number; rank: number };

export default function Leaderboard() {
  return (
    <ApiList<Entry>
      title="Leaderboard"
      description="Compare team point totals."
      endpoint="/api/leaderboard"
      dataKey="leaderboard"
      emptyMessage="No leaderboard scores yet."
      renderItem={(entry) => `${entry.rank}. ${entry.teamName}: ${entry.totalPoints} points`}
    />
  );
}
