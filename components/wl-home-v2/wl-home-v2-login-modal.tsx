"use client"

import { useId } from "react"
import { usePathname } from "next/navigation"

import { LoginCredentialsForm } from "@/components/auth/login-credentials-form"

type WlHomeV2LoginModalProps = {
  open: boolean
  onClose: () => void
  headingId: string
  onOpenForgotPassword: () => void
  onOpenSignUp: () => void
}

/**
 * Same shell as {@link WlHomeV2RequestModal}; form matches `/login` via {@link LoginCredentialsForm}.
 */
export function WlHomeV2LoginModal({
  open,
  onClose,
  headingId,
  onOpenForgotPassword,
  onOpenSignUp,
}: WlHomeV2LoginModalProps) {
  const pathname = usePathname()
  const formIdPrefix = useId()
  const redirectTo = pathname || "/"

  return (
    <div
      className={"modal-backdrop" + (open ? " open" : "")}
      id="login-modal"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="modal modal--login"
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-request-head modal-login-head">
          <h3 id={headingId}>Sign in</h3>
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
          <LoginCredentialsForm
            key={open ? `${formIdPrefix}-open` : `${formIdPrefix}-shut`}
            formIdPrefix={formIdPrefix}
            redirectTo={redirectTo}
            variant="home"
            onSuccess={onClose}
            onForgotPassword={onOpenForgotPassword}
            onSignUp={onOpenSignUp}
          />
        </div>
      </div>
    </div>
  )
}
