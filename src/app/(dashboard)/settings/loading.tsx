import { Skeleton, CardSkeleton } from "@/components/ui/Skeleton";
export default function SettingsLoading() {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div><Skeleton className="h-7 w-24" /><Skeleton className="h-4 w-48 mt-1" /></div>
      <CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton />
    </div>
  );
}
