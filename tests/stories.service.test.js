import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../models/stories.model.js', () => {
  const MockStory = vi.fn(function() { return { save: vi.fn() }; });
  MockStory.find = vi.fn();
  MockStory.findById = vi.fn();
  MockStory.findByIdAndUpdate = vi.fn();
  return { default: MockStory };
});

vi.mock('../models/tasks.model.js', () => {
  const MockTask = vi.fn(function() { return { save: vi.fn() }; });
  MockTask.find = vi.fn();
  return { default: MockTask };
});

import Story from '../models/stories.model.js';
import Task from '../models/tasks.model.js';
import { getAll, getById, getTasksByStory, create, update } from '../services/stories.service.js';
import NotFoundError from '../errors/NotFoundError.js';
import ValidationError from '../errors/ValidationError.js';

describe('StoriesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('devuelve todas las stories', async () => {
      const fakeStories = [{ _id: '1', name: 'Story A' }];
      Story.find.mockResolvedValue(fakeStories);

      const result = await getAll();

      expect(Story.find).toHaveBeenCalledOnce();
      expect(result).toEqual(fakeStories);
    });
  });

  describe('getById', () => {
    it('devuelve la story si existe', async () => {
      const fakeStory = { _id: '1', name: 'Story A' };
      Story.findById.mockResolvedValue(fakeStory);

      const result = await getById('1');

      expect(Story.findById).toHaveBeenCalledWith('1');
      expect(result).toEqual(fakeStory);
    });

    it('lanza NotFoundError si no existe', async () => {
      Story.findById.mockResolvedValue(null);

      await expect(getById('inexistente')).rejects.toThrow(NotFoundError);
    });
  });

  describe('getTasksByStory', () => {
    it('devuelve las tasks de la story', async () => {
      const fakeStory = { _id: '1', name: 'Story A' };
      const fakeTasks = [{ _id: 't1', name: 'Task A', story: '1' }];
      Story.findById.mockResolvedValue(fakeStory);
      Task.find.mockResolvedValue(fakeTasks);

      const result = await getTasksByStory('1');

      expect(Task.find).toHaveBeenCalledWith({ story: '1' });
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

    it('lanza ValidationError si falta name', () => {
      expect(() => create({ epic: 'epic-id' })).toThrow(ValidationError);
    });

    it('lanza ValidationError si falta epic', () => {
      expect(() => create({ name: 'Story' })).toThrow(ValidationError);
    });

    it('lanza ValidationError si points está fuera de rango', () => {
      expect(() => create({ name: 'Story', epic: 'epic-id', points: 6 })).toThrow(ValidationError);
    });

    it('lanza ValidationError si status es inválido', () => {
      expect(() => create({ name: 'Story', epic: 'epic-id', status: 'invalido' })).toThrow(ValidationError);
    });
  });

  describe('update', () => {
    it('actualiza y devuelve la story modificada', async () => {
      const existing = { _id: '1', name: 'Antes', epic: { toString: () => 'epic-1' } };
      const updated = { _id: '1', name: 'Después', epic: 'epic-1' };
      Story.findById.mockResolvedValue(existing);
      Story.findByIdAndUpdate.mockResolvedValue(updated);

      const result = await update('1', { name: 'Después', epic: 'epic-1' });

      expect(Story.findByIdAndUpdate).toHaveBeenCalledWith('1', expect.any(Object), { new: true });
      expect(result).toEqual(updated);
    });

    it('lanza NotFoundError si no existe', async () => {
      Story.findById.mockResolvedValue(null);

      await expect(update('inexistente', { name: 'x' })).rejects.toThrow(NotFoundError);
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

    it('lanza ValidationError si points está fuera de rango', async () => {
      await expect(update('1', { name: 'Story', points: -1 })).rejects.toThrow(ValidationError);
    });
  });
});
