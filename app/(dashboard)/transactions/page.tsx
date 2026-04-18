"use client";

import { LoaderIcon, PlusIcon } from "lucide-react";

import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useBulkDeleteTransactions } from "@/features/transactions/api/use-bulk-delete-transactions";
import { useGetTransactions } from "@/features/transactions/api/use-get-transactions";
import { useNewTransaction } from "@/features/transactions/hooks/use-new-transaction";

import { columns } from "./columns";

const TransactionsPage = () => {
  const newTransaction = useNewTransaction();
  const bulkDeleteTransactions = useBulkDeleteTransactions();
  const { data: transactions = [], isLoading } = useGetTransactions();

  const isDisabled = bulkDeleteTransactions.isPending || isLoading;

  if (isLoading) {
    return (
      <div className="pb-10 mx-auto -mt-24 w-full max-w-screen-2xl">
        <Card className="border-none drop-shadow-sm">
          <CardHeader>
            <Skeleton className="w-48 h-8" />
            <Skeleton className="w-64 h-10" />
          </CardHeader>
          <CardContent>
            <div className="h-125 w-full flex items-center justify-center">
              <LoaderIcon className="animate-spin size-12 text-slate-300" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="pb-10 mx-auto -mt-24 w-full max-w-screen-2xl">
      <Card className="border-none drop-shadow-sm">
        <CardHeader className="gap-y-2 lg:flex lg:flex-row lg:items-center lg:justify-between">
          <CardTitle className="text-xl line-clamp-1">
            Transactions History
          </CardTitle>
          <Button size="sm" onClick={newTransaction.onOpen}>
            <PlusIcon className="mr-2 size-4" />
            Add New
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={transactions}
            disabled={isDisabled}
            filterKey="payee"
            onDelete={(row) => {
              const ids = row.map((r) => r.original.id);
              bulkDeleteTransactions.mutate({ ids });
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionsPage;
