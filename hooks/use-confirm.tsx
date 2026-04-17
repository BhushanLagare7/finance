import { JSX, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Hook for displaying confirmation dialogs.
 *
 * This hook provides a reusable way to show confirmation dialogs throughout the application.
 * It manages the dialog's open state and returns a promise that resolves based on user interaction.
 *
 * @param {string} title - The title to display in the dialog header
 * @param {string} message - The message to display in the dialog body
 *
 * @returns {[() => JSX.Element, () => Promise<unknown>]}
 *          A tuple containing:
 *          1. The confirmation dialog component to render
 *          2. A function to trigger the confirmation dialog
 *
 * @example
 * const [ConfirmDialog, confirm] = useConfirm(
 *   "Delete Workspace",
 *   "Are you sure you want to delete this workspace?"
 * );
 *
 * // In your component:
 * const handleDelete = async () => {
 *   const ok = await confirm();
 *   if (ok) {
 *     // User confirmed, proceed with deletion
 *   }
 * };
 *
 * return (
 *   <>
 *     <Button onClick={handleDelete}>Delete</Button>
 *     <ConfirmDialog />
 *   </>
 * );
 */
export const useConfirm = (
  title: string,
  message: string,
): [() => JSX.Element, () => Promise<unknown>] => {
  const [promise, setPromise] = useState<{
    resolve: (value: boolean) => void;
  } | null>(null);

  const confirm = () =>
    new Promise((resolve) => {
      setPromise({ resolve });
    });

  const handleClose = () => {
    setPromise(null);
  };

  const handleCancel = () => {
    promise?.resolve(false);
    handleClose();
  };

  const handleConfirm = () => {
    promise?.resolve(true);
    handleClose();
  };

  const ConfirmDialog = () => (
    <Dialog open={promise !== null} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return [ConfirmDialog, confirm];
};
