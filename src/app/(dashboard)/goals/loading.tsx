import { Skeleton } from "@/components/ui/Skeleton";

export default function GoalsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {[1,2,3].map((i) => (
          <div key={i} className="bg-white rounded-xl overflow-hidden border border-gray-100">
            <Skeleton className="h-28 rounded-none" />
            <div className="p-4 space-y-3">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-2.5 w-full rounded-full" />
              <div className="flex justify-between">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-9 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
