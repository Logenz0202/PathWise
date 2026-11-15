import { Loader2 } from 'lucide-react'

// Spinner with a message, for content that is still loading
export default function LoadingState({ message }: { message: string }) {
  return (
    <p role="status" className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" />
      {message}
    </p>
  )
}
