import { JSX, useRef, useState } from "react";

import { Select } from "@/components/select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCreateAccount } from "@/features/accounts/api/use-create-account";
import { useGetAccounts } from "@/features/accounts/api/use-get-accounts";

/**
 * Hook for displaying account selection dialogs.
 *
 * This hook provides a reusable way to show account selection dialogs.
 * It manages the dialog's open state and returns a promise that resolves based on user interaction.
 *
 * @returns {[() => JSX.Element, () => Promise<unknown>]}
 *          A tuple containing:
 *          1. The account selection dialog component to render
 *          2. A function to trigger the account selection dialog
 *
 * @example
 * const [AccountDialog, confirm] = useSelectAccount();
 *
 * // In your component:
 * const handleSelectAccount = async () => {
 *   const accountId = await confirm();
 *   if (accountId) {
 *     // User selected an account, proceed with the action
 *   }
 * };
 *
 * return (
 *   <>
 *     <Button onClick={handleSelectAccount}>Select Account</Button>
 *     <AccountDialog />
 *   </>
 * );
 */
export const useSelectAccount = (): [
  () => JSX.Element,
  () => Promise<unknown>,
] => {
  const accountQuery = useGetAccounts();
  const accountMutation = useCreateAccount();

  const accountOptions = (accountQuery.data ?? []).map((account) => ({
    label: account.name,
    value: account.id,
  }));

  const onCreateAccount = (name: string) => {
    accountMutation.mutate({ name });
  };

  const [promise, setPromise] = useState<{
    resolve: (value: string | undefined) => void;
  } | null>(null);
  const selectValue = useRef<string | undefined>(undefined);

  const confirm = () =>
    new Promise((resolve) => {
      setPromise({ resolve });
    });

  const handleClose = () => {
    setPromise(null);
  };

  const handleCancel = () => {
    promise?.resolve(undefined);
    handleClose();
  };

  const handleConfirm = () => {
    promise?.resolve(selectValue.current);
    handleClose();
  };

  const ConfirmDialog = () => (
    <Dialog open={promise !== null} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select Account</DialogTitle>
          <DialogDescription>
            Please select an account from the list below.
          </DialogDescription>
        </DialogHeader>
        <Select
          disabled={accountMutation.isPending || accountQuery.isLoading}
          options={accountOptions}
          placeholder="Select an account"
          value={selectValue.current}
          onChange={(value) => (selectValue.current = value)}
          onCreate={onCreateAccount}
        />
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
