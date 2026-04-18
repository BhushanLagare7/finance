import { LoaderIcon } from "lucide-react";
import { z } from "zod";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { insertTransactionSchema } from "@/db/schema";
import { useCreateAccount } from "@/features/accounts/api/use-create-account";
import { useGetAccounts } from "@/features/accounts/api/use-get-accounts";
import { useCreateCategory } from "@/features/categories/api/use-create-category";
import { useGetCategories } from "@/features/categories/api/use-get-categories";
import { useDeleteTransaction } from "@/features/transactions/api/use-delete-transaction";
import { useEditTransaction } from "@/features/transactions/api/use-edit-transaction";
import { useGetTransaction } from "@/features/transactions/api/use-get-transaction";
import { TransactionForm } from "@/features/transactions/components/transaction-form";
import { useOpenTransaction } from "@/features/transactions/hooks/use-open-transaction";
import { useConfirm } from "@/hooks/use-confirm";

const formSchema = insertTransactionSchema.omit({ id: true });

type FormValues = z.infer<typeof formSchema>;

export const EditTransactionSheet = () => {
  const { isOpen, onClose, id } = useOpenTransaction();

  const [ConfirmDialog, confirm] = useConfirm(
    "Are you sure?",
    "You are about to delete this transaction. This action cannot be undone.",
  );

  const { data: transaction, isLoading: isLoadingTransaction } =
    useGetTransaction(id);
  const deleteMutation = useDeleteTransaction(id);
  const editMutation = useEditTransaction(id);

  const { data: categories, isLoading: isLoadingCategories } =
    useGetCategories();
  const categoryMutation = useCreateCategory();
  const onCreateCategory = (name: string) => {
    categoryMutation.mutate({ name });
  };
  const categoryOptions = (categories ?? []).map((category) => ({
    label: category.name,
    value: category.id,
  }));

  const { data: accounts, isLoading: isLoadingAccounts } = useGetAccounts();
  const accountMutation = useCreateAccount();
  const onCreateAccount = (name: string) => {
    accountMutation.mutate({ name });
  };
  const accountOptions = (accounts ?? []).map((account) => ({
    label: account.name,
    value: account.id,
  }));

  const isPending =
    editMutation.isPending ||
    deleteMutation.isPending ||
    categoryMutation.isPending ||
    accountMutation.isPending;

  const isLoading =
    isLoadingTransaction || isLoadingCategories || isLoadingAccounts;

  const onSubmit = (values: FormValues) => {
    editMutation.mutate(values, {
      onSuccess: () => {
        onClose();
      },
    });
  };

  const onDelete = async () => {
    const ok = await confirm();
    if (ok) {
      deleteMutation.mutate(undefined, {
        onSuccess: () => {
          onClose();
        },
      });
    }
  };

  const defaultValues = transaction
    ? {
        accountId: transaction.accountId,
        amount: transaction.amount.toString(),
        categoryId: transaction.categoryId,
        date: transaction.date ? new Date(transaction.date) : new Date(),
        payee: transaction.payee,
        notes: transaction.notes,
      }
    : {
        accountId: "",
        amount: "",
        categoryId: "",
        date: new Date(),
        payee: "",
        notes: "",
      };

  return (
    <>
      <ConfirmDialog />
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="space-y-4">
          <SheetHeader>
            <SheetTitle>Edit Transaction</SheetTitle>
            <SheetDescription>
              Edit an existing transaction to track your finances.
            </SheetDescription>
          </SheetHeader>
          {isLoading ? (
            <div className="flex absolute inset-0 justify-center items-center">
              <LoaderIcon className="animate-spin size-4 text-muted-foreground" />
            </div>
          ) : (
            <TransactionForm
              accountOptions={accountOptions}
              categoryOptions={categoryOptions}
              defaultValues={defaultValues}
              disabled={isPending}
              id={id}
              onCreateAccount={onCreateAccount}
              onCreateCategory={onCreateCategory}
              onDelete={onDelete}
              onSubmit={onSubmit}
            />
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};
