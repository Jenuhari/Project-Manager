# projects.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, Project, Task, ActivityLog, GlobalActivityLog

projects_bp = Blueprint('projects', __name__)


# ---------- helpers ----------

def _task_to_dict(t: Task):
    """Serialize a Task so frontend always gets project_id."""
    return {
        'id': t.id,
        'title': t.title,
        'status': t.status,
        'assigned_to': t.assigned_to,
        'project_id': t.project_id,
    }


def _create_task_for_project(current_user_id, project_id, data):
    """
    Shared task-creation logic used by:
      - POST /projects/<project_id>/tasks
      - POST /tasks (project_id from body)

    Only ADMIN (who owns the project) is allowed to create tasks.
    """
    current_user = User.query.get(current_user_id)
    if not current_user or getattr(current_user, "role", "") != "admin":
        return None, (jsonify({'error': 'Only admin can create tasks'}), 403)

    # ensure project belongs to this admin
    project = Project.query.filter_by(id=project_id, user_id=current_user_id).first()
    if not project:
        return None, (jsonify({'error': 'Invalid project or unauthorized'}), 403)

    # check assigned user (optional)
    assigned_to_id = data.get('assigned_to')
    if assigned_to_id is not None:
        assigned_user = User.query.get(assigned_to_id)
        if not assigned_user:
            return None, (jsonify({'error': 'Assigned user does not exist'}), 400)

    status = data.get('status', 'todo')

    task = Task(
        title=data['title'],
        status=status,
        project_id=project_id,
        assigned_to=assigned_to_id
    )
    db.session.add(task)

    # per-project log
    log = ActivityLog(
        action=f"Added task: {data['title']}",
        user_id=current_user_id,
        project_id=project_id,
    )
    db.session.add(log)

    # global log
    g_log = GlobalActivityLog(
        user_id=current_user_id,
        action=f"Added task '{data['title']}' in project {project_id}"
    )
    db.session.add(g_log)

    return task, None


# ---------- projects ----------

@projects_bp.route('/projects', methods=['POST'])
@jwt_required()
def create_project():
    """Only ADMIN can create projects."""
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    if not user or getattr(user, "role", "") != "admin":
        return jsonify({'error': 'Only admin can create projects'}), 403

    data = request.get_json() or {}
    if 'name' not in data:
        return jsonify({'error': 'Missing required field: name'}), 400

    project = Project(name=data['name'], user_id=current_user_id)
    db.session.add(project)
    db.session.commit()  # to get project.id

    # project-specific log
    log = ActivityLog(
        action=f'Created project: {project.name}',
        user_id=current_user_id,
        project_id=project.id
    )
    db.session.add(log)

    # global log
    g_log = GlobalActivityLog(
        user_id=current_user_id,
        action=f"Created project '{project.name}' (ID {project.id})"
    )
    db.session.add(g_log)

    db.session.commit()

    return jsonify({'message': 'Project created', 'id': project.id}), 201


@projects_bp.route('/projects', methods=['GET'])
@jwt_required()
def get_projects():
    """
    Admin: sees projects they own.
    Normal user: sees projects where they have at least one assigned task.
    """
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    if getattr(user, "role", "") == "admin":
        projects = Project.query.filter_by(user_id=current_user_id).all()
    else:
        # projects where this user has tasks assigned
        projects = (
            Project.query
            .join(Task, Task.project_id == Project.id)
            .filter(
                Task.assigned_to == current_user_id,
                Task.is_deleted == False
            )
            .distinct()
            .all()
        )

    return jsonify([{'id': p.id, 'name': p.name} for p in projects]), 200


# ---------- per-project tasks ----------

@projects_bp.route('/projects/<int:project_id>/tasks', methods=['GET', 'POST'])
@jwt_required()
def manage_tasks(project_id):
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    # permission check for this project
    project = Project.query.get(project_id)
    if not project:
        return jsonify({'error': 'Project not found'}), 404

    is_admin = getattr(user, "role", "") == "admin"

    if request.method == 'GET':
        # Admin: can view tasks for projects they own
        if is_admin:
            if project.user_id != current_user_id:
                return jsonify({'error': 'Unauthorized'}), 403
            tasks = Task.query.filter_by(project_id=project_id, is_deleted=False).all()
        else:
            # Normal user:
            # only allowed to view this board if they have at least one task here
            has_any = Task.query.filter_by(
                project_id=project_id,
                assigned_to=current_user_id,
                is_deleted=False
            ).first()
            if not has_any:
                return jsonify({'error': 'Unauthorized'}), 403

            # but they can see the whole board (all tasks in that project)
            tasks = Task.query.filter_by(project_id=project_id, is_deleted=False).all()

        return jsonify([_task_to_dict(t) for t in tasks]), 200

    # POST – create task for this project (only admin, enforced in helper)
    data = request.get_json() or {}
    if 'title' not in data:
        return jsonify({'error': 'Missing required field: title'}), 400

    try:
        task, error_response = _create_task_for_project(current_user_id, project_id, data)
        if error_response is not None:
            return error_response

        db.session.commit()
        return jsonify({'message': 'Task added', 'task_id': task.id}), 201
    except Exception as e:
        db.session.rollback()
        print(f"Error adding task: {str(e)}")
        return jsonify({'error': 'Failed to add task', 'details': str(e)}), 500


# ---------- GLOBAL TASKS (for TasksPage, with project_id column) ----------

@projects_bp.route('/tasks', methods=['GET', 'POST'])
@jwt_required()
def tasks_root():
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    # GET
    if request.method == 'GET':
        if getattr(user, "role", "") == "admin":
            # admin: tasks in projects they own
            tasks = (
                Task.query
                .join(Project, Task.project_id == Project.id)
                .filter(Project.user_id == current_user_id, Task.is_deleted == False)
                .all()
            )
        else:
            # normal user: only tasks assigned to them
            tasks = Task.query.filter_by(
                assigned_to=current_user_id,
                is_deleted=False
            ).all()

        return jsonify([_task_to_dict(t) for t in tasks]), 200

    # POST: only admin can create tasks this way
    if getattr(user, "role", "") != "admin":
        return jsonify({'error': 'Only admin can create tasks'}), 403

    data = request.get_json() or {}
    if 'title' not in data:
        return jsonify({'error': 'Missing required field: title'}), 400
    if 'project_id' not in data:
        return jsonify({'error': 'Missing required field: project_id'}), 400

    project_id = data['project_id']

    try:
        task, error_response = _create_task_for_project(current_user_id, project_id, data)
        if error_response is not None:
            return error_response

        db.session.commit()
        return jsonify({'message': 'Task added', 'task_id': task.id}), 201
    except Exception as e:
        db.session.rollback()
        print(f"Error adding task via /tasks: {str(e)}")
        return jsonify({'error': 'Failed to add task', 'details': str(e)}), 500


@projects_bp.route('/projects/<int:project_id>', methods=['GET'])
@jwt_required()
def get_project_detail(project_id):
    """
    Admin: can see project they own.
    User: can see project if they have any task in it.
    """
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    is_admin = getattr(user, "role", "") == "admin"

    if is_admin:
        project = Project.query.filter_by(id=project_id, user_id=current_user_id).first()
    else:
        project = (
            Project.query
            .join(Task, Task.project_id == Project.id)
            .filter(
                Project.id == project_id,
                Task.assigned_to == current_user_id,
                Task.is_deleted == False
            )
            .first()
        )

    if not project:
        return jsonify({'error': 'Project not found or unauthorized'}), 404

    task_count = Task.query.filter_by(project_id=project_id, is_deleted=False).count()

    return jsonify({
        'id': project.id,
        'name': project.name,
        'task_count': task_count
    }), 200


# ---------- per-project activity logs ----------

@projects_bp.route('/projects/<int:project_id>/logs', methods=['GET'])
@jwt_required()
def get_activity_logs(project_id):
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    if not current_user:
        return jsonify({'error': 'User not found'}), 404

    is_admin = getattr(current_user, "role", "") == "admin"

    query = (
        db.session.query(ActivityLog, User.username)
        .join(User, ActivityLog.user_id == User.id)
        .join(Project, ActivityLog.project_id == Project.id)
        .filter(ActivityLog.project_id == project_id)
    )

    if not is_admin:
        # normal user → only see their own actions in this project
        query = query.filter(ActivityLog.user_id == current_user_id)

    logs = query.order_by(ActivityLog.timestamp.desc()).all()

    return jsonify([
        {
            'id': log.id,
            'user': username,
            'action': log.action,
            'timestamp': log.timestamp.isoformat(),
            'project_id': log.project_id,
        }
        for log, username in logs
    ]), 200


# ---------- global activity logs (login/logout + project actions) ----------

# ---------- global activity logs (login/logout + project actions) ----------
from datetime import datetime
@projects_bp.route('/global-logs', methods=['GET'])
@jwt_required()
def get_global_logs():
    """
    Global activity stream (project/task + login/logout).
      - Admin: sees ALL users' logs.
      - Normal user: sees ONLY their own logs.
    Returned newest → oldest.
    Optional: ?limit=50
    """
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    if not current_user:
        return jsonify({'error': 'User not found'}), 404

    is_admin = getattr(current_user, "role", "") == "admin"
    limit = request.args.get("limit", type=int)

    events = []

    # ===== 1. PROJECT / TASK LOGS (ActivityLog) =====
    proj_query = (
        db.session.query(
            ActivityLog.id,
            ActivityLog.action,
            ActivityLog.timestamp,
            ActivityLog.project_id,
            User.username,
            Project.name,
        )
        .join(User, ActivityLog.user_id == User.id)
        .outerjoin(Project, ActivityLog.project_id == Project.id)
    )

    # normal user → only their own actions
    if not is_admin:
        proj_query = proj_query.filter(ActivityLog.user_id == current_user_id)

    for log_id, action, ts, project_id, username, project_name in proj_query.all():
        events.append({
            "id": f"proj-{log_id}",
            "user": username,
            "action": action,
            "created_at": ts.isoformat() if ts else None,
            "project_id": project_id,
            "project_name": project_name,
            "scope": "project",
        })

    # ===== 2. GLOBAL / AUTH LOGS (GlobalActivityLog) =====
    glob_query = (
        db.session.query(
            GlobalActivityLog.id,
            GlobalActivityLog.action,
            GlobalActivityLog.timestamp,
            User.username,
        )
        .join(User, GlobalActivityLog.user_id == User.id)
    )

    # normal user → only their own login/logout/global logs
    if not is_admin:
        glob_query = glob_query.filter(GlobalActivityLog.user_id == current_user_id)

    for log_id, action, ts, username in glob_query.all():
        events.append({
            "id": f"auth-{log_id}",
            "user": username,
            "action": action,  # e.g. "Logged in", "Logged out"
            "created_at": ts.isoformat() if ts else None,
            "project_id": None,
            "project_name": None,
            "scope": "auth",
        })

    # ===== 3. SAFE SORT: newest → oldest =====
    def safe_dt(iso_str):
        if not iso_str:
            return datetime.min
        try:
            return datetime.fromisoformat(iso_str)
        except Exception:
            return datetime.min

    for e in events:
        e["_dt"] = safe_dt(e.get("created_at"))

    # sort by our helper datetime field
    # events.sort(key=lambda e: e["_dt"], reverse=True)

    # apply optional limit AFTER sorting
    # if limit is not None and limit > 0:
    #     events = events[:limit]

    # remove helper before returning
    events.sort(key=lambda e: (e.get("created_at") or e.get("timestamp")  or ""), reverse=True)

    for e in events:
        e.pop("_dt", None)

    return jsonify(events), 200

