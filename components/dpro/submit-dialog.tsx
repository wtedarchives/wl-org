"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
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
        "An error occurred while submitting your information. Please try again."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitAnother = () => {
    setSubmitSuccess(false)
    setSelectedFile(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-full max-w-[calc(100%-2rem)] sm:max-w-md"
        showCloseButton={true}
      >
        <DialogHeader>
          <DialogTitle>Submit Information</DialogTitle>
        </DialogHeader>

        <p className="text-xs text-muted-foreground">
          Use this form to submit corrections, new information, or report issues
          with the site.
        </p>

        {submitSuccess ? (
          <div className="space-y-3 rounded-md border border-border bg-muted/30 p-3">
            <p className="text-sm font-medium">
              Thank you for your submission!
            </p>
            <p className="text-xs text-muted-foreground">
              We have received your information and will review it soon.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSubmitAnother}
              >
                Submit Another
              </Button>
              <Button variant="default" size="sm" onClick={handleClose}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            {submitError && (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2">
                <p className="text-xs text-destructive">{submitError}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="submissionType">
                Submission Type <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.submissionType}
                onValueChange={(v) =>
                  setFormData((prev) => ({ ...prev, submissionType: v }))
                }
                required
              >
                <SelectTrigger id="submissionType" className="w-full">
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  {SUBMISSION_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="contactEmail">
                Contact Email <span className="text-destructive">*</span>
              </Label>
              <Input
                type="email"
                id="contactEmail"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleChange}
                placeholder="ted@dripfield.pro"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="details">
                Details <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="details"
                name="details"
                value={formData.details}
                onChange={handleChange}
                placeholder="Please provide as much detail as possible about your submission..."
                rows={6}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="file">Attach File (Optional)</Label>
              <Input
                type="file"
                id="file"
                onChange={handleFileChange}
                accept="*/*"
                className="h-auto file:mr-2 file:rounded file:border-0 file:bg-primary file:px-3 file:py-1 file:text-xs file:font-medium file:text-primary-foreground file:hover:bg-primary/90"
              />
              {selectedFile && (
                <p className="text-[0.625rem] text-muted-foreground">
                  Selected: {selectedFile.name} (
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
              {fileError && (
                <p className="text-[0.625rem] text-destructive">{fileError}</p>
              )}
              <p className="text-[0.625rem] text-muted-foreground">
                Maximum file size: 50MB.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmationCode">
                Confirmation Code <span className="text-destructive">*</span>
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  id="confirmationCode"
                  name="confirmationCode"
                  value={formData.confirmationCode}
                  onChange={handleChange}
                  placeholder="—"
                  required
                  className={`w-24 ${confirmationError ? "border-destructive" : ""}`}
                />
                <span
                  className={`text-[0.625rem] ${confirmationError ? "text-destructive" : "text-muted-foreground"}`}
                >
                  {confirmationError
                    ? "Incorrect code. Please enter 726."
                    : "Type the number 726 here."}
                </span>
              </div>
            </div>

            <div className="flex justify-center pt-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
