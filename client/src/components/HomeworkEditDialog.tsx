import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertHomeworkSchema, type Homework } from "@shared/schema";
import { useUpdateHomework } from "@/hooks/use-homework";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

interface HomeworkEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  homework: Homework;
}

// Partial schema for editing - only specific fields allowed
const editSchema = insertHomeworkSchema.pick({
  activityType: true,
  chapter: true,
  page: true,
  description: true,
  source: true,
});

type EditFormValues = z.infer<typeof editSchema>;

export function HomeworkEditDialog({ open, onOpenChange, homework }: HomeworkEditDialogProps) {
  const updateHomework = useUpdateHomework();

  const form = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      activityType: homework.activityType,
      chapter: homework.chapter || "",
      page: homework.page || "",
      description: homework.description,
      source: homework.source || "Textbook",
    },
  });

  // Reset form when homework prop changes or dialog opens
  useEffect(() => {
    if (open) {
      form.reset({
        activityType: homework.activityType,
        chapter: homework.chapter || "",
        page: homework.page || "",
        description: homework.description,
        source: homework.source || "Textbook",
      });
    }
  }, [open, homework, form]);

  const onSubmit = async (values: EditFormValues) => {
    try {
      await updateHomework.mutateAsync({ 
        id: homework.id, 
        ...values 
      });
      onOpenChange(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Homework</DialogTitle>
          <DialogDescription>
            Update details for {homework.class} - {homework.activityType}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="activityType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Activity</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g. Textbook" value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="chapter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chapter</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="page"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Page No.</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question Numbers</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      className="min-h-[100px]"
                      placeholder="e.g. 1, 2, 3 or 1-10"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="pt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateHomework.isPending}>
                {updateHomework.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
