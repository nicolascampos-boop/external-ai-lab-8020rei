import UploadForm from '@/components/upload-form'

export default function UploadPage() {
  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Upload Material</h1>
        <p className="text-muted mt-1">Share a training document for the community to review</p>
      </div>

      <div className="bg-card rounded-xl border border-border p-6">
        <UploadForm />
      </div>
    </div>
  )
}
