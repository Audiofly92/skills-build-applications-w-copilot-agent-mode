import { Activity, Team, User, Workout } from '../models/index.js';
import mongoose from 'mongoose';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw Object.assign(new Error('Activity details are required'), { status: 400 });
  }
  const { userId, teamId, type, minutes } = input as Record<string, unknown>;
  if (
    typeof userId !== 'string' || !mongoose.isValidObjectId(userId) ||
    typeof teamId !== 'string' || !mongoose.isValidObjectId(teamId) ||
    typeof type !== 'string' || type.trim().length === 0 ||
    typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0
  ) {
    throw Object.assign(new Error('Valid userId, teamId, type, and positive minutes are required'), { status: 400 });
  }
  const [user, team] = await Promise.all([User.findById(userId), Team.findById(teamId)]);
  if (!user || !team) {
    throw Object.assign(new Error('User or team not found'), { status: 404 });
  }
  return Activity.create({
    user: user._id,
    team: team._id,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw Object.assign(new Error('Team details are required'), { status: 400 });
  }
  const { name, mascot, members = [] } = input as Record<string, unknown>;
  if (
    typeof name !== 'string' || name.trim().length === 0 ||
    typeof mascot !== 'string' || mascot.trim().length === 0 ||
    !Array.isArray(members) ||
    members.some((member) => typeof member !== 'string' || !mongoose.isValidObjectId(member))
  ) {
    throw Object.assign(new Error('Valid name, mascot, and member IDs are required'), { status: 400 });
  }
  const memberIds = [...new Set(members as string[])];
  const users = await User.find({ _id: { $in: memberIds } });
  if (users.length !== memberIds.length) {
    throw Object.assign(new Error('One or more team members were not found'), { status: 404 });
  }
  const team = await Team.create({ name: name.trim(), mascot: mascot.trim(), members: memberIds });
  const previousTeamIds = users.flatMap((user) => user.team ? [user.team] : []);
  if (previousTeamIds.length > 0) {
    await Team.updateMany(
      { _id: { $in: previousTeamIds } },
      { $pull: { members: { $in: memberIds } } },
    );
  }
  if (memberIds.length > 0) {
    await User.updateMany({ _id: { $in: memberIds } }, { $set: { team: team._id } });
  }
  return team;
}

export async function getLeaderboard() {
  const teams = await Team.aggregate([
    {
      $lookup: {
        from: Activity.collection.name,
        localField: '_id',
        foreignField: 'team',
        as: 'activities',
      },
    },
    {
      $project: {
        teamName: '$name',
        totalPoints: { $sum: '$activities.points' },
      },
    },
    { $sort: { totalPoints: -1, teamName: 1 } },
  ]);
  return teams.map(({ teamName, totalPoints }, index) => ({ teamName, totalPoints, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }
  const [recentActivity, workouts] = await Promise.all([
    Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).lean(),
    Workout.find().lean(),
  ]);
  const goalMatchExists = workouts.some((workout) => workout.focus === user.fitnessGoal);
  const preferredFocus = goalMatchExists ? user.fitnessGoal : recentActivity?.type;
  const orderedWorkouts = [...workouts].sort((a, b) => {
    if (!preferredFocus) return 0;
    return Number(b.focus === preferredFocus) - Number(a.focus === preferredFocus);
  });
  return orderedWorkouts.map((workout) => ({
    ...workout,
    reason: workout.focus === user.fitnessGoal
      ? `Recommended for your ${user.fitnessGoal} goal${recentActivity ? ` and recent ${recentActivity.type} activity` : ''}.`
      : recentActivity && workout.focus === recentActivity.type
        ? `Recommended based on your recent ${recentActivity.type} activity.`
        : `Recommended as an alternative to your ${user.fitnessGoal} goal.`,
  }));
}

export { User };
