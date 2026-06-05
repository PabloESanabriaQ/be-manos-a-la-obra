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

vi.mock('../models/users.model.js', () => {
  const MockUser = vi.fn();
  MockUser.findById = vi.fn();
  return { default: MockUser };
});

import Project from '../models/projects.model.js';
import Epic from '../models/epics.model.js';
import User from '../models/users.model.js';
import { getAll, getById, getEpicsByProject, create, update, remove } from '../services/projects.service.js';
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
      Project.findById.mockReturnValue(queryMock(fakeProject));

      const result = await getById('1');

      expect(Project.findById).toHaveBeenCalledWith('1');
      expect(result).toEqual(fakeProject);
    });

    it('lanza NotFoundError si no existe', async () => {
      Project.findById.mockReturnValue(queryMock(null));

      await expect(getById('inexistente')).rejects.toThrow(NotFoundError);
    });

    it('lanza NotFoundError si está eliminado', async () => {
      Project.findById.mockReturnValue(queryMock({ _id: '1', deletedAt: new Date() }));

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
    it('guarda el proyecto inicializando members con el admin asignado', async () => {
      User.findById.mockResolvedValue({ _id: 'admin-id', active: true });
      const saved = { _id: 'nuevo-id', name: 'Nuevo proyecto' };
      const mockInstance = { save: vi.fn().mockResolvedValue(saved) };
      Project.mockImplementation(function() { return mockInstance; });

      const result = await create({ name: 'Nuevo proyecto', adminId: 'admin-id' });

      expect(User.findById).toHaveBeenCalledWith('admin-id');
      expect(Project).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Nuevo proyecto',
        members: [{ user: 'admin-id', role: 'admin_projects' }],
      }));
      expect(mockInstance.save).toHaveBeenCalledOnce();
      expect(result).toEqual(saved);
    });

    it('ignora members del body y solo usa el admin asignado', async () => {
      User.findById.mockResolvedValue({ _id: 'admin-id', active: true });
      const mockInstance = { save: vi.fn().mockResolvedValue({ _id: 'x' }) };
      Project.mockImplementation(function() { return mockInstance; });

      await create({
        name: 'Proyecto',
        adminId: 'admin-id',
        members: [{ user: 'otro', role: 'admin_projects' }],
      });

      expect(Project).toHaveBeenCalledWith(expect.objectContaining({
        members: [{ user: 'admin-id', role: 'admin_projects' }],
      }));
    });

    it('lanza ValidationError si falta name', async () => {
      await expect(create({ adminId: 'admin-id' })).rejects.toThrow(ValidationError);
    });

    it('lanza ValidationError si falta adminId', async () => {
      await expect(create({ name: 'Proyecto' })).rejects.toThrow(ValidationError);
    });

    it('lanza ValidationError si el admin asignado no existe', async () => {
      User.findById.mockResolvedValue(null);

      await expect(create({ name: 'Proyecto', adminId: 'no-existe' }))
        .rejects.toThrow(ValidationError);
    });

    it('lanza ValidationError si el admin asignado está inactivo', async () => {
      User.findById.mockResolvedValue({ _id: 'admin-id', active: false });

      await expect(create({ name: 'Proyecto', adminId: 'admin-id' }))
        .rejects.toThrow(ValidationError);
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
