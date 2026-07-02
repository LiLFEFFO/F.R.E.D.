export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  role: 'standard' | 'elite';
  discord_id: string;
  avatar: string;
  created_at: string;
  updated_at: string;
}

export interface Championship {
  id: string;
  name: string;
  season: string;
  description: string;
  cover_image: string;
  rules: string;
  max_participants: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ScoringSystem {
  id: string;
  championship_id: string;
  position_points: string;
  pole_bonus: number;
  fastest_lap_bonus: number;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  championship_id: string;
  name: string;
  color: string;
  logo: string;
  reserve_driver_id: string | null;
  created_at: string;
}

export interface Driver {
  id: string;
  user_id: string | null;
  championship_id: string;
  team_id: string | null;
  name: string;
  number: number;
  avatar: string;
  created_at: string;
}

export interface Race {
  id: string;
  championship_id: string;
  name: string;
  circuit: string;
  date: string;
  weather: string;
  status: 'scheduled' | 'in_progress' | 'completed';
  created_at: string;
  updated_at: string;
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
  penalties: string;
  notes: string;
  created_at: string;
}

export interface DriverStanding {
  id: string;
  championship_id: string;
  driver_id: string;
  points: number;
  wins: number;
  podiums: number;
  poles: number;
  fastest_laps: number;
  position: number;
  previous_position: number;
  races_done: number;
  updated_at: string;
}

export interface ConstructorStanding {
  id: string;
  championship_id: string;
  team_id: string;
  points: number;
  position: number;
  previous_position: number;
  updated_at: string;
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
