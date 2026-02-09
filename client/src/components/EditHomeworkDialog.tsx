import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertHomeworkSchema } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useUpdateHomework } from "@/hooks/use-homework";
import { useToast } from "@/hooks/use-toast";
import type { HomeworkResponse } from "@shared/schema";

// Schema for editing - allow partial updates but validated
const editSchema = insertHomeworkSchema.partial();

interface EditHomeworkDialogProps {
  homework: HomeworkResponse;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function EditHomeworkDialog({ homework, trigger, open, onOpenChange }: EditHomeworkDialogProps) {
  const { mutateAsync: updateHomework, isPending } = useUpdateHomework();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const show = open ?? isOpen;
  const setShow = onOpenChange ?? setIsOpen;

  const form = useForm<z.infer<typeof editSchema>>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      description: homework.description,
      chapter: homework.chapter || "",
      page: homework.page || "",
      source: homework.source || "Textbook",
      activityType: homework.activityType,
    }
  });

  const onSubmit = async (data: z.infer<typeof editSchema>) => {
    try {
      await updateHomework({ id: homework.id, ...data });
      toast({ title: "Homework updated successfully" });
      setShow(false);
    } catch (error: any) {
      toast({ 
        title: "Failed to update homework", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  };

  return (
    <Dialog open={show} onOpenChange={setShow}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Homework</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Chapter</Label>
              <Input {...form.register("chapter")} placeholder="Ch. No" />
            </div>
            <div className="space-y-2">
              <Label>Page No.</Label>
              <Input {...form.register("page")} placeholder="Pg. No" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea 
              {...form.register("description")} 
              placeholder="Enter homework details..."
              className="min-h-[100px]"
            />
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
