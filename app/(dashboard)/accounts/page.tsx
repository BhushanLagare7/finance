"use client";

import { LoaderIcon, PlusIcon } from "lucide-react";

import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useBulkDeleteAccounts } from "@/features/accounts/api/use-bulk-delete";
import { useGetAccounts } from "@/features/accounts/api/use-get-accounts";
import { useNewAccount } from "@/features/accounts/hooks/use-new-account";

import { columns } from "./columns";

const AccountsPage = () => {
  const newAccount = useNewAccount();
  const bulkDeleteAccounts = useBulkDeleteAccounts();
  const { data: accounts = [], isLoading } = useGetAccounts();

  const isDisabled = bulkDeleteAccounts.isPending || isLoading;

  if (isLoading) {
    return (
      <div className="pb-10 mx-auto -mt-24 w-full max-w-screen-2xl">
        <Card className="border-none drop-shadow-sm">
          <CardHeader>
            <Skeleton className="w-48 h-8" />
            <Skeleton className="w-64 h-10" />
          </CardHeader>
          <CardContent>
            <div className="h-[500px] w-full flex items-center justify-center">
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
          <CardTitle className="text-xl line-clamp-1">Accounts</CardTitle>
          <Button size="sm" onClick={newAccount.onOpen}>
            <PlusIcon className="mr-2 size-4" />
            Add New
          </Button>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={accounts}
            disabled={isDisabled}
            filterKey="name"
            onDelete={(row) => {
              const ids = row.map((r) => r.original.id);
              bulkDeleteAccounts.mutate({ ids });
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountsPage;
