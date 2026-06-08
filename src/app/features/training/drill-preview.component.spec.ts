import { TestBed } from '@angular/core/testing';
import { DrillPreviewComponent } from './drill-preview.component';
import { ExerciseCanvasState } from './exercise-editor/exercise-editor.models';

function makeState(overrides: Partial<ExerciseCanvasState> = {}): string {
  const state: ExerciseCanvasState = {
    version: 1,
    courtMode: 'half',
    tokens: [
      { id: 'off1', type: 'offense', label: '1', position: { x: 300, y: 255 } },
      { id: 'def1', type: 'defense', label: 'X', position: { x: 380, y: 255 } },
    ],
    phases: [
      {
        playerPositions: {
          off1: { x: 100, y: 255 },
          def1: { x: 200, y: 255 },
        },
        ballCarrierIds: ['off1'],
        paths: [
          {
            ownerId: 'off1',
            actionType: 'dribble',
            points: [{ x: 100, y: 255 }, { x: 150, y: 255 }, { x: 200, y: 200 }],
          },
        ],
      },
    ],
    ballCarrierIds: ['off1'],
    currentPhaseIndex: 0,
    currentPhasePaths: [],
    ...overrides,
  };
  return JSON.stringify(state);
}

function createComponent(canvasState?: string): DrillPreviewComponent {
  const fixture = TestBed.createComponent(DrillPreviewComponent);
  if (canvasState !== undefined) {
    fixture.componentRef.setInput('canvasState', canvasState);
  }
  return fixture.componentInstance;
}

describe('DrillPreviewComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DrillPreviewComponent],
    }).compileComponents();
  });

  // ── status ────────────────────────────────────────────────────

  describe('status', () => {
    it('is "empty" when canvasState is undefined', () => {
      expect(createComponent().status()).toBe('empty');
    });

    it('is "empty" when canvasState is null', () => {
      expect(createComponent(undefined).status()).toBe('empty');
    });

    it('is "invalid" for malformed JSON', () => {
      expect(createComponent('not-json').status()).toBe('invalid');
    });

    it('is "invalid" for JSON that fails schema validation (wrong version)', () => {
      const bad = JSON.stringify({ version: 2, tokens: [] });
      expect(createComponent(bad).status()).toBe('invalid');
    });

    it('is "valid" for a well-formed canvas state', () => {
      expect(createComponent(makeState()).status()).toBe('valid');
    });
  });

  // ── courtMode / viewBox ───────────────────────────────────────

  describe('mode and viewBox', () => {
    it('defaults to half-court when state is empty', () => {
      expect(createComponent().mode()).toBe('half');
    });

    it('reflects half-court from state', () => {
      const c = createComponent(makeState({ courtMode: 'half' }));
      expect(c.mode()).toBe('half');
      expect(c.viewBox()).toBe('0 0 476 510');
    });

    it('reflects full-court from state', () => {
      const c = createComponent(makeState({ courtMode: 'full' }));
      expect(c.mode()).toBe('full');
      expect(c.viewBox()).toBe('0 0 952 510');
    });
  });

  // ── tokenDots – starting position ────────────────────────────

  describe('tokenDots', () => {
    it('returns empty array when status is not valid', () => {
      expect(createComponent().tokenDots()).toEqual([]);
    });

    it('uses phase[0].playerPositions when phases exist', () => {
      const c = createComponent(makeState());
      const dots = c.tokenDots();

      const off1 = dots.find(d => d.id === 'off1')!;
      expect(off1).toBeTruthy();
      // phase[0] position is (100, 255), NOT the token's current (300, 255)
      expect(off1.cx).toBe(100);
      expect(off1.cy).toBe(255);

      const def1 = dots.find(d => d.id === 'def1')!;
      expect(def1.cx).toBe(200);
      expect(def1.cy).toBe(255);
    });

    it('falls back to token.position when there are no phases', () => {
      const c = createComponent(makeState({ phases: [] }));
      const dots = c.tokenDots();

      const off1 = dots.find(d => d.id === 'off1')!;
      expect(off1.cx).toBe(300);
      expect(off1.cy).toBe(255);
    });

    it('assigns the correct colour for each token type', () => {
      const state = makeState({
        tokens: [
          { id: 'o', type: 'offense', label: '1', position: { x: 0, y: 0 } },
          { id: 'd', type: 'defense', label: 'X', position: { x: 0, y: 0 } },
          { id: 'c', type: 'coach',   label: 'C', position: { x: 0, y: 0 } },
          { id: 'n', type: 'cone',    label: '',  position: { x: 0, y: 0 } },
        ],
        phases: [],
      });
      const dots = createComponent(state).tokenDots();

      expect(dots.find(d => d.id === 'o')!.color).toBe('#60a5fa');
      expect(dots.find(d => d.id === 'd')!.color).toBe('#c084fc');
      expect(dots.find(d => d.id === 'c')!.color).toBe('#f59e0b');
      expect(dots.find(d => d.id === 'n')!.color).toBe('#f97316');
    });
  });

  // ── phase0Polylines ───────────────────────────────────────────

  describe('phase0Polylines', () => {
    it('returns empty array when status is not valid', () => {
      expect(createComponent().phase0Polylines()).toEqual([]);
    });

    it('converts phase[0] path points to SVG polyline strings', () => {
      const c = createComponent(makeState());
      const lines = c.phase0Polylines();
      expect(lines).toHaveLength(1);
      expect(lines[0]).toBe('100,255 150,255 200,200');
    });

    it('includes currentPhasePaths when phases array is empty', () => {
      const state = makeState({
        phases: [],
        currentPhasePaths: [
          {
            ownerId: 'off1',
            actionType: 'cut',
            points: [{ x: 50, y: 100 }, { x: 80, y: 120 }],
          },
        ],
      });
      const lines = createComponent(state).phase0Polylines();
      expect(lines).toHaveLength(1);
      expect(lines[0]).toBe('50,100 80,120');
    });

    it('concatenates phase[0] paths and currentPhasePaths', () => {
      const state = makeState({
        currentPhasePaths: [
          {
            ownerId: 'def1',
            actionType: 'cut',
            points: [{ x: 200, y: 255 }, { x: 250, y: 200 }],
          },
        ],
      });
      const lines = createComponent(state).phase0Polylines();
      expect(lines).toHaveLength(2);
    });
  });

  // ── conePoints ────────────────────────────────────────────────

  describe('conePoints', () => {
    it('returns the three triangle vertices as an SVG points string', () => {
      const c = createComponent();
      expect(c.conePoints(100, 200, 14)).toBe('100,186 86,214 114,214');
    });

    it('handles a radius of 0', () => {
      const c = createComponent();
      expect(c.conePoints(50, 50, 0)).toBe('50,50 50,50 50,50');
    });
  });
});
