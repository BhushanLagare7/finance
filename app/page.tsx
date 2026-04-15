import { Button } from "@/components/ui/button";

const HomePage = () => {
  return (
    <div className="flex gap-4 justify-center items-center p-4">
      <Button>Click me</Button>
      <Button variant="outline">Click me</Button>
      <Button variant="secondary">Click me</Button>
      <Button variant="ghost">Click me</Button>
      <Button variant="destructive">Click me</Button>
      <Button variant="link">Click me</Button>
    </div>
  );
};

export default HomePage;
