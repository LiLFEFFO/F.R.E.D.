export interface User {
  id: string;
  username: string;
  email: string;
  role: 'standard' | 'elite';
  avatar: string;
  discord_id: string;
  created_at: string;
}

export interface Championship {
  id: string;
  name: string;
  season: string;
  description: string;
  cover_image: string;
  rules: string;
  max_participants: number;
  status: 'active' | 'concluded';
  created_by: string;
  organizer_name: string;
  driver_count: number;
  race_count: number;
  completed_races: number;
  created_at: string;
  updated_at: string;
  scoring?: ScoringSystem;
  next_race?: Race | null;
  last_results?: any[];
}

export interface ScoringSystem {
  id: string;
  championship_id: string;
  position_points: string;
  pole_bonus: number;
  fastest_lap_bonus: number;
}

export interface Team {
  id: string;
  championship_id: string;
  name: string;
  color: string;
  logo: string;
  reserve_driver_id: string | null;
  driver_count?: number;
}

export interface Driver {
  id: string;
  user_id: string | null;
  championship_id: string;
  team_id: string | null;
  name: string;
  number: number;
  avatar: string;
  team_name?: string;
  team_color?: string;
  points?: number;
  position?: number;
  wins?: number;
  podiums?: number;
  poles?: number;
  fastest_laps?: number;
  races_done?: number;
  previous_position?: number;
  avg_points?: number;
  podium_pct?: number;
  results?: RaceResult[];
}

export interface Race {
  id: string;
  championship_id: string;
  name: string;
  circuit: string;
  date: string;
  weather: string;
  status: 'scheduled' | 'in_progress' | 'completed';
  results?: RaceResult[];
}

export interface RaceResult {
  id: string;
  race_id: string;
  driver_id: string;
  position: number;
  points: number;
  pole_position: boolean;
  fastest_lap: boolean;
  dnf: boolean;
  present: boolean;
  penalties: string;
  notes: string;
  driver_name?: string;
  driver_number?: number;
  driver_avatar?: string;
  team_name?: string;
  team_color?: string;
}

export interface TitleScenario {
  driver_id: string;
  driver_name: string;
  driver_number: number;
  avatar: string;
  team_name: string;
  team_color: string;
  current_points: number;
  can_win_next_race: boolean;
  position_needed: number;
  leader_driver_name: string;
  leader_driver_id: string;
  leader_points: number;
  leader_position_limit: number;
  scenario_description: string;
}

export interface TitleScenariosResponse {
  scenarios: TitleScenario[];
  concluded?: boolean;
  no_next_race?: boolean;
  next_race?: any;
  remaining_races?: number;
  max_points_per_race?: number;
}

export interface DriverStanding {
  id: string;
  championship_id: string;
  driver_id: string;
  driver_name: string;
  driver_number: number;
  avatar: string;
  team_id: string | null;
  team_name: string;
  team_color: string;
  points: number;
  wins: number;
  podiums: number;
  poles: number;
  fastest_laps: number;
  position: number;
  previous_position: number;
  races_done: number;
}

export interface ConstructorStanding {
  id: string;
  championship_id: string;
  team_id: string;
  team_name: string;
  team_color: string;
  points: number;
  position: number;
  previous_position: number;
  driver_count: number;
}

export interface Notification {
  id: string;
  user_id: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}

export interface Badge {
  id: string;
  user_id: string;
  championship_id: string;
  name: string;
  description: string;
  icon: string;
  awarded_at: string;
}

export interface Statistics {
  drivers: DriverStat[];
  race_history: RaceHistory[];
}

export interface DriverStat {
  id: string;
  name: string;
  number: number;
  avatar: string;
  team_name: string;
  team_color: string;
  points: number;
  wins: number;
  podiums: number;
  poles: number;
  fastest_laps: number;
  races_done: number;
  avg_points: number;
  podium_pct: number;
  position: number;
}

export interface RaceHistory {
  id: string;
  name: string;
  circuit: string;
  date: string;
  results: { driver_id: string; position: number; points: number; pole: boolean; fl: boolean; dnf: boolean }[];
}
