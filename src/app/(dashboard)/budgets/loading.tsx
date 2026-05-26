import { CardSkeleton, Skeleton } from "@/components/ui/Skeleton";
export default function BudgetsLoading() {
  return (
    <div className="space-y-5">
      <div className="flex justify-between"><Skeleton className="h-7 w-32"/><Skeleton className="h-9 w-36"/></div>
      <Skeleton className="h-12 rounded-xl"/>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{[1,2,3,4].map(i=><Skeleton key={i} className="h-16 rounded-xl"/>)}</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[1,2,3,4].map(i=><CardSkeleton key={i}/>)}</div>
    </div>
  );
}
