import { UserButton } from "@clerk/nextjs";

const HomePage = () => {
  return (
    <div className="flex justify-between items-center p-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <UserButton />
    </div>
  );
};

export default HomePage;
