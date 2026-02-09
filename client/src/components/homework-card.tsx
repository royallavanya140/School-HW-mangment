import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { HomeworkResponse } from "@shared/schema";
import { CalendarIcon, User, BookOpen } from "lucide-react";

interface HomeworkCardProps {
  homework: HomeworkResponse;
}

export function HomeworkCard({ homework }: HomeworkCardProps) {
  return (
    <div className="diary-paper rounded-lg p-5 mb-4 border border-border/50 relative overflow-hidden group hover:shadow-md transition-shadow duration-300">
      {/* Decorative colored strip on left */}
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-primary to-primary/60" />

      <div className="pl-3">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              {homework.subjectName}
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <CalendarIcon className="w-3 h-3" />
              {format(new Date(homework.date), "EEE, MMM d")}
            </span>
          </div>
          <div className="text-xs font-medium text-muted-foreground bg-secondary px-2 py-1 rounded">
            Class {homework.class}
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm text-foreground/80 mb-3 font-medium">
          <span className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded text-xs border border-orange-200">
            {homework.activityType}
          </span>
          {(homework.chapter || homework.page) && (
            <span className="text-xs text-muted-foreground">
              {homework.chapter && `Ch: ${homework.chapter}`}
              {homework.chapter && homework.page && " • "}
              {homework.page && `Pg: ${homework.page}`}
            </span>
          )}
        </div>

        <div className="font-handwriting text-lg leading-relaxed text-foreground/90 whitespace-pre-wrap">
          {homework.description}
        </div>

        <div className="mt-4 pt-3 border-t border-dashed flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <User className="w-3 h-3" />
            <span>Posted by {homework.teacherName}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
