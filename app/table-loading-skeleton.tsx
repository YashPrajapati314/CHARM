import { Skeleton } from "@/components/ui/skeleton";

const TableSkeleton = () => {
    return (
        <div className="table-container">
            <table className="request-table">
                {/* <thead>
                    <tr>
                        <th>SAP ID</th>
                        <th>Name</th>
                        <th>Roll No</th>
                        <th>Reason</th>
                    </tr>
                </thead> */}
                <tbody>
                    {Array.from({ length: 5 }).map((_, index) => (
                        <tr key={index}>
                            <td className="text-center align-middle">
                                <div className="flex justify-center items-center w-full h-full">
                                    <Skeleton className="h-6 w-24" />
                                </div>
                            </td>
                            <td className="text-center align-middle">
                                <div className="flex justify-center items-center w-full h-full">
                                    <Skeleton className="h-6 w-32" />
                                </div>
                            </td>
                            <td className="text-center align-middle">
                                <div className="flex justify-center items-center w-full h-full">
                                    <Skeleton className="h-6 w-16" />
                                </div>
                            </td>
                            <td className="text-center align-middle">
                                <div className="flex justify-center items-center w-full h-full">
                                    <Skeleton className="h-6 w-40" />
                                </div>
                            </td>
                            {/* <td className="text-center align-middle"><Skeleton className="h-6 w-32 align-middle" /></td>
                            <td className="text-center align-middle"><Skeleton className="h-6 w-16 align-middle" /></td>
                            <td className="text-center align-middle"><Skeleton className="h-6 w-40 align-middle" /></td> */}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default TableSkeleton;