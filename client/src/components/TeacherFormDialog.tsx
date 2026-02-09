import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertUserSchema } from "@shared/schema";
import { useCreateUser, useUpdateUser, useUsers } from "@/hooks/use-users"; // If update user exists, use it too
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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

// For teacher creation, password is not required in form (auto-generated)
// But zod schema requires it. We'll handle it.
const teacherFormSchema = insertUserSchema.extend({
  password: z.string().optional(), // Make password optional for form
  role: z.literal("teacher"),
});

type TeacherFormValues = z.infer<typeof teacherFormSchema>;

interface TeacherFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // If we had edit mode, we'd pass initial data here
  initialData?: any;
}

const CLASSES = ["Nursery", "LKG", "UKG", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th"];

export function TeacherFormDialog({ open, onOpenChange, initialData }: TeacherFormDialogProps) {
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();

  const form = useForm<TeacherFormValues>({
    resolver: zodResolver(teacherFormSchema),
    defaultValues: {
      username: "",
      name: "",
      mobile: "",
      assignedClass: "",
      role: "teacher",
      password: "TEMP_PASSWORD",
    },
  });

  // Reset form when dialog opens or initialData changes
  useEffect(() => {
    if (open) {
      if (initialData) {
        form.reset({
          username: initialData.username,
          name: initialData.name,
          mobile: initialData.mobile,
          assignedClass: initialData.assignedClass || "",
          role: "teacher",
          password: "TEMP_PASSWORD",
        });
      } else {
        form.reset({
          username: "",
          name: "",
          mobile: "",
          assignedClass: "",
          role: "teacher",
          password: "TEMP_PASSWORD",
        });
      }
    }
  }, [open, initialData, form]);

  const onSubmit = async (values: TeacherFormValues) => {
    const finalValues = {
      ...values,
      username: values.mobile || values.username,
    };

    try {
      if (initialData) {
        await updateUser.mutateAsync({ id: initialData.id, data: finalValues });
      } else {
        // @ts-ignore
        await createUser.mutateAsync(finalValues);
      }
      onOpenChange(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Teacher" : "Add New Teacher"}</DialogTitle>
          <DialogDescription>
            {initialData ? "Update teacher information." : "Create a teacher account. Credentials will be auto-generated."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Ramesh Kumar" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="mobile"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mobile Number</FormLabel>
                  <FormControl>
                    <Input placeholder="10 digit number" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="assignedClass"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assigned Class</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                    <FormControl>
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-popover border shadow-md max-h-[200px]">
                      {CLASSES.map((cls) => (
                        <SelectItem key={cls} value={cls}>
                          {cls}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="pt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createUser.isPending || updateUser.isPending}>
                {(createUser.isPending || updateUser.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {initialData ? "Update Teacher" : "Create Teacher"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
