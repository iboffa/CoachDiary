import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    const dbPath = path.join(app.getPath('userData'), 'coachdiary.db');
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    migrate(db);
  }
  return db;
}

function migrate(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      number INTEGER,
      position TEXT,
      height TEXT,
      weight TEXT,
      dominant_hand TEXT DEFAULT 'right',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS player_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'general',
      content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS plays (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT DEFAULT 'offense',
      canvas_state TEXT NOT NULL DEFAULT '{}',
      thumbnail TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS training_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      date TEXT,
      duration_minutes INTEGER,
      focus TEXT,
      notes TEXT,
      drills TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS season_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      season_year TEXT,
      start_date TEXT,
      end_date TEXT,
      goals TEXT,
      events TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS game_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      opponent TEXT,
      score TEXT,
      location TEXT,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
}

// --- Players ---
export const playerHandlers = {
  list: () => getDb().prepare('SELECT * FROM players ORDER BY number').all(),
  get: (id: number) => getDb().prepare('SELECT * FROM players WHERE id = ?').get(id),
  save: (player: any) => {
    if (player.id) {
      getDb().prepare(
        `UPDATE players SET name=?, number=?, position=?, height=?, weight=?, dominant_hand=?, updated_at=datetime('now') WHERE id=?`
      ).run(player.name, player.number, player.position, player.height, player.weight, player.dominant_hand, player.id);
      return player.id;
    }
    const result = getDb().prepare(
      `INSERT INTO players (name, number, position, height, weight, dominant_hand) VALUES (?,?,?,?,?,?)`
    ).run(player.name, player.number, player.position, player.height, player.weight, player.dominant_hand ?? 'right');
    return result.lastInsertRowid;
  },
  delete: (id: number) => getDb().prepare('DELETE FROM players WHERE id = ?').run(id),
};

export const playerNoteHandlers = {
  list: (playerId: number) => getDb().prepare('SELECT * FROM player_notes WHERE player_id = ? ORDER BY date DESC').all(playerId),
  save: (note: any) => {
    if (note.id) {
      getDb().prepare(`UPDATE player_notes SET date=?, category=?, content=? WHERE id=?`).run(note.date, note.category, note.content, note.id);
      return note.id;
    }
    const result = getDb().prepare(
      `INSERT INTO player_notes (player_id, date, category, content) VALUES (?,?,?,?)`
    ).run(note.player_id, note.date, note.category, note.content);
    return result.lastInsertRowid;
  },
  delete: (id: number) => getDb().prepare('DELETE FROM player_notes WHERE id = ?').run(id),
};

// --- Plays ---
export const playHandlers = {
  list: () => getDb().prepare('SELECT id, name, description, category, thumbnail, created_at, updated_at FROM plays ORDER BY updated_at DESC').all(),
  get: (id: number) => getDb().prepare('SELECT * FROM plays WHERE id = ?').get(id),
  save: (play: any) => {
    if (play.id) {
      getDb().prepare(
        `UPDATE plays SET name=?, description=?, category=?, canvas_state=?, thumbnail=?, updated_at=datetime('now') WHERE id=?`
      ).run(play.name, play.description, play.category, play.canvas_state, play.thumbnail, play.id);
      return play.id;
    }
    const result = getDb().prepare(
      `INSERT INTO plays (name, description, category, canvas_state, thumbnail) VALUES (?,?,?,?,?)`
    ).run(play.name, play.description ?? '', play.category ?? 'offense', play.canvas_state ?? '{}', play.thumbnail ?? null);
    return result.lastInsertRowid;
  },
  delete: (id: number) => getDb().prepare('DELETE FROM plays WHERE id = ?').run(id),
};

// --- Training Sessions ---
export const trainingHandlers = {
  list: () => getDb().prepare('SELECT * FROM training_sessions ORDER BY date DESC').all(),
  get: (id: number) => getDb().prepare('SELECT * FROM training_sessions WHERE id = ?').get(id),
  save: (session: any) => {
    if (session.id) {
      getDb().prepare(
        `UPDATE training_sessions SET name=?, date=?, duration_minutes=?, focus=?, notes=?, drills=?, updated_at=datetime('now') WHERE id=?`
      ).run(session.name, session.date, session.duration_minutes, session.focus, session.notes, session.drills, session.id);
      return session.id;
    }
    const result = getDb().prepare(
      `INSERT INTO training_sessions (name, date, duration_minutes, focus, notes, drills) VALUES (?,?,?,?,?,?)`
    ).run(session.name, session.date, session.duration_minutes, session.focus ?? '', session.notes ?? '', session.drills ?? '[]');
    return result.lastInsertRowid;
  },
  delete: (id: number) => getDb().prepare('DELETE FROM training_sessions WHERE id = ?').run(id),
};

// --- Season Plans ---
export const seasonHandlers = {
  list: () => getDb().prepare('SELECT * FROM season_plans ORDER BY start_date DESC').all(),
  get: (id: number) => getDb().prepare('SELECT * FROM season_plans WHERE id = ?').get(id),
  save: (plan: any) => {
    if (plan.id) {
      getDb().prepare(
        `UPDATE season_plans SET name=?, season_year=?, start_date=?, end_date=?, goals=?, events=?, updated_at=datetime('now') WHERE id=?`
      ).run(plan.name, plan.season_year, plan.start_date, plan.end_date, plan.goals, plan.events, plan.id);
      return plan.id;
    }
    const result = getDb().prepare(
      `INSERT INTO season_plans (name, season_year, start_date, end_date, goals, events) VALUES (?,?,?,?,?,?)`
    ).run(plan.name, plan.season_year, plan.start_date, plan.end_date, plan.goals ?? '', plan.events ?? '[]');
    return result.lastInsertRowid;
  },
  delete: (id: number) => getDb().prepare('DELETE FROM season_plans WHERE id = ?').run(id),
};

// --- Game Notes ---
export const gameNoteHandlers = {
  list: () => getDb().prepare('SELECT * FROM game_notes ORDER BY date DESC').all(),
  save: (note: any) => {
    if (note.id) {
      getDb().prepare(`UPDATE game_notes SET date=?, opponent=?, score=?, location=?, content=? WHERE id=?`).run(note.date, note.opponent, note.score, note.location, note.content, note.id);
      return note.id;
    }
    const result = getDb().prepare(
      `INSERT INTO game_notes (date, opponent, score, location, content) VALUES (?,?,?,?,?)`
    ).run(note.date, note.opponent, note.score, note.location, note.content);
    return result.lastInsertRowid;
  },
  delete: (id: number) => getDb().prepare('DELETE FROM game_notes WHERE id = ?').run(id),
};
