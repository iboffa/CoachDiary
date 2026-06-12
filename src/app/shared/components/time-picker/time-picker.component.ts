import {
  Component,
  computed,
  ElementRef,
  HostListener,
  model,
  output,
  signal,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

type Phase = 'hour' | 'minute';

interface NumberPosition {
  x: number;
  y: number;
  label: string;
  value: number;
}

const SVG_CENTER = 140;
const OUTER_RADIUS = 90;
const INNER_RADIUS = 60;
const MINUTE_RADIUS = 90;

function positionOnCircle(angleDeg: number, radius: number): { x: number; y: number } {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: SVG_CENTER + radius * Math.cos(rad),
    y: SVG_CENTER + radius * Math.sin(rad),
  };
}

@Component({
  selector: 'app-time-picker',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './time-picker.component.html',
  styleUrl: './time-picker.component.scss',
})
export class TimePickerComponent {
  value = model<string>('');
  confirmed = output<string>();
  cancelled = output<void>();

  readonly isOpen = signal(false);
  readonly phase = signal<Phase>('hour');

  // Panel position (fixed coordinates, set on open)
  readonly panelTop = signal(0);
  readonly panelLeft = signal(0);

  private _selectedHour = signal<number>(0);
  private _selectedMinute = signal<number>(0);

  readonly selectedHour = this._selectedHour.asReadonly();
  readonly selectedMinute = this._selectedMinute.asReadonly();

  readonly headerHour = computed(() =>
    String(this._selectedHour()).padStart(2, '0'),
  );
  readonly headerMinute = computed(() =>
    String(this._selectedMinute()).padStart(2, '0'),
  );

  // Hour positions: 0–11 on outer ring, 12–23 on inner ring
  readonly hourPositions = computed<NumberPosition[]>(() => {
    const positions: NumberPosition[] = [];
    for (let h = 0; h < 12; h++) {
      const angle = h * 30;
      const pos = positionOnCircle(angle, OUTER_RADIUS);
      positions.push({ ...pos, label: String(h), value: h });
    }
    for (let h = 12; h < 24; h++) {
      const angle = (h - 12) * 30;
      const pos = positionOnCircle(angle, INNER_RADIUS);
      positions.push({ ...pos, label: String(h), value: h });
    }
    return positions;
  });

  // Minute positions: 00, 05, 10 ... 55 (12 labels)
  readonly minutePositions = computed<NumberPosition[]>(() => {
    const positions: NumberPosition[] = [];
    for (let i = 0; i < 12; i++) {
      const minute = i * 5;
      const angle = i * 30;
      const pos = positionOnCircle(angle, MINUTE_RADIUS);
      positions.push({ ...pos, label: String(minute).padStart(2, '0'), value: minute });
    }
    return positions;
  });

  // Position of the currently-selected number (for the clock hand)
  readonly selectedPosition = computed<{ x: number; y: number }>(() => {
    if (this.phase() === 'hour') {
      const h = this._selectedHour();
      const radius = h < 12 ? OUTER_RADIUS : INNER_RADIUS;
      const angle = (h % 12) * 30;
      return positionOnCircle(angle, radius);
    } else {
      const m = this._selectedMinute();
      const angle = (m / 5) * 30;
      return positionOnCircle(angle, MINUTE_RADIUS);
    }
  });

  @ViewChild('wrapperRef') wrapperRef?: ElementRef<HTMLElement>;
  @ViewChild('panelRef') panelRef?: ElementRef<HTMLElement>;

  open(): void {
    const current = this.value();
    if (current && /^\d{1,2}:\d{2}$/.test(current)) {
      const [h, m] = current.split(':').map(Number);
      this._selectedHour.set(isNaN(h) ? 0 : Math.min(23, Math.max(0, h)));
      this._selectedMinute.set(isNaN(m) ? 0 : Math.min(59, Math.max(0, m)));
    } else {
      this._selectedHour.set(0);
      this._selectedMinute.set(0);
    }
    this.phase.set('hour');
    this.isOpen.set(true);

    // Position the panel below the input using getBoundingClientRect
    // so it works correctly even inside scrollable containers.
    requestAnimationFrame(() => {
      const wrapper = this.wrapperRef?.nativeElement;
      if (!wrapper) return;
      const rect = wrapper.getBoundingClientRect();
      const panelWidth = 300;
      const viewportWidth = window.innerWidth;
      let left = rect.left;
      if (left + panelWidth > viewportWidth - 8) {
        left = viewportWidth - panelWidth - 8;
      }
      this.panelTop.set(rect.bottom + 4);
      this.panelLeft.set(Math.max(8, left));
    });
  }

  close(): void {
    this.isOpen.set(false);
  }

  selectHour(h: number): void {
    this._selectedHour.set(h);
    this.phase.set('minute');
  }

  selectMinute(m: number): void {
    this._selectedMinute.set(m);
    this.confirm();
  }

  confirm(): void {
    const timeStr = `${this.headerHour()}:${this.headerMinute()}`;
    this.value.set(timeStr);
    this.confirmed.emit(timeStr);
    this.close();
  }

  cancel(): void {
    this.cancelled.emit();
    this.close();
  }

  isSelectedHour(h: number): boolean {
    return this.phase() === 'hour' && this._selectedHour() === h;
  }

  isSelectedMinute(m: number): boolean {
    return this.phase() === 'minute' && this._selectedMinute() === m;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.isOpen()) return;
    const wrapper = this.wrapperRef?.nativeElement;
    const panel = this.panelRef?.nativeElement;
    const target = event.target as Node;
    if (
      (wrapper && wrapper.contains(target)) ||
      (panel && panel.contains(target))
    ) {
      return;
    }
    this.close();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isOpen()) this.cancel();
  }

  onInputClick(event: MouseEvent): void {
    event.stopPropagation();
    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
    }
  }

  onPanelClick(event: MouseEvent): void {
    event.stopPropagation();
  }
}
