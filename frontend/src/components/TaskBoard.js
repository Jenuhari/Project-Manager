// src/components/TaskBoard.js
import React from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates
} from '@dnd-kit/sortable';
import Task from './Task';

function TaskBoard({ tasksByStatus, onDragEnd, onUpdateTask, onDeleteTask }) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <div className="row">
        {Object.entries(tasksByStatus).map(([status, tasks]) => (
          <div key={status} className="col-md-4">
            <h4>{status.replace('-', ' ').toUpperCase()}</h4>

            <SortableContext
              items={tasks.map(task => task.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="border p-2" style={{ minHeight: '240px' }}>
                {tasks.length === 0 ? (
                  <div className="text-muted">No tasks</div>
                ) : (
                  tasks.map(task => (
                    <Task
                      key={task.id}
                      task={task}
                      assignedUserName={task.assigned_to_name}  // 👈 pass username
                      onUpdate={onUpdateTask}
                      onDelete={onDeleteTask}
                    />
                  ))
                )}
              </div>
            </SortableContext>
          </div>
        ))}
      </div>
    </DndContext>
  );
}

export default TaskBoard;
