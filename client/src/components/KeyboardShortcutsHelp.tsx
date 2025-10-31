/**
 * Keyboard Shortcuts Help Modal
 * 
 * Displays all available keyboard shortcuts organized by category
 */

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Keyboard } from "lucide-react";
import { groupShortcuts, formatShortcut, type KeyboardShortcut } from "@/hooks/useKeyboardShortcuts";

interface KeyboardShortcutsHelpProps {
  shortcuts: KeyboardShortcut[];
  trigger?: React.ReactNode;
}

export function KeyboardShortcutsHelp({
  shortcuts,
  trigger,
}: KeyboardShortcutsHelpProps) {
  const [open, setOpen] = useState(false);
  
  const categories = groupShortcuts(shortcuts.filter(s => s.enabled !== false));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Keyboard className="h-4 w-4 mr-2" />
            Keyboard Shortcuts
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {categories.map((category) => {
            if (category.shortcuts.length === 0) {
              return null;
            }

            return (
              <div key={category.name} className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  {category.name}
                </h3>
                <div className="space-y-2">
                  {category.shortcuts.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-accent transition-colors"
                    >
                      <span className="text-sm">{shortcut.description}</span>
                      <kbd className="px-2.5 py-1.5 text-xs font-semibold text-foreground bg-muted border border-border rounded-md shadow-sm">
                        {formatShortcut(shortcut)}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 pt-4 border-t text-xs text-muted-foreground">
          <p>
            <strong>Tip:</strong> Most shortcuts work globally, but some may be disabled in input fields
            for typing. Press <kbd className="px-1.5 py-0.5 bg-muted rounded">Esc</kbd> to cancel operations.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
