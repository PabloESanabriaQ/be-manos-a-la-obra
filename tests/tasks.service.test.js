import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../models/tasks.model.js', () => {
  const MockTask = vi.fn(function() { return { save: vi.fn() }; });
  MockTask.find = vi.fn();
  MockTask.findById = vi.fn();
  MockTask.findByIdAndUpdate = vi.fn();
  MockTask.findByIdAndDelete = vi.fn();
  return { default: MockTask };
});

import Task from '../models/tasks.model.js';
import { getAll, getById, create, update, remove } from '../services/tasks.service.js';
import NotFoundError from '../errors/NotFoundError.js';
import ValidationError from '../errors/ValidationError.js';

describe('TasksService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('devuelve todas las tareas', async () => {
      const fakeTasks = [{ _id: '1', name: 'Tarea A' }];
      Task.find.mockResolvedValue(fakeTasks);

      const result = await getAll();

      expect(Task.find).toHaveBeenCalledOnce();
      expect(result).toEqual(fakeTasks);
    });
  });

  describe('getById', () => {
    it('devuelve la tarea si existe', async () => {
      const fakeTask = { _id: '1', name: 'Tarea A' };
      Task.findById.mockResolvedValue(fakeTask);

      const result = await getById('1');

      expect(Task.findById).toHaveBeenCalledWith('1');
      expect(result).toEqual(fakeTask);
    });

    it('lanza NotFoundError si no existe', async () => {
      Task.findById.mockResolvedValue(null);

      await expect(getById('inexistente')).rejects.toThrow(NotFoundError);
    });
  });

  describe('create', () => {
    it('guarda y devuelve la nueva tarea', async () => {
      const input = { name: 'Nueva tarea', story: 'story-id' };
      const saved = { _id: 'nuevo-id', ...input };
      const mockInstance = { save: vi.fn().mockResolvedValue(saved) };
      Task.mockImplementation(function() { return mockInstance; });

      const result = await create(input);

      expect(mockInstance.save).toHaveBeenCalledOnce();
      expect(result).toEqual(saved);
    });

    it('lanza ValidationError si falta name', () => {
      expect(() => create({ story: 'story-id' })).toThrow(ValidationError);
    });

    it('lanza ValidationError si falta story', () => {
      expect(() => create({ name: 'Tarea' })).toThrow(ValidationError);
    });
  });

  describe('update', () => {
    it('actualiza y devuelve la tarea modificada', async () => {
      const existing = { _id: '1', name: 'Antes', story: { toString: () => 'story-1' } };
      const updated = { _id: '1', name: 'Después', story: 'story-1' };
      Task.findById.mockResolvedValue(existing);
      Task.findByIdAndUpdate.mockResolvedValue(updated);

      const result = await update('1', { _id: '1', name: 'Después', story: 'story-1' });

      expect(Task.findByIdAndUpdate).toHaveBeenCalledWith('1', expect.any(Object), { new: true });
      expect(result).toEqual(updated);
    });

    it('lanza NotFoundError si no existe', async () => {
      Task.findById.mockResolvedValue(null);

      await expect(update('inexistente', { _id: 'x', name: 'x', story: 's' }))
        .rejects.toThrow(NotFoundError);
    });

    it('lanza ValidationError si se intenta cambiar la story', async () => {
      const existing = { _id: '1', name: 'Test', story: { toString: () => 'story-original' } };
      Task.findById.mockResolvedValue(existing);

      await expect(update('1', { _id: '1', name: 'Test', story: 'story-nueva' }))
        .rejects.toThrow(ValidationError);
    });
  });

  describe('remove', () => {
    it('llama a findByIdAndDelete con el id correcto', async () => {
      Task.findByIdAndDelete.mockResolvedValue({ _id: '1' });

      await remove('1');

      expect(Task.findByIdAndDelete).toHaveBeenCalledWith('1');
    });
  });
});
