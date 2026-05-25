export default function LeaveQuizModal({ open, onStay, onLeave }) {
  if (!open) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="leave-quiz-title">
      <div className="modal-card">
        <h3 id="leave-quiz-title" className="modal-title">Leave test?</h3>
        <p className="modal-body">
          Your progress will be lost and the timer will stop. You will need to start this round again.
        </p>
        <div className="modal-actions">
          <button type="button" className="btn btn-primary" onClick={onStay}>
            Continue test
          </button>
          <button type="button" className="btn btn-secondary" onClick={onLeave}>
            Leave anyway
          </button>
        </div>
      </div>
    </div>
  );
}
