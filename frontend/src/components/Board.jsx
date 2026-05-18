import TaskCard from './TaskCard'

const COLUMNS = [
  {
    status: 'OPEN',
    label: 'Open',
    borderColor: 'border-blue-500',
    dotColor: 'bg-blue-500',
    countStyle: 'bg-blue-500/10 text-blue-400',
  },
  {
    status: 'IN_PROGRESS',
    label: 'In Progress',
    borderColor: 'border-amber-500',
    dotColor: 'bg-amber-500',
    countStyle: 'bg-amber-500/10 text-amber-400',
  },
  {
    status: 'DONE',
    label: 'Done',
    borderColor: 'border-emerald-500',
    dotColor: 'bg-emerald-500',
    countStyle: 'bg-emerald-500/10 text-emerald-400',
  },
]

export default function Board({ tasks, onTransition, onDelete }) {
  const forStatus = (status) => tasks.filter((t) => t.status === status)

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {COLUMNS.map(({ status, label, borderColor, dotColor, countStyle }) => {
        const columnTasks = forStatus(status)
        return (
          <div key={status} className="flex flex-col gap-3">
            <div className={`flex items-center justify-between pb-3 border-b-2 ${borderColor}`}>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`} />
                <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-widest">
                  {label}
                </h2>
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${countStyle}`}>
                {columnTasks.length}
              </span>
            </div>

            <div className="flex flex-col gap-3 min-h-[50vh]">
              {columnTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 py-16 text-slate-700 border border-dashed border-slate-800 rounded-lg">
                  <svg
                    className="w-7 h-7 mb-2 opacity-40"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  <p className="text-xs">No tasks here</p>
                </div>
              ) : (
                columnTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onTransition={onTransition}
                    onDelete={onDelete}
                  />
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
