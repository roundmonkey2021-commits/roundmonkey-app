import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { AlertCircle, CheckCircle, XCircle } from "lucide-react";

export interface ValidationError {
  row: number;
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface CSVValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  validRowCount: number;
  totalRowCount: number;
  preview: any[];
}

interface CSVValidationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  result: CSVValidationResult;
  title: string;
  isDark?: boolean;
}

export function CSVValidationDialog({
  isOpen,
  onClose,
  onConfirm,
  result,
  title,
  isDark = false
}: CSVValidationDialogProps) {
  const hasErrors = result.errors.length > 0;
  const hasWarnings = result.warnings.length > 0;
  const canImport = result.isValid && result.validRowCount > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-4xl max-h-[85vh] overflow-y-auto ${isDark ? 'bg-zinc-900 border-zinc-800' : ''}`}>
        <DialogHeader>
          <DialogTitle className={`text-xl font-bold ${isDark ? 'text-zinc-100' : 'text-neutral-900'}`}>
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Summary */}
          <div className={`p-4 rounded-lg border ${
            hasErrors
              ? isDark ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'
              : isDark ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200'
          }`}>
            <div className="flex items-start gap-3">
              {hasErrors ? (
                <XCircle className="size-5 text-red-600 flex-shrink-0 mt-0.5" />
              ) : (
                <CheckCircle className="size-5 text-green-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <h3 className={`font-semibold mb-1 ${
                  hasErrors
                    ? isDark ? 'text-red-200' : 'text-red-900'
                    : isDark ? 'text-green-200' : 'text-green-900'
                }`}>
                  {hasErrors ? 'Validation Failed' : 'Validation Successful'}
                </h3>
                <div className={`text-sm space-y-1 ${
                  hasErrors
                    ? isDark ? 'text-red-300' : 'text-red-800'
                    : isDark ? 'text-green-300' : 'text-green-800'
                }`}>
                  <p>Total rows: {result.totalRowCount}</p>
                  <p>Valid rows: {result.validRowCount}</p>
                  {hasErrors && <p>Errors: {result.errors.length}</p>}
                  {hasWarnings && <p>Warnings: {result.warnings.length}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Errors */}
          {hasErrors && (
            <div>
              <h4 className={`font-semibold mb-2 flex items-center gap-2 ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                <AlertCircle className="size-4" />
                Errors ({result.errors.length})
              </h4>
              <div className={`max-h-48 overflow-y-auto space-y-2 p-3 rounded-lg ${
                isDark ? 'bg-zinc-800/50' : 'bg-neutral-50'
              }`}>
                {result.errors.map((error, index) => (
                  <div key={index} className={`text-sm p-2 rounded border ${
                    isDark ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'
                  }`}>
                    <span className={`font-medium ${isDark ? 'text-red-400' : 'text-red-700'}`}>
                      Row {error.row}, {error.field}:
                    </span>{' '}
                    <span className={isDark ? 'text-red-300' : 'text-red-600'}>
                      {error.message}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warnings */}
          {hasWarnings && (
            <div>
              <h4 className={`font-semibold mb-2 flex items-center gap-2 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
                <AlertCircle className="size-4" />
                Warnings ({result.warnings.length})
              </h4>
              <div className={`max-h-48 overflow-y-auto space-y-2 p-3 rounded-lg ${
                isDark ? 'bg-zinc-800/50' : 'bg-neutral-50'
              }`}>
                {result.warnings.map((warning, index) => (
                  <div key={index} className={`text-sm p-2 rounded border ${
                    isDark ? 'bg-yellow-900/20 border-yellow-800' : 'bg-yellow-50 border-yellow-200'
                  }`}>
                    <span className={`font-medium ${isDark ? 'text-yellow-400' : 'text-yellow-700'}`}>
                      Row {warning.row}, {warning.field}:
                    </span>{' '}
                    <span className={isDark ? 'text-yellow-300' : 'text-yellow-600'}>
                      {warning.message}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preview */}
          {result.preview.length > 0 && (
            <div>
              <h4 className={`font-semibold mb-2 ${isDark ? 'text-zinc-100' : 'text-neutral-900'}`}>
                Preview (first {Math.min(5, result.preview.length)} rows)
              </h4>
              <div className={`overflow-x-auto rounded-lg border ${
                isDark ? 'bg-zinc-800/50 border-zinc-700' : 'bg-neutral-50 border-neutral-200'
              }`}>
                <table className="min-w-full text-sm">
                  <thead className={isDark ? 'bg-zinc-800' : 'bg-neutral-100'}>
                    <tr>
                      {Object.keys(result.preview[0]).map((key) => (
                        <th
                          key={key}
                          className={`px-3 py-2 text-left font-medium ${
                            isDark ? 'text-zinc-300' : 'text-neutral-700'
                          }`}
                        >
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.preview.slice(0, 5).map((row, index) => (
                      <tr key={index} className={isDark ? 'border-t border-zinc-700' : 'border-t border-neutral-200'}>
                        {Object.values(row).map((value: any, colIndex) => (
                          <td
                            key={colIndex}
                            className={`px-3 py-2 ${isDark ? 'text-zinc-400' : 'text-neutral-600'}`}
                          >
                            {value?.toString() || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="mt-6">
          <Button onClick={onClose} variant="outline">
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={!canImport}
            className={!canImport ? 'opacity-50 cursor-not-allowed' : ''}
          >
            {hasWarnings ? `Import ${result.validRowCount} Valid Rows` : 'Import All'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
