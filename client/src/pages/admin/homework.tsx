import { useState } from "react";
import { LayoutShell } from "@/components/layout-shell";
import { useHomework } from "@/hooks/use-homework";
import { useSettings } from "@/hooks/use-settings";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Download, Filter, FileText, Edit, FileImage, FileDown } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
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
import { PageLoader } from "@/components/ui/loader";
import { api, buildUrl } from "@shared/routes";
import type { HomeworkResponse } from "@shared/schema";
import { cn } from "@/lib/utils";
import { HomeworkEditDialog } from "@/components/HomeworkEditDialog";
import { downloadHomeworkAsImage } from "@/hooks/use-download-homework-image";
import { useToast } from "@/hooks/use-toast";

const CLASSES = ["All", "Nursery", "LKG", "UKG", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th"];

export default function AdminHomeworkPage() {
  const [date, setDate] = useState<Date>(new Date());
  const [selectedClass, setSelectedClass] = useState<string>("All");
  const [editHomework, setEditHomework] = useState<HomeworkResponse | null>(null);
  const [downloadingImage, setDownloadingImage] = useState<string | null>(null);
  const { toast } = useToast();
  const { data: settings } = useSettings();

  // Format date for API: YYYY-MM-DD
  const dateString = format(date, "yyyy-MM-dd");
  
  const { data: homework, isLoading } = useHomework({ 
    date: dateString,
    class: selectedClass === "All" ? undefined : selectedClass
  });

  const handleDownloadAll = () => {
    const url = `${api.homework.downloadAll.path}?date=${dateString}`;
    window.location.href = url;
  };

  const handleDownloadClassPDF = (className: string) => {
    const path = buildUrl(api.homework.downloadClass.path, { class: className });
    window.location.href = `${path}?date=${dateString}`;
  };

  const handleDownloadClassImage = async (
    className: string,
    items: HomeworkResponse[]
  ) => {
    if (!items?.length) return;
    setDownloadingImage(className);
    try {
      await downloadHomeworkAsImage(
        {
          className,
          date: dateString,
          entries: items,
          schoolName: settings?.schoolName ?? "School Connect",
          logoUrl: settings?.logoUrl ?? null,
          watermarkUrl: settings?.watermarkUrl ?? null,
        },
        `homework_${className}_${dateString}.png`
      );
      toast({ title: "Downloaded", description: `Homework image saved for Class ${className}.` });
    } catch (e) {
      toast({ title: "Error", description: "Failed to generate image", variant: "destructive" });
    } finally {
      setDownloadingImage(null);
    }
  };

  if (isLoading) return <PageLoader />;

  // Group homework by class for better display
  const homeworkByClass: Record<string, HomeworkResponse[]> = {};
  if (homework) {
    homework.forEach((hw) => {
      if (!homeworkByClass[hw.class]) homeworkByClass[hw.class] = [];
      homeworkByClass[hw.class].push(hw);
    });
  }

  return (
    <LayoutShell>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Homework</h1>
            <p className="text-muted-foreground">View and manage daily homework submissions</p>
          </div>
          
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {/* Download All Button */}
             <Button 
                variant="outline" 
                onClick={handleDownloadAll}
                className="gap-2 border-primary/20 hover:bg-primary/5"
              >
                <Download className="w-4 h-4" />
                Download All (ZIP)
              </Button>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-popover" align="end">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-[180px] bg-background">
                <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Filter by Class" />
              </SelectTrigger>
              <SelectContent className="bg-popover border shadow-md">
                {CLASSES.map((cls) => (
                  <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Content Area */}
        <div className="space-y-8">
            {Object.keys(homeworkByClass).length === 0 ? (
                <div className="text-center py-20 bg-muted/30 rounded-3xl border-2 border-dashed">
                    <div className="bg-background w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <FileText className="w-8 h-8 text-muted-foreground/50" />
                    </div>
                    <h3 className="text-xl font-medium text-foreground">No homework found</h3>
                    <p className="text-muted-foreground mt-2">
                        Try selecting a different date or class filter.
                    </p>
                </div>
            ) : (
                Object.entries(homeworkByClass).map(([className, items]) => (
                    <div key={className} className="space-y-4">
                        <div className="flex items-center justify-between border-b pb-2">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <span className="bg-primary/10 text-primary px-3 py-1 rounded-md text-sm">
                                    Class {className}
                                </span>
                            </h2>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-2 border-primary/30 hover:bg-primary/5"
                                  disabled={downloadingImage === className}
                                >
                                  {downloadingImage === className ? (
                                    <span className="animate-pulse">...</span>
                                  ) : (
                                    <Download className="w-4 h-4" />
                                  )}
                                  Download
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel>Download as</DropdownMenuLabel>
                                <DropdownMenuItem
                                  onClick={() => handleDownloadClassPDF(className)}
                                  className="gap-2 cursor-pointer"
                                >
                                  <FileDown className="w-4 h-4" />
                                  PDF
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDownloadClassImage(className, items ?? [])}
                                  className="gap-2 cursor-pointer"
                                >
                                  <FileImage className="w-4 h-4" />
                                  Image (PNG)
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                            {items.map((hw: any) => (
                                <Card key={hw.id} className="relative overflow-hidden group">
                                    <CardContent className="p-6 relative z-10 bg-card">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-bold text-lg text-primary">{hw.subjectName}</span>
                                                    {hw.activityType && (
                                                        <span className="text-xs bg-secondary px-2 py-0.5 rounded-full text-secondary-foreground">
                                                            {hw.activityType}
                                                        </span>
                                                    )}
                                                    {hw.source && (
                                                       <span className="text-xs border px-2 py-0.5 rounded-full text-muted-foreground">
                                                            {hw.source}
                                                       </span>
                                                    )}
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    Teacher: {hw.teacherName}
                                                </div>
                                            </div>
                                            <Button 
                                                variant="ghost" 
                                                size="icon"
                                                onClick={() => setEditHomework(hw)}
                                                className="hover:bg-primary/10 flex-shrink-0"
                                            >
                                                <Edit className="w-4 h-4 text-primary" />
                                            </Button>
                                        </div>
                                        
                                        <div className="diary-paper diary-font text-base text-foreground/90 whitespace-pre-wrap break-words px-4 pb-4 rounded border border-border" style={{ paddingTop: '0.25rem' }}>
                                                {hw.description}
                                        </div>
                                        
                                        {(hw.chapter || hw.page) && (
                                            <div className="mt-4 pt-3 border-t border-dashed flex gap-4 text-sm font-medium text-muted-foreground">
                                                {hw.chapter && <span>Chapter: {hw.chapter}</span>}
                                                {hw.page && <span>Page: {hw.page}</span>}
                                            </div>
                                        )}
                                    </CardContent>
                                    
                                    {/* Decorative side line for diary look */}
                                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-400/20" />
                                </Card>
                            ))}
                        </div>
                    </div>
                ))
            )}
        </div>

        {editHomework && (
          <HomeworkEditDialog 
            open={!!editHomework} 
            onOpenChange={(open) => !open && setEditHomework(null)}
            homework={editHomework}
          />
        )}
      </div>
    </LayoutShell>
  );
}
