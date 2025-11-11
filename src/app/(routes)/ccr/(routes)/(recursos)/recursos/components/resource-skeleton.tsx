export function ResourceTableSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header Skeleton */}
      <div className="flex justify-end gap-2">
        <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
        <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* Table Skeleton */}
      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <div className="relative w-full overflow-x-auto">
          <table className="min-w-[700px] w-full">
            <thead>
              <tr className="bg-muted border-b">
                <th className="h-12 px-4 text-left font-semibold">
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                </th>
                <th className="h-12 px-4 text-left font-semibold">
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                </th>
                <th className="h-12 px-4 text-left font-semibold">
                  <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
                </th>
                <th className="h-12 px-4 text-left font-semibold">
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                </th>
                <th className="h-12 px-4 text-left font-semibold">
                  <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                </th>
                <th className="h-12 px-4 text-left font-semibold">
                  <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                </th>
                <th className="h-12 px-4 w-[70px]"></th>
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, i) => (
                <tr key={i} className="border-b">
                  <td className="h-[49px] px-4">
                    <div className="h-4 w-28 bg-gray-200 rounded animate-pulse" />
                  </td>
                  <td className="h-[49px] px-4">
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                  </td>
                  <td className="h-[49px] px-4">
                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                  </td>
                  <td className="h-[49px] px-4">
                    <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
                  </td>
                  <td className="h-[49px] px-4">
                    <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                  </td>
                  <td className="h-[49px] px-4">
                    <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse" />
                  </td>
                  <td className="h-[49px] px-4">
                    <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Skeleton */}
      <div className="flex items-center justify-end gap-4 px-2 py-4">
        <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="flex gap-1">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
