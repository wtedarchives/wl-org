"use client"

import { useId } from "react"

import { SignupCredentialsForm } from "@/components/auth/signup-credentials-form"
import { useWlHomeV2ScrollLock } from "@/hooks/use-wl-home-v2-scroll-lock"

type WlHomeV2SignupModalProps = {
  open: boolean
  onClose: () => void
  headingId: string
  onBackToLogin: () => void
}

export function WlHomeV2SignupModal({
  open,
  onClose,
  headingId,
  onBackToLogin,
}: WlHomeV2SignupModalProps) {
  const formIdPrefix = useId()
  useWlHomeV2ScrollLock(open)

  return (
    <div
      className={"modal-backdrop" + (open ? " open" : "")}
      id="signup-modal"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="modal modal--login modal--signup"
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-request-head modal-login-head">
          <h3 id={headingId}>Create account</h3>
          <button
            type="button"
            className="modal-request-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="modal-login-body">
          <SignupCredentialsForm
            key={open ? `${formIdPrefix}-open` : `${formIdPrefix}-shut`}
            formIdPrefix={formIdPrefix}
            variant="home"
            onBackToLogin={onBackToLogin}
          />
        </div>
      </div>
    </div>
  )
}
