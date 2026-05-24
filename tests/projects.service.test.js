import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../models/projects.model.js', () => {
  const MockProject = vi.fn(function() { return { save: vi.fn() }; });
  MockProject.find = vi.fn();
  MockProject.findById = vi.fn();
  MockProject.findByIdAndUpdate = vi.fn();
  MockProject.findByIdAndDelete = vi.fn();
  MockProject.countDocuments = vi.fn();
  return { default: MockProject };
});

vi.mock('../models/epics.model.js', () => {
  const MockEpic = vi.fn(function() { return { save: vi.fn() }; });
  MockEpic.find = vi.fn();
  MockEpic.updateMany = vi.fn();
  return { default: MockEpic };
});

vi.mock('../models/stories.model.js', () => {
  const MockStory = vi.fn(function() { return { save: vi.fn() }; });
  MockStory.find = vi.fn();
  MockStory.updateMany = vi.fn();
  return { default: MockStory };
});

vi.mock('../models/tasks.model.js', () => {
  const MockTask = vi.fn(function() { return { save: vi.fn() }; });
  MockTask.updateMany = vi.fn();
  return { default: MockTask };
});

import Project from '../models/projects.model.js';
import Epic from '../models/epics.model.js';
import { getAll, getById, getEpicsByProject, create, update, remove } from '../services/projects.service.js';
import NotFoundError from '../errors/NotFoundError.js';
import ValidationError from '../errors/ValidationError.js';

describe('ProjectsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('devuelve todos los proyectos paginados', async () => {
      const fakeProjects = [{ _id: '1', name: 'Proyecto A' }];
      Project.find.mockReturnValue({
        skip: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue(fakeProjects),
        }),
      });
      Project.countDocuments.mockResolvedValue(1);

      const result = await getAll(1, 20);

      expect(Project.find).toHaveBeenCalledOnce();
      expect(result).toEqual({ data: fakeProjects, total: 1 });
    });
  });

  describe('getById', () => {
    it('devuelve el proyecto si existe', async () => {
      const fakeProject = { _id: '1', name: 'Proyecto A' };
      Project.findById.mockResolvedValue(fakeProject);

      const result = await getById('1');

      expect(Project.findById).toHaveBeenCalledWith('1');
      expect(result).toEqual(fakeProject);
    });

    it('lanza NotFoundError si no existe', async () => {
      Project.findById.mockResolvedValue(null);

      await expect(getById('inexistente')).rejects.toThrow(NotFoundError);
    });

    it('lanza NotFoundError si está eliminado', async () => {
      Project.findById.mockResolvedValue({ _id: '1', deletedAt: new Date() });

      await expect(getById('1')).rejects.toThrow(NotFoundError);
    });
  });

  describe('getEpicsByProject', () => {
    it('devuelve las epics del proyecto', async () => {
      const fakeProject = { _id: '1', name: 'Proyecto A' };
      const fakeEpics = [{ _id: 'e1', name: 'Epic A', project: '1' }];
      Project.findById.mockResolvedValue(fakeProject);
      Epic.find.mockResolvedValue(fakeEpics);

      const result = await getEpicsByProject('1');

      expect(Epic.find).toHaveBeenCalledWith({ project: '1', deletedAt: null });
      expect(result).toEqual(fakeEpics);
    });

    it('lanza NotFoundError si el proyecto no existe', async () => {
      Project.findById.mockResolvedValue(null);

      await expect(getEpicsByProject('inexistente')).rejects.toThrow(NotFoundError);
    });
  });

  describe('create', () => {
    it('guarda y devuelve el nuevo proyecto', async () => {
      const input = { name: 'Nuevo proyecto' };
      const saved = { _id: 'nuevo-id', ...input };
      const mockInstance = { save: vi.fn().mockResolvedValue(saved) };
      Project.mockImplementation(function() { return mockInstance; });

      const result = await create(input);

      expect(mockInstance.save).toHaveBeenCalledOnce();
      expect(result).toEqual(saved);
    });

    it('lanza ValidationError si falta name', () => {
      expect(() => create({})).toThrow(ValidationError);
    });
  });

  describe('update', () => {
    it('actualiza y devuelve el proyecto modificado', async () => {
      const existing = { _id: '1', name: 'Antes' };
      const updated = { _id: '1', name: 'Actualizado' };
      Project.findById.mockResolvedValue(existing);
      Project.findByIdAndUpdate.mockResolvedValue(updated);

      const result = await update('1', { name: 'Actualizado' });

      expect(Project.findByIdAndUpdate).toHaveBeenCalledWith('1', { name: 'Actualizado' }, { new: true });
      expect(result).toEqual(updated);
    });

    it('lanza NotFoundError si no existe', async () => {
      Project.findById.mockResolvedValue(null);

      await expect(update('inexistente', { name: 'x' })).rejects.toThrow(NotFoundError);
    });

    it('lanza NotFoundError si está eliminado', async () => {
      Project.findById.mockResolvedValue({ _id: '1', deletedAt: new Date() });

      await expect(update('1', { name: 'x' })).rejects.toThrow(NotFoundError);
    });

    it('lanza ValidationError si falta name', async () => {
      await expect(update('1', {})).rejects.toThrow(ValidationError);
    });
  });

  describe('remove', () => {
    it('hace soft delete del proyecto y en cascada sus hijos', async () => {
      Project.findByIdAndUpdate.mockResolvedValue({ _id: '1' });
      Epic.find.mockReturnValue({ select: vi.fn().mockResolvedValue([]) });

      await remove('1');

      expect(Project.findByIdAndUpdate).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({ deletedAt: expect.any(Date) }),
      );
    });
  });
});
