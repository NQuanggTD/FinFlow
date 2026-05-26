import { Skeleton } from "@/components/ui/Skeleton";
export default function CalendarLoading() {
  return (
    <div className="space-y-4">
      <div><Skeleton className="h-7 w-40"/><Skeleton className="h-4 w-24 mt-1"/></div>
      <Skeleton className="h-[520px] rounded-xl"/>
    </div>
  );
}
