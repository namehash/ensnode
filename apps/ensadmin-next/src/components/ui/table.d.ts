import * as React from "react";

declare module "@/components/ui/table" {
  export const Table: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLTableElement> & React.RefAttributes<HTMLTableElement>
  >;
  
  export const TableHeader: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLTableSectionElement> & React.RefAttributes<HTMLTableSectionElement>
  >;
  
  export const TableBody: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLTableSectionElement> & React.RefAttributes<HTMLTableSectionElement>
  >;
  
  export const TableFooter: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLTableSectionElement> & React.RefAttributes<HTMLTableSectionElement>
  >;
  
  export const TableRow: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLTableRowElement> & React.RefAttributes<HTMLTableRowElement>
  >;
  
  export const TableHead: React.ForwardRefExoticComponent<
    React.ThHTMLAttributes<HTMLTableCellElement> & React.RefAttributes<HTMLTableCellElement>
  >;
  
  export const TableCell: React.ForwardRefExoticComponent<
    React.TdHTMLAttributes<HTMLTableCellElement> & React.RefAttributes<HTMLTableCellElement>
  >;
  
  export const TableCaption: React.ForwardRefExoticComponent<
    React.HTMLAttributes<HTMLTableCaptionElement> & React.RefAttributes<HTMLTableCaptionElement>
  >;
}
