import { Suspense } from "react";

import { LoadingSpinner } from "@/components/loading-spinner";

export default function ExploreRegistrations(){
    return (
        <Suspense fallback={<Loading />}>
            <div>Registrations</div>
        </Suspense>
    );
}

function Loading() {
    return (
        <div className="flex justify-center items-center h-screen">
            <LoadingSpinner className="h-32 w-32" />
        </div>
    );
}