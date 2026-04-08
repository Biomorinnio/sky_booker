import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-gray-200 dark:bg-gray-700",
        className
      )}
      {...props}
    />
  );
}

export function FlightCardSkeleton() {
  return (
    <div className="bg-liquid-glass bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl shadow-lg p-6 border border-white/20 dark:border-gray-700/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-12 h-12 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
        <Skeleton className="h-8 w-24" />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="space-y-2 text-center">
          <Skeleton className="h-4 w-16 mx-auto" />
          <Skeleton className="h-4 w-20 mx-auto" />
        </div>
        <div className="space-y-2 text-right">
          <Skeleton className="h-8 w-20 ml-auto" />
          <Skeleton className="h-4 w-32 ml-auto" />
        </div>
      </div>

      <Skeleton className="h-10 w-full rounded-lg" />
    </div>
  );
}

export function BookingCardSkeleton() {
  return (
    <div className="bg-liquid-glass bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl shadow-lg p-6 border border-white/20 dark:border-gray-700/20">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Skeleton className="w-12 h-12 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-32" />
          </div>
        </div>
        <Skeleton className="h-8 w-28 rounded-full" />
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-5 w-28" />
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
    </div>
  );
}
