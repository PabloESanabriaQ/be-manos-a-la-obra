import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../models/stories.model.js', () => {
  const MockStory = vi.fn(function() { return { save: vi.fn() }; });
  MockStory.find = vi.fn();
  MockStory.findById = vi.fn();
  MockStory.findByIdAndUpdate = vi.fn();
  MockStory.countDocuments = vi.fn();
  return { default: MockStory };
});

vi.mock('../models/tasks.model.js', () => {
  const MockTask = vi.fn(function() { return { save: vi.fn() }; });
  MockTask.find = vi.fn();
  return { default: MockTask };
});

vi.mock('../models/epics.model.js', () => {
  const MockEpic = vi.fn();
  MockEpic.findById = vi.fn();
  return { default: MockEpic };
});

vi.mock('../models/projects.model.js', () => {
  const MockProject = vi.fn();
  MockProject.find = vi.fn();
  MockProject.findById = vi.fn();
  return { default: MockProject };
});

import Story from '../models/stories.model.js';
import Task from '../models/tasks.model.js';
import Epic from '../models/epics.model.js';
import Project from '../models/projects.model.js';
import { getAll, getById, getTasksByStory, create, update } from '../services/stories.service.js';
import NotFoundError from '../errors/NotFoundError.js';
import ValidationError from '../errors/ValidationError.js';

// Imita el Query encadenable de Mongoose: .populate() devuelve el mismo objeto
// y .then() lo hace thenable para resolver con el valor mockeado.
const queryMock = (value) => {
  const q = {};
  q.populate = vi.fn(() => q);
  q.then = (onFulfilled, onRejected) => Promise.resolve(value).then(onFulfilled, onRejected);
  return q;
};

describe('StoriesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('devuelve todas las stories paginadas', async () => {
      const fakeStories = [{ _id: '1', name: 'Story A' }];
      Story.find.mockReturnValue({
        skip: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue(fakeStories),
        }),
      });
      Story.countDocuments.mockResolvedValue(1);

      const result = await getAll(1, 20);

      expect(Story.find).toHaveBeenCalledOnce();
      expect(result).toEqual({ data: fakeStories, total: 1 });
    });
  });

  describe('getById', () => {
    it('devuelve la story si existe', async () => {
      const fakeStory = { _id: '1', name: 'Story A' };
      Story.findById.mockReturnValue(queryMock(fakeStory));

      const result = await getById('1');

      expect(Story.findById).toHaveBeenCalledWith('1');
      expect(result).toEqual(fakeStory);
    });

    it('lanza NotFoundError si no existe', async () => {
      Story.findById.mockReturnValue(queryMock(null));

      await expect(getById('inexistente')).rejects.toThrow(NotFoundError);
    });

    it('lanza NotFoundError si está eliminada', async () => {
      Story.findById.mockReturnValue(queryMock({ _id: '1', deletedAt: new Date() }));

      await expect(getById('1')).rejects.toThrow(NotFoundError);
    });
  });

  describe('getTasksByStory', () => {
    it('devuelve las tasks de la story', async () => {
      const fakeStory = { _id: '1', name: 'Story A' };
      const fakeTasks = [{ _id: 't1', name: 'Task A', story: '1' }];
      Story.findById.mockResolvedValue(fakeStory);
      Task.find.mockResolvedValue(fakeTasks);

      const result = await getTasksByStory('1');

      expect(Task.find).toHaveBeenCalledWith({ story: '1', deletedAt: null });
      expect(result).toEqual(fakeTasks);
    });

    it('lanza NotFoundError si la story no existe', async () => {
      Story.findById.mockResolvedValue(null);

      await expect(getTasksByStory('inexistente')).rejects.toThrow(NotFoundError);
    });
  });

  describe('create', () => {
    it('guarda y devuelve la nueva story', async () => {
      const input = { name: 'Nueva story', epic: 'epic-id' };
      const saved = { _id: 'nuevo-id', ...input };
      const mockInstance = { save: vi.fn().mockResolvedValue(saved) };
      Story.mockImplementation(function() { return mockInstance; });

      const result = await create(input);

      expect(mockInstance.save).toHaveBeenCalledOnce();
      expect(result).toEqual(saved);
    });

    it('lanza ValidationError si falta name', async () => {
      await expect(create({ epic: 'epic-id' })).rejects.toThrow(ValidationError);
    });

    it('lanza ValidationError si falta epic', async () => {
      await expect(create({ name: 'Story' })).rejects.toThrow(ValidationError);
    });

    it('lanza ValidationError si points no es un valor válido de poker planning', async () => {
      await expect(create({ name: 'Story', epic: 'epic-id', points: 6 })).rejects.toThrow(ValidationError);
      await expect(create({ name: 'Story', epic: 'epic-id', points: 4 })).rejects.toThrow(ValidationError);
    });

    it('acepta todos los valores válidos de poker planning', async () => {
      for (const points of [0, 1, 2, 3, 5, 8, 13, 21]) {
        const input = { name: 'Story', epic: 'epic-id', points };
        const saved = { _id: 'nuevo-id', ...input };
        const mockInstance = { save: vi.fn().mockResolvedValue(saved) };
        Story.mockImplementation(function() { return mockInstance; });
        await expect(create(input)).resolves.toEqual(saved);
      }
    });

    it('coerciona points cuando llega como string numérico', async () => {
      const input = { name: 'Story', epic: 'epic-id', points: '5' };
      const mockInstance = { save: vi.fn().mockResolvedValue({ _id: 'nuevo-id' }) };
      Story.mockImplementation(function() { return mockInstance; });

      await create(input);

      expect(input.points).toBe(5);
      expect(Story).toHaveBeenCalledWith(expect.objectContaining({ points: 5 }));
    });

    it('lanza ValidationError si points es un string no válido', async () => {
      await expect(create({ name: 'Story', epic: 'epic-id', points: '4' })).rejects.toThrow(ValidationError);
      await expect(create({ name: 'Story', epic: 'epic-id', points: 'abc' })).rejects.toThrow(ValidationError);
    });

    it('lanza ValidationError si un usuario asignado no es miembro del proyecto', async () => {
      Epic.findById.mockResolvedValue({ _id: 'epic-id', project: 'project-id' });
      Project.findById.mockResolvedValue({
        _id: 'project-id',
        members: [{ user: { toString: () => 'user-miembro' } }],
      });

      await expect(
        create({ name: 'Story', epic: 'epic-id', assignedTo: ['user-no-miembro'] })
      ).rejects.toThrow(ValidationError);
    });

    it('permite asignar usuarios que son miembros del proyecto', async () => {
      Epic.findById.mockResolvedValue({ _id: 'epic-id', project: 'project-id' });
      Project.findById.mockResolvedValue({
        _id: 'project-id',
        members: [{ user: { toString: () => 'user-miembro' } }],
      });
      const input = { name: 'Story', epic: 'epic-id', assignedTo: ['user-miembro'] };
      const saved = { _id: 'nuevo-id', ...input };
      const mockInstance = { save: vi.fn().mockResolvedValue(saved) };
      Story.mockImplementation(function() { return mockInstance; });

      await expect(create(input)).resolves.toEqual(saved);
    });

    it('lanza ValidationError si status es inválido', async () => {
      await expect(create({ name: 'Story', epic: 'epic-id', status: 'invalido' })).rejects.toThrow(ValidationError);
    });
  });

  describe('update', () => {
    it('actualiza y devuelve la story modificada', async () => {
      const existing = { _id: '1', name: 'Antes', epic: { toString: () => 'epic-1' } };
      const updated = { _id: '1', name: 'Después', epic: 'epic-1' };
      Story.findById.mockResolvedValue(existing);
      Story.findByIdAndUpdate.mockReturnValue(queryMock(updated));

      const result = await update('1', { name: 'Después', epic: 'epic-1' });

      expect(Story.findByIdAndUpdate).toHaveBeenCalledWith('1', expect.any(Object), { new: true });
      expect(result).toEqual(updated);
    });

    it('lanza NotFoundError si no existe', async () => {
      Story.findById.mockResolvedValue(null);

      await expect(update('inexistente', { name: 'x' })).rejects.toThrow(NotFoundError);
    });

    it('lanza NotFoundError si está eliminada', async () => {
      Story.findById.mockResolvedValue({ _id: '1', deletedAt: new Date() });

      await expect(update('1', { name: 'x' })).rejects.toThrow(NotFoundError);
    });

    it('lanza ValidationError si falta name', async () => {
      await expect(update('1', {})).rejects.toThrow(ValidationError);
    });

    it('lanza ValidationError si se intenta cambiar la epic', async () => {
      const existing = { _id: '1', name: 'Story', epic: { toString: () => 'epic-original' } };
      Story.findById.mockResolvedValue(existing);

      await expect(update('1', { name: 'Story', epic: 'epic-nueva' }))
        .rejects.toThrow(ValidationError);
    });

    it('lanza ValidationError si points no es un valor válido de poker planning', async () => {
      await expect(update('1', { name: 'Story', points: -1 })).rejects.toThrow(ValidationError);
      await expect(update('1', { name: 'Story', points: 4 })).rejects.toThrow(ValidationError);
    });

    it('lanza ValidationError si un usuario asignado no es miembro del proyecto', async () => {
      const existing = { _id: '1', name: 'Story', epic: { toString: () => 'epic-id' } };
      Story.findById.mockResolvedValue(existing);
      Epic.findById.mockResolvedValue({ _id: 'epic-id', project: 'project-id' });
      Project.findById.mockResolvedValue({
        _id: 'project-id',
        members: [{ user: { toString: () => 'user-miembro' } }],
      });

      await expect(
        update('1', { name: 'Story', assignedTo: ['user-no-miembro'] })
      ).rejects.toThrow(ValidationError);
    });
  });
});
