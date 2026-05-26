import { Skeleton, TableSkeleton } from "@/components/ui/Skeleton";

export default function TransactionsLoading() {
  return (
    <div className="space-y-5">
      <div className="flex justify-between">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-9 w-36" />
      </div>
      <Skeleton className="h-16 rounded-xl" />
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <TableSkeleton rows={8} />
      </div>
    </div>
  );
}
