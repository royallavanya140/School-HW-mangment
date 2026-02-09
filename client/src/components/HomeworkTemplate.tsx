import type { HomeworkResponse } from "@shared/schema";
import { formatHomeworkActivity } from "@shared/homework-format";

// Layout constants – must match server PDF_LAYOUT for same format in image and PDF
const LAYOUT = {
  pageWidth: 595,
  margin: 50,
  subjectColWidth: 120,
  headerHeight: 40,
  rowHeight: 48,
} as const;

const formatDate = (d: string) => {
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y.slice(-2)}`;
};

export type HomeworkTemplateProps = {
  className: string;
  date: string;
  entries: HomeworkResponse[];
  schoolName: string;
  logoUrl?: string | null;
  /** Dedicated watermark image (used for center watermark). Falls back to logoUrl if not set. */
  watermarkUrl?: string | null;
};

export function HomeworkTemplate({
  className,
  date,
  entries,
  schoolName,
  logoUrl,
  watermarkUrl,
}: HomeworkTemplateProps) {
  const contentWidth = LAYOUT.pageWidth - LAYOUT.margin * 2;
  const homeworkColWidth = contentWidth - LAYOUT.subjectColWidth;
  const totalWidth = LAYOUT.pageWidth;
  const centerWatermarkUrl = watermarkUrl ?? logoUrl;

  return (
    <div
      className="homework-export-template bg-white text-slate-900 overflow-hidden"
      style={{
        width: totalWidth,
        minHeight: 700,
        fontFamily: "system-ui, -apple-system, sans-serif",
        position: "relative",
      }}
    >
      {/* Content first so it renders underneath */}
      <div style={{ position: "relative", zIndex: 1, padding: `0 ${LAYOUT.margin}px ${LAYOUT.margin}px` }}>
        <div style={{ paddingTop: 14 }}>
          {/* Top accent bar */}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              height: 4,
              background: "#1e3a8a",
            }}
          />

          {/* Header: logo + text + class/date (same as PDF) */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 20, marginBottom: 20 }}>
            {logoUrl && (
              <img
                src={logoUrl}
                alt=""
                style={{
                  width: 64,
                  height: 64,
                  objectFit: "contain",
                  flexShrink: 0,
                }}
              />
            )}
            <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
              <h1
                style={{
                  margin: 0,
                  fontSize: 24,
                  fontWeight: 700,
                  color: "#0f172a",
                  letterSpacing: "0.02em",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {schoolName.toUpperCase()}
              </h1>
              <p style={{ margin: "6px 0 0", fontSize: 12, color: "#475569" }}>
                HOMEWORK DIARY
              </p>
            </div>
            <div
              style={{
                border: "1px solid #e2e8f0",
                borderRadius: 4,
                padding: "8px 12px",
                minWidth: 140,
                textAlign: "left",
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b" }}>
                CLASS {className.toUpperCase()}
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", marginTop: 2 }}>
                DATE: {formatDate(date)}
              </div>
            </div>
          </div>

          {/* Table (same structure as PDF) */}
          <div style={{ border: "1px solid #e2e8f0", borderRadius: "0 0 6px 6px", overflow: "hidden" }}>
            <div style={{ display: "flex", height: LAYOUT.headerHeight }}>
              <div
                style={{
                  width: LAYOUT.subjectColWidth,
                  background: "#1e40af",
                  color: "#fff",
                  padding: "0 14px",
                  fontSize: 11,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                SUBJECT
              </div>
              <div
                style={{
                  width: homeworkColWidth,
                  background: "#2563eb",
                  color: "#fff",
                  padding: "0 14px",
                  fontSize: 11,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                HOMEWORK / ACTIVITY
              </div>
            </div>

            {entries.map((hw, i) => {
              const isTest = hw.activityType?.toLowerCase().includes("test");
              const text = formatHomeworkActivity({
                activityType: hw.activityType || "",
                subjectName: hw.subjectName || "",
                source: hw.source,
                chapter: hw.chapter,
                page: hw.page,
                description: hw.description,
              });

              return (
                <div
                  key={hw.id}
                  style={{
                    display: "flex",
                    minHeight: LAYOUT.rowHeight,
                    background: i % 2 === 0 ? "#f8fafc" : "#fff",
                    borderTop: "1px solid #e2e8f0",
                  }}
                >
                  <div style={{ width: 4, background: "#1e40af", flexShrink: 0 }} />
                  <div
                    style={{
                      width: LAYOUT.subjectColWidth - 4,
                      padding: "12px 14px",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#0f172a",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {hw.subjectName?.toUpperCase() ?? "—"}
                  </div>
                  <div
                    style={{
                      width: homeworkColWidth,
                      padding: "12px 14px",
                      fontSize: 10,
                      color: isTest ? "#b91c1c" : "#334155",
                      fontWeight: isTest ? 700 : 400,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {text || "—"}
                  </div>
                </div>
              );
            })}
          </div>

          <div
            style={{
              marginTop: 24,
              paddingTop: 12,
              borderTop: "1px solid #e2e8f0",
              fontSize: 9,
              color: "#94a3b8",
              textAlign: "center",
            }}
          >
            Generated by School Connect · {schoolName}
          </div>
        </div>
      </div>

      {/* Transparent watermark on top of table — circular crop for proper circle shape */}
      {centerWatermarkUrl && (
        <div
          aria-hidden
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ zIndex: 2 }}
        >
          <div
            style={{
              width: 380,
              height: 380,
              borderRadius: "50%",
              overflow: "hidden",
              transform: "rotate(-45deg)",
              border: "none",
              outline: "none",
            }}
          >
            <img
              src={centerWatermarkUrl}
              alt=""
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                opacity: 0.2,
                filter: "grayscale(100%)",
                userSelect: "none",
                pointerEvents: "none",
                border: "none",
                outline: "none",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
