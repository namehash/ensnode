import { PropsWithChildren } from "react";

export function ErrorMessage({ children }: PropsWithChildren) {
  return <div className="text-gray-600 bg-red-50/50 p-4 m-4 flex flex-col gap-4">{children}</div>;
}

ErrorMessage.Header = function ErrorHeader({ children }: PropsWithChildren) {
  return <h1 className="text-2xl font-bold">{children}</h1>;
};

ErrorMessage.Message = function ErrorMessage({ children }: PropsWithChildren) {
  return <p className="text-gray-600">{children}</p>;
};
