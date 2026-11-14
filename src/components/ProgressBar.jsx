function ProgressBar({ current, total, height = 'h-2' }) {
  const percentage = total > 0 ? (current / total) * 100 : 0
  
  let colorClass = 'bg-danger'
  if (percentage === 100) colorClass = 'bg-success'
  else if (percentage >= 75) colorClass = 'bg-blue-400'
  else if (percentage >= 50) colorClass = 'bg-warning'
  else if (percentage >= 25) colorClass = 'bg-orange-400'

  return (
    <div className={`w-full bg-gray-200 rounded-full ${height} overflow-hidden`}>
      <div
        className={`${colorClass} ${height} rounded-full transition-all duration-300`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}

export default ProgressBar
