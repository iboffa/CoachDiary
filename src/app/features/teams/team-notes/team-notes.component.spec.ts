import { TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { TeamNotesComponent } from './team-notes.component';
import { TeamService } from '../../../core/services/team.service';
import { Team, TeamNote } from '../../../shared/models/models';

const TEAM: Team = { id: 1, name: 'Lakers U18', description: '' };

const NOTES: TeamNote[] = [
  { id: 1, team_id: 1, date: '2026-06-05', content: 'Worked on defense' },
  { id: 2, team_id: 1, date: '2026-06-01', content: 'Good session today' },
];

describe('TeamNotesComponent', () => {
  let component: TeamNotesComponent;
  let service: any;

  beforeEach(async () => {
    service = {
      get:        vi.fn().mockResolvedValue(TEAM),
      listNotes:  vi.fn().mockResolvedValue([]),
      saveNote:   vi.fn().mockResolvedValue(1),
      deleteNote: vi.fn().mockResolvedValue(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [TeamNotesComponent],
      providers: [
        provideRouter([]),
        { provide: TeamService, useValue: service },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: { get: (k: string) => k === 'teamId' ? '1' : null } },
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(TeamNotesComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  // ── initial load ────────────────────────────────────────────────

  describe('initial load', () => {
    it('loads the team into the team signal', () => {
      expect(component.team()?.name).toBe('Lakers U18');
    });

    it('starts with an empty entries list when there are no notes', () => {
      expect(component.entries()).toEqual([]);
    });

    it('loads existing notes into the entries signal', async () => {
      service.listNotes.mockResolvedValue(NOTES);
      await (component as any).load();
      expect(component.entries()).toHaveLength(2);
    });
  });

  // ── newEntry defaults ───────────────────────────────────────────

  describe('newEntry defaults', () => {
    it('defaults the date to today in ISO format', () => {
      const today = new Date().toISOString().split('T')[0];
      expect(component.newEntry.date).toBe(today);
    });

    it('defaults content to an empty string', () => {
      expect(component.newEntry.content).toBe('');
    });
  });

  // ── addEntry ────────────────────────────────────────────────────

  describe('addEntry', () => {
    it('calls saveNote with the correct team_id, date, and content', async () => {
      service.listNotes.mockResolvedValue([]);
      component.newEntry = { date: '2026-06-08', content: 'Great defense drill' };

      await component.addEntry();

      const saved = service.saveNote.mock.calls[0][0];
      expect(saved.team_id).toBe(1);
      expect(saved.date).toBe('2026-06-08');
      expect(saved.content).toBe('Great defense drill');
    });

    it('reloads entries after saving', async () => {
      const note: TeamNote = { id: 3, team_id: 1, date: '2026-06-08', content: 'New note' };
      service.listNotes.mockResolvedValue([note]);
      component.newEntry = { date: '2026-06-08', content: 'New note' };

      await component.addEntry();

      expect(component.entries()).toHaveLength(1);
      expect(component.entries()[0].content).toBe('New note');
    });

    it('resets newEntry content and date to today after saving', async () => {
      service.listNotes.mockResolvedValue([]);
      component.newEntry = { date: '2026-05-01', content: 'Some note' };

      await component.addEntry();

      const today = new Date().toISOString().split('T')[0];
      expect(component.newEntry.content).toBe('');
      expect(component.newEntry.date).toBe(today);
    });

    it('does nothing when content is empty', async () => {
      component.newEntry = { date: '2026-06-08', content: '' };

      await component.addEntry();

      expect(service.saveNote).not.toHaveBeenCalled();
    });

    it('does nothing when content is whitespace only', async () => {
      component.newEntry = { date: '2026-06-08', content: '   ' };

      await component.addEntry();

      expect(service.saveNote).not.toHaveBeenCalled();
    });
  });

  // ── deleteEntry ─────────────────────────────────────────────────

  describe('deleteEntry', () => {
    it('calls deleteNote with the correct id', async () => {
      service.listNotes.mockResolvedValue([]);

      await component.deleteEntry(42);

      expect(service.deleteNote).toHaveBeenCalledWith(42);
    });

    it('reloads entries after deleting', async () => {
      service.listNotes.mockResolvedValue(NOTES);
      await (component as any).load();
      expect(component.entries()).toHaveLength(2);

      service.listNotes.mockResolvedValue([NOTES[0]]);
      await component.deleteEntry(2);

      expect(component.entries()).toHaveLength(1);
      expect(component.entries()[0].id).toBe(1);
    });
  });
});
