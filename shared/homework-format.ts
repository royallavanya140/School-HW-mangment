/**
 * Formats homework activity as a proper sentence.
 * Used by both PDF (server) and image template (client) so format is identical.
 * Supports English, Telugu, and Hindi based on subject name.
 */

export type HomeworkActivityInput = {
  activityType: string;
  subjectName: string;
  source: string | null;
  chapter: string | null;
  page: string | null;
  description: string;
};

export function isTelugu(subjectName: string): boolean {
  const n = subjectName.toLowerCase();
  return n.includes("telugu") || n.includes("తెలుగు");
}

export function isHindi(subjectName: string): boolean {
  const n = subjectName.toLowerCase();
  return n.includes("hindi") || n.includes("हिंदी") || n.includes("hindi");
}

function isMaths(subjectName: string): boolean {
  return subjectName.toLowerCase().includes("math");
}

function lessonLabel(subjectName: string, lang: "en" | "te" | "hi"): string {
  const maths = isMaths(subjectName);
  if (lang === "te") return maths ? "అధ్యాయం" : "పాఠం";
  if (lang === "hi") return maths ? "अध्याय" : "पाठ";
  return maths ? "Chapter" : "Lesson";
}

// ---- English sentences ----
function enPart(source: string | null, chapter: string | null, page: string | null, label: string): string {
  const parts: string[] = [];
  if (source) parts.push(source);
  if (chapter) parts.push(`${label} ${chapter}`);
  if (page) parts.push(`Page ${page}`);
  return parts.join(", ");
}

export function formatEnglish(input: HomeworkActivityInput): string {
  const { activityType, source, chapter, page, description } = input;
  const label = lessonLabel(input.subjectName, "en");
  const loc = enPart(source, chapter, page, label);
  const act = (activityType || "").trim().toLowerCase();

  if (!loc && !description) return activityType ? `${activityType}.` : "—";

  const withLoc = loc ? ` from ${loc}` : "";
  const tail = description ? `. Question numbers: ${description}` : "";

  switch (act) {
    case "reading":
      return `Complete the reading${withLoc}${tail}.`.replace(/\.\./g, ".");
    case "writing":
      return `Complete the writing task${withLoc}${tail}.`.replace(/\.\./g, ".");
    case "read and write":
      return `Read and write${withLoc}${tail}.`.replace(/\.\./g, ".");
    case "learning":
      return `Learn the content${withLoc}${description ? `. ${description}` : ""}.`.replace(/\.\./g, ".");
    case "test":
      return `[TEST] Prepare for the test${withLoc}${description ? `. ${description}` : ""}.`.replace(/\.\./g, ".");
    case "activity":
      return `Complete the activity${withLoc}${description ? `. ${description}` : ""}.`.replace(/\.\./g, ".");
    case "project":
      return `Complete the project work${withLoc}${description ? `. ${description}` : ""}.`.replace(/\.\./g, ".");
    case "revise":
      return `Revise${withLoc}${description ? `. ${description}` : ""}.`.replace(/\.\./g, ".");
    case "complete":
      return `Complete the given task${withLoc}${description ? `. ${description}` : ""}.`.replace(/\.\./g, ".");
    default:
      return act
        ? `${activityType}${withLoc}${description ? `. ${description}` : ""}.`.replace(/\.\./g, ".")
        : (loc ? `From ${loc}` : "") + (description ? `. ${description}` : "").replace(/^\./, "") || "—";
  }
}

// ---- Telugu sentences (for Telugu subject) ----
function formatTelugu(input: HomeworkActivityInput): string {
  const { activityType, source, chapter, page, description } = input;
  const label = lessonLabel(input.subjectName, "te");
  const act = (activityType || "").trim().toLowerCase();

  const locParts: string[] = [];
  if (source) locParts.push(source);
  if (chapter) locParts.push(`${label} ${chapter}`);
  if (page) locParts.push(`పేజీ ${page}`);
  const loc = locParts.join(", ");

  const q = description ? ` ప్రశ్నలు: ${description}` : "";

  switch (act) {
    case "reading":
      return (loc ? `పాఠ్యపుస్తకంలో ${loc} చదవండి.` : `చదవండి.`) + q;
    case "writing":
      return (loc ? `${loc} రాయడం పూర్తి చేయండి.` : `రాయడం పూర్తి చేయండి.`) + q;
    case "read and write":
      return (loc ? `${loc} చదివి రాయండి.` : `చదివి రాయండి.`) + q;
    case "learning":
      return (loc ? `${loc} నేర్చుకోండి.` : `నేర్చుకోండి.`) + (description ? ` ${description}.` : "");
    case "test":
      return (loc ? `[పరీక్ష] ${loc} పరీక్షకు సిద్ధం అవండి.` : `[పరీక్ష] పరీక్షకు సిద్ధం అవండి.`) + (description ? ` ${description}.` : "");
    case "activity":
      return (loc ? `కృత్యం పూర్తి చేయండి: ${loc}.` : `కృత్యం పూర్తి చేయండి.`) + (description ? ` ${description}.` : "");
    case "project":
      return (loc ? `ప్రాజెక్ట్ పని: ${loc}.` : `ప్రాజెక్ట్ పూర్తి చేయండి.`) + (description ? ` ${description}.` : "");
    case "revise":
      return (loc ? `${loc} రివైజ్ చేయండి.` : `రివైజ్ చేయండి.`) + (description ? ` ${description}.` : "");
    case "complete":
      return (loc ? `పని పూర్తి చేయండి: ${loc}.` : `పూర్తి చేయండి.`) + (description ? ` ${description}.` : "");
    default:
      return loc ? `${loc}.${description ? ` ${description}.` : ""}` : (description || "—");
  }
}

// ---- Hindi sentences (for Hindi subject) ----
function formatHindi(input: HomeworkActivityInput): string {
  const { activityType, source, chapter, page, description } = input;
  const label = lessonLabel(input.subjectName, "hi");
  const act = (activityType || "").trim().toLowerCase();

  const locParts: string[] = [];
  if (source) locParts.push(source);
  if (chapter) locParts.push(`${label} ${chapter}`);
  if (page) locParts.push(`पृष्ठ ${page}`);
  const loc = locParts.join(", ");

  const q = description ? ` प्रश्न: ${description}` : "";

  switch (act) {
    case "reading":
      return (loc ? `पाठ्यपुस्तक में ${loc} पढ़ें.` : `पढ़ें.`) + q;
    case "writing":
      return (loc ? `${loc} लिखने का कार्य पूरा करें.` : `लिखने का कार्य पूरा करें.`) + q;
    case "read and write":
      return (loc ? `${loc} पढ़कर लिखें.` : `पढ़कर लिखें.`) + q;
    case "learning":
      return loc ? `${loc} सीखें.${description ? ` ${description}` : ""}.` : `सीखें.${description ? ` ${description}` : ""}.`;
    case "test":
      return loc ? `[परीक्षा] ${loc} परीक्षा की तैयारी करें.${description ? ` ${description}` : ""}.` : `[परीक्षा] परीक्षा की तैयारी करें.${description ? ` ${description}` : ""}.`;
    case "activity":
      return loc ? `गतिविधि पूरी करें: ${loc}.${description ? ` ${description}` : ""}.` : `गतिविधि पूरी करें.${description ? ` ${description}` : ""}.`;
    case "project":
      return loc ? `परियोजना कार्य: ${loc}.${description ? ` ${description}` : ""}.` : `परियोजना पूरी करें.${description ? ` ${description}` : ""}.`;
    case "revise":
      return loc ? `${loc} दोहराएं.${description ? ` ${description}` : ""}.` : `दोहराएं.${description ? ` ${description}` : ""}.`;
    case "complete":
      return loc ? `दिया गया कार्य पूरा करें: ${loc}.${description ? ` ${description}` : ""}.` : `पूरा करें.${description ? ` ${description}` : ""}.`;
    default:
      return loc ? `${loc}.${description ? ` ${description}` : ""}.` : (description || "—");
  }
}

export function formatHomeworkActivity(input: HomeworkActivityInput): string {
  if (isTelugu(input.subjectName)) return formatTelugu(input);
  if (isHindi(input.subjectName)) return formatHindi(input);
  return formatEnglish(input);
}
