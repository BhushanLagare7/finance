import { useOpenAccount } from "@/features/accounts/hooks/use-open-account";

interface AccountColumnProps {
  account: string;
  accountId: string;
}

export const AccountColumn = ({ account, accountId }: AccountColumnProps) => {
  const { onOpen: onOpenAccount } = useOpenAccount();

  const onClick = () => {
    onOpenAccount(accountId);
  };

  return (
    <div
      className="flex items-center cursor-pointer hover:underline"
      role="button"
      onClick={onClick}
    >
      {account}
    </div>
  );
};
