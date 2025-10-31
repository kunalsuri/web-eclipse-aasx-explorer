/**
 * Validation Report Generator
 * Generates validation reports in multiple formats (PDF, JSON, CSV)
 */

import type { ValidationResult, ValidationError } from "../../../../../shared/aas-validation-engine";

export interface ReportOptions {
  format: "pdf" | "json" | "csv" | "html";
  includeSummary?: boolean;
  includeDetails?: boolean;
  groupBySeverity?: boolean;
  timestamp?: boolean;
}

/**
 * Generate validation report in specified format
 */
export function generateValidationReport(
  result: ValidationResult,
  options: ReportOptions = { format: "json", includeSummary: true, includeDetails: true }
): string | Blob {
  switch (options.format) {
    case "json":
      return generateJSONReport(result, options);
    case "csv":
      return generateCSVReport(result, options);
    case "html":
      return generateHTMLReport(result, options);
    case "pdf":
      // PDF generation requires a library like jsPDF
      // For now, return HTML that can be printed to PDF
      return generateHTMLReport(result, { ...options, format: "html" });
    default:
      throw new Error(`Unsupported format: ${options.format}`);
  }
}

/**
 * Generate JSON report
 */
function generateJSONReport(result: ValidationResult, options: ReportOptions): string {
  const report: any = {};

  if (options.includeSummary !== false) {
    report.summary = {
      isValid: result.isValid,
      totalErrors: result.errors.length,
      totalWarnings: result.warnings.length,
      totalInfo: result.infos.length,
      duration: result.duration,
      timestamp: result.timestamp.toISOString(),
    };
  }

  if (options.includeDetails !== false) {
    if (options.groupBySeverity) {
      report.errors = result.errors;
      report.warnings = result.warnings;
      report.info = result.infos;
    } else {
      report.issues = [...result.errors, ...result.warnings, ...result.infos];
    }
  }

  return JSON.stringify(report, null, 2);
}

/**
 * Generate CSV report
 */
function generateCSVReport(result: ValidationResult, options: ReportOptions): string {
  const allErrors = [...result.errors, ...result.warnings, ...result.infos];
  
  let csv = "Severity,Code,Message,Path,Suggestion\n";
  
  allErrors.forEach((error) => {
    const row = [
      error.severity,
      error.code,
      `"${error.message.replace(/"/g, '""')}"`,
      error.path || "",
      error.suggestion ? `"${error.suggestion.replace(/"/g, '""')}"` : "",
    ];
    csv += row.join(",") + "\n";
  });

  return csv;
}

/**
 * Generate HTML report
 */
function generateHTMLReport(result: ValidationResult, options: ReportOptions): string {
  const timestamp = options.timestamp !== false ? new Date().toISOString() : "";
  
  let html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AAS Validation Report</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
      padding: 2rem;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 2rem;
    }
    
    .header h1 {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }
    
    .header p {
      opacity: 0.9;
      font-size: 0.95rem;
    }
    
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      padding: 2rem;
      background: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .summary-card {
      background: white;
      padding: 1.5rem;
      border-radius: 8px;
      border-left: 4px solid;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    
    .summary-card.valid {
      border-color: #10b981;
    }
    
    .summary-card.errors {
      border-color: #ef4444;
    }
    
    .summary-card.warnings {
      border-color: #f59e0b;
    }
    
    .summary-card.info {
      border-color: #3b82f6;
    }
    
    .summary-card h3 {
      font-size: 0.875rem;
      color: #6b7280;
      margin-bottom: 0.5rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    .summary-card .value {
      font-size: 2rem;
      font-weight: bold;
      color: #111827;
    }
    
    .content {
      padding: 2rem;
    }
    
    .section {
      margin-bottom: 2rem;
    }
    
    .section h2 {
      font-size: 1.5rem;
      margin-bottom: 1rem;
      color: #111827;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .issue {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-left: 4px solid;
      border-radius: 6px;
      padding: 1rem;
      margin-bottom: 1rem;
    }
    
    .issue.error {
      border-left-color: #ef4444;
      background: #fef2f2;
    }
    
    .issue.warning {
      border-left-color: #f59e0b;
      background: #fffbeb;
    }
    
    .issue.info {
      border-left-color: #3b82f6;
      background: #eff6ff;
    }
    
    .issue-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }
    
    .badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    .badge.error {
      background: #fee2e2;
      color: #991b1b;
    }
    
    .badge.warning {
      background: #fef3c7;
      color: #92400e;
    }
    
    .badge.info {
      background: #dbeafe;
      color: #1e40af;
    }
    
    .issue-code {
      font-family: 'Courier New', monospace;
      font-size: 0.875rem;
      color: #6b7280;
    }
    
    .issue-message {
      font-size: 0.95rem;
      color: #111827;
      margin-bottom: 0.5rem;
    }
    
    .issue-path {
      font-family: 'Courier New', monospace;
      font-size: 0.8rem;
      color: #6b7280;
      background: #f3f4f6;
      padding: 0.5rem;
      border-radius: 4px;
      margin-bottom: 0.5rem;
      overflow-x: auto;
    }
    
    .issue-suggestion {
      font-size: 0.875rem;
      color: #059669;
      background: #d1fae5;
      padding: 0.5rem;
      border-radius: 4px;
      border-left: 3px solid #10b981;
    }
    
    .footer {
      padding: 1.5rem 2rem;
      background: #f9fafb;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 0.875rem;
    }
    
    @media print {
      body {
        background: white;
        padding: 0;
      }
      
      .container {
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔍 AAS Validation Report</h1>
      <p>Asset Administration Shell V3.0 Compliance Validation</p>
      ${timestamp ? `<p style="margin-top: 0.5rem; opacity: 0.8;">Generated: ${new Date(timestamp).toLocaleString()}</p>` : ""}
    </div>
`;

  if (options.includeSummary !== false) {
    html += `
    <div class="summary">
      <div class="summary-card ${result.isValid ? "valid" : "errors"}">
        <h3>Status</h3>
        <div class="value">${result.isValid ? "✓ Valid" : "✗ Invalid"}</div>
      </div>
      <div class="summary-card errors">
        <h3>Errors</h3>
        <div class="value">${result.errors.length}</div>
      </div>
      <div class="summary-card warnings">
        <h3>Warnings</h3>
        <div class="value">${result.warnings.length}</div>
      </div>
      <div class="summary-card info">
        <h3>Info</h3>
        <div class="value">${result.infos.length}</div>
      </div>
    </div>
`;
  }

  if (options.includeDetails !== false) {
    html += `<div class="content">`;

    if (result.errors.length > 0) {
      html += `
      <div class="section">
        <h2>❌ Errors (${result.errors.length})</h2>
        ${result.errors.map((error) => generateIssueHTML(error)).join("")}
      </div>
`;
    }

    if (result.warnings.length > 0) {
      html += `
      <div class="section">
        <h2>⚠️ Warnings (${result.warnings.length})</h2>
        ${result.warnings.map((error) => generateIssueHTML(error)).join("")}
      </div>
`;
    }

    if (result.infos.length > 0) {
      html += `
      <div class="section">
        <h2>ℹ️ Information (${result.infos.length})</h2>
        ${result.infos.map((error) => generateIssueHTML(error)).join("")}
      </div>
`;
    }

    if (result.errors.length === 0 && result.warnings.length === 0 && result.infos.length === 0) {
      html += `
      <div class="section">
        <p style="text-align: center; color: #10b981; font-size: 1.2rem; padding: 2rem;">
          ✓ No validation issues found. The AAS Environment is fully compliant with AAS V3.0 specifications.
        </p>
      </div>
`;
    }

    html += `</div>`;
  }

  html += `
    <div class="footer">
      <p>RE-Eclipse AASX Web • Validation completed in ${result.duration}ms</p>
      <p style="margin-top: 0.25rem;">Report generated on ${new Date().toLocaleString()}</p>
    </div>
  </div>
</body>
</html>
`;

  return html;
}

/**
 * Generate HTML for a single issue
 */
function generateIssueHTML(error: ValidationError): string {
  return `
    <div class="issue ${error.severity}">
      <div class="issue-header">
        <span class="badge ${error.severity}">${error.severity}</span>
        <span class="issue-code">${error.code}</span>
      </div>
      <div class="issue-message">${escapeHtml(error.message)}</div>
      ${error.path ? `<div class="issue-path">${escapeHtml(error.path)}</div>` : ""}
      ${error.suggestion ? `<div class="issue-suggestion">💡 ${escapeHtml(error.suggestion)}</div>` : ""}
    </div>
  `;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Download report as file
 */
export function downloadReport(content: string | Blob, filename: string, mimeType: string): void {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Get appropriate MIME type for format
 */
export function getMimeType(format: string): string {
  const mimeTypes: Record<string, string> = {
    json: "application/json",
    csv: "text/csv",
    html: "text/html",
    pdf: "application/pdf",
  };
  return mimeTypes[format] || "text/plain";
}

/**
 * Get appropriate file extension for format
 */
export function getFileExtension(format: string): string {
  const extensions: Record<string, string> = {
    json: "json",
    csv: "csv",
    html: "html",
    pdf: "pdf",
  };
  return extensions[format] || "txt";
}
