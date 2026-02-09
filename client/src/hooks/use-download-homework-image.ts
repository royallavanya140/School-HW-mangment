import { createRoot } from "react-dom/client";
import React from "react";
import html2canvas from "html2canvas";
import type { HomeworkResponse } from "@shared/schema";
import { HomeworkTemplate } from "@/components/HomeworkTemplate";

export type ExportImageParams = {
  className: string;
  date: string;
  entries: HomeworkResponse[];
  schoolName: string;
  logoUrl?: string | null;
  watermarkUrl?: string | null;
};

export async function downloadHomeworkAsImage(
  params: ExportImageParams,
  filename: string = `homework_${params.className}_${params.date}.png`
): Promise<void> {
  const wrapper = document.createElement("div");
  wrapper.style.cssText =
    "position:fixed;left:-9999px;top:0;z-index:-1;pointer-events:none;";
  document.body.appendChild(wrapper);

  const root = createRoot(wrapper);
  root.render(
    React.createElement(HomeworkTemplate, {
      className: params.className,
      date: params.date,
      entries: params.entries,
      schoolName: params.schoolName,
      logoUrl: params.logoUrl,
      watermarkUrl: params.watermarkUrl,
    })
  );

  await new Promise((r) => setTimeout(r, 350));

  const templateEl = wrapper.querySelector(".homework-export-template") as HTMLElement;
  if (!templateEl) {
    root.unmount();
    document.body.removeChild(wrapper);
    return;
  }

  const canvas = await html2canvas(templateEl, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
  });

  root.unmount();
  document.body.removeChild(wrapper);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        resolve();
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      resolve();
    }, "image/png");
  });
}
