import { Canvas } from 'fabric';
import { Play } from '../../../shared/models/models';
import { buildPlaySavePayload, PlayEditorPersistedState } from './play-editor-persistence.utils';

export interface PlaySaveControllerDeps {
  getCanvas: () => Canvas;
  getSnapshot: () => PlayEditorPersistedState;
  getPlayDesc: () => string;
  getPlayCat: () => string | undefined;
  save: (play: Play) => Promise<string>;
}

interface PersistOptions {
  playId: string | null;
  name: string;
  extra?: Partial<Play>;
}

/** Builds the play save payload (state snapshot + thumbnail) and persists it, shared by save/duplicate/save-as-template. */
export class PlaySaveController {
  constructor(private readonly deps: PlaySaveControllerDeps) {}

  persist({ playId, name, extra }: PersistOptions): Promise<string> {
    const play = buildPlaySavePayload({
      playId,
      name,
      description: this.deps.getPlayDesc(),
      category_id: this.deps.getPlayCat(),
      state: this.deps.getSnapshot(),
      thumbnail: this.deps.getCanvas().toDataURL({ multiplier: 1, format: 'jpeg', quality: 0.6 }),
    });
    return this.deps.save({ ...play, ...extra });
  }
}
