"use client";

type OrganizationCsvButtonProps = {
  filename: string;
  rows: string[][];
  className?: string;
  children: React.ReactNode;
};

function csvCell(value: string) {
  const safe = /^[=+@\-\t\r]/.test(value) ? "'" + value : value;
  return '"' + safe.replace(/"/g, '""') + '"';
}

export function OrganizationCsvButton({ filename, rows, className, children }: OrganizationCsvButtonProps) {
  function download() {
    const csv = "\uFEFF" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  return <button type="button" className={className} onClick={download}>{children}</button>;
}
