import { AlertIcon } from "@/components/icons/AlertIcon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shadcn/card";

export interface ErrorInfoProps {
  title?: string;
  description?: string;
}

export function ErrorInfo({ title, description }: ErrorInfoProps) {
  return (
    <section className="flex flex-col gap-6 p-6 max-sm:p-3">
      <Card className="w-full border-red-200 bg-red-50">
        <CardHeader className="pb-2 max-sm:p-3">
          <CardTitle className="flex flex-row justify-start items-center gap-2 text-2xl max-sm:text-lg text-red-700">
            <AlertIcon width={22} height={22} className="flex-shrink-0" />
            {title ? title : "Error"}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-red-700 whitespace-pre-wrap max-sm:px-3 max-sm:pb-3">
          {description ? description : "An error has occurred."}
        </CardContent>
      </Card>
    </section>
  );
}
