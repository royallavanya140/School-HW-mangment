import { useState, useEffect } from "react";
import { LayoutShell } from "@/components/layout-shell";
import { useCreateHomework, useHomework, useUpdateHomework, useDeleteHomework } from "@/hooks/use-homework";
import { useSubjects, useSettings } from "@/hooks/use-settings";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Save, Loader2, Download, Trash2, Check, FileImage, FileDown } from "lucide-react";
import { PageLoader } from "@/components/ui/loader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { downloadHomeworkAsImage } from "@/hooks/use-download-homework-image";

const ACTIVITY_TYPES = ["Reading", "Writing", "Read and Write", "Learning", "Project", "Activity", "Test", "Revise", "Complete"];
const SOURCES = ["Textbook", "Material", "Workbook", "Worksheet", "Note Book", "C/W", "H/W"];

type HomeworkEntry = {
  subjectId: number;
  subjectName: string;
  homework: string;
  activityType: string;
  source: string;
  chapter: string;
  page: string;
  existingId?: number;
  saved: boolean;
};

export default function TeacherEntryPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [date, setDate] = useState<Date>(new Date());
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [activityType, setActivityType] = useState<string>("");
  const [source, setSource] = useState<string>("Textbook");
  const [chapter, setChapter] = useState<string>("");
  const [page, setPage] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  const dateString = format(date, "yyyy-MM-dd");
  const displayDate = format(date, "dd/MM/yy");

  const { data: subjects, isLoading: loadingSubjects } = useSubjects();
  const { data: existingHomework, refetch } = useHomework({
    date: dateString,
    class: user?.assignedClass || undefined
  });

  const createHomework = useCreateHomework();
  const updateHomework = useUpdateHomework();
  const deleteHomework = useDeleteHomework();

  // Load existing entry when subject or date changes
  useEffect(() => {
    if (selectedSubjectId && existingHomework) {
      const existing = existingHomework.find(hw => hw.subjectId === Number(selectedSubjectId));
      if (existing) {
        setActivityType(existing.activityType || "");
        setSource(existing.source || "Textbook");
        setChapter(existing.chapter || "");
        setPage(existing.page || "");
        setDescription(existing.description || "");
      } else {
        setActivityType("");
        setSource("Textbook");
        setChapter("");
        setPage("");
        setDescription("");
      }
    }
  }, [selectedSubjectId, existingHomework]);

  const handleSave = async () => {
    if (!user || !selectedSubjectId || !description.trim()) {
      toast({ title: "Error", description: "Please select a subject and enter question numbers.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const subjectId = Number(selectedSubjectId);
      const existing = existingHomework?.find(hw => hw.subjectId === subjectId);

      if (existing) {
        await updateHomework.mutateAsync({
          id: existing.id,
          data: {
            description,
            activityType,
            source,
            chapter,
            page
          }
        });
      } else {
        await createHomework.mutateAsync({
          date: dateString,
          class: user.assignedClass || "",
          subjectId,
          teacherId: user.id,
          description,
          activityType,
          source,
          chapter,
          page
        });
      }
      
      refetch();
      toast({ title: "Saved!", description: "Homework entry saved successfully." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to save homework", variant: "destructive" });
    } finally {
      setIsSaving(null as any); // Reset loading state
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedSubjectId) return;
    const subjectId = Number(selectedSubjectId);
    const existing = existingHomework?.find(hw => hw.subjectId === subjectId);

    if (!existing) {
      setActivityType("");
      setSource("Textbook");
      setChapter("");
      setPage("");
      setDescription("");
      return;
    }

    try {
      await deleteHomework.mutateAsync(existing.id);
      refetch();
      setActivityType("");
      setSource("Textbook");
      setChapter("");
      setPage("");
      setDescription("");
      toast({ title: "Deleted", description: "Homework removed." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    }
  };

  const { data: settings } = useSettings();
  const [downloadingImage, setDownloadingImage] = useState(false);

  const downloadPDF = () => {
    window.open(`/api/homework/download/${user?.assignedClass}?date=${dateString}`, '_blank');
  };

  const downloadImage = async () => {
    const cl = user?.assignedClass;
    if (!cl || !existingHomework?.length) {
      toast({ title: "No homework", description: "No entries to export.", variant: "destructive" });
      return;
    }
    setDownloadingImage(true);
    try {
      await downloadHomeworkAsImage(
        {
          className: cl,
          date: dateString,
          entries: existingHomework,
          schoolName: settings?.schoolName ?? "School Connect",
          logoUrl: settings?.logoUrl ?? null,
          watermarkUrl: settings?.watermarkUrl ?? null,
        },
        `homework_${cl}_${dateString}.png`
      );
      toast({ title: "Downloaded", description: "Homework image saved." });
    } catch (e) {
      toast({ title: "Error", description: "Failed to generate image", variant: "destructive" });
    } finally {
      setDownloadingImage(false);
    }
  };

  if (loadingSubjects || !user) return <PageLoader />;

  const currentEntry = existingHomework?.find(hw => hw.subjectId === Number(selectedSubjectId));

  return (
    <LayoutShell>
      <div className="max-w-2xl mx-auto space-y-6 px-4 pb-10">
        {/* Header Section */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-primary">Homework Entry</h1>
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Class {user.assignedClass || "N/A"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-10 px-3 font-bold border-2 border-primary">
                  <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                  {displayDate}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 border-2"
                  disabled={downloadingImage}
                >
                  {downloadingImage ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Download as</DropdownMenuLabel>
                <DropdownMenuItem onClick={downloadPDF} className="gap-2 cursor-pointer">
                  <FileDown className="w-4 h-4" />
                  PDF
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={downloadImage}
                  className="gap-2 cursor-pointer"
                  disabled={!existingHomework?.length}
                >
                  <FileImage className="w-4 h-4" />
                  Image (PNG)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Main Entry Card */}
        <Card className="border-2 shadow-sm">
          <div className="bg-primary/5 border-b px-4 py-3">
            <h2 className="font-bold text-lg text-primary flex items-center gap-2">
              New Entry
              {currentEntry && <Check className="w-4 h-4 text-green-600" />}
            </h2>
          </div>
          <CardContent className="p-4 space-y-6">
            {/* Subject Dropdown */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-muted-foreground uppercase">Subject</label>
              <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                <SelectTrigger className="h-12 text-base border-2">
                  <SelectValue placeholder="Select Subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects?.map((sub) => (
                    <SelectItem key={sub.id} value={sub.id.toString()}>
                      {sub.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Activity & Source Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Activity</label>
                <Select value={activityType} onValueChange={setActivityType}>
                  <SelectTrigger className="h-10 border-2">
                    <SelectValue placeholder="Activity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {ACTIVITY_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Source</label>
                <Select value={source} onValueChange={setSource}>
                  <SelectTrigger className="h-10 border-2">
                    <SelectValue placeholder="Source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {SOURCES.map((src) => (
                      <SelectItem key={src} value={src}>{src}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Chapter & Page Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Chapter</label>
                <Input
                  value={chapter}
                  onChange={(e) => setChapter(e.target.value)}
                  placeholder="e.g. 5"
                  className="h-10 border-2"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Page</label>
                <Input
                  value={page}
                  onChange={(e) => setPage(e.target.value)}
                  placeholder="e.g. 42-43"
                  className="h-10 border-2"
                />
              </div>
            </div>

            {/* Question Numbers Textarea */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-muted-foreground uppercase">Question Numbers</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. 1, 2, 3 or 1-10"
                className="w-full min-h-[100px] p-3 rounded-md border-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none text-base"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleSave}
                disabled={isSaving || !selectedSubjectId || !description.trim()}
                className="flex-1 h-12 text-lg font-bold shadow-lg"
              >
                {isSaving ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Save className="mr-2 h-5 w-5" />
                )}
                {currentEntry ? "Update Entry" : "Save Entry"}
              </Button>
              {currentEntry && (
                <Button
                  onClick={handleDelete}
                  variant="destructive"
                  className="h-12 w-12 p-0 shadow-lg"
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* List of Today's Submitted Homework */}
        {existingHomework && existingHomework.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Submitted for {format(date, "MMM d")}
            </h3>
            <div className="grid gap-3">
              {existingHomework.map((hw) => (
                <Card key={hw.id} className="border-2 p-4 flex justify-between items-start bg-primary/5 dark:bg-primary/10">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-primary">{hw.subjectName}</span>
                      {hw.activityType && (
                        <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold uppercase">
                          {hw.activityType}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-foreground line-clamp-2">{hw.description}</p>
                    <div className="text-[10px] text-muted-foreground flex gap-2">
                      {hw.chapter && <span>Ch: {hw.chapter}</span>}
                      {hw.page && <span>Pg: {hw.page}</span>}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-primary"
                    onClick={() => setSelectedSubjectId(hw.subjectId.toString())}
                  >
                    Edit
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </LayoutShell>
  );
}
