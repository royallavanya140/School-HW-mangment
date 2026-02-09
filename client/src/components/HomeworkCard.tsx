import { type HomeworkResponse } from "@shared/schema";
import { cn } from "@/lib/utils";
import { Pencil } from "lucide-react";
import { Button } from "./ui/button";

interface Props {
  entry: HomeworkResponse;
  onEdit?: (entry: HomeworkResponse) => void;
  showEdit?: boolean;
}

export function HomeworkCard({ entry, onEdit, showEdit }: Props) {
  return (
    <div className="relative group overflow-hidden rounded-xl border bg-white shadow-sm transition-all hover:shadow-md dark:bg-slate-900">
      {/* Decorative side accent */}
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary/80" />
      
      <div className="p-4 pl-6 space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary ring-1 ring-inset ring-primary/20">
                {entry.subjectName}
              </span>
              <span className="text-sm font-medium text-muted-foreground">
                • {entry.activityType}
              </span>
              {entry.source && (
                 <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                   {entry.source}
                 </span>
              )}
            </div>
          </div>
          {showEdit && onEdit && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 -mr-2 text-muted-foreground hover:text-foreground"
              onClick={() => onEdit(entry)}
            >
              <Pencil className="w-4 h-4" />
            </Button>
          )}
        </div>

        <div className="font-hand text-lg leading-relaxed text-foreground/90 whitespace-pre-wrap break-words diary-lines pb-1">
          {entry.description}
        </div>

        {(entry.chapter || entry.page) && (
          <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2 border-t border-dashed">
            {entry.chapter && <span>Chapter: {entry.chapter}</span>}
            {entry.page && <span>Page: {entry.page}</span>}
          </div>
        )}
        
        <div className="text-xs text-muted-foreground/50 pt-1 text-right italic">
           Posted by {entry.teacherName} • {entry.class}
        </div>
      </div>
    </div>
  );
}
