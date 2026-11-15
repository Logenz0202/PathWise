import { Loader2 } from 'lucide-react'

// Spinner with a message, for content that is still loading
export default function LoadingState({ message }: { message: string }) {
  return (
    <p role="status" className="flex items-center justify-center gap-2 py-4 text-slate-600">
      <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
      {message}
    </p>
  )
}
