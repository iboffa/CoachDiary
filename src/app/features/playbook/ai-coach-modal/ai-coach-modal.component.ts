import {
  Component, EventEmitter, Input, OnInit, Output, inject, signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DbService } from '../../../core/services/db.service';
import { RagService, ChatMessage, RosterPlayer, ChatResponse } from '../../../core/services/rag.service';
import { PlayEditorState } from '../../../core/services/rag.service';
import { Player } from '../../../shared/models/models';

interface DisplayMessage {
  role: 'user' | 'assistant';
  content: string;
  success?: boolean;
  options?: string[];
}

@Component({
  selector: 'app-ai-coach-modal',
  imports: [FormsModule],
  templateUrl: './ai-coach-modal.component.html',
  styleUrl: './ai-coach-modal.component.scss',
})
export class AiCoachModalComponent implements OnInit {
  @Input() teamId!: string;
  @Input() courtMode: 'half' | 'full' = 'half';
  @Input() getPlay?: () => PlayEditorState;
  @Output() playGenerated = new EventEmitter<PlayEditorState>();

  private readonly db = inject(DbService);
  private readonly ragService = inject(RagService);

  private history: ChatMessage[] = [];
  roster: RosterPlayer[] = [];

  readonly messages = signal<DisplayMessage[]>([]);
  readonly loading = signal(false);
  inputText = '';

  async ngOnInit(): Promise<void> {
    const players: Player[] = await this.db.listPlayers(this.teamId);
    this.roster = players.map(p => ({
      name: p.name,
      position: p.position,
      number: p.number,
      role: p.role,
      strengths: p.strengths,
      weaknesses: p.weaknesses,
      notes: p.notes,
    }));
  }

  resetChat(): void {
    this.history = [];
    this.messages.set([]);
    this.inputText = '';
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  selectOption(option: string): void {
    this.inputText = option;
    this.send();
  }

  send(): void {
    const text = this.inputText.trim();
    if (!text || this.loading()) return;

    this.inputText = '';
    this.messages.update(msgs => [...msgs, { role: 'user', content: text }]);
    this.loading.set(true);

    const currentPlay = this.getPlay?.();
    console.log('[modal] getPlay bound:', !!this.getPlay, 'tokens:', currentPlay?.tokens?.length ?? 'none');

    this.ragService.chat({
      history: this.history,
      message: text,
      roster: this.roster,
      courtMode: this.courtMode,
      currentPlay,
    }).subscribe({
      next: (response: ChatResponse) => {
        this.loading.set(false);
        this.history.push({ role: 'user', content: text });
        this.history.push({ role: 'assistant', content: response.message });

        if (response.type === 'play' && response.play) {
          this.playGenerated.emit(response.play);
          this.messages.update(msgs => [
            ...msgs,
            { role: 'assistant', content: response.message },
            { role: 'assistant', content: '✓ Play loaded on the canvas. Edit it manually or describe changes to refine it.', success: true },
          ]);
          this.history = [];
        } else {
          const opts = response.options?.length ? response.options : undefined;
          this.messages.update(msgs => [...msgs, { role: 'assistant', content: response.message, options: opts }]);
        }
      },
      error: () => {
        this.loading.set(false);
        this.messages.update(msgs => [
          ...msgs,
          { role: 'assistant', content: 'Something went wrong connecting to the AI server. Make sure the RAG server is running.' },
        ]);
      },
    });
  }
}
