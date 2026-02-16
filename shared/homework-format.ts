/**
 * Formats homework activity as a proper sentence.
 * Used by both PDF (server) and image template (client) so format is identical.
 * English only for now; Telugu/Hindi commented out — uncomment later to re-enable.
 */

export type HomeworkActivityInput = {
  activityType: string;
  subjectName: string;
  source: string | null;
  chapter: string | null;
  page: string | null;
  description: string;
};

// Stubs so server still compiles; uncomment real impl below and use in formatHomeworkActivity to re-enable Telugu/Hindi
export function isTelugu(_subjectName: string): boolean {
  return false;
}
export function isHindi(_subjectName: string): boolean {
  return false;
}

function isMaths(subjectName: string): boolean {
  return subjectName.toLowerCase().includes("math");
}

function lessonLabel(subjectName: string): string {
  return isMaths(subjectName) ? "Chapter" : "Lesson";
}

/** Build ref phrase with separate labels: Source: X, Chapter: Y, Page: Z (only includes present fields). */
function refPhrase(source: string | null, chapter: string | null, page: string | null, label: string): string {
  const parts: string[] = [];
  if (source) parts.push(`Source: ${source}`);
  if (chapter) parts.push(`${label}: ${chapter}`);
  if (page) parts.push(`Page: ${page}`);
  return parts.join(", ");
}

function hasRef(source: string | null, chapter: string | null, page: string | null): boolean {
  return !!(source || chapter || page);
}

// ---- English: natural, friendly diary style (source, chapter, page labeled separately) ----
export function formatEnglish(input: HomeworkActivityInput): string {
  const { activityType, source, chapter, page, description } = input;
  const label = lessonLabel(input.subjectName);
  const ref = refPhrase(source, chapter, page, label);
  const act = (activityType || "").trim().toLowerCase();
  const hasAnyRef = hasRef(source, chapter, page);

  if (!hasAnyRef && !description) return activityType ? `${activityType}.` : "—";

  switch (act) {
    case "reading":
      return hasAnyRef
        ? `Read through ${ref}.${description ? ` Try questions: ${description}` : ""}`
        : `Read the given portion.${description ? ` Questions: ${description}` : ""}`;
    case "writing":
      return hasAnyRef
        ? `Do the writing — ${ref}.${description ? ` Q${description}` : ""}`
        : `Complete the writing task.${description ? ` ${description}` : ""}`;
    case "read and write":
      return hasAnyRef
        ? `Read and write — ${ref}.${description ? ` Q${description}` : ""}`
        : `Read and write the given part.${description ? ` ${description}` : ""}`;
    case "learning":
      return hasAnyRef
        ? `Learn the topic — ${ref}.${description ? ` Focus: ${description}` : ""}`
        : `Study the content.${description ? ` ${description}` : ""}`;
    case "test":
      return hasAnyRef
        ? `[TEST] Prepare the topic/Questions from ${ref} for the test.${description ? ` Questions: ${description}` : ""}`
        : `[TEST] Get ready for the test.${description ? ` with the topic/Questions ${description}` : ""}`;
    case "activity":
      return hasAnyRef
        ? `Do the activity — ${ref}.${description ? ` ${description}` : ""}`
        : `Complete the activity.${description ? ` ${description}` : ""}`;
    case "project":
      return hasAnyRef
        ? `Work on the project — ${ref}.${description ? ` ${description}` : ""}`
        : `Complete the project work.${description ? ` ${description}` : ""}`;
    case "revise":
      return hasAnyRef
        ? `Revise the topic — ${ref}.${description ? ` ${description}` : ""}`
        : `Revise the portion done.${description ? ` ${description}` : ""}`;
    case "complete":
      return hasAnyRef
        ? `Complete the task — ${ref}.${description ? ` ${description}` : ""}`
        : `Finish the given task.${description ? ` ${description}` : ""}`;
    default:
      return act
        ? hasAnyRef
          ? `${activityType} — ${ref}.${description ? ` ${description}` : ""}`
          : `${activityType}.${description ? ` ${description}` : ""}`
        : (hasAnyRef ? ref + (description ? `. ${description}` : "") : description || "—");
  }
}

export function formatHomeworkActivity(input: HomeworkActivityInput): string {
  // Use English only for now; uncomment below to re-enable Telugu/Hindi
  // if (isTelugu(input.subjectName)) return formatTelugu(input);
  // if (isHindi(input.subjectName)) return formatHindi(input);
  return formatEnglish(input);
}
