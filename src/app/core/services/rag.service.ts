import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// ---------------------------------------------------------------------------
// Request / response types — mirror the Python models in rag-server/src/models.py
// ---------------------------------------------------------------------------

export interface QueryRequest {
  question: string;
}

export interface QueryResponse {
  answer: string;
  sources: string[];
}

export interface PlayRequest {
  description: string;
  num_players?: number;
  court_mode?: 'half' | 'full';
}

export interface Point {
  x: number;
  y: number;
}

export interface PlayerToken {
  id: string;
  type: 'offense' | 'defense';
  label: string;
  position: Point;
}

export interface StoredPath {
  ownerId: string;
  actionType: 'dribble' | 'pass' | 'cut' | 'screen' | 'dribble-handoff' | 'shoot';
  points: Point[];
  targetId: string | null;
}

export interface Phase {
  playerPositions: Record<string, Point>;
  ballCarrierId: string | null;
  paths: StoredPath[];
}

export interface PlayEditorState {
  tokens: PlayerToken[];
  phases: Phase[];
  ballCarrierId: string | null;
  currentPhaseIndex: number;
  currentPhasePaths: StoredPath[];
  courtMode: 'half' | 'full';
}

export interface PlayResponse {
  name: string;
  description: string;
  play: PlayEditorState;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface RosterPlayer {
  name: string;
  position: string;
  number: number;
  role?: string;
  strengths?: string;
  weaknesses?: string;
  notes?: string;
}

export interface ChatRequest {
  history: ChatMessage[];
  message: string;
  roster: RosterPlayer[];
  courtMode: string;
  currentPlay?: PlayEditorState;
}

export interface ChatResponse {
  type: 'question' | 'play';
  message: string;
  play?: PlayEditorState;
  options?: string[];
}

// ---------------------------------------------------------------------------

@Injectable({ providedIn: 'root' })
export class RagService {
  private readonly baseUrl = environment.ragServerUrl;

  constructor(private http: HttpClient) {}

  query(question: string): Observable<QueryResponse> {
    const body: QueryRequest = { question };
    return this.http.post<QueryResponse>(`${this.baseUrl}/query`, body);
  }

  generatePlay(
    description: string,
    numPlayers = 5,
    courtMode: 'half' | 'full' = 'half',
  ): Observable<PlayResponse> {
    const body: PlayRequest = { description, num_players: numPlayers, court_mode: courtMode };
    return this.http.post<PlayResponse>(`${this.baseUrl}/generate-play`, body);
  }

  chat(request: ChatRequest): Observable<ChatResponse> {
    const body: Record<string, unknown> = {
      history: request.history,
      message: request.message,
      roster: request.roster,
      court_mode: request.courtMode,
    };
    if (request.currentPlay) body['current_play'] = request.currentPlay;
    return this.http.post<ChatResponse>(`${this.baseUrl}/chat`, body);
  }
}
