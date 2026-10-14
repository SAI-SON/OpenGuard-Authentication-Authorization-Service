import React, { useState } from "react";
import { Check, Copy } from "lucide-react";

interface JsonViewerProps {
  data: any;
  title?: string;
  maxHeight?: string;
}

export const JsonViewer: React.FC<JsonViewerProps> = ({
  data,
  title = "Response Payload",
  maxHeight = "max-h-96",
}) => {
  const [copied, setCopied] = useState(false);
  const formatted = typeof data === "string" ? data : JSON.stringify(data, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-900 text-slate-100 overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-950/60 border-b border-slate-800 text-xs font-mono text-slate-400">
        <span className="font-semibold text-slate-300">{title}</span>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-colors"
          title="Copy JSON"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <div className={`p-4 overflow-auto font-mono text-xs leading-relaxed ${maxHeight}`}>
        <pre className="text-emerald-400 whitespace-pre-wrap break-all">
          {formatted}
        </pre>
      </div>
    </div>
  );
};
