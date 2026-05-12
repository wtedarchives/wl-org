"use client"

import { useEffect, useId, useState } from "react"

import { WlHomeV2ModalPortal } from "@/components/wl-home-v2/wl-home-v2-modal-portal"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useWlHomeV2ScrollLock } from "@/hooks/use-wl-home-v2-scroll-lock"
import { supabase } from "@/lib/supabase"

const SUBMISSION_TYPES = [
  "Setlist Correction",
  "Setlist Submission",
  "Bandcamp/YouTube/Release Information",
  "Guest Information",
  "Song Correction",
  "Setlist Game Issue/Bug",
  "Site Issue/Bug",
  "Other",
] as const

interface SubmitDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SubmitDialog({ open, onOpenChange }: SubmitDialogProps) {
  const headingId = useId()
  const subtextId = useId()
  const [formData, setFormData] = useState({
    submissionType: "",
    contactEmail: "",
    details: "",
    confirmationCode: "",
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [confirmationError, setConfirmationError] = useState(false)

  useWlHomeV2ScrollLock(open)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, onOpenChange])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (name === "confirmationCode") setConfirmationError(false)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        setFileError("File size must be less than 50MB")
        setSelectedFile(null)
        return
      }
      setFileError("")
      setSelectedFile(file)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitError("")
    setConfirmationError(false)

    if (formData.confirmationCode !== "726") {
      setConfirmationError(true)
      setIsSubmitting(false)
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.contactEmail)) {
      setSubmitError("Please enter a valid email address.")
      setIsSubmitting(false)
      return
    }

    if (!formData.submissionType) {
      setSubmitError("Please select a submission type.")
      setIsSubmitting(false)
      return
    }

    if (!formData.details.trim()) {
      setSubmitError("Please provide details for your submission.")
      setIsSubmitting(false)
      return
    }

    if (!supabase) {
      setSubmitError("Submission service is not configured.")
      setIsSubmitting(false)
      return
    }

    try {
      let fileUrl: string | null = null

      if (selectedFile) {
        const fileExt = selectedFile.name.split(".").pop()
        const fileName = `${new Date().toISOString()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`
        const filePath = `submissions/${new Date().getFullYear()}/${new Date().getMonth() + 1}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from("files")
          .upload(filePath, selectedFile)

        if (uploadError) throw uploadError

        const { data } = supabase.storage.from("files").getPublicUrl(filePath)
        fileUrl = data.publicUrl
      }

      const { error } = await supabase.from("bugs").insert([
        {
          bug_type: formData.submissionType,
          bug_contactemail: formData.contactEmail,
          bug_detail: formData.details,
          bug_completion: false,
          bug_submissiondate: new Date().toISOString(),
          bug_file_url: fileUrl,
        },
      ])

      if (error) throw error

      setFormData({
        submissionType: "",
        contactEmail: "",
        details: "",
        confirmationCode: "",
      })
      setSelectedFile(null)
      setSubmitSuccess(true)
    } catch (err) {
      console.error("Submit error:", err)
      setSubmitError(
        "An error occurred while submitting your information. Please try again.",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitAnother = () => {
    setSubmitSuccess(false)
    setSelectedFile(null)
  }

  const backdropClass = open ? "modal-backdrop open" : "modal-backdrop"
  const codeInputClass =
    "modal-dpro-submit-code-input" +
    (confirmationError ? " modal-dpro-submit-code-input--error" : "")
  const codeHintClass =
    "modal-dpro-submit-code-hint" +
    (confirmationError ? " modal-dpro-submit-code-hint--error" : "")

  return (
    <WlHomeV2ModalPortal open={open}>
      <div
        className={backdropClass}
        id="submit-information-modal"
        role="presentation"
        onClick={(e) => {
          if (e.target === e.currentTarget) onOpenChange(false)
        }}
      >
        <div
          className="modal modal--wted-request modal--dpro-submit"
          role="dialog"
          aria-modal="true"
          aria-labelledby={headingId}
          aria-describedby={subtextId}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-request-head">
            <div className="modal-request-head-text">
              <h3 id={headingId}>Submit Information</h3>
              <p id={subtextId} className="modal-request-sub">
                Send corrections, new information, or report issues with the
                site.
              </p>
            </div>
            <button
              type="button"
              className="modal-request-close"
              onClick={handleClose}
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <div className="modal-request-body">
            <div className="modal-dpro-submit-inner">
              {submitSuccess ? (
                <div className="modal-dpro-submit-success">
                  <p className="modal-auth-success" role="status">
                    Thank you for your submission! We have received your
                    information and will review it soon.
                  </p>
                  <div className="modal-dpro-submit-actions">
                    <button
                      type="button"
                      className="wbtn"
                      onClick={handleSubmitAnother}
                    >
                      Submit Another
                    </button>
                    <button
                      type="button"
                      className="wbtn primary"
                      onClick={handleClose}
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="modal-dpro-submit-form">
                  {submitError && (
                    <p className="modal-dpro-submit-error" role="alert">
                      {submitError}
                    </p>
                  )}

                  <div className="modal-dpro-submit-field modal-dpro-submit-field--select">
                    <Label htmlFor="submissionType" className="modal-dpro-submit-label">
                      Submission Type{" "}
                      <span className="modal-dpro-submit-required">*</span>
                    </Label>
                    <Select
                      value={formData.submissionType}
                      onValueChange={(v) =>
                        setFormData((prev) => ({ ...prev, submissionType: v }))
                      }
                      required
                    >
                      <SelectTrigger id="submissionType">
                        <SelectValue placeholder="Choose a type…" />
                      </SelectTrigger>
                      <SelectContent className="modal-dpro-submit-select-content">
                        {SUBMISSION_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="modal-dpro-submit-field modal-dpro-submit-field--email">
                    <Label htmlFor="contactEmail" className="modal-dpro-submit-label">
                      Contact Email{" "}
                      <span className="modal-dpro-submit-required">*</span>
                    </Label>
                    <Input
                      type="email"
                      id="contactEmail"
                      name="contactEmail"
                      value={formData.contactEmail}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      required
                    />
                  </div>

                  <div className="modal-dpro-submit-field modal-dpro-submit-field--details">
                    <Label htmlFor="details" className="modal-dpro-submit-label">
                      Details <span className="modal-dpro-submit-required">*</span>
                    </Label>
                    <Textarea
                      id="details"
                      name="details"
                      value={formData.details}
                      onChange={handleChange}
                      placeholder="Please provide as much detail as possible about your submission…"
                      rows={5}
                      required
                    />
                  </div>

                  <div className="modal-dpro-submit-field modal-dpro-submit-field--file">
                    <Label htmlFor="file" className="modal-dpro-submit-label">
                      Attach File (Optional)
                    </Label>
                    <Input
                      type="file"
                      id="file"
                      onChange={handleFileChange}
                      accept="*/*"
                      className="modal-dpro-submit-file-input"
                    />
                    {selectedFile && (
                      <p className="modal-dpro-submit-meta">
                        Selected: {selectedFile.name} (
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    )}
                    {fileError && (
                      <p className="modal-dpro-submit-meta modal-dpro-submit-meta--error">
                        {fileError}
                      </p>
                    )}
                    <p className="modal-dpro-submit-meta">
                      Maximum file size: 50MB.
                    </p>
                  </div>

                  <div className="modal-dpro-submit-field">
                    <Label
                      htmlFor="confirmationCode"
                      className="modal-dpro-submit-label"
                    >
                      Confirmation Code{" "}
                      <span className="modal-dpro-submit-required">*</span>
                    </Label>
                    <div className="modal-dpro-submit-confirm-row">
                      <Input
                        type="text"
                        id="confirmationCode"
                        name="confirmationCode"
                        value={formData.confirmationCode}
                        onChange={handleChange}
                        placeholder="726"
                        required
                        className={codeInputClass}
                        aria-invalid={confirmationError}
                      />
                      <span className={codeHintClass}>
                        {confirmationError
                          ? "Incorrect code. Please enter 726."
                          : "Type the number 726."}
                      </span>
                    </div>
                  </div>

                  <div className="modal-dpro-submit-actions">
                    <button
                      type="submit"
                      className="wbtn primary"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Submitting…" : "Submit"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </WlHomeV2ModalPortal>
  )
}
