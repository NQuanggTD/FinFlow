import { Skeleton } from "@/components/ui/Skeleton";
export default function AILoading() {
  return (
    <div className="space-y-6">
      <div><Skeleton className="h-7 w-48"/><Skeleton className="h-4 w-64 mt-1"/></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-96 rounded-xl"/><Skeleton className="h-96 rounded-xl"/>
      </div>
    </div>
  );
}
