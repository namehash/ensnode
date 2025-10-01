import {Registrations} from "@/components/recent-registrations/registrations";


//TODO: Maybe the logic from <Registrations> could be just moved here?
// Not sure about that due to the "use client" clause (afaik we avoid using it directly in the @app dir)
export default function ExploreRegistrations(){
    return <Registrations />;
}