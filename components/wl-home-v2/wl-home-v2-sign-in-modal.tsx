"use client"

type WlHomeV2SignInModalProps = {
  open: boolean
  onClose: () => void
  headingId: string
  onOpenLogin: () => void
  onOpenSignup: () => void
}

/**
 * Same shell as {@link WlHomeV2RequestModal}: `.modal-backdrop` + `.modal`.
 * Sign in opens {@link WlHomeV2LoginModal}; create account opens the home signup modal.
 */
export function WlHomeV2SignInModal({
  open,
  onClose,
  headingId,
  onOpenLogin,
  onOpenSignup,
}: WlHomeV2SignInModalProps) {
  return (
    <div
      className={"modal-backdrop" + (open ? " open" : "")}
      id="sign-in-modal"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="modal modal--sign-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-request-head">
          <h3 id={headingId}>Sign In</h3>
          <button
            type="button"
            className="modal-request-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <p className="sub">
          Sign in to open your archive profile — shows attended, badges, songs
          tracked, and more.
        </p>
        <div className="modal-actions modal-actions--sign-in">
          <button
            type="button"
            className="wbtn primary"
            onClick={() => {
              onClose()
              onOpenLogin()
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className="wbtn"
            onClick={() => {
              onClose()
              onOpenSignup()
            }}
          >
            Create account
          </button>
        </div>
      </div>
    </div>
  )
}
