import { Suspense } from "react";


import {LoadingSpinner} from "@/components/loading-spinner";
import ConnectionInfo from "@/components/connection";

export default function Connection(){
    return (
        <Suspense fallback={<Loading />}>
            <ConnectionInfo />
        </Suspense>
    )
}

function Loading() {
    return (
        <div className="flex justify-center items-center h-screen">
            <LoadingSpinner className="h-32 w-32" />
        </div>
    );
}