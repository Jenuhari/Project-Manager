# tasks.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Task, Project, User, ActivityLog, GlobalActivityLog

tasks_bp = Blueprint('tasks', __name__)


@tasks_bp.route('/tasks', methods=['GET'])
@jwt_required()
def get_all_user_tasks():
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    # 🔹 Admin: see tasks in projects they own
    if user.role == 'admin':
        projects = Project.query.filter_by(user_id=current_user_id).all()
        project_ids = [p.id for p in projects]
        tasks = Task.query.filter(
            Task.project_id.in_(project_ids),
            Task.is_deleted == False
        ).all()
    else:
        # 🔹 Normal user: only tasks assigned to them
        tasks = Task.query.filter_by(
            assigned_to=current_user_id,
            is_deleted=False
        ).all()

    tasks_data = []
    for t in tasks:
        tasks_data.append({
            'id': t.id,
            'title': t.title,
            'status': t.status,
            'assigned_to': t.assigned_to,
            'project_id': t.project_id
        })
    return jsonify(tasks_data), 200


@tasks_bp.route('/tasks', methods=['POST'])
@jwt_required()
def create_task():
    """Only ADMIN can create tasks via /tasks."""
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    if not user or user.role != 'admin':
        return jsonify({'error': 'Only admin can create tasks'}), 403

    data = request.get_json() or {}

    title = data.get('title')
    project_id = data.get('project_id')
    assigned_to = data.get('assigned_to')  # optional
    status = data.get('status', 'todo')

    if not title or not project_id:
        return jsonify({'error': 'Missing required fields'}), 400

    # Verify that the project belongs to this admin
    project = Project.query.filter_by(id=project_id, user_id=current_user_id).first()
    if not project:
        return jsonify({'error': 'Invalid project or unauthorized'}), 403

    # (Optional) Validate the assigned_to user exists
    if assigned_to is not None:
        assigned_user = User.query.get(assigned_to)
        if not assigned_user:
            return jsonify({'error': 'Assigned user does not exist'}), 400

    task = Task(
        title=title,
        project_id=project_id,
        assigned_to=assigned_to,
        status=status
    )

    db.session.add(task)

    # per-project log
    log = ActivityLog(
        action=f"Added task: {title}",
        user_id=current_user_id,
        project_id=project_id
    )
    db.session.add(log)

    # global log
    g_log = GlobalActivityLog(
        user_id=current_user_id,
        action=f"Added task '{title}' in project {project_id}"
    )
    db.session.add(g_log)

    db.session.commit()

    return jsonify({'message': 'Task created', 'task_id': task.id}), 201


def normalize_status(value):
    """Normalize common frontend status values into stored values (we store same values as frontend)."""
    if not value:
        return 'todo'
    s = str(value).strip().lower()
    if s in ('todo', 'to-do', 'to do', 'pending'):
        return 'todo'
    if s in ('in-progress', 'in progress', 'in_progress', 'inprogress'):
        return 'in-progress'
    if s in ('done', 'completed', 'complete'):
        return 'done'
    return s


@tasks_bp.route('/tasks/<int:task_id>', methods=['PUT'])
@jwt_required()
def update_task(task_id):
    current_user_id = get_jwt_identity()
    data = request.get_json() or {}
    task = Task.query.get_or_404(task_id)

    project = Project.query.get(task.project_id)
    if project is None:
        return jsonify({'error': 'Parent project not found'}), 404

    # user must be project owner OR currently assigned user
    if int(project.user_id) != int(current_user_id) and (
        task.assigned_to is None or int(task.assigned_to) != int(current_user_id)
    ):
        return jsonify({'error': 'Unauthorized'}), 403

    # 👇 role / permissions
    current_user = User.query.get(int(current_user_id))
    is_admin = current_user and getattr(current_user, "role", "") == "admin"
    is_project_owner = int(project.user_id) == int(current_user_id)
    can_edit_structure = is_admin or is_project_owner  # can change title / assignee

    changes = []

    # TITLE – only admin / project owner may change
    if 'title' in data and can_edit_structure:
        new_title = str(data['title']).strip()
        if not new_title:
            return jsonify({'error': 'Title cannot be empty'}), 400
        if new_title != task.title:
            changes.append(f"Title changed '{task.title}' → '{new_title}'")
        task.title = new_title

    # STATUS – ANY authorized user may change
    if 'status' in data:
        new_status = normalize_status(data['status'])
        if new_status != task.status:
            changes.append(f"Status changed {task.status} → {new_status}")
        task.status = new_status

    # ASSIGNED TO – only admin / project owner may change
    if 'assigned_to' in data and can_edit_structure:
        new_assigned = data['assigned_to']
        if new_assigned is not None:
            assigned_user = User.query.get(new_assigned)
            if not assigned_user:
                return jsonify({'error': 'Assigned user does not exist'}), 400

        if new_assigned != task.assigned_to:
            old_user = task.assigned_to if task.assigned_to is not None else "Unassigned"
            new_user = new_assigned if new_assigned is not None else "Unassigned"
            changes.append(f"Assigned_to changed {old_user} → {new_user}")
        task.assigned_to = new_assigned

    # Build log text
    if not changes:
        action_text = f"Updated task: {task.title}"
    else:
        change_details = "; ".join(changes)
        action_text = f"Updated task: {task.title} ({change_details})"

    log = ActivityLog(
        action=action_text,
        user_id=current_user_id,
        project_id=task.project_id
    )
    db.session.add(log)

    try:
        db.session.commit()
        return jsonify({
            'message': 'Task updated',
            'task': {
                'id': task.id,
                'title': task.title,
                'status': task.status,
                'assigned_to': task.assigned_to,
                'project_id': task.project_id
            }
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Database error', 'details': str(e)}), 500

@tasks_bp.route('/tasks/<int:task_id>', methods=['DELETE'])
@jwt_required()
def delete_task(task_id):
    """
    Only admin (project owner) can delete tasks.
    """
    current_user_id = int(get_jwt_identity())
    task = Task.query.get_or_404(task_id)

    project = Project.query.get(task.project_id)
    if project is None:
        return jsonify({'error': 'Parent project not found'}), 404

    current_user = User.query.get(current_user_id)
    if not current_user or current_user.role != 'admin':
        return jsonify({'error': 'Only admin can delete tasks'}), 403

    # Soft delete
    task.is_deleted = True
    log = ActivityLog(
        action=f"Deleted task: {task.title}",
        user_id=current_user_id,
        project_id=task.project_id
    )
    db.session.add(log)

    g_log = GlobalActivityLog(
        user_id=current_user_id,
        action=f"Deleted task: {task.title}"
    )
    db.session.add(g_log)

    try:
        db.session.commit()
        return jsonify({'message': 'Task deleted'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Database error', 'details': str(e)}), 500
