import { useState } from "react";
import { LayoutShell } from "@/components/layout-shell";
import { useUsers, useDeleteUser } from "@/hooks/use-users";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, UserX, Loader2, KeyRound, Phone, School, Edit } from "lucide-react";
import { TeacherFormDialog } from "@/components/TeacherFormDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PageLoader } from "@/components/ui/loader";

export default function TeachersPage() {
  const { data: teachers, isLoading } = useUsers('teacher');
  const deleteUser = useDeleteUser();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  if (isLoading) return <PageLoader />;

  return (
    <LayoutShell>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teachers</h1>
          <p className="text-muted-foreground">Manage teacher accounts and assignments</p>
        </div>
        <Button 
          onClick={() => {
            setEditingTeacher(null);
            setIsDialogOpen(true);
          }}
          className="w-full sm:w-auto shadow-lg shadow-primary/25"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Teacher
        </Button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {teachers?.map((teacher) => (
          <Card key={teacher.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <CardHeader className="bg-muted/30 pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{teacher.name || "Unnamed Teacher"}</CardTitle>
                  <CardDescription>@{teacher.username}</CardDescription>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setEditingTeacher(teacher);
                      setIsDialogOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteId(teacher.id)}
                  >
                    <UserX className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center text-sm text-muted-foreground">
                <School className="mr-2 h-4 w-4 text-primary" />
                Class: <span className="font-medium text-foreground ml-1">{teacher.assignedClass || "None"}</span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Phone className="mr-2 h-4 w-4 text-primary" />
                {teacher.mobile || "No mobile"}
              </div>
              
              {/* Credentials Display */}
              <div className="mt-4 p-3 bg-muted rounded-lg border border-border text-sm">
                 <div className="flex items-center gap-2 mb-1 text-xs uppercase text-muted-foreground font-semibold">
                    <KeyRound className="w-3 h-3" /> Credentials
                 </div>
                 <div className="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1">
                    <span className="text-muted-foreground">Username:</span>
                    <span className="font-mono font-medium">{teacher.username}</span>
                    <span className="text-muted-foreground">Password:</span>
                    <span className="font-mono font-medium text-primary">
                        {/* 
                           Reconstruct password pattern for display since we don't store plain text
                           Rule: First 3 letters of name (upper) + last 4 of mobile
                        */}
                        {teacher.name && teacher.mobile 
                            ? `${teacher.name.substring(0,3).toUpperCase()}${teacher.mobile.slice(-4)}`
                            : "Manual Set"}
                    </span>
                 </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <TeacherFormDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen}
        initialData={editingTeacher}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the teacher account
              and remove their access to the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteId && deleteUser.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </LayoutShell>
  );
}

