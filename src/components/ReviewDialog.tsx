import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Star, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ReviewDialogProps {
  orderId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userName: string;
  userId: string;
}

const ReviewDialog = ({ orderId, isOpen, onClose, onSuccess, userName, userId }: ReviewDialogProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast({ title: "Please enter a comment", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await (supabase.from("reviews" as any).insert([
        {
          order_id: orderId,
          user_id: userId,
          user_name: userName,
          rating,
          comment: comment.trim(),
          source: "web",
          is_approved: false // Needs admin approval
        }
      ])) as any;

      if (error) throw error;

      toast({
        title: "Review submitted!",
        description: "Thank you for your feedback. It will be visible after approval.",
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Leave a Review</DialogTitle>
          <DialogDescription>
            How was your experience with this order? Your feedback helps us improve.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="flex flex-col items-center gap-3">
            <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Rating</Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110 active:scale-90"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= rating ? "fill-primary text-primary" : "text-muted"
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-xs font-medium text-muted-foreground">
              {rating === 5 ? "Excellent!" : rating === 4 ? "Great" : rating === 3 ? "Good" : rating === 2 ? "Fair" : "Poor"}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Your Comment</Label>
            <Textarea
              id="comment"
              required
              placeholder="What did you think of the products and delivery?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="min-w-[100px]">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {submitting ? "Submitting..." : "Submit Review"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewDialog;
