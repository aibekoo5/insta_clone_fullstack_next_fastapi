
import type { Comment as CommentType } from '@/types';
import { CommentItem } from './comment-item';

interface CommentListProps {
  comments: CommentType[];
  postId: number; // Added postId to pass to CommentItem
}

export function CommentList({ comments, postId }: CommentListProps) {
  if (!comments || comments.length === 0) {
    return <p className="text-sm text-muted-foreground py-4 text-center">No comments yet.</p>;
  }

  return (
    <div className="space-y-2 divide-y divide-border/50">
      {comments.map((comment) => (
        <CommentItem key={comment.id} comment={comment} postId={postId} />
      ))}
      {/* Placeholder for infinite scroll loading or "load more" button */}
    </div>
  );
}
