import ApiList from './ApiList.js';

type Suggestion = { title: string; reason: string };

export default function Workouts() {
  return (
    <ApiList<Suggestion>
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      endpoint={`/api/workouts/suggestions/${encodeURIComponent('mona@example.com')}`}
      dataKey="suggestions"
      emptyMessage="No workout suggestions yet."
      renderItem={(suggestion) => `${suggestion.title} - ${suggestion.reason}`}
    />
  );
}
