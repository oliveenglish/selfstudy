"use client";

import { Material } from "@/lib/types";

function toYouTubeEmbed(url: string) {
  const match = url.match(/(?:youtu\.be\/|v=)([\w-]{11})/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

export default function MaterialModal({
  title,
  description,
  material,
  onClose,
}: {
  title: string;
  description?: string | null;
  material: Material | null;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-navy">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-500"
          >
            닫기
          </button>
        </div>

        {description && (
          <p className="mb-4 rounded-lg bg-blue-50 px-3 py-2 text-sm text-navy">
            📝 {description}
          </p>
        )}

        {!material && !description && (
          <p className="text-sm text-gray-500">연결된 자료가 아직 없어요.</p>
        )}

        {material?.type === "text" && (
          <p className="whitespace-pre-wrap text-sm text-gray-700">{material.content}</p>
        )}

        {material?.type === "image" && material.content && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={material.content} alt={material.title} className="w-full rounded-lg" />
        )}

        {material?.type === "video" && material.content && (
          <div className="aspect-video w-full overflow-hidden rounded-lg">
            <iframe
              src={toYouTubeEmbed(material.content) ?? material.content}
              className="h-full w-full"
              allowFullScreen
            />
          </div>
        )}

        {material?.type === "pdf" && material.content && (
          <a
            href={material.content}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-semibold text-accent underline"
          >
            자료 열기 (PDF)
          </a>
        )}
      </div>
    </div>
  );
}
