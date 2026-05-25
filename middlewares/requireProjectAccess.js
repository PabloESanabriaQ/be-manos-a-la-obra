import Project from '../models/projects.model.js';
import ForbiddenError from '../errors/ForbiddenError.js';
import NotFoundError from '../errors/NotFoundError.js';

// Permisos por rol dentro de un proyecto
const PERMISSIONS = {
  admin_projects: new Set([
    'project:read', 'project:edit', 'project:delete',
    'epic:read', 'epic:create', 'epic:edit', 'epic:delete',
    'story:read', 'story:create', 'story:edit', 'story:delete',
    'task:read', 'task:create', 'task:edit', 'task:delete',
  ]),
  member: new Set([
    'project:read',
    'epic:read', 'epic:edit',
    'story:read', 'story:create', 'story:edit', 'story:delete',
    'task:read', 'task:create', 'task:edit', 'task:delete',
  ]),
};

// resource: 'project' | 'epic' | 'story' | 'task'
// action:   'read' | 'create' | 'edit' | 'delete'
//
// El projectId se resuelve desde req.projectId (seteado por rutas anidadas)
// o desde req.params._id (rutas directas de proyecto).
const requireProjectAccess = (resource, action) => async (req, res, next) => {
  try {
    const projectId = req.projectId ?? req.params._id;

    const project = await Project.findById(projectId);
    if (!project || project.deletedAt) {
      return next(new NotFoundError('Project not found'));
    }

    const membership = project.members.find(
      (m) => m.user.toString() === req.userId,
    );

    if (!membership) {
      return next(new ForbiddenError('You are not a member of this project'));
    }

    if (!PERMISSIONS[membership.role]?.has(`${resource}:${action}`)) {
      return next(new ForbiddenError('Insufficient permissions for this action'));
    }

    req.projectId = project._id;
    req.projectMemberRole = membership.role;
    next();
  } catch (err) {
    next(err);
  }
};

export default requireProjectAccess;
