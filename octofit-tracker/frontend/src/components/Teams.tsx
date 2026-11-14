import ApiList from './ApiList.js';

type Team = { name: string; members?: string[] | null };

export default function Teams() {
  return (
    <ApiList<Team>
      title="Teams"
      description="Manage teams and members."
      endpoint="/api/teams"
      dataKey="teams"
      emptyMessage="No teams yet."
      renderItem={(team) => `${team.name} - ${team.members?.length ?? 0} members`}
    />
  );
}
