import { Component, computed, input } from '@angular/core';
import { parseExerciseCanvasState } from './exercise-editor/exercise-editor-persistence.utils';
import { courtSize, CourtMode } from '../playbook/play-editor/court-painter';
import { ExerciseTokenType } from './exercise-editor/exercise-editor.models';

const TOKEN_COLOR: Record<ExerciseTokenType, string> = {
  offense: '#60a5fa',
  defense: '#c084fc',
  coach:   '#f59e0b',
  cone:    '#f97316',
};

const WHITE = 'rgba(255,255,255,0.9)';

@Component({
  selector: 'app-drill-preview',
  standalone: true,
  styleUrl: './drill-preview.component.scss',
  template: `
    @if (status() !== 'valid') {
      <div class="dp-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
          <rect x="2" y="3" width="20" height="18" rx="2"/>
          <path d="M8 3v18M16 3v18M2 9h20M2 15h20" stroke-linecap="round"/>
        </svg>
        <span>Click to design</span>
      </div>
    } @else {
      <svg class="dp-svg"
           [attr.viewBox]="viewBox()"
           preserveAspectRatio="xMidYMid meet"
           xmlns="http://www.w3.org/2000/svg">

        <!-- Hardwood background (simplified plank bands) -->
        <defs>
          <pattern id="planks" x="0" y="0" width="1" height="10" patternUnits="userSpaceOnUse">
            <rect width="9999" height="5"  y="0" fill="#F9E494"/>
            <rect width="9999" height="5"  y="5" fill="#F5DC86"/>
            <line x1="0" y1="10" x2="9999" y2="10" stroke="rgba(0,0,0,0.1)" stroke-width="0.8"/>
          </pattern>
        </defs>
        <rect x="0" y="0" [attr.width]="cw()" [attr.height]="510" fill="url(#planks)"/>

        <!-- ── LEFT BASKET (half-court & full-court) ────────────── -->
        <!-- Paint rectangle -->
        <rect x="0" y="172" width="197" height="166"
              fill="rgba(20,55,110,0.45)" stroke="${WHITE}" stroke-width="2"/>
        <!-- FT line tick marks at 2.9 m and 4.1 m -->
        <line x1="99"  y1="156" x2="99"  y2="172" stroke="${WHITE}" stroke-width="2"/>
        <line x1="99"  y1="338" x2="99"  y2="354" stroke="${WHITE}" stroke-width="2"/>
        <line x1="139" y1="156" x2="139" y2="172" stroke="${WHITE}" stroke-width="2"/>
        <line x1="139" y1="338" x2="139" y2="354" stroke="${WHITE}" stroke-width="2"/>
        <!-- FT circle – solid half (CW) -->
        <path d="M 197 194 A 61 61 0 0 1 197 316"
              fill="none" stroke="${WHITE}" stroke-width="2"/>
        <!-- FT circle – dashed half (CCW) -->
        <path d="M 197 194 A 61 61 0 0 0 197 316"
              fill="none" stroke="${WHITE}" stroke-width="2" stroke-dasharray="8 6"/>
        <!-- Backboard -->
        <line x1="41" y1="224" x2="41" y2="286"
              stroke="${WHITE}" stroke-width="4"/>
        <!-- Hoop -->
        <circle cx="54" cy="255" r="14"
                fill="none" stroke="#f97316" stroke-width="3"/>
        <!-- No-charge arc (CCW for left basket) -->
        <path d="M 54 298 A 43 43 0 0 0 54 212"
              fill="none" stroke="${WHITE}" stroke-width="2"/>
        <!-- Corner 3-pt lines -->
        <line x1="0"   y1="31"  x2="106" y2="31"  stroke="${WHITE}" stroke-width="2"/>
        <line x1="0"   y1="479" x2="106" y2="479" stroke="${WHITE}" stroke-width="2"/>
        <!-- 3-pt arc (CW for left basket) -->
        <path d="M 106 31 A 230 230 0 0 1 106 479"
              fill="none" stroke="${WHITE}" stroke-width="2"/>

        @if (mode() === 'half') {
          <!-- Centre-circle stub at right edge -->
          <path d="M 476 194 A 61 61 0 0 0 476 316"
                fill="none" stroke="${WHITE}" stroke-width="2"/>
        }

        @if (mode() === 'full') {
          <!-- Centre line & circle -->
          <line x1="476" y1="0" x2="476" y2="510" stroke="${WHITE}" stroke-width="2"/>
          <circle cx="476" cy="255" r="61" fill="none" stroke="${WHITE}" stroke-width="2"/>
          <!-- ── RIGHT BASKET ──────────────────────────────── -->
          <!-- Paint rectangle -->
          <rect x="755" y="172" width="197" height="166"
                fill="rgba(20,55,110,0.45)" stroke="${WHITE}" stroke-width="2"/>
          <!-- FT tick marks -->
          <line x1="813" y1="156" x2="813" y2="172" stroke="${WHITE}" stroke-width="2"/>
          <line x1="813" y1="338" x2="813" y2="354" stroke="${WHITE}" stroke-width="2"/>
          <line x1="853" y1="156" x2="853" y2="172" stroke="${WHITE}" stroke-width="2"/>
          <line x1="853" y1="338" x2="853" y2="354" stroke="${WHITE}" stroke-width="2"/>
          <!-- FT circle solid (CCW for right basket) -->
          <path d="M 755 194 A 61 61 0 0 0 755 316"
                fill="none" stroke="${WHITE}" stroke-width="2"/>
          <!-- FT circle dashed (CW) -->
          <path d="M 755 194 A 61 61 0 0 1 755 316"
                fill="none" stroke="${WHITE}" stroke-width="2" stroke-dasharray="8 6"/>
          <!-- Backboard -->
          <line x1="911" y1="224" x2="911" y2="286"
                stroke="${WHITE}" stroke-width="4"/>
          <!-- Hoop -->
          <circle cx="898" cy="255" r="14"
                  fill="none" stroke="#f97316" stroke-width="3"/>
          <!-- No-charge arc (CW for right basket) -->
          <path d="M 898 298 A 43 43 0 0 1 898 212"
                fill="none" stroke="${WHITE}" stroke-width="2"/>
          <!-- Corner 3-pt lines -->
          <line x1="952" y1="31"  x2="846" y2="31"  stroke="${WHITE}" stroke-width="2"/>
          <line x1="952" y1="479" x2="846" y2="479" stroke="${WHITE}" stroke-width="2"/>
          <!-- 3-pt arc (CCW for right basket) -->
          <path d="M 846 31 A 230 230 0 0 0 846 479"
                fill="none" stroke="${WHITE}" stroke-width="2"/>
        }

        <!-- Boundary lines (on top of paint) -->
        <rect x="0" y="0" [attr.width]="cw()" height="510"
              fill="none" stroke="${WHITE}" stroke-width="3"/>

        <!-- Phase 0 paths -->
        @for (pl of phase0Polylines(); track $index) {
          <polyline [attr.points]="pl"
                    fill="none" stroke="#00000040" stroke-width="4"
                    stroke-linecap="round" stroke-linejoin="round"/>
        }

        <!-- Token dots -->
        @for (t of tokenDots(); track t.id) {
          @if (t.type === 'cone') {
            <polygon [attr.points]="conePoints(t.cx, t.cy, 14)"
                     [attr.fill]="t.color" fill-opacity="0.9"
                     stroke="#00000088" stroke-width="2"/>
          } @else {
            <circle [attr.cx]="t.cx" [attr.cy]="t.cy" r="16"
                    [attr.fill]="t.color" fill-opacity="0.9"
                    stroke="#00000088" stroke-width="2"/>
            @if (t.label) {
              <text [attr.x]="t.cx" [attr.y]="t.cy"
                    text-anchor="middle" dominant-baseline="central"
                    font-family="system-ui,sans-serif"
                    font-size="14" font-weight="800" fill="#000c">{{ t.label }}</text>
            }
          }
        }
      </svg>
    }
  `,
})
export class DrillPreviewComponent {
  readonly canvasState = input<string | undefined | null>();

  private readonly parsed = computed(() =>
    parseExerciseCanvasState(this.canvasState() ?? null));

  readonly status = computed(() => this.parsed().kind);

  readonly mode = computed((): CourtMode => {
    const p = this.parsed();
    return p.kind === 'valid' ? p.state.courtMode : 'half';
  });

  readonly cw = computed(() => courtSize(this.mode()).W);
  readonly viewBox = computed(() => `0 0 ${this.cw()} 510`);

  readonly tokenDots = computed(() => {
    const p = this.parsed();
    if (p.kind !== 'valid') return [];
    const startPositions = p.state.phases[0]?.playerPositions ?? {};
    return p.state.tokens.map(t => {
      const pos = startPositions[t.id] ?? t.position;
      return {
        id:    t.id,
        type:  t.type,
        cx:    pos.x,
        cy:    pos.y,
        color: TOKEN_COLOR[t.type] ?? '#888',
        label: t.label,
      };
    });
  });

  readonly phase0Polylines = computed(() => {
    const p = this.parsed();
    if (p.kind !== 'valid') return [];
    const paths = (p.state.phases[0]?.paths ?? []).concat(p.state.currentPhasePaths);
    return paths.map(path =>
      path.points.map(pt => `${pt.x},${pt.y}`).join(' '),
    );
  });

  conePoints(cx: number, cy: number, r: number): string {
    const top = `${cx},${cy - r}`;
    const bl  = `${cx - r},${cy + r}`;
    const br  = `${cx + r},${cy + r}`;
    return `${top} ${bl} ${br}`;
  }
}
