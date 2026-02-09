import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSettings, useUpdateSettings, useSubjects, useCreateSubject, useDeleteSubject, useChangePassword } from "@/hooks/use-settings";
import { LayoutShell } from "@/components/layout-shell";
import { PageLoader } from "@/components/ui/loader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, Loader2, Eye, EyeOff, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { api } from "@shared/routes";

const passwordChangeSchema = api.auth.changePassword.input;

export default function SettingsPage() {
  const { data: settings, isLoading: loadingSettings } = useSettings();
  const { data: subjects, isLoading: loadingSubjects } = useSubjects();
  const updateSettings = useUpdateSettings();
  const createSubject = useCreateSubject();
  const deleteSubject = useDeleteSubject();
  const changePassword = useChangePassword();
  const { toast } = useToast();

  const [newSubject, setNewSubject] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordForm = useForm<z.infer<typeof passwordChangeSchema>>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const handlePasswordChange = async (data: z.infer<typeof passwordChangeSchema>) => {
    if (data.newPassword !== data.confirmPassword) {
      passwordForm.setError("confirmPassword", {
        message: "Passwords do not match",
      });
      return;
    }
    changePassword.mutate(data, {
      onSuccess: () => {
        passwordForm.reset();
      },
    });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        updateSettings.mutate({ logoUrl: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleWatermarkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        updateSettings.mutate({ watermarkUrl: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  if (loadingSettings || loadingSubjects) return <PageLoader />;

  const handleUpdateSchool = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const schoolName = formData.get("schoolName") as string;
    
    try {
      await updateSettings.mutateAsync({ schoolName });
      toast({ title: "Settings updated" });
    } catch (error) {
      toast({ title: "Failed to update", variant: "destructive" });
    }
  };

  const handleAddSubject = async () => {
    if (!newSubject.trim()) return;
    try {
      await createSubject.mutateAsync({ name: newSubject });
      setNewSubject("");
      toast({ title: "Subject added" });
    } catch (error) {
      toast({ title: "Failed to add subject", variant: "destructive" });
    }
  };

  return (
    <LayoutShell>
      <div className="max-w-2xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>

        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle>General Information</CardTitle>
            <CardDescription>Update your school details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <form onSubmit={handleUpdateSchool} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="schoolName">School Name</Label>
                  <Input 
                    id="schoolName" 
                    name="schoolName" 
                    defaultValue={settings?.schoolName || ""} 
                    placeholder="Enter school name"
                  />
                </div>
                <Button type="submit" disabled={updateSettings.isPending}>
                  {updateSettings.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </form>

              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label>School Logo</Label>
                  <div className="flex items-center gap-4">
                    {settings?.logoUrl && (
                      <div className="relative w-20 h-20 border rounded overflow-hidden bg-white">
                        <img 
                          src={settings.logoUrl} 
                          alt="School Logo" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <Input 
                        id="logo" 
                        type="file" 
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="cursor-pointer"
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Upload an image (PNG/JPG) to use as the school logo in PDFs.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label>Watermark</Label>
                    <div className="flex items-center gap-4">
                      {settings?.watermarkUrl && (
                        <div className="relative w-20 h-20 border rounded overflow-hidden bg-white">
                          <img
                            src={settings.watermarkUrl}
                            alt="Watermark"
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <Input
                          id="watermark"
                          type="file"
                          accept="image/*"
                          onChange={handleWatermarkUpload}
                          className="cursor-pointer"
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                          Upload an image to use as a watermark on homework templates (image and PDF).
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Password Change */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Change Password
            </CardTitle>
            <CardDescription>Update your admin account password</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)} className="space-y-4">
                <FormField
                  control={passwordForm.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showCurrentPassword ? "text" : "password"}
                            placeholder="Enter current password"
                            {...field}
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-0 top-0 h-full w-10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showNewPassword ? "text" : "password"}
                            placeholder="Enter new password"
                            {...field}
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-0 top-0 h-full w-10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirm new password"
                            {...field}
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-0 top-0 h-full w-10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  disabled={changePassword.isPending}
                  className="w-full"
                >
                  {changePassword.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Changing Password...
                    </>
                  ) : (
                    "Change Password"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Subjects Management */}
        <Card>
          <CardHeader>
            <CardTitle>Subjects</CardTitle>
            <CardDescription>Manage subjects available for homework</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-2">
              <Input 
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                placeholder="New subject name..."
                onKeyDown={(e) => e.key === 'Enter' && handleAddSubject()}
              />
              <Button onClick={handleAddSubject} disabled={createSubject.isPending}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {subjects?.map((subject) => (
                <Badge 
                  key={subject.id} 
                  variant="secondary" 
                  className="px-3 py-1 text-sm flex items-center gap-2"
                >
                  {subject.name}
                  <button 
                    onClick={() => deleteSubject.mutate(subject.id)}
                    className="hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </LayoutShell>
  );
}
