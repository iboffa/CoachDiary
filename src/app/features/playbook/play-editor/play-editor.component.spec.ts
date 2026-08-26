import { TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute, Router } from '@angular/router';
import { PlayEditorComponent } from './play-editor.component';
import { COURT_OUT_OF_BOUNDS_PADDING, courtCanvasSize } from './court-painter';
import { PlayService } from '../../../core/services/play.service';

describe('PlayEditorComponent - Pick and Roll & Pass/Shoot Test', () => {
  let playServiceMock: any;
  let activatedRouteMock: any;

  beforeEach(async () => {
    playServiceMock = {
      get: vi.fn().mockResolvedValue(undefined),
      save: vi.fn().mockResolvedValue(123),
    };

    activatedRouteMock = {
      snapshot: {
        paramMap: {
          get: () => 'new',
        },
      },
    };

    await TestBed.configureTestingModule({
      imports: [PlayEditorComponent],
      providers: [
        provideRouter([]),
        { provide: PlayService, useValue: playServiceMock },
        { provide: ActivatedRoute, useValue: activatedRouteMock },
      ],
    }).compileComponents();
  });

  it('should draw a simple pick and roll and run preview without hanging', async () => {
    const fixture = TestBed.createComponent(PlayEditorComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
    fixture.detectChanges();
    await fixture.whenStable();

    const tokens = (component as any).tokens;
    expect(tokens.length).toBeGreaterThanOrEqual(2);

    const pg = tokens.find((t: any) => t.id === 'offense-1');
    const center = tokens.find((t: any) => t.id === 'offense-2');

    expect(pg).toBeTruthy();
    expect(center).toBeTruthy();
    expect(component.ballCarrierId()).toBe('offense-1');

    const pgStart = { ...pg.position };
    const centerStart = { ...center.position };

    const screenLocation = { x: pgStart.x + 20, y: pgStart.y };
    const centerPath = {
      ownerId: 'offense-2',
      actionType: 'screen' as const,
      points: [centerStart, screenLocation],
      fabricObjects: [
        { set: vi.fn(), setCoords: vi.fn() } as any,
        { set: vi.fn(), setCoords: vi.fn() } as any,
      ]
    };
    (component as any).currentPhasePaths.push(centerPath);

    const wingLocation = { x: pgStart.x - 80, y: pgStart.y + 20 };
    const pgPath = {
      ownerId: 'offense-1',
      actionType: 'dribble' as const,
      points: [pgStart, wingLocation],
      fabricObjects: [
        { set: vi.fn(), setCoords: vi.fn() } as any,
        { set: vi.fn(), setCoords: vi.fn() } as any,
      ]
    };
    (component as any).currentPhasePaths.push(pgPath);
    component.currentPathCount.set(2);

    const pgGroupSpy = vi.spyOn(pg.fabricGroup, 'setCoords');
    const centerGroupSpy = vi.spyOn(center.fabricGroup, 'setCoords');

    component.nextPhase();

    expect(component.phaseCount()).toBe(1);
    expect(component.phases.length).toBe(1);

    expect(pg.position).toEqual(wingLocation);
    expect(center.position).toEqual(screenLocation);

    expect(pgGroupSpy).toHaveBeenCalled();
    expect(centerGroupSpy).toHaveBeenCalled();

    const previewPromise = component.previewPlay();
    expect(component.animState()).toBe('playing');

    component.stopAnimation();
    await previewPromise;

    expect(component.animState()).toBe('idle');
    expect(component.animProgress()).toBe(0);
    expect(pg.position).toEqual(wingLocation);
    expect(center.position).toEqual(screenLocation);
  });

  it('should keep default player tokens interactive for initial repositioning', async () => {
    const fixture = TestBed.createComponent(PlayEditorComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    const tokens = (component as any).tokens;
    expect(tokens.length).toBeGreaterThan(0);

    for (const token of tokens) {
      expect(token.fabricGroup.selectable).toBe(true);
      expect(token.fabricGroup.evented).toBe(true);
    }
  });

  it('should add out-of-bounds canvas space for inbound play setup', async () => {
    const fixture = TestBed.createComponent(PlayEditorComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    const fabricCanvas = (component as any).fabricCanvas;
    const { width, height } = courtCanvasSize(component.courtMode());

    expect(fabricCanvas.getWidth()).toBe(width);
    expect(fabricCanvas.getHeight()).toBe(height);
    expect(fabricCanvas.viewportTransform?.[4]).toBe(COURT_OUT_OF_BOUNDS_PADDING);
    expect(fabricCanvas.viewportTransform?.[5]).toBe(COURT_OUT_OF_BOUNDS_PADDING);
  });

  it('should automatically order screen use, dribble, pass, cut, and received shot timing', async () => {
    const fixture = TestBed.createComponent(PlayEditorComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    const tokens = (component as any).tokens;
    const pg = tokens.find((token: any) => token.id === 'offense-1');
    const screener = tokens.find((token: any) => token.id === 'offense-2');
    const shooter = tokens.find((token: any) => token.id === 'offense-4');

    const screenEnd = { x: pg.position.x - 18, y: pg.position.y + 6 };
    const dribbleEnd = { x: pg.position.x - 92, y: pg.position.y + 18 };
    const passTarget = { x: shooter.position.x + 24, y: shooter.position.y + 12 };
    const cutEnd = { x: dribbleEnd.x - 34, y: dribbleEnd.y - 16 };
    const shotControl = { x: (passTarget.x + 54) / 2, y: Math.min(passTarget.y, 255) - 48 };

    const phase = {
      playerPositions: Object.fromEntries(tokens.map((token: any) => [token.id, { ...token.position }])),
      ballCarrierId: null,
      paths: [
        { ownerId: 'offense-2', actionType: 'screen' as const, points: [{ ...screener.position }, screenEnd] },
        {
          ownerId: 'offense-1',
          actionType: 'dribble' as const,
          points: [{ ...pg.position }, { x: screenEnd.x + 8, y: screenEnd.y + 2 }, dribbleEnd],
        },
        { ownerId: 'offense-1', actionType: 'pass' as const, points: [dribbleEnd, passTarget], targetId: 'offense-4' },
        { ownerId: 'offense-1', actionType: 'cut' as const, points: [dribbleEnd, cutEnd] },
        { ownerId: 'offense-4', actionType: 'shoot' as const, points: [passTarget, shotControl, { x: 54, y: 255 }] },
      ],
    };

    const scheduledPaths = (component as any).buildPhasePathSchedule(phase);
    const [screenPath, dribblePath, passPath, cutPath, shootPath] = scheduledPaths;
    const epsilon = 0.000001;

    expect(dribblePath.startTime).toBeGreaterThanOrEqual(screenPath.endTime - epsilon);
    expect(passPath.startTime).toBeGreaterThanOrEqual(dribblePath.endTime - epsilon);
    expect(cutPath.startTime).toBeGreaterThanOrEqual(passPath.endTime - epsilon);
    expect(shootPath.startTime).toBeGreaterThanOrEqual(passPath.endTime - epsilon);
  });

  it('should make the screener wait for the screen usage before cutting', async () => {
    const fixture = TestBed.createComponent(PlayEditorComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    const tokens = (component as any).tokens;
    const pg = tokens.find((token: any) => token.id === 'offense-1');
    const screener = tokens.find((token: any) => token.id === 'offense-2');

    const screenEnd = { x: pg.position.x - 16, y: pg.position.y + 4 };
    const dribbleEnd = { x: pg.position.x - 88, y: pg.position.y + 20 };
    const screenerCutEnd = { x: screenEnd.x - 28, y: screenEnd.y - 34 };
    const phase = {
      playerPositions: Object.fromEntries(tokens.map((token: any) => [token.id, { ...token.position }])),
      ballCarrierId: 'offense-1',
      paths: [
        { ownerId: 'offense-2', actionType: 'screen' as const, points: [{ ...screener.position }, screenEnd] },
        {
          ownerId: 'offense-1',
          actionType: 'dribble' as const,
          points: [{ ...pg.position }, { x: screenEnd.x + 6, y: screenEnd.y + 3 }, dribbleEnd],
        },
        { ownerId: 'offense-2', actionType: 'cut' as const, points: [screenEnd, screenerCutEnd] },
      ],
    };

    const scheduledPaths = (component as any).buildPhasePathSchedule(phase);
    const [screenPath, dribblePath, cutPath] = scheduledPaths;
    const epsilon = 0.000001;

    expect(dribblePath.startTime).toBeGreaterThanOrEqual(screenPath.endTime - epsilon);
    expect(cutPath.startTime).toBeGreaterThanOrEqual(dribblePath.endTime - epsilon);
  });

  it('should animate a received shot only after the pass window closes', async () => {
    const fixture = TestBed.createComponent(PlayEditorComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    const tokens = (component as any).tokens;
    const pg = tokens.find((token: any) => token.id === 'offense-1');
    const wing = tokens.find((token: any) => token.id === 'offense-2');

    const receivePoint = { x: wing.position.x + 32, y: wing.position.y - 14 };
    const shotControl = { x: (receivePoint.x + 54) / 2, y: Math.min(receivePoint.y, 255) - 44 };
    const phase = {
      playerPositions: Object.fromEntries(tokens.map((token: any) => [token.id, { ...token.position }])),
      ballCarrierId: null,
      paths: [
        { ownerId: 'offense-1', actionType: 'pass' as const, points: [{ ...pg.position }, receivePoint], targetId: 'offense-2' },
        { ownerId: 'offense-2', actionType: 'shoot' as const, points: [receivePoint, shotControl, { x: 54, y: 255 }] },
      ],
    };

    (component as any).ensureBallIndicator();
    const scheduledPaths = (component as any).buildPhasePathSchedule(phase);
    const passPath = scheduledPaths[0];
    const shootPath = scheduledPaths[1];

    (component as any).animateBallForPhase(phase, scheduledPaths, (passPath.startTime + passPath.endTime) / 2);
    expect((component as any).ballIndicator.left).toBeGreaterThan(Math.min(pg.position.x + 8, receivePoint.x + 8));
    expect((component as any).ballIndicator.left).toBeLessThan(Math.max(pg.position.x + 8, receivePoint.x + 8));

    (component as any).animateBallForPhase(phase, scheduledPaths, (shootPath.startTime + shootPath.endTime) / 2);
    expect((component as any).ballIndicator.top).toBeLessThan(receivePoint.y - 26);
  });

  it('should finalize the play immediately after a shot and block further actions', async () => {
    const fixture = TestBed.createComponent(PlayEditorComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
    fixture.detectChanges();
    await fixture.whenStable();

    const tokens = (component as any).tokens;

    expect(component.ballCarrierId()).toBe('offense-1');

    // 1. Simulate selecting Pass from PG
    component.contextMenu.set({
      clientX: 0, clientY: 0, playerId: 'offense-1', isBallCarrier: true, hasNearbyPlayer: false
    });
    component.selectAction('pass');

    // Verify pendingPassFrom is set and tool is select
    expect(component.pendingPassFrom()).toBe('offense-1');
    expect(component.activeTool()).toBe('select');

    // 2. Execute pass by triggering executePass directly (simulated click on Offense 4)
    (component as any).executePass('offense-1', 'offense-4');

    // Verify pass is recorded in currentPhasePaths
    expect(component.currentPathCount()).toBe(1);
    const passPath = (component as any).currentPhasePaths[0];
    expect(passPath.actionType).toBe('pass');
    expect(passPath.ownerId).toBe('offense-1');

    // Verify ball carrier changes to Offense 4
    expect(component.ballCarrierId()).toBe('offense-4');

    // 3. Commit Phase 1
    component.nextPhase();
    expect(component.phaseCount()).toBe(1);

    // 4. Select Shoot for Offense 4 (auto-finalizes the play)
    component.contextMenu.set({
      clientX: 0, clientY: 0, playerId: 'offense-4', isBallCarrier: true, hasNearbyPlayer: false
    });
    component.selectAction('shoot');

    expect(component.phaseCount()).toBe(2);
    expect(component.currentPathCount()).toBe(0);

    const shootPath = component.phases[1].paths[0];
    expect(shootPath.actionType).toBe('shoot');
    expect(shootPath.ownerId).toBe('offense-4');

    // Verify ball carrier becomes null after shooting
    expect(component.ballCarrierId()).toBeNull();

    // 5. Verify no further actions can be added after terminal shot
    component.contextMenu.set({
      clientX: 0, clientY: 0, playerId: 'offense-4', isBallCarrier: false, hasNearbyPlayer: false
    });
    component.selectAction('cut');
    expect(component.currentPathCount()).toBe(0);

    expect(component.animState()).toBe('idle');
  }, 60000);

  it('should recreate a visible ball indicator for preview animation when the editor currently has none', async () => {
    const fixture = TestBed.createComponent(PlayEditorComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    const tokens = (component as any).tokens;
    const pg = tokens.find((t: any) => t.id === 'offense-1');
    const wing = tokens.find((t: any) => t.id === 'offense-2');
    expect(pg).toBeTruthy();
    expect(wing).toBeTruthy();

    component.contextMenu.set({
      clientX: 0,
      clientY: 0,
      playerId: 'offense-1',
      isBallCarrier: true,
      hasNearbyPlayer: false,
    });
    component.selectAction('pass');
    (component as any).executePass('offense-1', 'offense-2');
    component.nextPhase();

    component.contextMenu.set({
      clientX: 0,
      clientY: 0,
      playerId: 'offense-2',
      isBallCarrier: true,
      hasNearbyPlayer: false,
    });
    component.selectAction('shoot');
    component.nextPhase();

    expect(component.ballCarrierId()).toBeNull();
    expect((component as any).ballIndicator).toBeNull();

    const previewPromise = component.previewPlay();

    expect((component as any).ballIndicator).toBeTruthy();
    expect((component as any).ballIndicator.visible).toBe(true);

    component.stopAnimation();
    await previewPromise;
  });

  it('should create a shadow endpoint and chain the next movement from it', async () => {
    const fixture = TestBed.createComponent(PlayEditorComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    const tokens = (component as any).tokens;
    const pg = tokens.find((t: any) => t.id === 'offense-1');
    expect(pg).toBeTruthy();

    component.contextMenu.set({
      clientX: 0,
      clientY: 0,
      playerId: 'offense-1',
      isBallCarrier: true,
      hasNearbyPlayer: false,
    });
    component.selectAction('dribble');

    const firstEnd = { x: pg.position.x - 70, y: pg.position.y + 24 };
    (component as any).startPath(pg.position.x, pg.position.y);
    (component as any).updateLivePath(pg.position.x - 30, pg.position.y + 22);
    (component as any).endPath(firstEnd.x, firstEnd.y);

    const firstPath = (component as any).currentPhasePaths[0];
    expect(firstPath.points).toHaveLength(3);
    expect(firstPath.points[0]).toEqual(pg.position);
    expect(firstPath.points.at(-1)).toEqual(firstEnd);

    const firstShadow = (component as any).shadowTokens[0];
    expect((component as any).shadowTokens).toHaveLength(1);
    expect(firstShadow.ownerId).toBe('offense-1');
    expect(firstShadow.position).toEqual(firstEnd);
    expect((component as any).ballIndicator.left).toBeCloseTo(firstEnd.x + 8);
    expect((component as any).ballIndicator.top).toBeCloseTo(firstEnd.y - 26);

    component.contextMenu.set({
      clientX: 0,
      clientY: 0,
      playerId: 'offense-1',
      isBallCarrier: true,
      hasNearbyPlayer: false,
    });
    component.selectAction('dribble');
    expect((component as any).pendingDrawStart).toEqual(firstEnd);

    const secondEnd = { x: firstEnd.x - 48, y: firstEnd.y - 12 };
    (component as any).startPath(firstEnd.x, firstEnd.y);
    (component as any).updateLivePath(firstEnd.x - 18, firstEnd.y - 20);
    (component as any).endPath(secondEnd.x, secondEnd.y);

    const secondPath = (component as any).currentPhasePaths[1];
    expect((component as any).currentPhasePaths).toHaveLength(2);
    expect(secondPath.points[0]).toEqual(firstEnd);
    expect(secondPath.points).toHaveLength(3);
    expect(secondPath.points.at(-1)).toEqual(secondEnd);
    expect((component as any).shadowTokens).toHaveLength(1);
    expect((component as any).shadowTokens[0].position).toEqual(secondEnd);

    component.nextPhase();

    expect(pg.position).toEqual(secondEnd);
    expect((component as any).shadowTokens).toHaveLength(0);
  });

  it('should remove chained shadow arrows when deleting the base arrow', async () => {
    const fixture = TestBed.createComponent(PlayEditorComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    const pg = (component as any).tokens.find((t: any) => t.id === 'offense-1');
    expect(pg).toBeTruthy();

    component.contextMenu.set({
      clientX: 0,
      clientY: 0,
      playerId: 'offense-1',
      isBallCarrier: true,
      hasNearbyPlayer: false,
    });
    component.selectAction('dribble');

    const firstEnd = { x: pg.position.x - 66, y: pg.position.y + 18 };
    (component as any).startPath(pg.position.x, pg.position.y);
    (component as any).updateLivePath(pg.position.x - 24, pg.position.y + 18);
    (component as any).endPath(firstEnd.x, firstEnd.y);

    component.contextMenu.set({
      clientX: 0,
      clientY: 0,
      playerId: 'offense-1',
      isBallCarrier: true,
      hasNearbyPlayer: false,
    });
    component.selectAction('dribble');

    const secondEnd = { x: firstEnd.x - 44, y: firstEnd.y - 12 };
    (component as any).startPath(firstEnd.x, firstEnd.y);
    (component as any).updateLivePath(firstEnd.x - 20, firstEnd.y - 16);
    (component as any).endPath(secondEnd.x, secondEnd.y);

    expect((component as any).currentPhasePaths).toHaveLength(2);
    const firstPath = (component as any).currentPhasePaths[0];
    (component as any).beginPathEditing(firstPath);

    component.onDeleteKey();

    expect((component as any).currentPhasePaths).toHaveLength(0);
    expect(component.currentPathCount()).toBe(0);
    expect((component as any).shadowTokens).toHaveLength(0);
  });

  it('should show a spline handle for screen paths while keeping the screen bar non-editable', async () => {
    const fixture = TestBed.createComponent(PlayEditorComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    const screener = (component as any).tokens.find((t: any) => t.id === 'offense-2');
    expect(screener).toBeTruthy();

    component.contextMenu.set({
      clientX: 0,
      clientY: 0,
      playerId: 'offense-2',
      isBallCarrier: false,
      hasNearbyPlayer: false,
    });
    component.selectAction('screen');

    const end = { x: screener.position.x + 26, y: screener.position.y - 42 };
    (component as any).startPath(screener.position.x, screener.position.y);
    (component as any).updateLivePath(screener.position.x + 12, screener.position.y - 10);
    (component as any).endPath(end.x, end.y);

    const screenPath = (component as any).currentPhasePaths[0];
    (component as any).beginPathEditing(screenPath);

    expect((component as any).activePathEdit).toBeTruthy();
    expect((component as any).activePathEdit.path).toBe(screenPath);
    expect(screenPath.fabricObjects[1].evented).toBe(false);
    expect((component as any).shadowTokens).toHaveLength(1);
    expect((component as any).shadowTokens[0].ownerId).toBe('offense-2');
  });

  it('should toggle shrinking animation lines during playback', async () => {
    const fixture = TestBed.createComponent(PlayEditorComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    const pg = (component as any).tokens.find((t: any) => t.id === 'offense-1');
    expect(pg).toBeTruthy();

    component.contextMenu.set({
      clientX: 0,
      clientY: 0,
      playerId: 'offense-1',
      isBallCarrier: true,
      hasNearbyPlayer: false,
    });
    component.selectAction('dribble');

    const end = { x: pg.position.x - 74, y: pg.position.y + 18 };
    (component as any).startPath(pg.position.x, pg.position.y);
    (component as any).updateLivePath(pg.position.x - 28, pg.position.y + 22);
    (component as any).endPath(end.x, end.y);

    const phase = {
      playerPositions: Object.fromEntries((component as any).tokens.map((token: any) => [token.id, { ...token.position }])),
      ballCarrierId: component.ballCarrierId(),
      paths: (component as any).currentPhasePaths.map((path: any) => ({ ownerId: path.ownerId, actionType: path.actionType, points: path.points })),
    };
    const scheduledPaths = (component as any).buildPhasePathSchedule(phase);

    component.showAnimatedLines.set(false);
    (component as any).updateAnimatedPhaseObjects(phase, scheduledPaths, 0);
    expect((component as any).animatedPhaseObjects).toHaveLength(0);

    component.showAnimatedLines.set(true);
    (component as any).updateAnimatedPhaseObjects(phase, scheduledPaths, 0);
    expect((component as any).animatedPhaseObjects.length).toBeGreaterThan(0);

    (component as any).updateAnimatedPhaseObjects(phase, scheduledPaths, 1);
    expect((component as any).animatedPhaseObjects).toHaveLength(0);
  });

  it('should edit the latest movement spline through its control handle and shadow endpoint', async () => {
    const fixture = TestBed.createComponent(PlayEditorComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    const pg = (component as any).tokens.find((t: any) => t.id === 'offense-1');
    expect(pg).toBeTruthy();

    component.contextMenu.set({
      clientX: 0,
      clientY: 0,
      playerId: 'offense-1',
      isBallCarrier: true,
      hasNearbyPlayer: false,
    });
    component.selectAction('dribble');

    const firstEnd = { x: pg.position.x - 72, y: pg.position.y + 18 };
    (component as any).startPath(pg.position.x, pg.position.y);
    (component as any).updateLivePath(pg.position.x - 28, pg.position.y + 26);
    (component as any).endPath(firstEnd.x, firstEnd.y);

    const path = (component as any).currentPhasePaths[0];
    expect(path.fabricObjects[0].evented).toBe(true);
    expect(path.fabricObjects[1].evented).toBe(false);
    expect((component as any).shadowTokens[0].fabricGroup.selectable).toBe(true);

    (component as any).beginPathEditing(path);
    const activeEdit = (component as any).activePathEdit;
    expect(activeEdit).toBeTruthy();

    const updatedControl = { x: path.points[1].x + 20, y: path.points[1].y - 16 };
    const removeSpy = vi.spyOn((component as any).fabricCanvas, 'remove');
    const addSpy = vi.spyOn((component as any).fabricCanvas, 'add');
    activeEdit.controlHandle.set({ left: updatedControl.x, top: updatedControl.y });
    activeEdit.controlHandle.setCoords();
    (component as any).previewActivePathControlEdit();

    expect(path.points[1]).toEqual(updatedControl);
    expect(removeSpy.mock.calls.some(call => call.includes(activeEdit.controlHandle))).toBe(false);
    expect(addSpy.mock.calls.some(call => call.includes(activeEdit.controlHandle))).toBe(false);

    (component as any).applyActivePathControlEdit();
    removeSpy.mockRestore();
    addSpy.mockRestore();

    expect(path.points[1]).toEqual(updatedControl);

    const updatedEnd = { x: firstEnd.x + 26, y: firstEnd.y + 14 };
    const shadow = (component as any).shadowTokens[0];
    const shadowGroup = shadow.fabricGroup;
    shadow.fabricGroup.set({ left: updatedEnd.x - 18, top: updatedEnd.y - 18 });
    shadow.fabricGroup.setCoords();
    shadow.position = updatedEnd;
    (component as any).applyShadowEndpointEdit(shadow, true);

    expect(path.points.at(-1)).toEqual(updatedEnd);
    expect((component as any).shadowTokens).toHaveLength(1);
    expect((component as any).shadowTokens[0]).toBe(shadow);
    expect((component as any).shadowTokens[0].fabricGroup).toBe(shadowGroup);
    expect((component as any).shadowTokens[0].position).toEqual(updatedEnd);
    expect((component as any).activePathEdit.path).toBe(path);
    expect((component as any).ballIndicator.left).toBeCloseTo(updatedEnd.x + 8);
    expect((component as any).ballIndicator.top).toBeCloseTo(updatedEnd.y - 26);
  });

  it('should show simultaneous latest shadows and clear all shadows on next phase', async () => {
    const fixture = TestBed.createComponent(PlayEditorComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    const tokens = (component as any).tokens;
    const pg = tokens.find((t: any) => t.id === 'offense-1');
    const wing = tokens.find((t: any) => t.id === 'offense-2');

    component.contextMenu.set({
      clientX: 0,
      clientY: 0,
      playerId: 'offense-1',
      isBallCarrier: true,
      hasNearbyPlayer: false,
    });
    component.selectAction('dribble');

    const pgEnd = { x: pg.position.x - 64, y: pg.position.y + 20 };
    (component as any).startPath(pg.position.x, pg.position.y);
    (component as any).updateLivePath(pg.position.x - 22, pg.position.y + 24);
    (component as any).endPath(pgEnd.x, pgEnd.y);

    const pgPath = (component as any).currentPhasePaths[0];
    expect((component as any).shadowTokens).toHaveLength(1);
    expect((component as any).shadowTokens[0].ownerId).toBe('offense-1');

    component.contextMenu.set({
      clientX: 0,
      clientY: 0,
      playerId: 'offense-2',
      isBallCarrier: false,
      hasNearbyPlayer: false,
    });
    component.selectAction('cut');

    const wingEnd = { x: wing.position.x + 34, y: wing.position.y - 54 };
    (component as any).startPath(wing.position.x, wing.position.y);
    (component as any).updateLivePath(wing.position.x + 18, wing.position.y - 20);
    (component as any).endPath(wingEnd.x, wingEnd.y);

    expect((component as any).shadowTokens).toHaveLength(2);
    expect((component as any).shadowTokens.map((shadow: any) => shadow.ownerId).sort()).toEqual(['offense-1', 'offense-2']);

    (component as any).beginPathEditing(pgPath);
    const activeEdit = (component as any).activePathEdit;
    activeEdit.controlHandle.set({ left: pgPath.points[1].x + 16, top: pgPath.points[1].y - 12 });
    activeEdit.controlHandle.setCoords();
    (component as any).applyActivePathControlEdit();

    expect((component as any).shadowTokens).toHaveLength(2);
    expect((component as any).shadowTokens.map((shadow: any) => shadow.ownerId).sort()).toEqual(['offense-1', 'offense-2']);

    component.nextPhase();

    expect((component as any).shadowTokens).toHaveLength(0);
  });

  it('should remove the spline handle when clicking a non-editable element', async () => {
    const fixture = TestBed.createComponent(PlayEditorComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    const pg = (component as any).tokens.find((t: any) => t.id === 'offense-1');
    expect(pg).toBeTruthy();

    component.contextMenu.set({
      clientX: 0,
      clientY: 0,
      playerId: 'offense-1',
      isBallCarrier: true,
      hasNearbyPlayer: false,
    });
    component.selectAction('dribble');

    const end = { x: pg.position.x - 70, y: pg.position.y + 24 };
    (component as any).startPath(pg.position.x, pg.position.y);
    (component as any).updateLivePath(pg.position.x - 26, pg.position.y + 24);
    (component as any).endPath(end.x, end.y);

    const dribblePath = (component as any).currentPhasePaths[0];
    (component as any).beginPathEditing(dribblePath);
    expect((component as any).activePathEdit).toBeTruthy();

    (component as any).executePass('offense-1', 'offense-4');
    const passPath = (component as any).currentPhasePaths.find((p: any) => p.actionType === 'pass');
    expect(passPath).toBeTruthy();

    (component as any).mouseDownPoint = { x: 20, y: 20 };
    (component as any).fabricCanvas.fire('mouse:up', {
      e: new MouseEvent('mouseup', { clientX: 20, clientY: 20 }),
      target: passPath.fabricObjects[0],
    });

    expect((component as any).activePathEdit).toBeNull();
  });

  it('should remove the spline handle when clicking a shadow and only reopen on arrow click', async () => {
    const fixture = TestBed.createComponent(PlayEditorComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    const pg = (component as any).tokens.find((t: any) => t.id === 'offense-1');
    expect(pg).toBeTruthy();

    component.contextMenu.set({
      clientX: 0,
      clientY: 0,
      playerId: 'offense-1',
      isBallCarrier: true,
      hasNearbyPlayer: false,
    });
    component.selectAction('dribble');

    const end = { x: pg.position.x - 64, y: pg.position.y + 20 };
    (component as any).startPath(pg.position.x, pg.position.y);
    (component as any).updateLivePath(pg.position.x - 20, pg.position.y + 18);
    (component as any).endPath(end.x, end.y);

    const dribblePath = (component as any).currentPhasePaths[0];
    (component as any).beginPathEditing(dribblePath);
    expect((component as any).activePathEdit).toBeTruthy();

    const shadow = (component as any).shadowTokens[0];
    (component as any).mouseDownPoint = { x: 10, y: 10 };
    (component as any).fabricCanvas.fire('mouse:up', {
      e: new MouseEvent('mouseup', { clientX: 10, clientY: 10 }),
      target: shadow.fabricGroup,
    });

    expect((component as any).activePathEdit).toBeNull();

    (component as any).mouseDownPoint = { x: 12, y: 12 };
    (component as any).fabricCanvas.fire('mouse:up', {
      e: new MouseEvent('mouseup', { clientX: 12, clientY: 12 }),
      target: dribblePath.fabricObjects[0],
    });

    expect((component as any).activePathEdit).toBeTruthy();
    expect((component as any).activePathEdit.path).toBe(dribblePath);
  });

  it('should remove the spline handle when clicking outside the canvas area', async () => {
    const fixture = TestBed.createComponent(PlayEditorComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    const pg = (component as any).tokens.find((t: any) => t.id === 'offense-1');
    expect(pg).toBeTruthy();

    component.contextMenu.set({
      clientX: 0,
      clientY: 0,
      playerId: 'offense-1',
      isBallCarrier: true,
      hasNearbyPlayer: false,
    });
    component.selectAction('dribble');

    const end = { x: pg.position.x - 68, y: pg.position.y + 16 };
    (component as any).startPath(pg.position.x, pg.position.y);
    (component as any).updateLivePath(pg.position.x - 22, pg.position.y + 18);
    (component as any).endPath(end.x, end.y);

    const dribblePath = (component as any).currentPhasePaths[0];
    (component as any).beginPathEditing(dribblePath);
    expect((component as any).activePathEdit).toBeTruthy();

    const outsideButton = fixture.nativeElement.querySelector('.editor-topbar .btn--ghost') as HTMLButtonElement;
    expect(outsideButton).toBeTruthy();

    component.onDocumentPointerDown({ target: outsideButton } as unknown as PointerEvent);

    expect((component as any).activePathEdit).toBeNull();
  });

  it('should remove the spline handle when clicking empty court space', async () => {
    const fixture = TestBed.createComponent(PlayEditorComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    const pg = (component as any).tokens.find((t: any) => t.id === 'offense-1');
    expect(pg).toBeTruthy();

    component.contextMenu.set({
      clientX: 0,
      clientY: 0,
      playerId: 'offense-1',
      isBallCarrier: true,
      hasNearbyPlayer: false,
    });
    component.selectAction('dribble');

    const end = { x: pg.position.x - 62, y: pg.position.y + 18 };
    (component as any).startPath(pg.position.x, pg.position.y);
    (component as any).updateLivePath(pg.position.x - 18, pg.position.y + 16);
    (component as any).endPath(end.x, end.y);

    const dribblePath = (component as any).currentPhasePaths[0];
    (component as any).beginPathEditing(dribblePath);
    expect((component as any).activePathEdit).toBeTruthy();

    (component as any).fabricCanvas.fire('mouse:down', {
      e: new MouseEvent('mousedown', { clientX: 30, clientY: 30 }),
      target: undefined,
    });

    expect((component as any).activePathEdit).toBeNull();
  });

  it('should keep short dribble-handoff paths so the ball handler can move in tight space', async () => {
    const fixture = TestBed.createComponent(PlayEditorComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    const ballHandler = (component as any).tokens.find((t: any) => t.id === 'offense-1');
    expect(ballHandler).toBeTruthy();

    component.contextMenu.set({
      clientX: 0,
      clientY: 0,
      playerId: 'offense-1',
      isBallCarrier: true,
      hasNearbyPlayer: true,
    });
    component.selectAction('dribble-handoff');

    const start = { ...ballHandler.position };
    const end = { x: start.x + 3, y: start.y + 2 };
    (component as any).startPath(start.x, start.y);
    (component as any).endPath(end.x, end.y);

    expect((component as any).currentPhasePaths).toHaveLength(1);
    const handoffPath = (component as any).currentPhasePaths[0];
    expect(handoffPath.actionType).toBe('dribble-handoff');
    expect(handoffPath.ownerId).toBe('offense-1');
    expect((component as any).shadowTokens).toHaveLength(0);
  });
});

describe('PlayEditorComponent — category management', () => {
  let component: PlayEditorComponent;
  let service: any;

  beforeEach(async () => {
    service = {
      get:            vi.fn().mockResolvedValue(undefined),
      save:           vi.fn().mockResolvedValue(123),
      listCategories: vi.fn().mockResolvedValue([]),
      saveCategory:   vi.fn().mockResolvedValue(99),
    };

    await TestBed.configureTestingModule({
      imports: [PlayEditorComponent],
      providers: [
        provideRouter([]),
        { provide: PlayService, useValue: service },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: { get: (k: string) => k === 'teamId' ? '42' : null },
            },
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(PlayEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  // ── setCategoryId ──────────────────────────────────────────────

  it('setCategoryId parses a numeric string into the signal', () => {
    component.setCategoryId('7');
    expect(component.playCat()).toBe(7);
  });

  it('setCategoryId sets undefined for an empty string', () => {
    component.setCategoryId('7');
    component.setCategoryId('');
    expect(component.playCat()).toBeUndefined();
  });

  // ── createCategory ─────────────────────────────────────────────

  it('createCategory saves the category, clears the input, reloads, and selects the new id', async () => {
    const newCat = { id: 99, name: 'Fast Break', team_id: 42 };
    service.saveCategory.mockResolvedValue(99);
    service.listCategories.mockResolvedValue([newCat]);

    component.newCategoryName = 'Fast Break';
    await component.createCategory();

    expect(service.saveCategory).toHaveBeenCalledWith({ name: 'Fast Break', team_id: 42 });
    expect(component.newCategoryName).toBe('');
    expect(component.categories()).toEqual([newCat]);
    expect(component.playCat()).toBe(99);
  });

  it('createCategory trims the input before saving', async () => {
    service.saveCategory.mockResolvedValue(99);
    service.listCategories.mockResolvedValue([]);

    component.newCategoryName = '  Zone Press  ';
    await component.createCategory();

    expect(service.saveCategory).toHaveBeenCalledWith({ name: 'Zone Press', team_id: 42 });
  });

  it('createCategory is a no-op when the input is blank', async () => {
    component.newCategoryName = '   ';
    await component.createCategory();
    expect(service.saveCategory).not.toHaveBeenCalled();
  });

  // ── save() auto-creates pending category ───────────────────────

  it('save() auto-creates a pending category before building the payload', async () => {
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    const newCat = { id: 99, name: 'Man Offense', team_id: 42 };
    service.saveCategory.mockResolvedValue(99);
    service.listCategories.mockResolvedValue([newCat]);

    component.newCategoryName = 'Man Offense';
    await component.save();

    expect(service.saveCategory).toHaveBeenCalledWith({ name: 'Man Offense', team_id: 42 });
    const savedPlay = service.save.mock.calls.at(-1)[0];
    expect(savedPlay.category_id).toBe(99);
  });

  it('save() does not call saveCategory when newCategoryName is empty', async () => {
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    component.newCategoryName = '';
    await component.save();
    expect(service.saveCategory).not.toHaveBeenCalled();
  });
});
